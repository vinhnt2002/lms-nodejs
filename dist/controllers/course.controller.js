"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCourse = exports.adminGetAllCourses = exports.addReplyReview = exports.addReview = exports.addAnswer = exports.addCommnet = exports.getCourseByUser = exports.getAllCourse = exports.getSingleCourse = exports.updateCourse = exports.uploadCourse = void 0;
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const error_handler_1 = __importDefault(require("../utils/error-handler"));
const course_service_1 = require("../services/course.service");
const course_model_1 = __importDefault(require("../models/course.model"));
const redis_1 = require("../utils/redis");
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const send_mail_1 = __importDefault(require("../utils/send-mail"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const s3_1 = require("../utils/s3");
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
exports.uploadCourse = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        const thumbnail = req.body.thumbnail;
        if (thumbnail) {
            let uploadResult;
            if (typeof thumbnail === "string" && thumbnail.startsWith("http")) {
                uploadResult = yield (0, s3_1.uploadImageS3)(thumbnail, "image.jpg");
            }
            else if (!Array.isArray(thumbnail) && thumbnail.data) {
                uploadResult = yield (0, s3_1.uploadImageS3)(thumbnail.data, thumbnail.name);
            }
            else {
                return next(new error_handler_1.default("Invalid thumbnail", 400));
            }
            data.thumbnail = {
                public_id: uploadResult.key,
            };
        }
        (0, course_service_1.createCourseService)(data, res, next);
    }
    catch (error) {
        return next(new error_handler_1.default(error.message, 400));
    }
}));
exports.updateCourse = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        const public_id = data.public_id;
        const courseId = req.params.id;
        if (thumbnail) {
            const uploadResult = (typeof thumbnail === "string" && thumbnail.startsWith("http")) ||
                (!Array.isArray(thumbnail) && thumbnail.data)
                ? yield (0, s3_1.updateImageS3)(public_id || "", typeof thumbnail === "string" ? thumbnail : thumbnail.data, typeof thumbnail === "string" ? "image.jpg" : thumbnail.name)
                : (() => {
                    throw new error_handler_1.default("Invalid thumbnail", 400);
                })();
            data.thumbnail = {
                public_id: uploadResult.key,
            };
        }
        const course = yield course_model_1.default.findByIdAndUpdate(courseId, { $set: data }, { new: true });
        const course_res = yield (0, course_service_1.getCourseWithSignedUrlServices)(course);
        res.status(201).json({
            success: true,
            course_res,
        });
    }
    catch (error) {
        return next(new error_handler_1.default(error.message, 400));
    }
}));
//get singleCourse ----> without purchase
exports.getSingleCourse = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courseId = req.params.id;
        const isCachedCourse = yield redis_1.redis.get(courseId);
        console.log(courseId);
        let course;
        if (isCachedCourse) {
            console.log("go here");
            course = JSON.parse(isCachedCourse);
            console.log(course);
            course = (yield (0, course_service_1.getCourseWithSignedUrlServices)(course)) || course;
        }
        else {
            console.log("go here1");
            course = yield course_model_1.default
                .findById(courseId)
                .select("-courseData.suggestion -courseData.comments -courseData.videoUrl -courseData.links");
            course = (yield (0, course_service_1.getCourseWithSignedUrlServices)(course)) || course;
            yield redis_1.redis.set(courseId, JSON.stringify(course));
        }
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new error_handler_1.default(error.message, 500));
    }
}));
// get course with out purchase
exports.getAllCourse = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isCachedCourse = yield redis_1.redis.get("allCourse");
        let courses = isCachedCourse
            ? JSON.parse(isCachedCourse)
            : yield course_model_1.default
                .find({})
                .select("-courseData.suggestion -courseData.comments -courseData.videoUrl -courseData.links");
        if (!isCachedCourse) {
            yield redis_1.redis.set("allCourse", JSON.stringify(courses));
        }
        const coursesWithUrls = yield Promise.all(courses.map((course) => (0, course_service_1.getCourseWithSignedUrlServices)(course)));
        res.status(200).json({
            success: true,
            coursesWithUrls,
        });
    }
    catch (error) {
        return next(new error_handler_1.default(error.message, 500));
    }
}));
// get courseData --only valid for user
exports.getCourseByUser = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userCourseList = (_a = req.user) === null || _a === void 0 ? void 0 : _a.courses;
        const courseId = req.params.id;
        const courseExits = userCourseList === null || userCourseList === void 0 ? void 0 : userCourseList.find((course) => course._id.toString() === courseId);
        if (!courseExits) {
            return next(new error_handler_1.default("You are not permission to access this resourse", 404));
        }
        const course = yield course_model_1.default.findById(courseId);
        const courseConvertImageServices = yield (0, course_service_1.getCourseWithSignedUrlServices)(course);
        const courseData = courseConvertImageServices === null || courseConvertImageServices === void 0 ? void 0 : courseConvertImageServices.courseData;
        res.status(200).json({
            success: true,
            courseData,
        });
    }
    catch (error) {
        return next(new error_handler_1.default(error.message, 500));
    }
}));
exports.addCommnet = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { courseId, courseDataId, comment } = req.body;
        const course = yield course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(courseDataId)) {
            return next(new error_handler_1.default("Invalid courseDataId", 400));
        }
        const courseData = course === null || course === void 0 ? void 0 : course.courseData.find((item) => item._id.equals(courseDataId));
        if (!courseData) {
            return next(new error_handler_1.default("Invalid courseDataId", 400));
        }
        //create the new comment
        const newComment = {
            user: req.user,
            comment,
            commentReplies: [],
        };
        // add comment to courseData
        courseData.comments.push(newComment);
        yield notification_model_1.default.create({
            user: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
            title: "New Question",
            message: `You have the new question in this ${courseData.title}`,
        });
        yield (course === null || course === void 0 ? void 0 : course.save());
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new error_handler_1.default(error.message, 500));
    }
}));
exports.addAnswer = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d, _e;
    try {
        const { courseId, courseDataId, answer, commentId } = req.body;
        const course = yield course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(courseDataId)) {
            return next(new error_handler_1.default("Invalid courseDataId", 400));
        }
        const courseData = course === null || course === void 0 ? void 0 : course.courseData.find((item) => item._id.equals(courseDataId));
        if (!courseData) {
            return next(new error_handler_1.default("Invalid courseDataId", 400));
        }
        const comment = courseData === null || courseData === void 0 ? void 0 : courseData.comments.find((item) => item._id.equals(commentId));
        if (!comment) {
            return next(new error_handler_1.default("Invalid commentId", 400));
        }
        //create the new answer
        const newAnswer = {
            user: req.user,
            answer,
        };
        // add answer to courseData
        (_c = comment.commentReplies) === null || _c === void 0 ? void 0 : _c.push(newAnswer);
        yield (course === null || course === void 0 ? void 0 : course.save());
        //notificate check
        if (((_d = req.user) === null || _d === void 0 ? void 0 : _d._id) === comment.user._id) {
            // create nofificate
            yield notification_model_1.default.create({
                user: (_e = req.user) === null || _e === void 0 ? void 0 : _e._id,
                title: "New Question",
                message: `You have the new question in this ${courseData.title}`,
            });
        }
        else {
            const data = {
                name: comment.user.name,
                title: courseData.title,
            };
            const html = yield ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/question-reply.ejs"), data);
            try {
                yield (0, send_mail_1.default)({
                    email: comment.user.email,
                    subject: "Question Reply",
                    template: "question-reply.ejs",
                    data,
                });
            }
            catch (error) {
                return next(new error_handler_1.default(error.message, 500));
            }
        }
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new error_handler_1.default(error.message, 500));
    }
}));
exports.addReview = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f, _g;
    try {
        const { review, rating } = req.body;
        const courseId = req.params.id;
        const userCourseList = (_f = req.user) === null || _f === void 0 ? void 0 : _f.courses;
        // check course exits
        const courseExits = userCourseList === null || userCourseList === void 0 ? void 0 : userCourseList.some((course) => course._id.toString() === courseId);
        if (!courseExits) {
            return next(new error_handler_1.default("You not stay in this course", 400));
        }
        const course = yield course_model_1.default.findById(courseId);
        const reviewData = {
            comment: review,
            rating,
        };
        course === null || course === void 0 ? void 0 : course.reviews.push(reviewData);
        // calculate the start of rating in 5
        let avg = 0;
        course === null || course === void 0 ? void 0 : course.reviews.forEach((review) => (avg += review.rating));
        if (course) {
            course.ratings = avg / course.reviews.length; // example: we have 2 reviews one is 5 and one is 4. So match working like 9 /2 = 4.5
        }
        yield (course === null || course === void 0 ? void 0 : course.save());
        //create notificate
        const notification = {
            title: "New Review Recived",
            message: `${(_g = req.user) === null || _g === void 0 ? void 0 : _g.name} has given review in your ${course === null || course === void 0 ? void 0 : course.name}`,
        };
        //TO DO TO CREATE NOTIFICATE
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new error_handler_1.default(error.message, 500));
    }
}));
exports.addReplyReview = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { comment, courseId, reviewId } = req.body;
        const course = yield course_model_1.default.findById(courseId);
        if (!course) {
            return next(new error_handler_1.default("Course not found", 404));
        }
        const review = course.reviews.find((review) => review._id.toString() === reviewId);
        if (!review) {
            return next(new error_handler_1.default("review not found", 404));
        }
        const replyReview = {
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
        yield (course === null || course === void 0 ? void 0 : course.save());
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new error_handler_1.default(error.message, 500));
    }
}));
// get all course --admin
exports.adminGetAllCourses = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, course_service_1.getAllCourseServices)(res);
    }
    catch (error) {
        return next(new error_handler_1.default(error.message, 400));
    }
}));
// delete course  --admin
exports.deleteCourse = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const course = yield course_model_1.default.findById(id);
        if (!course) {
            return next(new error_handler_1.default("course not found", 400));
        }
        yield course.deleteOne({ id });
        yield redis_1.redis.del(id);
        res.status(200).json({
            success: true,
            message: "delete successfully",
        });
    }
    catch (error) {
        return next(new error_handler_1.default(error.message, 400));
    }
}));
// video run by 3th --later
