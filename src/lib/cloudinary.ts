import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

/**
 * Saves a file locally as a fallback
 */
function saveLocally(fileBuffer: Buffer): string {
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Simple magic bytes check to determine extension
    let ext = "png";
    if (fileBuffer.length > 4) {
      const header = fileBuffer.toString("hex", 0, 4);
      if (header.startsWith("89504e47")) ext = "png";
      else if (header.startsWith("ffd8ffe0") || header.startsWith("ffd8ffe1") || header.startsWith("ffd8ffe2")) ext = "jpg";
      else if (header.startsWith("47494638")) ext = "gif";
      else if (header.startsWith("25504446")) ext = "pdf";
    }

    const filename = `${randomBytes(8).toString("hex")}.${ext}`;
    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, fileBuffer);
    
    console.log("[CLOUDINARY FALLBACK] Saved image locally to:", filepath);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error("[CLOUDINARY FALLBACK] Failed to save locally:", err);
    throw new Error("Failed to upload image.");
  }
}

export async function uploadImage(
  fileBuffer: Buffer,
  folder = "marketplace"
): Promise<string> {
  // If Cloudinary keys are missing, save locally immediately
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return saveLocally(fileBuffer);
  }

  return new Promise((resolve) => {
    let completed = false;

    // Timeout after 25 seconds for remote upload completion
    const timeout = setTimeout(() => {
      if (!completed) {
        completed = true;
        console.warn("[CLOUDINARY] Upload timed out after 25s. Falling back to local storage.");
        try {
          resolve(saveLocally(fileBuffer));
        } catch (e) {
          resolve(""); // Fallback failed
        }
      }
    }, 25000);

    try {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "image" },
        (error, result) => {
          if (completed) return;
          completed = true;
          clearTimeout(timeout);

          if (error || !result) {
            console.error("[CLOUDINARY] Upload stream error:", error);
            // Fallback to local storage
            resolve(saveLocally(fileBuffer));
          } else {
            resolve(result.secure_url);
          }
        }
      );
      stream.end(fileBuffer);
    } catch (err) {
      if (completed) return;
      completed = true;
      clearTimeout(timeout);
      console.error("[CLOUDINARY] Catch block error:", err);
      resolve(saveLocally(fileBuffer));
    }
  });
}

export async function deleteImage(publicId: string) {
  if (publicId.startsWith("/uploads/")) {
    try {
      const filepath = path.join(process.cwd(), "public", publicId);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log("[CLOUDINARY FALLBACK] Deleted local file:", filepath);
      }
      return { result: "ok" };
    } catch (err) {
      console.error("[CLOUDINARY FALLBACK] Failed to delete local file:", err);
      return { result: "error" };
    }
  }
  return cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
