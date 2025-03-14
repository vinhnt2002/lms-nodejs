"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const course_controller_1 = require("../controllers/course.controller");
const auth_1 = require("../middleware/auth");
const courseRouter = express_1.default.Router();
courseRouter.post('/create-course', course_controller_1.uploadCourse);
courseRouter.put('/update-course/:id', auth_1.isAuthenticated, (0, auth_1.authorized)("admin"), course_controller_1.updateCourse);
courseRouter.get('/get-course/:id', course_controller_1.getSingleCourse);
courseRouter.get('/get-courses', course_controller_1.getAllCourse);
courseRouter.get('/courses', auth_1.isAuthenticated, (0, auth_1.authorized)("admin"), course_controller_1.adminGetAllCourses);
courseRouter.get("/get-user-course/:id", auth_1.isAuthenticated, course_controller_1.getCourseByUser);
courseRouter.put("/add-comment", auth_1.isAuthenticated, course_controller_1.addCommnet);
courseRouter.put("/add-answer", auth_1.isAuthenticated, course_controller_1.addAnswer);
courseRouter.put("/add-reviews/:id", auth_1.isAuthenticated, course_controller_1.addReview);
courseRouter.put("/add-reply-review", auth_1.isAuthenticated, (0, auth_1.authorized)("admin"), course_controller_1.addReplyReview);
courseRouter.put("/delete-course/:id", auth_1.isAuthenticated, (0, auth_1.authorized)("admin"), course_controller_1.deleteCourse);
exports.default = courseRouter;
