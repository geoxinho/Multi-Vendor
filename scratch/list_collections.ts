import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";

async function listCols() {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) {
    console.log("No DB connection");
    return;
  }
  const cols = await db.listCollections().toArray();
  console.log("Collections in DB:", cols.map(c => c.name));
  process.exit(0);
}

listCols();
