import { cloudinary } from "./cloudinary.js";

export async function uploadToCloudinary(buffer: Buffer, folder: string) {
  return new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (err, result) => err ? reject(err) : resolve(result as { secure_url: string })
    );
    stream.end(buffer);
  });
}