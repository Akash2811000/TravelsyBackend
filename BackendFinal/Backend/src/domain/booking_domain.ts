import { bookingmodel } from "../model/booking";
import { StatusCode } from "../statuscode";
import { hotelmodel } from "../model/hotel";
import { imagemodel } from "../model/image";
import { Usermodel } from '../model/users';
import express, { Express, Request, Response } from 'express'


class BookingDomain {
    async addBooking(req: Request, res: Response) {
        var reqData: any = JSON.parse(JSON.stringify(req.headers['data']));
        //    var uid = "SyNy85NLZRhAwZmgUjbFWQYoKbA2";
        try {
            var nextID: any = await bookingmodel.findOne({}, { _id: 1 }).sort({ _id: -1 });
            var noOfRoom: Number = req.body.room_id.length
            var bookIngData: object = {
                _id: nextID?._id == undefined ? 1 : Number(nextID?.id) + 1,
                user_id: reqData.uid,
                //user_id: uid,
                hotel_id: req.body.hotel_id,
                no_of_room: noOfRoom,
                room_id: req.body.room_id,
                checkin_date: new Date(req.body.checkin_date),
                checkout_date: new Date(req.body.checkout_date),
                price: {
                    number_of_nights: req.body.price.number_of_nights,
                    room_price: req.body.price.room_price,
                    gst: req.body.price.gst,
                    discount: req.body.price.discount,
                    total_price: req.body.price.total_price
                },
                status: "success",
                paymentId: req.body.paymentId,
                orderId: req.body.orderId

            }
            console.log(bookIngData);
            // var sum = 0;
            // var rommIdFromReq: any = (req.body.room_id);
            // console.log(rommIdFromReq);
            // var getHotelRoom = await hotelmodel.find({ _id: req.body.hotel_id })
            // var roomPrice: any = [];
            // getHotelRoom.forEach((e: any) => {
            //     e.room.forEach((d: any) => {
            //         if (rommIdFromReq.includes(d.room_id)) {
            //             roomPrice.push(d.price);
            //             sum = sum + d.price;
            //         }
            //     })
            // })
            // const getHotelRoomPrice: number = sum;
            // console.log(getHotelRoom);
            // console.log('price ' + getHotelRoomPrice);
            // var totalPrize = (req.body.price.total_price);
            // var noOfNight = (req.body.price.number_of_nights);
            // var roomGstPrice = ((18 / 100) * (getHotelRoomPrice * noOfNight));
            // var roomDiscountPrice = ((getHotelRoomPrice * noOfNight) + roomGstPrice) * 0.05;
            // console.log(`gst ${roomGstPrice}`);
            // console.log(`discount ${roomDiscountPrice}`);
            // var roomTotalPrize = ((getHotelRoomPrice * noOfNight) - roomDiscountPrice + roomGstPrice)
            // console.log('price ' + roomTotalPrize);
            // console.log('total ' + totalPrize);
            // if (roomTotalPrize == totalPrize) {
            var bookedData = new bookingmodel(bookIngData);
            console.log(bookedData);
            //  await bookedData.save();
            res.status(StatusCode.Sucess).send("Booking Success")
            res.end();
            // }
            // else {
            //     res.status(StatusCode.Not_Acceptable).send("Error in calculation");
            // }
            res.end();
        } catch (err: any) {
            res.status(StatusCode.Server_Error).send(err.message);
            res.end();
        }
    }

    async roomBookAvailableCheck(req: Request, res: Response) {
        try {
            var q: any = req.query;
            const hotelId: string = q.hotel_id;
            const cIn: Date = new Date(q.cin);
            const cOut: Date = new Date(q.cout);
            const noofroom = q.no_of_room;
            const bookedId: any = [];
            const unAvailableRoomDupId: any = [];
            const unAvailableRoomId: any = [];
            const roomDetailList: any = [];
            var hotelName: any;
            //finding mattressprize
            var hotelMattress = await hotelmodel.findOne({ _id: parseInt(hotelId) }).select("mattressPrice");
            var hotelMattressPrize = hotelMattress?.mattressPrice ?? 0;
            //console.log(hotelMattressPrize);
            //booking table check checkIn and checkOut match with user checkIn & checkOut date
            const resData = await bookingmodel.find({
                $and: [{ hotel_id: hotelId },
                {
                    $or: [
                        { $and: [{ "checkin_date": { $lte: cIn } }, { "checkout_date": { $lte: cIn } }] },
                        { $and: [{ "checkin_date": { $gte: cOut } }, { "checkout_date": { $gte: cOut } }] }
                    ]
                }
                ]
            },
                {
                    "_id": 1,
                    "hotel_id": 1,
                    "checkin_date": 1,
                    "checkout_date": 1,
                    "room_id": 1
                });
            // console.log(resData);
            if (resData != null) {
                //booked ID from resData
                resData.forEach(e => {
                    bookedId.push(e._id);
                });
                const unAvailableBooking = await bookingmodel.find({ $and: [{ hotel_id: hotelId }, { _id: { $nin: bookedId } }] }, {
                    "_id": 1,
                    "hotel_id": 1,
                    "room_id": 1
                })
                //console.log("this is unavilablebooking " + unAvailableBooking);
                if (unAvailableBooking != null) {
                    //Available roomId 
                    unAvailableBooking.forEach(e => {
                        e.room_id.forEach(d => {
                            unAvailableRoomDupId.push(d);
                        })
                    })
                    //Duplication Remove in roomId
                    unAvailableRoomDupId.forEach((item: any) => {
                        if (!unAvailableRoomId.includes(item)) {
                            unAvailableRoomId.push(item);
                        }
                    })
                    // console.log("this unAvailableRoomId " + unAvailableRoomId);
                    var semiDeluxData: any;
                    var superDeluxData: any;
                    var deluxData: any;
                    //get hotel all room Id and subtract it from unAvailable
                    var hRoom = await hotelmodel.find({ _id: hotelId });
                    hRoom.forEach(e => {
                        hotelName = e.hotel_name;
                        e.room.forEach(c => {
                            if (!unAvailableRoomId.includes(c.room_id)) {
                                roomDetailList.push(c);
                            }
                            if (c.room_type == "Deluxe" && deluxData == null) {
                                deluxData = (JSON.parse(JSON.stringify(c)));
                            }
                            if (c.room_type == "Semi-Deluxe" && semiDeluxData == null) {
                                semiDeluxData = (JSON.parse(JSON.stringify(c)));
                            }
                            if (c.room_type == "Super-Deluxe" && superDeluxData == null) {
                                superDeluxData = (JSON.parse(JSON.stringify(c)));
                            }
                        });
                    })
                    var deluxImage = await imagemodel.find({ $and: [{ room_id: deluxData.room_id }, { hotel_id: hotelId }] });
                    var superDeluxImage = await imagemodel.find({ $and: [{ room_id: semiDeluxData.room_id }, { hotel_id: hotelId }] });
                    var semideluxImage = await imagemodel.find({ $and: [{ room_id: semiDeluxData.room_id }, { hotel_id: hotelId }] });
                    deluxData.image = deluxImage;
                    superDeluxData.image = superDeluxImage;
                    semiDeluxData.image = semideluxImage;

                    const newDeluxIDList: any = [];
                    const newsemiDeluxIDList: any = [];
                    const newSuperDeluxIDList: any = [];
                    roomDetailList.forEach((a: any) => {
                        if (a.room_type == "Deluxe") {
                            newDeluxIDList.push(a.room_id);
                        }
                        else if (a.room_type == "Semi-Deluxe") {
                            newsemiDeluxIDList.push(a.room_id);
                        }
                        else if (a.room_type == "Super-Deluxe") {
                            newSuperDeluxIDList.push(a.room_id);
                        }
                    });
                    var resultData = {
                        "hotel_id": hotelId,
                        "hotel_name": hotelName,
                        "hotelMattressPrize": hotelMattressPrize,
                        "deluxe_room_id": newDeluxIDList,
                        "deluxe": deluxData,
                        "semideluxe_room_id": newsemiDeluxIDList,
                        "semideluxe": semiDeluxData,
                        "superdeluxe_room_id": newSuperDeluxIDList,
                        "supedeluxe": superDeluxData,
                    };
                    res.status(StatusCode.Sucess).send(resultData);

                } else {
                    res.status(StatusCode.Sucess).send({})
                    res.end()
                }
            } else {
                res.status(StatusCode.Sucess).send({
                })
                res.end()
            }
        } catch (error: any) {
            res.status(StatusCode.Server_Error).send(error.message);
            res.end();
        }
    }


    async userBookingHistory(req: Request, res: Response) {
        try {
            var reqData: any = JSON.parse(JSON.stringify(req.headers['data']));
            var uid: String = reqData.uid;
            var bookingData = await bookingmodel.find({ "user_id": uid });
            var hotelIdList: any = [];
            var bookingHistoryData: any = [];
            if (bookingData != null) {
                bookingData.forEach(e => {
                    hotelIdList.push(e.hotel_id);
                })
                var hotelData = await hotelmodel.aggregate([
                    {
                        $match: {
                            _id: { $in: hotelIdList }
                        }
                    },
                    {
                        $lookup: {
                            from: "images",
                            localField: "_id",
                            foreignField: "hotel_id",
                            pipeline: [
                                { $match: { room_id: null } }
                            ],
                            as: "images",
                        },
                    },
                    {
                        "$project": {
                            "hotel_id": "$_id",
                            "hotel_name": "$hotel_name",
                            "address": "$address",
                            'images': "$images"
                        }
                    },

                ]);

                bookingData.forEach(e => {
                    hotelData.forEach(d => {
                        if (e.hotel_id == d._id) {
                            bookingHistoryData.push({
                                "hotel_id": d._id,
                                "hotel_name": d.hotel_name,
                                "address": d.address,
                                'images': d.images,
                                "price": e.price?.total_price,
                                "checking_date": e.checkin_date,
                                "checkout_date": e.checkout_date
                            })
                        }
                    })
                })

                res.status(StatusCode.Sucess).send(bookingHistoryData);

            } else {
                res.status(StatusCode.Sucess).send([]);
                res.end()
            }
        } catch (e: any) {
            res.status(StatusCode.Server_Error).send(e.message);
            res.end();
        }
    }

    async checkCommon(cIn: any, cOut: any, hotelId: any, noOfRoom: any) {
        const bookedId: any = [];
        const unAvailableRoomDupId: any = [];
        const unAvailableRoomId: any = [];
        const roomDetailList: any = [];
        var hotelName: any;
        //booking table check checkIn and checkOut match with user checkIn & checkOut date
        const resData = await bookingmodel.find({
            $and: [{ hotel_id: hotelId },
            {
                $or: [
                    { $and: [{ "checkin_date": { $lte: cIn } }, { "checkout_date": { $lte: cIn } }] },
                    { $and: [{ "checkin_date": { $gte: cOut } }, { "checkout_date": { $gte: cOut } }] }
                ]
            }
            ]
        },
            {
                "_id": 1,
                "hotel_id": 1,
                "checkin_date": 1,
                "checkout_date": 1,
                "room_id": 1
            });
        // console.log(resData);
        if (resData != null) {
            //booked ID from resData
            resData.forEach(e => {
                bookedId.push(e._id);
            });
            const unAvailableBooking = await bookingmodel.find({ $and: [{ hotel_id: hotelId }, { _id: { $nin: bookedId } }] }, {
                "_id": 1,
                "hotel_id": 1,
                "room_id": 1
            })
            if (unAvailableBooking != null) {
                //Available roomId 
                unAvailableBooking.forEach(e => {
                    e.room_id.forEach(d => {
                        unAvailableRoomDupId.push(d);
                    })
                })
                //Duplication Remove in roomId
                unAvailableRoomDupId.forEach((item: any) => {
                    if (!unAvailableRoomId.includes(item)) {
                        unAvailableRoomId.push(item);
                    }
                })
                //console.log(unAvailableRoomId);
                //get hotel all room Id and subtract it from unAvailable
                const hRoom = await hotelmodel.find({ _id: hotelId });
                hRoom.forEach(e => {
                    hotelName = e.hotel_name;
                    e.room.forEach(c => {
                        if (unAvailableRoomId.includes(c.room_id)) {
                        } else {
                            roomDetailList.push(c);
                        }
                    });
                })
                // console.log(roomDetailList.length);
                if (roomDetailList.length >= noOfRoom) {
                    return hotelId;
                }
            }
        }
    }
    async availableCheck(req: Request, res: Response) {
        try {
            var q: any = req.query;
            if (q.cin.length != 0 && q.cout.length != 0 && q.no_of_room.length != 0 && q.type.length != 0 && q.id.length != 0) {
                const cIn: Date = new Date(q.cin);
                const cOut: Date = new Date(q.cout);
                const noOfRoom: any = q.no_of_room;
                const type: any = q.type;
                const id: any = q.id;
                const hotelIdArray: any = [];
                const hotelListSerch: any = [];
                if (type == "hotel") {
                    var dHotelId = await this.checkCommon(cIn, cOut, id, noOfRoom);
                    if (dHotelId != null) {
                        var hoteBySerch: any = await hotelmodel.aggregate([
                            {
                                $match: {
                                    '_id': parseInt(dHotelId)
                                }
                            },
                            {
                                $lookup: {
                                    from: "images",
                                    localField: "_id",
                                    foreignField: "hotel_id",
                                    pipeline: [
                                        { $match: { room_id: null } }
                                    ],
                                    as: "Images",
                                },
                            },
                            {
                                "$project": {
                                    "hotel_id": "$_id",
                                    "hotel_name": "$hotel_name",
                                    "rating": "$rating",
                                    "address": "$address",
                                    "price": "$price",
                                    'Images': "$Images"
                                }
                            },
                        ]);
                        if (hoteBySerch.length != 0) {
                            res.status(StatusCode.Sucess).send(hoteBySerch);
                            res.end();
                        } else {
                            res.status(StatusCode.Sucess).send([])
                            res.end()
                        }
                    } else {
                        res.status(StatusCode.Sucess).send([])
                        res.end()
                    }
                }
                else if (type == "area") {
                    var cityBasedSerch = await hotelmodel.find({ 'address.city_id': id });
                    var retResult: any = [];
                    await Promise.all(cityBasedSerch.map(async (e: any) => {
                        hotelIdArray.push(e._id);
                        var d = await this.checkCommon(cIn, cOut, e._id, noOfRoom);
                        retResult.push(d);
                    }))
                    if (retResult.length != 0) {
                        await Promise.all(
                            retResult.map(async (e: any) => {
                                var hoteBySerch: any = await hotelmodel.aggregate([
                                    {
                                        $match: {
                                            '_id': e
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: "images",
                                            localField: "_id",
                                            foreignField: "hotel_id",
                                            pipeline: [
                                                { $match: { room_id: null } }
                                            ],
                                            as: "Images",
                                        },
                                    },
                                    {
                                        "$project": {
                                            "hotel_id": "$_id",
                                            "hotel_name": "$hotel_name",
                                            "rating": "$rating",
                                            "address": "$address",
                                            "price": "$price",
                                            'Images': "$Images"
                                        }
                                    },
                                ]);
                                if (hoteBySerch.length != 0) {
                                    // console.log(hoteBySerch);
                                    hotelListSerch.push(hoteBySerch[0]);
                                }
                            }
                            ))
                        if (hotelListSerch.length == 0) {
                            res.status(StatusCode.Sucess).send([])
                            res.end()
                        } else {
                            res.status(StatusCode.Sucess).send(hotelListSerch);
                            res.end();
                        }
                    } else {
                        res.status(StatusCode.Sucess).send([])
                        res.end()
                    }
                } else {
                    //type not match
                    res.send([]);
                    res.end();
                }
            } else {
                res.send('params is not match');
                res.end();
            }
        } catch (error: any) {
            res.status(StatusCode.Server_Error).send(error.message);
            res.end();
        }
    }

    // async getRoomPrize(req: Request, res: Response) {
    //     var query: any = req.query;
    //     var roomid: any = query.roomid.split(",").map(Number);
    //     var hotelid: any = query.hotelid
    //     var getHotelRoom = await hotelmodel.find({ _id: hotelid })
    //     var hotelId = parseInt(getHotelRoom[0]._id.toString());
    //     var hotelName = getHotelRoom[0].hotel_name.toString();
    //     var address = getHotelRoom[0].address?.address_line;
    //     var rating = parseInt(getHotelRoom[0].rating.toString());
    //     var roomPrice: any = [];
    //     var sum = 0;
    //     var reqData: any = JSON.parse(JSON.stringify(req.headers['data']));
    //     var uid: string = reqData.uid;
    //     console.log(uid);
    //     var userData = await Usermodel.find({ _id: uid }).select("-__v");
    //     console.log(userData);

    //     getHotelRoom.forEach((e: any) => {
    //         e.room.forEach((d: any) => {
    //             if (roomid.includes(d.room_id)) {
    //                 roomPrice.push(d.price);
    //                 sum = sum + d.price;
    //             }
    //         })
    //     })

    //     var checkInDate = new Date(query.cin);
    //     var checkOutDate = new Date(query.cout);
    //     var diff = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    //     var diffDays = Math.ceil(diff / (1000 * 3600 * 24));
    //     const getHotelRoomPrice: number = sum;
    //     var roomPrizwWithDays = getHotelRoomPrice * diffDays;
    //     var gstPercentage = 18;
    //     var discountPercentage = 5;
    //     var roomPriceWithGst = (roomPrizwWithDays * (gstPercentage / 100));
    //     var discountPrice = (roomPrizwWithDays + roomPriceWithGst) * (discountPercentage / 100);
    //     var totalRoomPrice = (roomPrizwWithDays + roomPriceWithGst - discountPrice);
    //     var roomPriceData = {
    //         hotelid: hotelId,
    //         hotelName: hotelName,
    //         address: address,
    //         rating: rating,
    //         checkInDate: query.cin,
    //         checkOutDate: query.cout,
    //         roomId: roomid,
    //         roomPrice: Math.floor(getHotelRoomPrice),
    //         noOfDays: diffDays,
    //         subTotal: Math.floor(roomPrizwWithDays),
    //         gstPercentage: gstPercentage,
    //         discountPercentage: discountPercentage,
    //         gst: Math.floor(roomPriceWithGst),
    //         offer: Math.floor(discountPrice),
    //         total: Math.floor(totalRoomPrice)

    //     }
    //     res.send(roomPriceData);



    // }

    async getRoomPrize(req: Request, res: Response) {
        var query: any = req.query;
        var roomid: any = query.roomid.split(",").map(Number);
        var hotelid: any = query.hotelid
        var countOfMattress = query.countOfMattress
        var getHotelRoom = await hotelmodel.find({ _id: hotelid })
        var hotelId = parseInt(getHotelRoom[0]._id.toString());
        var hotelName = getHotelRoom[0].hotel_name.toString();
        var address = getHotelRoom[0].address?.address_line;
        var rating = parseInt(getHotelRoom[0].rating.toString());
        var roomPrice: any = [];
        var sum = 0;
        var hotelMattress = await hotelmodel.findOne({ _id: hotelid }).select("mattressPrice");
        console.log(hotelMattress!.mattressPrice);
        var hotelMattressPrize = hotelMattress?.mattressPrice ?? 0;
        getHotelRoom.forEach((e: any) => {
            e.room.forEach((d: any) => {
                if (roomid.includes(d.room_id)) {
                    roomPrice.push(d.price);
                    sum = sum + d.price;
                }
            })
        })
        console.log(countOfMattress);
        var totalMattressPrize = hotelMattressPrize * countOfMattress;
        console.log(totalMattressPrize);
        var checkInDate = new Date(query.cin);
        var checkOutDate = new Date(query.cout);
        var diff = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
        var diffDays = Math.ceil(diff / (1000 * 3600 * 24));
        var getHotelRoomPrice = sum;
        var totalHotelRoomPrize = getHotelRoomPrice + totalMattressPrize;
        var roomPrizwWithDays = totalHotelRoomPrize * diffDays;
        var gstPercentage = 18;
        var discountPercentage = 5;
        var roomPriceWithGst = (roomPrizwWithDays * (gstPercentage / 100));
        var discountPrice = (roomPrizwWithDays + roomPriceWithGst) * (discountPercentage / 100);
        var totalRoomPrice = (roomPrizwWithDays + roomPriceWithGst - discountPrice);
        var roomPriceData = {
            hotelid: hotelId,
            hotelName: hotelName,
            address: address,
            rating: rating,
            checkInDate: query.cin,
            checkOutDate: query.cout,
            roomId: roomid,
            roomPrice: Math.floor(getHotelRoomPrice),
            noOfmatress: countOfMattress,
            matressPrize: Math.floor(totalMattressPrize),
            noOfDays: diffDays,
            subTotal: Math.floor(roomPrizwWithDays),
            gstPercentage: gstPercentage,
            discountPercentage: discountPercentage,
            gst: Math.floor(roomPriceWithGst),
            offer: Math.floor(discountPrice),
            total: Math.floor(totalRoomPrice)

        }
        res.send(roomPriceData);



    }




}

export { BookingDomain };