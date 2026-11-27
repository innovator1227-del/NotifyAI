import mongoose from "mongoose";

const connectDB = async () => {
  if (!process.env.MONGODB_URI)
    throw new Error("MONGODB_URI is missing from server/.env");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected successfully");
};

export default connectDB;
