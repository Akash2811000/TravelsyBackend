import { PaymentDomain } from "../domain/payment_domain";
import express, { Express, Request, Response } from 'express';
var router = express.Router();

class PaymentController {

    static async createOrder(req :Request , res :Response){
        const paymentDomain = new PaymentDomain();
        await paymentDomain.createOrder(req,res);
    }

    // static async verifyPayment(req:Request , res : Response){
    //     const paymentDomain = new PaymentDomain();
    //     await paymentDomain.verifypayment(req,res);
    // }

    static async checkpayment(req:Request , res : Response){
        const paymentDomain = new PaymentDomain();
        await paymentDomain.checkpayment(req,res);
    }
}


router.post("/",PaymentController.createOrder);
//router.post("/verifypayment" , PaymentController.verifyPayment);
router.post("/verifypayment" , PaymentController.checkpayment);

export {router};