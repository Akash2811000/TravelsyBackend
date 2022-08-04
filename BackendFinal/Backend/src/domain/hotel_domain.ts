import { hotelmodel } from "../model/hotel";
import { citymodel } from "../model/city";
import { statemodel } from "../model/state";
import { StatusCode } from "../statuscode";
import { imagemodel } from "../model/image";
import { BookingDomain } from "../domain/booking_domain";
import { bookmarkmodel } from "../model/bookmark";
import express, { Express, Request, Response } from 'express'

class HotelDomain {
    //Get All hotel list
    async getAllHotel(req: Request, res: Response) {
        try {
            var hoteBySerch: any = await hotelmodel.aggregate([
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
            if (hoteBySerch.length == 0) {
                res.status(StatusCode.Sucess).send("No Hotel Found")
                res.end()
            } else {
                res.status(StatusCode.Sucess).send(hoteBySerch);
                res.end();
            }
        } catch (err: any) {
            res.status(StatusCode.Server_Error).send(err.message);
            res.end();
        }
    }

    //get hotel image based on ui send limit of needed image
    //get hotel image based on ui send limit of needed image

    async getHotelImage(req: Request, res: Response) {

        try {

            var hotelData = await hotelmodel.aggregate([

                { $sample: { size: parseInt(req.params.imagelimit) } },
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

                        'Images': "$Images"

                    }

                },

            ])

            res.send(hotelData);
            res.end();

        } catch (e: any) {

            res.status(500).send(e.message);

            res.end();

        }

    }

    // get hotel by search [city wise or hotel name wise]
    async getHotelBySearch(req: Request, res: Response) {
        try {
            var hotelSearchParams: String = req.params.hotelsearch;
            var city: any = await citymodel.findOne({ city_name: { $regex: hotelSearchParams + '.*', $options: 'i' } })
            var cityId: Number = city?._id;
            var hoteBySerch: any = await hotelmodel.aggregate([
                {
                    $match: {
                        $or: [{ "address.city_id": cityId },
                        { "address.address_line": { $regex: hotelSearchParams + '.*', $options: 'i' } },
                        { "address.pincode": { $regex: hotelSearchParams + '.*', $options: 'i' } },
                        { hotel_name: { $regex: hotelSearchParams + '.*', $options: 'i' } }]
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
            if (hoteBySerch.length == 0) {
                res.status(StatusCode.Sucess).send([])
                res.end()
            } else {
                res.status(StatusCode.Sucess).send(hoteBySerch);
                res.end();
            }
        } catch (err: any) {
            res.status(StatusCode.Server_Error).send(err.message);
            res.end();
        }
    }


    // get perticular hotel
    async getParticularHotel(req: Request, res: Response) {
        try {
            var bookmark;
            if (req.headers['token'] != null) {
                var reqData = JSON.parse(JSON.stringify(req.headers['data']));

                var uId = reqData.uid;
                if (reqData.provider != 'anyonums' && reqData.email != null) {
                    let dataBook = await bookmarkmodel.find({ $and: [{ hotel_id: req.params.hotel_id }, { user_id: uId }] });
                    if (dataBook.length != 0) {
                        bookmark = true;
                    } else {
                        bookmark = false;
                    }
                } else {
                    bookmark = false;
                }
            } else {
                bookmark = false;
            }
            var hotelData = await hotelmodel.aggregate([
                { $match: { "_id": parseInt(req.params.hotel_id) } },
                {
                    $lookup: {
                        from: 'images',
                        localField: '_id',
                        foreignField: 'hotel_id',
                        pipeline: [
                            { $match: { "room_id": null } }
                        ],
                        as: 'images'
                    }
                }, {
                    $project: {
                        "_id": 1,
                        "hotel_name": 1,
                        "rating": 1,
                        "address": 1,
                        "description": 1,
                        "phone_number": 1,
                        "price": 1,
                        "features": 1,
                        'images': 1
                    }
                },
            ])
            const d = hotelData[0];
            const responseData = {
                _id: d._id,
                hotel_name: d.hotel_name,
                rating: d.rating,
                address: d.address,
                description: d.description,
                price: d.price,
                features: d.features,
                phone_number: d.phone_number,
                images: d.images,
                isbookmark: bookmark
            }
            res.status(StatusCode.Sucess).send(responseData);
            res.end();
        } catch (err: any) {
            res.status(StatusCode.Server_Error).send(err.message);
            res.end();
        }
    }

    async getHotelFilterList(req: Request, res: Response) {
        var q: any = req.query;
        const bookIngDomain = new BookingDomain();
        if (q.cin.length != 0 && q.cout.length != 0 && q.no_of_room.length != 0 && q.type.length != 0 && q.id.length != 0) {
            const cIn: Date = new Date(q.cin);
            const cOut: Date = new Date(q.cout);
            const noOfRoom: any = q.no_of_room;
            const type: any = q.type;
            const id: any = q.id;
            const hotelIdArray: any = [];
            var avilHotelId: any = [];
            if (type == "hotel") {
                var dHotelId = await bookIngDomain.checkCommon(cIn, cOut, id, noOfRoom);
                if (dHotelId != null) {
                    avilHotelId.push(dHotelId)

                }
            } else if (type == "area") {
                var cityBasedSerch = await hotelmodel.find({ 'address.city_id': id });
                await Promise.all(cityBasedSerch.map(async (e: any) => {
                    hotelIdArray.push(e._id);
                    var d = await bookIngDomain.checkCommon(cIn, cOut, e._id, noOfRoom);
                    avilHotelId.push(d);

                }))
            } else {
                res.send('params is not match');
                res.end();
            }
            var avilHotelId = avilHotelId.map(Number);
            console.log(avilHotelId);

            if (avilHotelId != null) {
                var ratingparams = q.rating.split(",").map(Number);
                var priceparams = q.price.split("-").map(Number);
                var flag: boolean = false;
                q.price.length==0 ? (null) : (priceparams.length == 1 ? (priceparams[1]=100000) : (flag = false));
                var featuresparams = q.features.split(",");
                var resData: any = [];
                console.log(ratingparams);
                console.log(featuresparams);
                console.log(priceparams);
                await Promise.all(
                    avilHotelId.map(async (e: any) => {
                        if (q.rating.length == 0 && q.price.length == 0 && q.features.length == 0) {
                            console.log('if')
                        
                            var hotelfilterlist = await hotelmodel.aggregate(
                                [{
                                    $match: { _id: e },

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
                                ]
                            )
                        } else {
                            console.log('else')
                            var hotelfilterlist = await hotelmodel.aggregate(
                                [{
                                    $match: {
                                        $and: [{ _id: e }, {
                                            $or: [{ rating: { $in: ratingparams } },
                                            { price: { $gte: priceparams[0], $lte: priceparams[1] } },
                                            { features: { $in: featuresparams } }
                                            ]
                                        }]
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
                                ]
                            )
                        }
                        if (hotelfilterlist.length == 0) {

                        } else {
                            resData.push(hotelfilterlist[0]);
                        }
                    })
                )

                res.send(resData);
                res.end();

            }

        }
    }





}
export { HotelDomain };
