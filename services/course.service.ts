import { Request, Response } from "express";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors";
import courseModel from "../models/course.model";

export const createCourseService = CatchAsyncErrors(
  async (data: any, res: Response) => {
    const course = await courseModel.create(data);

    res.status(201).json({
      success: true,
      course,
    });
  }
);

export const updateCourseService = CatchAsyncErrors(
  async (data: any,courseId: string , res: Response) => {
    const course = await courseModel.findByIdAndUpdate(
      courseId,
      { $set: data },
      { new: true }
    );

    res.status(201).json({
      success: true,
      course
    })
  }
);

// get all courses 
export const getAllCourseServices = async (res: Response) => {
  const courses = await courseModel.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    courses,
  });
};
