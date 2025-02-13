import { NextFunction, Request, Response } from "express";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/error-handler";
import cloudinary from "cloudinary";
import {
  deleteImageFromCloudinary,
  uploadImageToCloudinary,
} from "../utils/cloudinary";
import {
  createCourseService,
  getAllCourseServices,
  getCourseWithSignedUrlServices,
  updateCourseService,
} from "../services/course.service";
import courseModel, { ICourse } from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/send-mail";
import notificationModel from "../models/notification.model";
import {
  deleteImageS3,
  getSignedImageUrl,
  updateImageS3,
  uploadImageS3,
} from "../utils/s3";
// export const uploadCourse = CatchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const data = req.body;
//       const thumbnail = data.thumbnail;

//       if (thumbnail) {
//         const myCloud = await uploadImageToCloudinary(thumbnail, "courses");

//         data.thumbnail = {
//           public_id: myCloud.public_id,
//           url: myCloud.url,
//         };
//       }

//       createCourseService(data, res, next);
//     } catch (error: any) {
//       return next(new ErrorHandler(error.message, 400));
//     }
//   }
// );

export const uploadCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = req.body.thumbnail;

      if (thumbnail) {
        let uploadResult: { key: string };

        if (typeof thumbnail === "string" && thumbnail.startsWith("http")) {
          uploadResult = await uploadImageS3(thumbnail, "image.jpg");
        } else if (!Array.isArray(thumbnail) && thumbnail.data) {
          uploadResult = await uploadImageS3(thumbnail.data, thumbnail.name);
        } else {
          return next(new ErrorHandler("Invalid thumbnail", 400));
        }

        data.thumbnail = {
          public_id: uploadResult.key,
        };
      }

      createCourseService(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const updateCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      const public_id = data.public_id
      const courseId = req.params.id;

      if (thumbnail) {
        const uploadResult =
          (typeof thumbnail === "string" && thumbnail.startsWith("http")) ||
          (!Array.isArray(thumbnail) && thumbnail.data)
            ? await updateImageS3(
              public_id|| "",
                typeof thumbnail === "string" ? thumbnail : thumbnail.data,
                typeof thumbnail === "string" ? "image.jpg" : thumbnail.name
              )
            : (() => {
                throw new ErrorHandler("Invalid thumbnail", 400);
              })();

        data.thumbnail = {
          public_id: uploadResult.key,
        };
      }

      const course: ICourse| null = await courseModel.findByIdAndUpdate(
        courseId,
        { $set: data },
        { new: true }
      );

      const course_res = await getCourseWithSignedUrlServices(course);
      res.status(201).json({
        success: true,
        course_res,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//get singleCourse ----> without purchase
export const getSingleCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const isCachedCourse = await redis.get(courseId);
console.log(courseId)
      let course: ICourse;
      
      if (isCachedCourse) {
        console.log("go here")
        course = JSON.parse(isCachedCourse);
        console.log(course)
        course = await getCourseWithSignedUrlServices(course) || course;
      } else {
        console.log("go here1")
        course = await courseModel
          .findById(courseId)
          .select(
            "-courseData.suggestion -courseData.comments -courseData.videoUrl -courseData.links"
          );
          
        course = await getCourseWithSignedUrlServices(course) || course;
        
        await redis.set(courseId, JSON.stringify(course));
      }

      res.status(200).json({
        success: true,
        course, 
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get course with out purchase
export const getAllCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isCachedCourse = await redis.get("allCourse");

      let courses: ICourse[] = isCachedCourse
        ? JSON.parse(isCachedCourse)
        : await courseModel
            .find({})
            .select(
              "-courseData.suggestion -courseData.comments -courseData.videoUrl -courseData.links"
            );

      if (!isCachedCourse) {
        await redis.set("allCourse", JSON.stringify(courses));
      }

      const coursesWithUrls = await Promise.all(
        courses.map((course) => getCourseWithSignedUrlServices(course))
      );
      res.status(200).json({
        success: true,
        coursesWithUrls,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get courseData --only valid for user
export const getCourseByUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;

      const courseExits = userCourseList?.find(
        (course: any) => course._id.toString() === courseId
      );

      if (!courseExits) {
        return next(
          new ErrorHandler(
            "You are not permission to access this resourse",
            404
          )
        );
      }

      const course: any = await courseModel.findById(courseId);
      const courseConvertImageServices = await getCourseWithSignedUrlServices(
        course
      );
      const courseData = courseConvertImageServices?.courseData;
      res.status(200).json({
        success: true,
        courseData,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//create comment in course
interface ICommnetBody {
  comment: string;
  courseId: string;
  courseDataId: string;
}

export const addCommnet = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, courseDataId, comment } = req.body as ICommnetBody;

      const course = await courseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(courseDataId)) {
        return next(new ErrorHandler("Invalid courseDataId", 400));
      }
      const courseData = course?.courseData.find((item: any) =>
        item._id.equals(courseDataId)
      );

      if (!courseData) {
        return next(new ErrorHandler("Invalid courseDataId", 400));
      }

      //create the new comment
      const newComment: any = {
        user: req.user,
        comment,
        commentReplies: [],
      };

      // add comment to courseData
      courseData.comments.push(newComment);

      await notificationModel.create({
        user: req.user?._id,
        title: "New Question",
        message: `You have the new question in this ${courseData.title}`,
      });

      await course?.save();

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add answer course comment
interface IAnswerComment {
  answer: string;
  courseId: string;
  courseDataId: string;
  commentId: string;
}

export const addAnswer = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, courseDataId, answer, commentId } =
        req.body as IAnswerComment;

      const course = await courseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(courseDataId)) {
        return next(new ErrorHandler("Invalid courseDataId", 400));
      }
      const courseData = course?.courseData.find((item: any) =>
        item._id.equals(courseDataId)
      );

      if (!courseData) {
        return next(new ErrorHandler("Invalid courseDataId", 400));
      }
      const comment = courseData?.comments.find((item: any) =>
        item._id.equals(commentId)
      );

      if (!comment) {
        return next(new ErrorHandler("Invalid commentId", 400));
      }
      //create the new answer
      const newAnswer: any = {
        user: req.user,
        answer,
      };

      // add answer to courseData
      comment.commentReplies?.push(newAnswer);

      await course?.save();

      //notificate check
      if (req.user?._id === comment.user._id) {
        // create nofificate
        await notificationModel.create({
          user: req.user?._id,
          title: "New Question",
          message: `You have the new question in this ${courseData.title}`,
        });
      } else {
        const data = {
          name: comment.user.name,
          title: courseData.title,
        };

        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/question-reply.ejs"),
          data
        );

        try {
          await sendMail({
            email: comment.user.email,
            subject: "Question Reply",
            template: "question-reply.ejs",
            data,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 500));
        }
      }

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//add revier course -- only user in course
interface IReviewBody {
  review: string;
  rating: number;
}

export const addReview = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { review, rating } = req.body as IReviewBody;
      const courseId = req.params.id;
      const userCourseList = req.user?.courses;

      // check course exits
      const courseExits = userCourseList?.some(
        (course: any) => course._id.toString() === courseId
      );

      if (!courseExits) {
        return next(new ErrorHandler("You not stay in this course", 400));
      }

      const course = await courseModel.findById(courseId);

      const reviewData: any = {
        comment: review,
        rating,
      };

      course?.reviews.push(reviewData);

      // calculate the start of rating in 5
      let avg = 0;
      course?.reviews.forEach((review) => (avg += review.rating));

      if (course) {
        course.ratings = avg / course.reviews.length; // example: we have 2 reviews one is 5 and one is 4. So match working like 9 /2 = 4.5
      }

      await course?.save();

      //create notificate
      const notification = {
        title: "New Review Recived",
        message: `${req.user?.name} has given review in your ${course?.name}`,
      };

      //TO DO TO CREATE NOTIFICATE

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add reply to review course -- only admin
interface IReplyReview {
  comment: string;
  courseId: string;
  reviewId: string;
}

export const addReplyReview = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment, courseId, reviewId } = req.body as IReplyReview;

      const course = await courseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const review = course.reviews.find(
        (review) => review._id.toString() === reviewId
      );

      if (!review) {
        return next(new ErrorHandler("review not found", 404));
      }

      const replyReview: any = {
        user: req.user,
        comment,
      };

      if (!review.commentReplies) {
        review.commentReplies = [];
      }

      review.commentReplies.push(replyReview);

      // await notificationModel.create({
      //   userId: req.user?._id,
      //   title: "New Question",
      //   message: `You have the new question in this ${course.name}`
      // })

      await course?.save();

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get all course --admin
export const adminGetAllCourses = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllCourseServices(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// delete course  --admin
export const deleteCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const course = await courseModel.findById(id);

      if (!course) {
        return next(new ErrorHandler("course not found", 400));
      }

      await course.deleteOne({ id });

      await redis.del(id);

      res.status(200).json({
        success: true,
        message: "delete successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// video run by 3th --later
