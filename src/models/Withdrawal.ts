import { Schema, model, models, Document, Types } from "mongoose";

export interface IWithdrawal extends Document {
  seller: Types.ObjectId;
  amount: number;
  bankDetails: {
    bankName: string;
    bankCode?: string;
    accountNumber: string;
    accountName: string;
  };
  status: "pending" | "completed" | "failed";
  reference?: string;
  processedAt?: Date;
  createdAt: Date;
}

const WithdrawalSchema = new Schema<IWithdrawal>(
  {
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    bankDetails: {
      bankName: { type: String, required: true },
      bankCode: { type: String, default: "" },
      accountNumber: { type: String, required: true },
      accountName: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
    reference: { type: String, default: "" },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Withdrawal = models.Withdrawal || model<IWithdrawal>("Withdrawal", WithdrawalSchema);
