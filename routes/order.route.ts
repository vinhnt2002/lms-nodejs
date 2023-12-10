import express from 'express'
import { createOrder, getAllOrders } from '../controllers/order.controller';
import { authorized, isAuthenticated } from '../middleware/auth';

const orderRouter = express.Router();


orderRouter.post('/create-order',isAuthenticated ,createOrder)

orderRouter.get('/orders',isAuthenticated, authorized("admin") ,getAllOrders)


export default orderRouter