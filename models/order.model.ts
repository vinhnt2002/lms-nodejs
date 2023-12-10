import mongoose, { Document, Schema, Model } from "mongoose";


export interface IOrder extends Document {
    userId: string,
    courseId: string,
    payment_info: object
}

const OrderSchema = new Schema<IOrder>({
    userId: {
        type: String,
        required: true
    },
    courseId: {
        type: String,
        required: true
    },
    payment_info: {
        type: Object,
        // required: true 
    }
}, {timestamps: true})

const orderModel = mongoose.model<IOrder>("Order", OrderSchema)

export default orderModel