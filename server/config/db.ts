import mongoose from "mongoose";
import { seedDatabase } from "../seed";

let isConnected = false;

const connectDB = async (): Promise<void> => {
  // Check if mongoose already has an active connection (readyState 1 = connected, 2 = connecting)
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    const mongoUri = (process.env.MONGODB_URI || process.env.MONGO_URI)?.trim();
    if (mongoUri) {
      try {
        console.log("Connecting to MongoDB Atlas...");
        const conn = await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
        });
        console.log(`MongoDB connected successfully: ${conn.connection.host}`);
        if (!isConnected) {
          isConnected = true;
          await seedDatabase();
        }
        return;
      } catch (externalErr) {
        console.warn(
          `External MongoDB connection failed (${(externalErr as Error).message}).`
        );
        if (process.env.NODE_ENV === "production") {
          throw externalErr;
        }
      }
    }

    // In-memory Mongo Database only for local development
    if (process.env.NODE_ENV !== "production") {
      console.log("Starting in-memory MongoDB server for local development...");
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      console.log(`In-memory MongoDB connected: ${uri}`);
      if (!isConnected) {
        isConnected = true;
        await seedDatabase();
      }
    }
  } catch (error) {
    console.error(`DB Connection Error: ${error}`);
  }
};

export default connectDB;