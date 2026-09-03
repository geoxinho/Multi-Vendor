import NextAuth, { AuthError } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { AdminUser } from "@/models/AdminUser";
import { User } from "@/models/User";
import { findUserAcrossCampuses, getCampusUserModel, getCampusSlug } from "./campusModels";
import { authConfig } from "./auth.config";

class CustomAuthError extends AuthError {
  code: string;
  constructor(message: string) {
    super();
    this.type = "CredentialsSignin";
    this.code = message;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();
        const input = (credentials.email as string).toLowerCase().trim();

        // 1. Check Admin collection first
        const admin = await AdminUser.findOne({
          $or: [{ email: input }, { username: input }],
        }).lean();

        if (admin) {
          if (admin.isBanned) throw new CustomAuthError("Your admin account has been suspended.");
          const isMatch = await bcrypt.compare(credentials.password as string, admin.password);
          if (!isMatch) throw new CustomAuthError("Incorrect password. Please try again.");

          AdminUser.findByIdAndUpdate(admin._id, { lastActiveAt: new Date() }).exec().catch(() => {});

          return {
            id: admin._id.toString(),
            name: admin.name,
            email: admin.email,
            role: "admin",
            roles: admin.roles || ["admin"],
            storeName: "",
            school: "",
            campusSlug: "admin",
            image: admin.avatar,
          };
        }

        // 2. Search across campus user collections
        let user: any = null;
        let campusSlug = "";
        let userSchool = "";

        const campusResult = await findUserAcrossCampuses({
          $or: [{ email: input }, { username: input }],
        });

        if (campusResult) {
          user = campusResult.user;
          campusSlug = campusResult.campusSlug;
          userSchool = campusResult.school;
        } else {
          // 3. Fallback for transition/legacy user collection
          const legacyUser = await User.findOne({
            $or: [{ email: input }, { username: input }],
          }).lean();
          if (legacyUser) {
            user = legacyUser;
            userSchool = legacyUser.school || "";
            campusSlug = getCampusSlug(userSchool);
          }
        }

        if (!user) {
          throw new CustomAuthError("No account found with this email address.");
        }
        if (user.isBanned) {
          throw new CustomAuthError("Your account has been banned.");
        }
        if (!user.isEmailVerified && user.role !== "admin") {
          throw new CustomAuthError("Please verify your email address before logging in.");
        }

        const isMatch = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );
        if (!isMatch) {
          throw new CustomAuthError("Incorrect password. Please try again.");
        }

        // Update lastActiveAt in user's campus collection
        if (campusSlug && campusSlug !== "general") {
          getCampusUserModel(campusSlug)
            .findByIdAndUpdate(user._id, { lastActiveAt: new Date() })
            .exec()
            .catch(() => {});
        } else {
          User.findByIdAndUpdate(user._id, { lastActiveAt: new Date() }).exec().catch(() => {});
        }

        const roles: string[] =
          user.roles && user.roles.length > 0
            ? (user.roles as string[])
            : [user.role as string];

        const avatarUrl = user.role === "seller" ? (user.passport || user.avatar || "") : (user.avatar || "");

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role as string,
          roles,
          storeName: user.storeName || "",
          school: userSchool,
          campusSlug,
          passport: user.passport || "",
          avatar: avatarUrl,
          image: avatarUrl,
        };
      },
    }),
  ],
});
