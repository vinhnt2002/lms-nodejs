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
exports.getSignedImageUrl = exports.updateImageS3 = exports.deleteImageS3 = exports.uploadImageS3 = void 0;
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const client_s3_1 = require("@aws-sdk/client-s3");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
dotenv_1.default.config();
const s3 = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
/**
 * Upload file lên S3 từ buffer hoặc URL
 * @param input Buffer hoặc URL của file
 * @param fileName Tên file
 * @returns URL file trên S3
 */
const uploadImageS3 = (input, fileName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let fileBuffer;
        let fileExtension;
        // Kiểm tra nếu input là URL
        if (typeof input === "string" && input.startsWith("http")) {
            // Download file từ URL
            const response = yield axios_1.default.get(input, { responseType: "arraybuffer" });
            fileBuffer = Buffer.from(response.data);
            // Lấy extension từ Content-Type
            const contentType = response.headers["content-type"];
            fileExtension = `.${contentType.split("/")[1]}`;
        }
        else {
            // Nếu input là Buffer
            fileBuffer = input;
            fileExtension = path_1.default.extname(fileName);
        }
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const key = `uploads/${uniqueSuffix}${fileExtension}`;
        const upload = new lib_storage_1.Upload({
            client: s3,
            params: {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key,
                Body: fileBuffer,
                ContentType: getContentType(fileExtension),
            },
        });
        console.log(key);
        yield upload.done();
        return { key };
    }
    catch (error) {
        console.error("Lỗi khi upload lên S3:", error);
        throw new Error("Upload failed");
    }
});
exports.uploadImageS3 = uploadImageS3;
/**
 * Xóa hình ảnh trên S3
 * @param key Key ảnh cần xóa
 */
const deleteImageS3 = (key) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
        });
        yield s3.send(command);
        console.log(`Ảnh với key ${key} đã bị xóa.`);
    }
    catch (error) {
        console.error(`Lỗi khi xóa ảnh với key ${key}:`, error);
        throw new Error("Xóa ảnh thất bại");
    }
});
exports.deleteImageS3 = deleteImageS3;
/**
 * Cập nhật hình ảnh trên S3 bằng cách xóa ảnh cũ và upload ảnh mới
 * @param oldKey Key ảnh cũ
 * @param input Buffer hoặc URL ảnh mới
 * @param fileName Tên file mới
 * @returns Key ảnh mới
 */
const updateImageS3 = (oldKey, input, fileName) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, exports.deleteImageS3)(oldKey);
    return yield (0, exports.uploadImageS3)(input, fileName);
});
exports.updateImageS3 = updateImageS3;
const getContentType = (ext) => {
    switch (ext.toLowerCase()) {
        case ".jpg":
        case ".jpeg":
            return "image/jpeg";
        case ".png":
            return "image/png";
        case ".gif":
            return "image/gif";
        default:
            return "application/octet-stream";
    }
};
const getSignedImageUrl = (key, expiresIn = 3600) => __awaiter(void 0, void 0, void 0, function* () {
    const command = new client_s3_1.GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
    });
    const signedUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3, command, { expiresIn });
    console.log("test run", signedUrl);
    return signedUrl;
});
exports.getSignedImageUrl = getSignedImageUrl;
