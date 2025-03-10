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
exports.getCourseWithSignedUrlServices = exports.getAllCourseServices = exports.updateCourseService = exports.createCourseService = void 0;
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const course_model_1 = __importDefault(require("../models/course.model"));
const s3_1 = require("../utils/s3");
exports.createCourseService = (0, catchAsyncErrors_1.CatchAsyncErrors)((data, res) => __awaiter(void 0, void 0, void 0, function* () {
    const course = yield course_model_1.default.create(data);
    const course_res = yield (0, exports.getCourseWithSignedUrlServices)(course);
    res.status(201).json({
        success: true,
        course_res,
    });
}));
exports.updateCourseService = (0, catchAsyncErrors_1.CatchAsyncErrors)((data, courseId, res) => __awaiter(void 0, void 0, void 0, function* () {
    const course = yield course_model_1.default.findByIdAndUpdate(courseId, { $set: data }, { new: true });
    res.status(201).json({
        success: true,
        course,
    });
}));
// get all courses
const getAllCourseServices = (res) => __awaiter(void 0, void 0, void 0, function* () {
    const courses = yield course_model_1.default.find().sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        courses,
    });
});
exports.getAllCourseServices = getAllCourseServices;
// get course with getCourseWithSignedUrls
const getCourseWithSignedUrlServices = (course) => __awaiter(void 0, void 0, void 0, function* () {
    if (!course) {
        return null;
    }
    try {
        const imageUrl = yield (0, s3_1.getSignedImageUrl)(course.thumbnail.public_id);
        console.log(imageUrl);
        course.thumbnail.image_url = imageUrl;
        return course;
    }
    catch (error) {
        console.error('Error getting signed URL:', error);
        return null;
    }
});
exports.getCourseWithSignedUrlServices = getCourseWithSignedUrlServices;
