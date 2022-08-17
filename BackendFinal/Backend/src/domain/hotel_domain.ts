import { hotelmodel } from "../model/hotel";
import { citymodel } from "../model/city";
import { statemodel } from "../model/state";
import { StatusCode } from "../statuscode";
import { imagemodel } from "../model/image";
import { BookingDomain } from "../domain/booking_domain";
import { bookmarkmodel } from "../model/bookmark";
import { Usermodel } from '../model/users';
import express, { Express, Request, Response } from 'express'

class HotelDomain {
    

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
                q.price.length == 0 ? (null) : (priceparams.length == 1 ? (priceparams[1] = 100000) : (flag = false));
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
                                // { $skip : pageSize * page },


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


    // adding hotel 
    async addHotel(req: Request, res: Response) {
        console.log("asa");
        var newHotelData = req.body;
        //var nextID: any = await hotelmodel.findOne({}, { _id: 1 }).sort({ _id: -1 });
        var last = await hotelmodel.find({}).sort({ _id: -1 }).limit(1);
        console.log(last[0]._id);
        var newId = last[0]._id;
        newHotelData._id = newId + 1;
        console.log(last);
        var room: any = [];

        var noOfDelux = req.body.noofdeluxe;
        var noOfSuperDeluxe = req.body.noodsuperdeluxe;
        var noOfSemiDeluxe = req.body.noofsemideluxe;

        console.log(noOfDelux);

        var i: any;
        for (i = 0; i < noOfDelux; i++) {
            var deluxRoomDetails = {
                "room_id": ((newHotelData._id) * 100) + (i + 1),
                "room_type": "Deluxe",
                "room_size": req.body.deluxesize,
                "bed_size": req.body.deluxebadsize,
                "max_capacity": req.body.deluxemaxcapacity,
                "price": req.body.deluxeprice,
                "features": req.body.deluxefeatures,
                "description": req.body.deluxedescription
            }
            room.push(deluxRoomDetails);
        }

        for (i = 0; i < noOfSemiDeluxe; i++) {
            var semideluxRoomDetails = {
                "room_id": ((newHotelData._id) * 100) + (i + 1 + noOfDelux),
                "room_type": "Semi-Deluxe",
                "room_size": req.body.semideluxesize,
                "bed_size": req.body.semideluxebadsize,
                "max_capacity": req.body.semideluxemaxcapacity,
                "price": req.body.semideluxeprice,
                "features": req.body.semideluxefeatures,
                "description": req.body.semideluxedescription
            }
            room.push(semideluxRoomDetails);
        }

        for (i = 0; i < noOfSuperDeluxe; i++) {
            var superdeluxRoomDetails = {
                "room_id": ((newHotelData._id) * 100) + (i + 1 + noOfSemiDeluxe + noOfDelux),
                "room_type": "Super-Deluxe",
                "room_size": req.body.superdeluxesize,
                "bed_size": req.body.superdeluxebadsize,
                "max_capacity": req.body.superdeluxemaxcapacity,
                "price": req.body.superdeluxeprice,
                "features": req.body.superdeluxefeatures,
                "description": req.body.superdeluxedescription
            }
            room.push(superdeluxRoomDetails);
        }


        newHotelData.room = room;
        
        var data = new hotelmodel(newHotelData);
        var hoteId = {
            "hotel_id": newHotelData._id,
            "message ": "Your hotel data sucefully saved"
        }
        try {
            await data.save();
            res.send(hoteId);
        }
        catch (err: any) {
            res.send(err.message);
        }
    }

    //adding image
    async addhotelImage(req: Request, res: Response) {
        var reqData: any = JSON.parse(JSON.stringify(req.headers['data']));
        var uid: string = reqData.uid;
        var userData = await Usermodel.find({ _id: uid }).select("-__v");
        if (userData[0].user_type == "admin") {

            var nextID: any = await imagemodel.findOne({}, { _id: 1 }).sort({ _id: -1 });
            var hotelId: any = await hotelmodel.findOne({}, { _id: 1 }).sort({ _id: -1 });
            req.body._id = nextID._id + 1;
            console.log(req.body._id);
            req.body.hotel_id = hotelId._id
            var imagearray: any = req.body.image_url;
            var imageData: any = [];
            var i: any;
            for (i = 0; i < imagearray.length; i++) {
                console.log("this i", i);
                console.log("this is image 1", imagearray[i])
                console.log(req.body._id + i);
                var images = {
                    "_id": req.body._id + i,
                    "image_url": imagearray[i],
                    "hotel_id": req.body.hotel_id,
                    "room_id": (req.body.room_id == null) ? null : req.body.room_id,
                    "tour_id": null,
                    "user_id": null
                }
                imageData.push(images)

            }
            console.log(imageData);
            res.send(imageData);
            imagemodel.insertMany(imageData, function (err: any, result: any) {
                if (err) throw err;
                res.send("Image sucessfully added");
            });
        }
        else {
            res.send("you are not authorize")
        }

    }

    //adding deluxroomimage 
    async addRoomImage(req: Request, res: Response, roomtype: String) {
        var nextID: any = await imagemodel.findOne({}, { _id: 1 }).sort({ _id: -1 });
        var hotelId: any = await hotelmodel.findOne({}, { _id: 1 }).sort({ _id: -1 });
        req.body._id = nextID._id + 1;
        var roomId: any = [];
        var roomdata = await hotelmodel.findOne({ _id: hotelId }).select("room");
        roomdata!.room.forEach((e: any) => {
            if (e.room_type == roomtype) {
                roomId.push(e.room_id);
            }
        });

        var imagearray: any = req.body.image_url;
        var imageData: any = [];
        var i: any;
        var j: any;


        for (j = 0; j < roomId.length; j++) {
            for (i = 0; i < imagearray.length; i++) {
                var images = {
                    "image_url": imagearray[i],
                    "hotel_id": req.body.hotel_id,
                    "room_id": roomId[j],
                    "tour_id": null,
                    "user_id": null
                }
                imageData.push(images)

            }
        }
        for (i = 0; i < imageData.length; i++) {
            imageData[i]._id = nextID._id + i + 1;
        }

        imagemodel.insertMany(imageData, function (err: any, result: any) {
            if (err) throw err;
            res.send("Image sucessfully added");
        });
    }



    async addDeluxRoomImage(req: Request, res: Response) {
        await this.addRoomImage(req, res, "Deluxe");
    }

    async addSuperDeluxRoomImage(req: Request, res: Response) {
        await this.addRoomImage(req, res, "Super-Deluxe");
    }


    async addSemiDeluxRoomImage(req: Request, res: Response) {
        await this.addRoomImage(req, res, "Semi-Deluxe");
    }






    //delete hotel 
    async deleteHotel(req: Request, res: Response) {
        var hotelData = await hotelmodel.findOne({ _id: req.params.hoteId })
        if (hotelData) {
            hotelmodel.deleteOne({ _id: req.params.hoteId }, function (err) {
                if (!err) {
                    //res.send("Delete sucesffully");
                    imagemodel.deleteMany({ hotel_id: req.params.hoteId }, function (err) {
                        if (!err) {
                            res.send("hotel and image Delete sucesffully");
                            res.end();
                        }
                        else {
                            res.send("Error in deleeting");
                            res.end();
                        }
                    });
                }
                else {
                    res.send("Error in deleeting");
                    res.end();
                }
            });


        } else {
            res.send("Can not find hotel");
            res.end();
        }
    }
    



    //Get All hotel list
    async getAllHotel(req: Request, res: Response) {
        var pageSize: any = req.query.pagesize;
        var page: any = req.query.page;
        var hotelSearchParams:any = req.query.searchdata;
        var city: any = await citymodel.findOne({ city_name: { $regex: hotelSearchParams + '.*', $options: 'i' } })
        var cityId: Number = city?._id;
        try {
            var hoteBySerch: any = await hotelmodel.aggregate([
                
                    {
                        $match: {
                            $or: [{ "address.city_id": cityId },
                            { "address.address_line": { $regex: hotelSearchParams + '.*', $options: 'i' } },
                            { "address.pincode": { $regex: hotelSearchParams + '.*', $options: 'i' } },
                            { hotel_name: { $regex: hotelSearchParams + '.*', $options: 'i' } }]
                        }
                    },
                
                { $sort : { _id : 1 } },
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

            ]).skip((parseInt(pageSize) * parseInt(page))).limit(parseInt(pageSize));
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
    
    //update hotel
    async updateHotel(req:Request , res : Response){
        var newHotelData = req.body;        
        var room: any = []
        var noOfDelux = req.body.noofdeluxe;
        var noOfSuperDeluxe = req.body.noodsuperdeluxe;
        var noOfSemiDeluxe = req.body.noofsemideluxe;
        var i: any;
        for (i = 0; i < noOfDelux; i++) {
            var deluxRoomDetails = {
                "room_id": ((newHotelData._id) * 100) + (i + 1),
                "room_type": "Deluxe",
                "room_size": req.body.deluxesize,
                "bed_size": req.body.deluxebadsize,
                "max_capacity": req.body.deluxemaxcapacity,
                "price": req.body.deluxeprice,
                "features": req.body.deluxefeatures,
                "description": req.body.deluxedescription
            }
            room.push(deluxRoomDetails);
        }

        for (i = 0; i < noOfSemiDeluxe; i++) {
            var semideluxRoomDetails = {
                "room_id": ((newHotelData._id) * 100) + (i + 1 + noOfDelux),
                "room_type": "Semi-Deluxe",
                "room_size": req.body.semideluxesize,
                "bed_size": req.body.semideluxebadsize,
                "max_capacity": req.body.semideluxemaxcapacity,
                "price": req.body.semideluxeprice,
                "features": req.body.semideluxefeatures,
                "description": req.body.semideluxedescription
            }
            room.push(semideluxRoomDetails);
        }

        for (i = 0; i < noOfSuperDeluxe; i++) {
            var superdeluxRoomDetails = {
                "room_id": ((newHotelData._id) * 100) + (i + 1 + noOfSemiDeluxe + noOfDelux),
                "room_type": "Super-Deluxe",
                "room_size": req.body.superdeluxesize,
                "bed_size": req.body.superdeluxebadsize,
                "max_capacity": req.body.superdeluxemaxcapacity,
                "price": req.body.superdeluxeprice,
                "features": req.body.superdeluxefeatures,
                "description": req.body.superdeluxedescription
            }
            room.push(superdeluxRoomDetails);
        }


        newHotelData.room = room;
        console.log(newHotelData);
       
        try {
            var data = req.body;
            console.log(data);
            await hotelmodel.updateOne({ _id: data._id },data)
            res.send('update saved success');
        }
        catch (err: any) {
            res.send(err.message);
        }
    }


    















}
export { HotelDomain };
