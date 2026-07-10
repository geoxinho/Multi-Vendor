import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["buyer", "seller"]),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Mobile number must be between 10 to 15 digits"),
  hearAboutUs: z.string().min(1, "Please select how you heard about us"),
  school: z.string().min(1, "Please select your school"),
  nin: z.string().optional(),
  sellerCategory: z.string().optional(),
  storeName: z.string().optional(),
  storeDescription: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role === "seller") {
    if (!data.nin || !/^\d{11}$/.test(data.nin)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nin"],
        message: "NIN must be exactly 11 digits for sellers",
      });
    }
    if (!data.sellerCategory || data.sellerCategory.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sellerCategory"],
        message: "Please select a product category for your store",
      });
    }
    if (!data.storeName || data.storeName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["storeName"],
        message: "Store name is required for sellers",
      });
    }
    if (!data.bankName || data.bankName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bankName"],
        message: "Bank name is required for sellers",
      });
    }
    if (!data.accountNumber || !/^\d{10}$/.test(data.accountNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["accountNumber"],
        message: "Account number must be 10 digits",
      });
    }
    if (!data.accountName || data.accountName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["accountName"],
        message: "Account name is required for sellers",
      });
    }
  }
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const productSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().positive("Price must be positive"),
  condition: z.enum(["new", "used"]),
  category: z.string().min(1, "Category is required"),
  stock: z.number().int().min(1, "Stock must be at least 1"),
  images: z.array(z.string()).min(1, "At least one image is required"),
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5, "Comment must be at least 5 characters"),
});

export const shippingSchema = z.object({
  fullName: z.string().min(2),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(4),
  phone: z.string().min(10),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type ShippingInput = z.infer<typeof shippingSchema>;
