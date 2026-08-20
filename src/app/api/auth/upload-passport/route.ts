import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";

/**
 * POST /api/auth/upload-passport
 * Public endpoint — no session required.
 * Accepts a single image file via multipart/form-data (field: "file")
 * and uploads it to Cloudinary under the "marketplace/passports" folder.
 *
 * Rate-limited to 5 uploads per IP per 10 minutes.
 */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 10 * 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many uploads. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // Validate type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are accepted." },
        { status: 400 }
      );
    }

    // Validate size — max 5 MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 5 MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadImage(buffer, "marketplace/passports");

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[UPLOAD PASSPORT]", err);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
