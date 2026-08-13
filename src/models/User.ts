import mongoose, { Schema, model, models, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  username?: string;
  email: string;
  password: string;
  role: "buyer" | "seller" | "admin";
  roles: string[];
  avatar?: string;
  storeName?: string;
  storeDescription?: string;
  isBanned: boolean;
  nin?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationTokenExpires?: Date;
  phone?: string;
  hearAboutUs?: string;
  sellerCategory?: string;
  school?: string;
  passport?: string;
  bankDetails?: {
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  };
  lastBrandNameChangeAt?: Date;
  passwordResetToken?: string;
  passwordResetTokenExpires?: Date;
  createdAt: Date;
}


const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["buyer", "seller", "admin"], default: "buyer" },
    roles: { type: [String], enum: ["buyer", "seller", "admin"], default: ["buyer"] },
    avatar: { type: String, default: "" },
    storeName: { type: String, default: "" },
    storeDescription: { type: String, default: "" },
    isBanned: { type: Boolean, default: false },
    nin: { type: String, default: "" },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: "" },
    emailVerificationTokenExpires: { type: Date },
    phone: { type: String, default: "" },
    hearAboutUs: { type: String, default: "" },
    sellerCategory: { type: String, default: "" },
    school: { type: String, default: "" },
    passport: { type: String, default: "" },
    bankDetails: {
      bankName: { type: String, default: "" },
      bankCode: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      accountName: { type: String, default: "" },
    },
    lastBrandNameChangeAt: { type: Date },
    passwordResetToken: { type: String, default: "" },
    passwordResetTokenExpires: { type: Date },
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>("User", UserSchema);
