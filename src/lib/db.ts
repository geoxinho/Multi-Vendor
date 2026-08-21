import mongoose from "mongoose";
import "@/models/User";
import "@/models/Category";
import "@/models/Product";
import "@/models/Order";
import "@/models/Message";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };
global.mongoose = cached;

export async function connectDB() {
  // Check inside the function (not at module level) so a missing env var
  // throws a proper error inside the route handler, not at cold-start import time.
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI environment variable is not defined. " +
        "Add it to your Vercel project settings under Environment Variables."
    );
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // allow retry on next request
    throw err;
  }
  return cached.conn;
}
