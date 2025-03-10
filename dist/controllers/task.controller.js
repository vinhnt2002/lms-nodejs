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
exports.getTask = void 0;
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const error_handler_1 = __importDefault(require("../utils/error-handler"));
const task_model_1 = __importDefault(require("../models/task.model"));
exports.getTask = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, status, priority, page, per_page } = req.query;
        const filter = {};
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
        const totalTasks = yield task_model_1.default.countDocuments(filter);
        const paginatedTasks = yield task_model_1.default
            .find(filter)
            .select("-_id -createdAt -updatedAt")
            .skip(skip)
            .limit(perPageAsNumber);
        res.status(200).json({
            success: true,
            data: paginatedTasks,
            pageCount: Math.ceil(totalTasks / perPageAsNumber),
        });
    }
    catch (error) {
        return next(new error_handler_1.default(error.message, 400));
    }
}));
