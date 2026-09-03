import { Schema, model, models, Document } from "mongoose";

export interface IAdminUser extends Document {
  name: string;
  username?: string;
  email: string;
  password: string;
  role: "admin";
  roles: string[];
  avatar?: string;
  isBanned: boolean;
  isEmailVerified: boolean;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, default: "admin", enum: ["admin"] },
    roles: { type: [String], default: ["admin"] },
    avatar: { type: String, default: "" },
    isBanned: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: true },
    lastActiveAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
    collection: "admins", // Stored exclusively in the 'admins' collection
  }
);

if (models.AdminUser) {
  try {
    delete (models as any).AdminUser;
  } catch {}
}

export const AdminUser =
  models.AdminUser || model<IAdminUser>("AdminUser", AdminUserSchema, "admins");
