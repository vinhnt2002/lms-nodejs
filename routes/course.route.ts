import express from 'express'
import { addAnswer, addCommnet, addReplyReview, addReview, adminGetAllCourses, deleteCourse, getAllCourse, getCourseByUser, getSingleCourse, updateCourse, uploadCourse } from '../controllers/course.controller'
import { authorized, isAuthenticated } from '../middleware/auth'

const courseRouter = express.Router()

courseRouter.post('/create-course', isAuthenticated, authorized("admin") ,uploadCourse)

courseRouter.put('/update-course/:id', isAuthenticated, authorized("admin") ,updateCourse)

courseRouter.get('/get-course/:id' ,getSingleCourse)

courseRouter.get('/get-courses' ,getAllCourse)

courseRouter.get('/courses', isAuthenticated, authorized("admin") ,adminGetAllCourses)

courseRouter.get("/get-user-course/:id", isAuthenticated, getCourseByUser);

courseRouter.put("/add-comment", isAuthenticated, addCommnet);

courseRouter.put("/add-answer", isAuthenticated, addAnswer);

courseRouter.put("/add-reviews/:id", isAuthenticated, addReview);

courseRouter.put("/add-reply-review", isAuthenticated, authorized("admin") , addReplyReview);

courseRouter.put("/delete-course/:id", isAuthenticated, authorized("admin") , deleteCourse);


export default courseRouter