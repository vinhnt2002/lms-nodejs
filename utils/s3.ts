import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  GetObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import dotenv from "dotenv";
import path from "path";
import axios from "axios";

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Upload file lên S3 từ buffer hoặc URL
 * @param input Buffer hoặc URL của file
 * @param fileName Tên file
 * @returns URL file trên S3
 */

export const uploadImageS3 = async (
  input: Buffer | string,
  fileName: string
): Promise<{ key: string }> => {
  try {
    let fileBuffer: Buffer;
    let fileExtension: string;

    // Kiểm tra nếu input là URL
    if (typeof input === "string" && input.startsWith("http")) {
      // Download file từ URL
      const response = await axios.get(input, { responseType: "arraybuffer" });
      fileBuffer = Buffer.from(response.data);

      // Lấy extension từ Content-Type
      const contentType = response.headers["content-type"];
      fileExtension = `.${contentType.split("/")[1]}`;
    } else {
      // Nếu input là Buffer
      fileBuffer = input as Buffer;
      fileExtension = path.extname(fileName);
    }

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const key = `uploads/${uniqueSuffix}${fileExtension}`;

    const upload = new Upload({
      client: s3,
      params: {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: getContentType(fileExtension),
      },
    });

    console.log(key);
    await upload.done();
    return { key };
  } catch (error) {
    console.error("Lỗi khi upload lên S3:", error);
    throw new Error("Upload failed");
  }
};

/**
 * Xóa hình ảnh trên S3
 * @param key Key ảnh cần xóa
 */
export const deleteImageS3 = async (key: string): Promise<void> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
    });

    await s3.send(command);
    console.log(`Ảnh với key ${key} đã bị xóa.`);
  } catch (error) {
    console.error(`Lỗi khi xóa ảnh với key ${key}:`, error);
    throw new Error("Xóa ảnh thất bại");
  }
};

/**
 * Cập nhật hình ảnh trên S3 bằng cách xóa ảnh cũ và upload ảnh mới
 * @param oldKey Key ảnh cũ
 * @param input Buffer hoặc URL ảnh mới
 * @param fileName Tên file mới
 * @returns Key ảnh mới
 */

export const updateImageS3 = async (
  oldKey: string,
  input: Buffer | string,
  fileName: string
): Promise<{ key: string }> => {
  await deleteImageS3(oldKey);
  return await uploadImageS3(input, fileName);
};

const getContentType = (ext: string): string => {
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

export const getSignedImageUrl = async (
  key: string,
  expiresIn = 3600
): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn });
  console.log("test run", signedUrl)
  return signedUrl;
};
