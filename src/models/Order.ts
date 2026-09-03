import { Schema, model, models, Document, Types } from "mongoose";

interface OrderItem {
  product: Types.ObjectId;
  title: string;
  image: string;
  price: number;
  quantity: number;
  seller: Types.ObjectId;
  platformFee: number;
  netPayout: number;
  selectedSize?: string;
  selectedColor?: string;
}

interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
}

export interface IOrder extends Document {
  buyer: Types.ObjectId;
  items: OrderItem[];
  totalAmount: number;
  platformFee: number;
  netPayout: number;
  paymentRef: string;
  paymentStatus: "pending" | "paid" | "failed";
  deliveryStatus: "processing" | "shipped" | "delivered";
  deliveredAt?: Date;
  sellerPayoutReleaseAt?: Date;
  sellerPaid: boolean;
  payoutHeld: boolean;
  payoutHoldReason?: string;
  shippingAddress: ShippingAddress;
  deliveryPin: string;
  createdAt: Date;
}

const OrderItemSchema = new Schema<OrderItem>({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  title: String,
  image: String,
  price: Number,
  quantity: { type: Number, default: 1 },
  seller: { type: Schema.Types.ObjectId, ref: "User" },
  platformFee: { type: Number, default: 0 },
  netPayout: { type: Number, default: 0 },
  selectedSize: { type: String, default: "" },
  selectedColor: { type: String, default: "" },
});

const ShippingAddressSchema = new Schema<ShippingAddress>({
  fullName: String,
  address: String,
  city: String,
  state: String,
  postalCode: String,
  phone: String,
});

export const OrderSchema = new Schema<IOrder>(
  {
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    netPayout: { type: Number, required: true },
    paymentRef: { type: String, default: "" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    deliveryStatus: { type: String, enum: ["processing", "shipped", "delivered"], default: "processing" },
    deliveredAt: { type: Date },
    sellerPayoutReleaseAt: { type: Date },
    sellerPaid: { type: Boolean, default: false },
    payoutHeld: { type: Boolean, default: false },
    payoutHoldReason: { type: String, default: "" },
    shippingAddress: ShippingAddressSchema,
    deliveryPin: {
      type: String,
      default: () => Math.floor(100000 + Math.random() * 900000).toString(),
    },
  },
  { timestamps: true }
);

export const Order = models.Order || model<IOrder>("Order", OrderSchema);
