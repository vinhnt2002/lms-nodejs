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

// get all orders 
export const getAllOrderServices = async (res: Response) => {
    const orders = await orderModel.find().sort({ createdAt: -1 });
  
    res.status(200).json({
      success: true,
      orders,
    });
  };
  