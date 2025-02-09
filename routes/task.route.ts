import express from 'express'
import { getTask } from '../controllers/task.controller';


const taskRouter = express.Router();


taskRouter.get('/tasks', getTask)



export default taskRouter