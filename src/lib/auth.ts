import NextAuth, { AuthError } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
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
        // Search by email OR username in a single query
        const user = await User.findOne({
          $or: [{ email: input }, { username: input }],
        }).lean();

        if (!user)
          throw new CustomAuthError("No account found with this email address.");
        if (user.isBanned)
          throw new CustomAuthError("Your account has been banned.");
        if (!user.isEmailVerified && user.role !== "admin")
          throw new CustomAuthError("Please verify your email address before logging in.");

        const isMatch = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );
        if (!isMatch)
          throw new CustomAuthError("Incorrect password. Please try again.");

        const roles: string[] =
          user.roles && user.roles.length > 0
            ? (user.roles as string[])
            : [user.role as string];

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role as string,
          roles,
          image: user.avatar,
        };
      },
    }),
  ],
});
