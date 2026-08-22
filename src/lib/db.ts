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
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI environment variable is not defined. " +
        "Add it to your Vercel project settings under Environment Variables."
    );
  }

  // If connection exists and is connected (readyState === 1), return cached connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If connection dropped or disconnected, clear promise so we re-connect
  if (mongoose.connection.readyState === 0) {
    cached.promise = null;
    cached.conn = null;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // Fail fast after 10s instead of hanging for 30s-60s
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // allow retry on next request
    cached.conn = null;
    throw err;
  }
  return cached.conn;
}
