import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { findUserAcrossCampuses, getCampusUserModel } from "@/lib/campusModels";

// POST /api/auth/verify-email
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, token } = body;

    if (!email || !token) {
      return NextResponse.json({ error: "Email and verification code are required" }, { status: 400 });
    }

    await connectDB();

    const campusResult = await findUserAcrossCampuses({
      email: email.toLowerCase(),
      emailVerificationToken: token,
      emailVerificationTokenExpires: { $gt: new Date() },
    });

    if (!campusResult) {
      // Legacy fallback
      const user = await User.findOne({
        email: email.toLowerCase(),
        emailVerificationToken: token,
        emailVerificationTokenExpires: { $gt: new Date() },
      });

      if (!user) {
        return NextResponse.json(
          { error: "The verification code is invalid or has expired." },
          { status: 400 }
        );
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = "";
      user.emailVerificationTokenExpires = undefined;
      await user.save();

      return NextResponse.json({ message: "Email verified successfully" }, { status: 200 });
    }

    const CampusUser = getCampusUserModel(campusResult.campusSlug);
    await CampusUser.findByIdAndUpdate(campusResult.user._id, {
      isEmailVerified: true,
      emailVerificationToken: "",
      $unset: { emailVerificationTokenExpires: 1 },
    });

    return NextResponse.json({ message: "Email verified successfully" }, { status: 200 });
  } catch (err) {
    console.error("[EMAIL VERIFICATION POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
