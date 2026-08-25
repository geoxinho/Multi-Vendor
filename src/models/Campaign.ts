import { Schema, model, models, Document, Types } from "mongoose";

export interface ICampaign extends Document {
  subject: string;
  preheader?: string;
  audience: "all" | "buyers" | "sellers" | "abandoned_cart" | "inactive" | "custom";
  audienceLabel: string;
  recipientCount: number;
  recipientEmails?: string[];
  htmlContent: string;
  ctaText?: string;
  ctaUrl?: string;
  sentBy: Types.ObjectId;
  status: "sent" | "failed" | "sending";
  sentAt: Date;
  createdAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    subject: { type: String, required: true, trim: true },
    preheader: { type: String, default: "" },
    audience: {
      type: String,
      enum: ["all", "buyers", "sellers", "abandoned_cart", "inactive", "custom"],
      required: true,
    },
    audienceLabel: { type: String, required: true },
    recipientCount: { type: Number, default: 0 },
    recipientEmails: [{ type: String }],
    htmlContent: { type: String, required: true },
    ctaText: { type: String, default: "" },
    ctaUrl: { type: String, default: "" },
    sentBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["sent", "failed", "sending"], default: "sent" },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Campaign = models.Campaign || model<ICampaign>("Campaign", CampaignSchema);
