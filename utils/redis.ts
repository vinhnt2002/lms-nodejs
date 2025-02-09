import { Redis, RedisOptions } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// Hàm khởi tạo Redis
const createRedisClient = (): Redis => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL is not defined in the environment variables.");
  }

  const options: RedisOptions = {};

  // Kiểm tra nếu dùng giao thức TLS (rediss://)
  if (redisUrl.startsWith("rediss://")) {
    options.tls = {
      rejectUnauthorized: false, // Không xác thực chứng chỉ SSL (chỉ dùng khi cần thiết)
    };
  }

  const redisClient = new Redis(redisUrl, options);

  // Lắng nghe các sự kiện của Redis
  redisClient.on("connect", () => {
    console.log("Redis connected successfully.");
  });

  redisClient.on("ready", () => {
    console.log("Redis is ready to use.");
  });

  redisClient.on("error", (err: Error) => {
    console.error("Redis connection error:", err.message);
  });

  redisClient.on("reconnecting", (time: number) => {
    console.log(`Reconnecting to Redis in ${time}ms...`);
  });

  redisClient.on("end", () => {
    console.warn("Redis connection closed.");
  });

  return redisClient;
};

// Khởi tạo Redis client
export const redis = createRedisClient();
