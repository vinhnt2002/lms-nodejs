"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMiddleWare = void 0;
const error_handler_1 = __importDefault(require("../utils/error-handler"));
const ErrorMiddleWare = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || 'Internal server error';
    //wrong mongodb id connect error
    if (err.name === 'CastError') {
        const message = `Resource not found. Invalid ${err.path}`;
        err = new error_handler_1.default(message, 400);
    }
    // Duplicate key error 
    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
        err = new error_handler_1.default(message, 400);
    }
    // wrong jwt error
    if (err.name === 'JsonWebTokenError') {
        const message = `Json web token is invalid, try again`;
        err = new error_handler_1.default(message, 400);
    }
    //JWT expried error
    if (err.name === 'TokenExpiredError') {
        const message = `Json web token is expired, try again`;
        err = new error_handler_1.default(message, 400);
    }
    res.status(err.statusCode).json({
        success: false,
        message: err.message
    });
};
exports.ErrorMiddleWare = ErrorMiddleWare;
