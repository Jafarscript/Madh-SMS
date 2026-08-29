import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { seedDatabase } from "../seed";

let mongoServer: MongoMemoryServer | null = null;

const connectDB = async (): Promise<void> => {
  try {
    if (process.env.MONGO_URI && process.env.MONGO_URI.trim() !== "") {
      try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB connected: ${conn.connection.host}`);
        await seedDatabase();
        return;
      } catch (externalErr) {
        console.warn(`External MongoDB connection failed (${(externalErr as Error).message}). Falling back to in-memory MongoDB...`);
      }
    }

    // In-memory Mongo Database for seamless zero-config local execution
    console.log("Starting in-memory MongoDB server...");
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log(`In-memory MongoDB connected: ${uri}`);

    // Seed with initial data
    await seedDatabase();
  } catch (error) {
    console.error(`DB Connection Error: ${error}`);
  }
};

export default connectDB;
