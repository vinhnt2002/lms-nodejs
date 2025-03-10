"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = require("ioredis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Hàm khởi tạo Redis
const createRedisClient = () => {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        throw new Error("REDIS_URL is not defined in the environment variables.");
    }
    const options = {};
    // Kiểm tra nếu dùng giao thức TLS (rediss://)
    if (redisUrl.startsWith("rediss://")) {
        options.tls = {
            rejectUnauthorized: false, // Không xác thực chứng chỉ SSL (chỉ dùng khi cần thiết)
        };
    }
    const redisClient = new ioredis_1.Redis(redisUrl, options);
    // Lắng nghe các sự kiện của Redis
    redisClient.on("connect", () => {
        console.log("Redis connected successfully.");
    });
    redisClient.on("ready", () => {
        console.log("Redis is ready to use.");
    });
    redisClient.on("error", (err) => {
        console.error("Redis connection error:", err.message);
    });
    redisClient.on("reconnecting", (time) => {
        console.log(`Reconnecting to Redis in ${time}ms...`);
    });
    redisClient.on("end", () => {
        console.warn("Redis connection closed.");
    });
    return redisClient;
};
// Khởi tạo Redis client
exports.redis = createRedisClient();
