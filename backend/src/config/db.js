import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MONGODB CONNETED SUCCESSFULLY");
  } catch (err) {
    console.error("Error connecting to MONGODB", err);
    process.exit(1);
  }
};
