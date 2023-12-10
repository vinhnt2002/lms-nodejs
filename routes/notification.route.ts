import express from 'express'
import { authorized, isAuthenticated } from '../middleware/auth';
import { getNotification, updateNotification } from '../controllers/notification.controller';

const notificationRouter = express.Router();


notificationRouter.get('/get-notification',isAuthenticated, authorized("admin") ,getNotification)

notificationRouter.put('/update-notification/:id',isAuthenticated, authorized("admin") ,updateNotification)


export default notificationRouter