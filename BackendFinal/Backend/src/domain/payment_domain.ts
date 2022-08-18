import express, { Express, Request, Response } from 'express';

import { Usermodel } from '../model/users';
import * as dotenv from 'dotenv';
dotenv.config();
import { Razorpay } from 'razorpay-typescript';
import * as crypto from "crypto";
import { StatusCode } from '../statuscode';
import { BookingDomain } from './booking_domain';

var secretkey = process.env.KEY_SECRET;
var keyId = process.env.KEY_ID;
const instance: Razorpay = new Razorpay({
    authKey: {
        key_id: keyId ?? "keyId",
        key_secret: secretkey ?? "secretkey"
    },
});
//const secret_key = 'yCKG9zsdIoWft58QwrYxjf1G'
class PaymentDomain {

    // async createOrder(req: Request, res: Response) {
    //     let amount = req.body.amount;
    //     const options = {
    //         amount: amount * 100,
    //         currency: 'INR',
    //     }
    //     console.log(options);
    //     try {
    //         // var reqData: any = JSON.parse(JSON.stringify(req.headers['data']));
    //         // var uid: string = reqData.uid;
    //         // console.log(uid);
    //         //var userData = await Usermodel.find({ _id: uid }).select("-__v");
    //         console.log("try");
    //         const response = await instance.orders.create(options);
    //         var orderData = {
    //             order_id: response.id,
    //             currency: response.currency,
    //             amount: response.amount / 100,
    //             // user_name: userData[0].user_name,
    //             // user_email: userData[0].user_email,
    //             // user_phone_number: userData[0].user_phone_number,
    //         }
    //         console.log(orderData);
    //         res.send(orderData)
    //     } catch (error: any) {
    //         res.status(400).send('Unable to create order');
    //     }



    // }

    async createOrder(req: Request, res: Response) {
        console.log("hy");
        let amount = req.body.amount;
        const options = {
            amount: amount * 100,
            currency: 'INR',
        }
        console.log(options);
        try {
            // var reqData: any = JSON.parse(JSON.stringify(req.headers['data']));
            // var uid: string = reqData.uid;
            // var userData = await Usermodel.find({ _id: uid }).select("-__v");
            const response = await instance.orders.create(options);
            var orderData = {
                order_id: response.id,
                currency: response.currency,
                // amount: response.amount / 100,
                // user_name: userData[0].user_name,
                // user_email: userData[0].user_email,
                // user_phone_number: userData[0].user_phone_number,
            }
            const bookIngDomain = new BookingDomain();
        // var resBooking=await bookIngDomain.bookingFreeze(req,res,req.body.cin,req.body.cout,req.body.room_id,req.body.hotel_id);
        // console.log(resBooking);
        // console.log('check')
     // if(resBooking!=0){
                console.log(orderData);
                res.send(orderData)
                res.end();
                // setTimeout(bookIngDomain.bookingFreezFail, 20000, resBooking);
     //}
            //}else{
               // res.status(400).send('faile');    
            //}   
        } catch (error: any) {
            console.log("hy")
            console.log(error);
            res.status(400).send('Unable to create order');
        }
    }

    async checkpayment(req:Request , res : Response){
        // console.log("hy");
        // console.log(req.params.orderid);
        // var paymentdata = await instance.orders.fetch(req.params.orderid)
        // res.send(paymentdata);
        // await instance.orders.fetch(req.params.orderid) 
        const SECRET = '123456';
        console.log(req.body);
        console.log(req.body.payload);
        res.send(req.body)
    }

    async verifypayment(req: Request, res: Response) {
        var orderId = req.body.orderId;
        var paymentId = req.body.paymentId;
        var body = orderId + "|" + paymentId;
        var expectedSignature = crypto.createHmac('sha256', secretkey!).update(body.toString()).digest("hex");
        console.log("sig", req.body.razorpay_signature);
        console.log("sig", req.body.expectedSignature);
        var response = { status: "failure" };
        if (expectedSignature === req.body.razorpay_signature) {
            response = { status: "sucess" };
            res.send(response);
        }

    }

    
}

export { PaymentDomain };