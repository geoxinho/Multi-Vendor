import { Schema, model, models, Document, Types } from "mongoose";

export interface IOrderReport extends Document {
  order: Types.ObjectId;
  reportedBy: Types.ObjectId;
  reporterRole: "buyer" | "seller";
  reason: string;
  subject: string;
  description: string;
  images: string[];
  status: "pending" | "investigating" | "resolved" | "dismissed";
  adminNotes?: string;
  resolvedAt?: Date;
  resolvedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrderReportSchema = new Schema<IOrderReport>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reporterRole: { type: String, enum: ["buyer", "seller"], required: true },
    reason: { type: String, required: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ["pending", "investigating", "resolved", "dismissed"],
      default: "pending",
      index: true,
    },
    adminNotes: { type: String, default: "" },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

if (models.OrderReport) {
  try {
    delete (models as any).OrderReport;
  } catch {}
}

export const OrderReport = models.OrderReport || model<IOrderReport>("OrderReport", OrderReportSchema);
