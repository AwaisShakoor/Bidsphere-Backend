import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function uploadToCloudinary(file: Express.Multer.File) {
  return new Promise<{ public_id: string; secure_url: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "bidsphere/items" },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Image upload failed"));
            return;
          }
          resolve(result as { public_id: string; secure_url: string });
        },
      );
      stream.end(file.buffer);
    },
  );
}

export function deleteFromCloudinary(publicId: string) {
    return cloudinary.uploader.destroy(publicId);
  }

export default cloudinary;
