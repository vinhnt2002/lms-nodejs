import { NextFunction, Request, Response } from "express"
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors"
import ErrorHandler from "../utils/error-handler"
import notificationModel from "../models/notification.model"
import cron from 'node-cron'


// get notification --only admin
export const getNotification = CatchAsyncErrors(async(req: Request, res: Response, next: NextFunction) => {
    try {

        const notifications = await notificationModel.find().sort({createdAt: -1})

        res.status(200).json({
            success: true,
            notifications
        })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})

// update notification status --admin
export const updateNotification = CatchAsyncErrors(async(req: Request, res: Response, next: NextFunction) => {
    try {

        const notification = await notificationModel.findById(req.params.id)

       

        if (!notification) {
          return next(new ErrorHandler("Notification not found", 400));
        } else {
          notification?.status
            ? (notification.status = "read")
            : notification?.status;
        }

        await notification.save();

        const notifications = await notificationModel.find().sort({createdAt : -1})

        res.status(200).json({
            success: true,
            notifications
        })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})


//delete notification auto after read and 30days

cron.schedule("0 0 0 * * *",async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    await notificationModel.deleteMany({status: 'read', createdAt: {$lt: thirtyDaysAgo}})
    console.log("Delete Notifications")
})