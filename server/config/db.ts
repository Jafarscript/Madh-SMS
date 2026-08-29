import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { seedDatabase } from "../seed";

let mongoServer: MongoMemoryServer | null = null;

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI?.trim();
    if (mongoUri) {
      try {
        console.log("Connecting to MongoDB Atlas...");
        const conn = await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
        });
        console.log(`MongoDB connected successfully: ${conn.connection.host}`);
        await seedDatabase();
        return;
      } catch (externalErr) {
        console.warn(
          `External MongoDB connection failed (${(externalErr as Error).message}). Falling back to in-memory MongoDB...`
        );
      }
    }

    // In-memory Mongo Database for seamless zero-config local execution
    console.log("Starting in-memory MongoDB server...");
    try {
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      console.log(`In-memory MongoDB connected: ${uri}`);

      // Seed with initial data
      await seedDatabase();
    } catch (memErr) {
      console.error(`In-memory MongoDB start failed: ${(memErr as Error).message}`);
    }
  } catch (error) {
    console.error(`DB Connection Error: ${error}`);
  }
};

export default connectDB;