import express, { Express, Request, Response } from 'express';
import * as dotenv from 'dotenv';
dotenv.config();
import { Razorpay } from 'razorpay-typescript';
import * as crypto from "crypto";
import { StatusCode } from '../statuscode';
// import {RazorWebhook} from 'razorpay-typescript'
// import { Razorpay } from "../dist/razorpay";
//import Razorpay from 'razorpay';
var secretkey = process.env.secretkey;
const instance: Razorpay = new Razorpay({
    authKey: {
        key_id: 'rzp_test_LqRkyAt6cQpVui',
        key_secret: 'yCKG9zsdIoWft58QwrYxjf1G',
    },
});
const secret_key = 'yCKG9zsdIoWft58QwrYxjf1G'
class PaymentDomain {

    async createOrder(req: Request, res: Response) {
        let amount = req.body.amount;
        const options = {
            amount: amount,
            currency: 'INR',
            // receipt: "order_rcptid_11", // any unique id
        }
        console.log(options);
        try {


            const response = await instance.orders.create(options);
            console.log("hy");
            console.log(response.currency);
            res.json({
                order_id: response.id,
                currency: response.currency,
                amount: response.amount
            })
        } catch (error: any) {
            res.status(400).send('Unable to create order');
        }



    }

    async verifypayment(req: Request, res: Response) {
        var orderId = req.body.orderId;
        var paymentId = req.body.paymentId;
        var body = orderId + "|" + paymentId;
        var expectedSignature = crypto.createHmac('sha256',secret_key).update(body.toString()).digest("hex");
        console.log("sig" , req.body.razorpay_signature);
        console.log("sig" , req.body.expectedSignature);
        var response = {status : "failure"};
        if(expectedSignature === req.body.razorpay_signature){
            response = {status : "sucess"};
            res.send(response);
        }

    }
}

export { PaymentDomain };