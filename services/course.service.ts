import { Request, Response } from "express";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors";
import courseModel, { ICourse } from "../models/course.model";
import { getSignedImageUrl } from "../utils/s3";

export const createCourseService = CatchAsyncErrors(
  async (data: any, res: Response) => {
    const course: ICourse = await courseModel.create(data);
    const course_res = await getCourseWithSignedUrlServices(course)
    res.status(201).json({
      success: true,
      course_res,
    });
  }
);

export const updateCourseService = CatchAsyncErrors(
  async (data: any, courseId: string, res: Response) => {
    const course = await courseModel.findByIdAndUpdate(
      courseId,
      { $set: data },
      { new: true }
    );

    res.status(201).json({
      success: true,
      course,
    });
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

// get course with getCourseWithSignedUrls

export const getCourseWithSignedUrlServices = async (course: ICourse| null) => {
  if (!course) {
    return null;
  }

  try {
    const imageUrl = await getSignedImageUrl(course.thumbnail.public_id);
    console.log(imageUrl)
    course.thumbnail.image_url = imageUrl;
    return course;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }
};
