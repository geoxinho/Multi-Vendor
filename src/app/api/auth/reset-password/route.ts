import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AdminUser } from "@/models/AdminUser";
import { User } from "@/models/User";
import { findUserAcrossCampuses, getCampusUserModel } from "@/lib/campusModels";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, token, password } = await req.json();

    if (!email || !token || !password) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    await connectDB();
    const cleanEmail = email.toLowerCase().trim();

    const hashedPassword = await bcrypt.hash(password, 12);

    // 1. Check AdminUser
    const admin = await AdminUser.findOne({
      email: cleanEmail,
      passwordResetToken: token,
      passwordResetTokenExpires: { $gt: new Date() },
    });

    if (admin) {
      await AdminUser.findByIdAndUpdate(admin._id, {
        password: hashedPassword,
        passwordResetToken: "",
        $unset: { passwordResetTokenExpires: 1 },
      });
      return NextResponse.json({ message: "Password updated successfully." });
    }

    // 2. Check campus collections
    const campusRes = await findUserAcrossCampuses({
      email: cleanEmail,
      passwordResetToken: token,
      passwordResetTokenExpires: { $gt: new Date() },
    });

    if (campusRes) {
      const CampusUser = getCampusUserModel(campusRes.campusSlug);
      await CampusUser.findByIdAndUpdate(campusRes.user._id, {
        password: hashedPassword,
        passwordResetToken: "",
        $unset: { passwordResetTokenExpires: 1 },
      });
      return NextResponse.json({ message: "Password updated successfully." });
    }

    // 3. Legacy fallback
    const user = await User.findOne({
      email: cleanEmail,
      passwordResetToken: token,
      passwordResetTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
    }

    user.password = hashedPassword;
    user.passwordResetToken = "";
    user.passwordResetTokenExpires = undefined;
    await user.save();

    return NextResponse.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("[RESET PASSWORD]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
