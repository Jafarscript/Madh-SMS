import mongoose from "mongoose";

let isConnected = false;

const connectDB = async (): Promise<void> => {
  // Check if mongoose already has an active connection (readyState 1 = connected, 2 = connecting)
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const targetDbName = (process.env.MONGODB_DB_NAME || "test").trim();

  try {
    const mongoUri = (process.env.MONGODB_URI || process.env.MONGO_URI)?.trim();
    if (mongoUri) {
      try {
        console.log(`Connecting to MongoDB Atlas (Target Database: ${targetDbName})...`);
        const conn = await mongoose.connect(mongoUri, {
          dbName: targetDbName,
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
        });
        const activeDb = conn.connection.db?.databaseName || targetDbName;
        console.log(`MongoDB connected successfully to host: ${conn.connection.host}, Database: ${activeDb}`);
        isConnected = true;
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
        dbName: targetDbName,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      console.log(`In-memory MongoDB connected: ${uri}, Database: ${targetDbName}`);
      isConnected = true;
    }
  } catch (error) {
    console.error(`DB Connection Error: ${error}`);
  }
};

export default connectDB;