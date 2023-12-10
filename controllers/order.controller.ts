import { NextFunction, Request, Response } from "express";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/error-handler";
import { IOrder } from "../models/order.model";
import userModal from "../models/user.model";
import courseModel from "../models/course.model";
import { newOrder } from "../services/order.service";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/send-mail";
import notificationModel from "../models/notification.model";

//create order
export const createOrder = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, payment_info } = req.body as IOrder;

      const user = await userModal.findById(req.user?._id);

      const courseExitsInUser = user?.courses.some(
        (course: any) => course._id.toString() === courseId
      );

      if (courseExitsInUser) {
        return next(
          new ErrorHandler("You have already to buy this course ", 400)
        );
      }

      const course = await courseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("course not found ", 404));
      }

      const data: any = {
        courseId: course._id,
        userId: user?._id,
        payment_info,
      };

      const mailData = {
        order: {
          _id: course._id.toString().slice(0, 6),
          name: course.name,
          price: course.price,
          data: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        },
      };

      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/order-confirmation.ejs"),
        { order: mailData }
      );

      try {
        if (user) {
          sendMail({
            email: user.email,
            subject: "Order confirmation",
            template: "order-confirmation.ejs",
            data: mailData,
          });
        }
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      user?.courses.push(course._id);
      await user?.save();

      await notificationModel.create({
        user: user?._id,
        title: "New Order",
        message: `You have a new order from ${course.name} `,
      });

      course.purschase ? (course.purschase += 1) : course.purschase = 1;
      
      console.log(course);

      await course.save();
      newOrder(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
// export const createOrder = CatchAsyncErrors(async(req: Request, res: Response, next: NextFunction) => {
//     try {

//     } catch (error: any) {
//         return next(new ErrorHandler(error.message, 400))
//     }
// })
// export const createOrder = CatchAsyncErrors(async(req: Request, res: Response, next: NextFunction) => {
//     try {

//     } catch (error: any) {
//         return next(new ErrorHandler(error.message, 400))
//     }
// })
// export const createOrder = CatchAsyncErrors(async(req: Request, res: Response, next: NextFunction) => {
//     try {

//     } catch (error: any) {
//         return next(new ErrorHandler(error.message, 400))
//     }
// })
