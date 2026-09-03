import mongoose, { Schema, Document, model, models } from "mongoose";

export interface ISupportTicket extends Document {
  ticketId: string;
  name: string;
  email: string;
  subject: string;
  category?: string;
  orderId?: string;
  message: string;
  isLoggedIn: boolean;
  userId?: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    subject: { type: String, required: true },
    category: { type: String, default: "General Inquiry" },
    orderId: { type: String, default: "" },
    message: { type: String, required: true },
    isLoggedIn: { type: Boolean, default: false },
    userId: { type: String, default: "" },
    status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

export const SupportTicket =
  models.SupportTicket ||
  model<ISupportTicket>("SupportTicket", SupportTicketSchema);
