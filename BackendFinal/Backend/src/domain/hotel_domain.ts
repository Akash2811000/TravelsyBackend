import { hotelmodel } from "../model/hotel";
import { citymodel } from "../model/city";
import { statemodel } from "../model/state";
import { StatusCode } from "../statuscode";
import { imagemodel } from "../model/image";
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
            console.log(hotelData);

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
        var hotelData = [
            {
                "_id": 1,
                "hotel_id": 1,
                "hotel_name": "Hotel Khyber Palace",
                "rating": 4,
                "address": {
                    "address_line": "Sanand Cir, Sarkhej, Ahmedabad, Gujarat, India 382210",
                    "pincode": 382210,
                    "city_id": 69,
                    "location": {
                        "latitude": 23.0609355,
                        "longitude": 72.4483075
                    }
                },
                "price": 5000,
                "Images": [
                    {
                        "_id": 16,
                        "image_url": "https://firebasestorage.googleapis.com/v0/b/travelproject22-6b9d4.appspot.com/o/hotel_image%2F1.jpg?alt=media&token=3148b5f2-af26-4094-8c7c-59dd4c5c9a5f",
                        "hotel_id": 1,
                        "room_id": null,
                        "tour_id": null,
                        "user_id": null
                    },
                    {
                        "_id": 17,
                        "image_url": "https://firebasestorage.googleapis.com/v0/b/travelproject22-6b9d4.appspot.com/o/hotel_image%2F10.jpg?alt=media&token=957ff0b4-4e9d-49c7-a073-5acee6718bf9",
                        "hotel_id": 1,
                        "room_id": null,
                        "tour_id": null,
                        "user_id": null
                    },
                    {
                        "_id": 18,
                        "image_url": "https://firebasestorage.googleapis.com/v0/b/travelproject22-6b9d4.appspot.com/o/hotel_image%2F100.jpg?alt=media&token=95abd6b8-d27e-4f3f-93bb-984175b41beb",
                        "hotel_id": 1,
                        "room_id": null,
                        "tour_id": null,
                        "user_id": null
                    },
                    {
                        "_id": 19,
                        "image_url": "https://firebasestorage.googleapis.com/v0/b/travelproject22-6b9d4.appspot.com/o/hotel_image%2F11.jpg?alt=media&token=800ca785-fab3-4b52-8f48-f050aece4d48",
                        "hotel_id": 1,
                        "room_id": null,
                        "tour_id": null,
                        "user_id": null
                    },
                    {
                        "_id": 20,
                        "image_url": "https://firebasestorage.googleapis.com/v0/b/travelproject22-6b9d4.appspot.com/o/hotel_image%2F11.png?alt=media&token=3f2d0a99-891e-4151-bd51-6235685d5b6f",
                        "hotel_id": 1,
                        "room_id": null,
                        "tour_id": null,
                        "user_id": null
                    }
                ]
            },
            {
                "_id": 2,
                "hotel_id": 2,
                "hotel_name": "Renaissance Ahmedabad Hotel",
                "rating": 5,
                "address": {
                    "address_line": "Behind Ganesh Meridian Complex Sola Road, Sarkhej - Gandhinagar Hwy, Ahmedabad, Gujarat, India 380060",
                    "city_id": 69,
                    "pincode": 380060,
                    "location": {
                        "latitude": 23.07526,
                        "longitude": 72.5267243
                    }
                },
                "price": 5600,
                "Images": [
                    {
                        "_id": 36,
                        "image_url": "https://firebasestorage.googleapis.com/v0/b/travelproject22-6b9d4.appspot.com/o/hotel_image%2F12.jpg?alt=media&token=817b5b0a-4acf-4030-8842-027578f5c105",
                        "hotel_id": 2,
                        "room_id": null,
                        "tour_id": null,
                        "user_id": null
                    },
                    {
                        "_id": 37,
                        "image_url": "https://firebasestorage.googleapis.com/v0/b/travelproject22-6b9d4.appspot.com/o/hotel_image%2F13.jpg?alt=media&token=5eb95a9a-09ed-459f-99af-ebc8de28ad30",
                        "hotel_id": 2,
                        "room_id": null,
                        "tour_id": null,
                        "user_id": null
                    },
                    {
                        "_id": 38,
                        "image_url": "https://firebasestorage.googleapis.com/v0/b/travelproject22-6b9d4.appspot.com/o/hotel_image%2F14.jpeg?alt=media&token=6edb351a-2bcf-4935-9ed6-75a45f008ab0",
                        "hotel_id": 2,
                        "room_id": null,
                        "tour_id": null,
                        "user_id": null
                    },
                    {
                        "_id": 39,
                        "image_url": "https://firebasestorage.googleapis.com/v0/b/travelproject22-6b9d4.appspot.com/o/hotel_image%2F15.jpg?alt=media&token=b637950d-3fde-418e-911f-cc2eaafa00a1",
                        "hotel_id": 2,
                        "room_id": null,
                        "tour_id": null,
                        "user_id": null
                    },
                    {
                        "_id": 40,
                        "image_url": "https://firebasestorage.googleapis.com/v0/b/travelproject22-6b9d4.appspot.com/o/hotel_image%2F16.jpg?alt=media&token=b013cb81-c174-43ac-9c24-cbc4064d1924",
                        "hotel_id": 2,
                        "room_id": null,
                        "tour_id": null,
                        "user_id": null
                    }
                ]
            },
            {
                "_id": 4,
                "hotel_id": 4,
                "hotel_name": "Hyatt Ahmedabad",
                "rating": 5,
                "address": {
                    "address_line": "Bodakdev Rd, next to Ahmedabad One Mall, Vastrapur, Ahmedabad, Gujarat, India 380015",
                    "city_id": 69,
                    "pincode": 380015,
                    "location": {
                        "latitude": 23.0393464,
                        "longitude": 72.5306502
                    }
                },
                "price": 5692,
                "Images": [
                    {
                        "_id": 66,
                        "image_url": "https://firebasestorage.googleapis.com/v0/b/travelproject22-6b9d4.appspot.com/o/hotel_image%2F1.jpg?alt=media&token=3148b5f2-af26-4094-8c7c-59dd4c5c9a5f",
                        "hotel_id": 4,
                        "room_id": null,
                        "tour_id": null,
                        "user_id": null
                    },
                    {
                        "_id": 67,
                        "image_url": "https://firebasestorage.googleapis.com/v0/b/travelproject22-6b9d4.appspot.com/o/hotel_image%2F10.jpg?alt=media&token=957ff0b4-4e9d-49c7-a073-5acee6718bf9",
                        "hotel_id": 4,
                        "room_id": null,
                        "tour_id": null,
                        "user_id": null
                    },
                    {
                        "_id": 68,
                        "image_url": "https://firebasestorage.googleapis.com/v0/b/travelproject22-6b9d4.appspot.com/o/hotel_image%2F100.jpg?alt=media&token=95abd6b8-d27e-4f3f-93bb-984175b41beb",
                        "hotel_id": 4,
                        "room_id": null,
                        "tour_id": null,
                        "user_id": null
                    },
                    {
                        "_id": 69,
                        "image_url": "https://firebasestorage.googleapis.com/v0/b/travelproject22-6b9d4.appspot.com/o/hotel_image%2F11.jpg?alt=media&token=800ca785-fab3-4b52-8f48-f050aece4d48",
                        "hotel_id": 4,
                        "room_id": null,
                        "tour_id": null,
                        "user_id": null
                    },
                    {
                        "_id": 70,
                        "image_url": "https://firebasestorage.googleapis.com/v0/b/travelproject22-6b9d4.appspot.com/o/hotel_image%2F11.png?alt=media&token=3f2d0a99-891e-4151-bd51-6235685d5b6f",
                        "hotel_id": 4,
                        "room_id": null,
                        "tour_id": null,
                        "user_id": null
                    }
                ]
            },
            {
                "_id": 5,
                "hotel_id": 5,
                "hotel_name": "Lemon Tree Hotel, Ahmedabad",
                "rating": 5,
                "address": {
                    "address_line": "434/1, Mithakhali Six, Vijay Cross Rd, Navrangpura, Ahmedabad, Gujarat, India 380006",
                    "city_id": 69,
                    "pincode": 380006,
                    "location": {
                        "latitude": 23.0296354,
                        "longitude": 72.5638695
                    }
                },
                "price": 2703,
                "Images": [
                    {
                        "_id": 86,
                        "image_url": "https://firebasestorage.googleapis.com/v0/b/travelproject22-6b9d4.appspot.com/o/hotel_image%2F99.jpg?alt=media&token=4b7ad5dc-68e5-4cf7-90b8-36974a3a6d07",
                        "hotel_id": 5,
                        "room_id": null,
                        "tour_id": null,
                        "user_id": null
                    },
                    {
                        "_id": 87,
                        "image_url": "https://firebasestorage.googleapis.com/v0/b/travelproject22-6b9d4.appspot.com/o/hotel_image%2F98.jpg?alt=media&token=cbf6a697-17a1-4ef0-bb22-0a5498eb6f6c",
                        "hotel_id": 5,
                        "room_id": null,
                        "tour_id": null,
                        "user_id": null
                    },
                    {
                        "_id": 88,
                        "image_url": "https://firebasestorage.googleapis.com/v0/b/travelproject22-6b9d4.appspot.com/o/hotel_image%2F97.jpg?alt=media&token=f91e965d-f460-4e9d-a818-f9ff809c7dac",
                        "hotel_id": 5,
                        "room_id": null,
                        "tour_id": null,
                        "user_id": null
                    },
                    {
                        "_id": 89,
                        "image_url": "https://firebasestorage.googleapis.com/v0/b/travelproject22-6b9d4.appspot.com/o/hotel_image%2F96.jpg?alt=media&token=1e1d78bb-357a-4e0c-9bb9-4385270f6a18",
                        "hotel_id": 5,
                        "room_id": null,
                        "tour_id": null,
                        "user_id": null
                    },
                    {
                        "_id": 90,
                        "image_url": "https://firebasestorage.googleapis.com/v0/b/travelproject22-6b9d4.appspot.com/o/hotel_image%2F95.jpg?alt=media&token=44a38fdf-194e-484b-88b8-5223ce0d4235",
                        "hotel_id": 5,
                        "room_id": null,
                        "tour_id": null,
                        "user_id": null
                    }
                ]
            }
        ]
        var q: any = req.query;
        console.log(q);
        var ratingparams = q.rating.split(",")
        var priceparams = q.price.split("-");
        var featuresparams = q.features.split(",");
        
        // var filterHotelList:any = []
        // hotelData.forEach(e => {
        //     // if(e.rating == ratingparams[2] ){
        //     // filterHotelList.push(e);
        //     // }


        // })
        console.log(ratingparams);

        var hotelIdList: any = [1, 2, 3, 4, null];
        var resData: any = [];
        await Promise.all(
            hotelIdList.map(async (e: any) => {
                var hotelfilterlist = await hotelmodel.find({
                    $and: [{ _id: e }, {
                        $or: [{ rating: { $in: ratingparams } },
                        { price: { $gte: parseInt(priceparams[0]), $lte: parseInt(priceparams[1]) } },
                        { features: { $in: featuresparams }}
                        ]
                    }]
                })
                if (hotelfilterlist.length == 0) {

                } else {
                    resData.push(hotelfilterlist[0]);
                }
            })
        )
        res.send(resData);


        // res.send(filterHotelList);
    }

}
export { HotelDomain };
