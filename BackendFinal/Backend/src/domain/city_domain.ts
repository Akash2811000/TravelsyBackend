import { citymodel } from "../model/city";
import { StatusCode } from "../statuscode";
import { statemodel } from "../model/state";
import express, { Express, Request, Response } from 'express'
import { hotelmodel } from "../model/hotel";

class CityDomain {
    async getAllCity(req: Request, res: Response) {
        try {
            citymodel.find({}, function (error: Error, result: String) {
                if (result) {
                    res.status(StatusCode.Sucess).send(result);

                    res.end();
                } else {
                    res.status(StatusCode.Server_Error).send(error);
                    res.end();
                }
                res.end();
            })
        }
        catch (err: any) {
            res.status(StatusCode.Server_Error).send(err.message);
            res.end();

        }
    }

    async getcityList(req: Request, res: Response) {
        var city: String = req.params.cityname
        try {
            var citydata = await citymodel.find({ city_name: { $regex: `^${city}`, $options: 'i' } }).populate({ path: 'state_id', model: statemodel });
            var hoteldata = await hotelmodel.find({
                $or: [
                    { "address.address_line": { $regex: city + '.*', $options: 'i' } },
                    { hotel_name: { $regex: city + '.*', $options: 'i' } }]
            }).select("hotel_name");
            var hotelist: any = [];
            citydata.forEach(e => {
                var s: any = e.state_id;
                var jsData = {
                    id: parseInt(e.id),
                    'name': e.city_name + ', ' + s.state_name,
                    'type': 'area'
                }
                hotelist.push(jsData);
            });
            hoteldata.forEach(e => {
                var d = {
                    id: parseInt(e.id),
                    'name': e.hotel_name,
                    'type': 'hotel'
                }
                hotelist.push(d);
            })
            res.send(hotelist);

        }
        catch (err: any) {
            res.status(StatusCode.Server_Error).send(err.message);
            res.end();

        }
    }



}

export { CityDomain };