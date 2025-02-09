import mongoose, { Document, Schema, Model } from "mongoose";


export interface ITask extends Document {
    id: string;
    code: string;
    title: string;
    status: string;
    label: string;
    priority: string;

}

const TaskSchema = new Schema<ITask>({
    id: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    title: {
        type: String,
    },
    status: {
        type: String,
    },
    label: {
        type: String,
    },
    priority: {
        type: String,
    }
}, {timestamps: true})

const taskModel = mongoose.model<ITask>("Task", TaskSchema)

export default taskModel