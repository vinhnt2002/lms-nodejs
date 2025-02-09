import { NextFunction, Response, Request } from "express";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/error-handler";
import taskModel from "../models/task.model";

export const getTask = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, status, priority, page, per_page } = req.query;

      const filter: any = {};

      if (title) {
        filter.title = { $regex: title.toString(), $options: "i" }; 
      }
      if (status) {
        const statusParts = status.toString().split(".");

        // status = todo.progress
        filter.status = { $in: statusParts }; 
      }
      if (priority) {
        const priorityParts = priority.toString().split(".");
        filter.priority = { $in: priorityParts };
      }

      // Pagination
      const pageAsNumber = Number(page) || 1;
      const perPageAsNumber = Number(per_page) || 10;
      const skip = (pageAsNumber - 1) * perPageAsNumber;

      
      const totalTasks = await taskModel.countDocuments(filter);
      const paginatedTasks = await taskModel
        .find(filter)
        .select("-_id -createdAt -updatedAt")
        .skip(skip)
        .limit(perPageAsNumber);

      
      res.status(200).json({
        success: true,
        data: paginatedTasks,
        pageCount: Math.ceil(totalTasks / perPageAsNumber),
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
