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
exports.getAllOrders = exports.createOrder = void 0;
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const error_handler_1 = __importDefault(require("../utils/error-handler"));
const user_model_1 = __importDefault(require("../models/user.model"));
const course_model_1 = __importDefault(require("../models/course.model"));
const order_service_1 = require("../services/order.service");
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const send_mail_1 = __importDefault(require("../utils/send-mail"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
//create order
exports.createOrder = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { courseId, payment_info } = req.body;
        const user = yield user_model_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        const courseExitsInUser = user === null || user === void 0 ? void 0 : user.courses.some((course) => course._id.toString() === courseId);
        if (courseExitsInUser) {
            return next(new error_handler_1.default("You have already to buy this course ", 400));
        }
        const course = yield course_model_1.default.findById(courseId);
        if (!course) {
            return next(new error_handler_1.default("course not found ", 404));
        }
        const data = {
            courseId: course._id,
            userId: user === null || user === void 0 ? void 0 : user._id,
            payment_info,
        };
        const mailData = {
            order: {
                _id: course._id.toString().slice(0, 6),
                name: course.name,
                price: course.price,
                data: new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
            },
        };
        const html = yield ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/order-confirmation.ejs"), { order: mailData });
        try {
            if (user) {
                (0, send_mail_1.default)({
                    email: user.email,
                    subject: "Order confirmation",
                    template: "order-confirmation.ejs",
                    data: mailData,
                });
            }
        }
        catch (error) {
            return next(new error_handler_1.default(error.message, 500));
        }
        user === null || user === void 0 ? void 0 : user.courses.push(course._id);
        yield (user === null || user === void 0 ? void 0 : user.save());
        yield notification_model_1.default.create({
            user: user === null || user === void 0 ? void 0 : user._id,
            title: "New Order",
            message: `You have a new order from ${course.name} `,
        });
        course.purschase ? (course.purschase += 1) : course.purschase = 1;
        console.log(course);
        yield course.save();
        (0, order_service_1.newOrder)(data, res, next);
    }
    catch (error) {
        return next(new error_handler_1.default(error.message, 500));
    }
}));
// get all user --admin
exports.getAllOrders = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, order_service_1.getAllOrderServices)(res);
    }
    catch (error) {
        return next(new error_handler_1.default(error.message, 400));
    }
}));
// payemnt momo -zalopay ....  --later
