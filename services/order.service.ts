import { NextFunction, Response } from 'express';
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors";
import orderModel from '../models/order.model';



export const newOrder = CatchAsyncErrors(async(data:any, res: Response, next: NextFunction)=> {
    const order = await orderModel.create(data)

    res.status(201).json({
        success: true,
        order: order
    })

})