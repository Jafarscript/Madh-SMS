import mongoose from "mongoose";

interface MongooseConnectionCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Persist the connection cache across warm serverless function invocations (Vercel)
// even across module re-evaluations
declare global {
  // eslint-disable-next-line no-var
  var _mongooseConnectionCache: MongooseConnectionCache | undefined;
}

let cached = globalThis._mongooseConnectionCache;

if (!cached) {
  cached = globalThis._mongooseConnectionCache = { conn: null, promise: null };
}

const connectDB = async (): Promise<typeof mongoose> => {
  // 1. If we already have an active, open connection (readyState 1), reuse it immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // 2. If a connection attempt is already in progress, await the existing promise
  // This prevents multiple concurrent requests from creating redundant connection handshakes
  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (err) {
      cached.promise = null;
      throw err;
    }
  }

  const targetDbName = (process.env.MONGODB_DB_NAME || "test").trim();
  const mongoUri = (process.env.MONGODB_URI || process.env.MONGO_URI)?.trim();

  // On Vercel / Serverless with MongoDB Atlas Free Tier (M0 limit: 500 connections),
  // restricting the connection pool size per lambda instance (default 5, min 0, maxIdleTime 10s)
  // is critical to prevent connection exhaustion.
  const maxPoolSize = Math.max(1, Math.min(20, Number(process.env.MONGODB_MAX_POOL_SIZE) || 5));

  const connectionOptions: mongoose.ConnectOptions = {
    dbName: targetDbName,
    maxPoolSize,
    minPoolSize: 0,
    maxIdleTimeMS: 10000,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 30000,
  };

  cached.promise = (async () => {
    if (mongoUri) {
      try {
        console.log(`[Database] Connecting to MongoDB Atlas (Pool: ${maxPoolSize}, DB: ${targetDbName})...`);
        const conn = await mongoose.connect(mongoUri, connectionOptions);
        const activeDb = conn.connection.db?.databaseName || targetDbName;
        console.log(`[Database] Connected successfully (Host: ${conn.connection.host}, DB: ${activeDb})`);
        return conn;
      } catch (externalErr) {
        console.warn(`[Database] External MongoDB connection failed: ${(externalErr as Error).message}`);
        if (process.env.NODE_ENV === "production") {
          throw externalErr;
        }
      }
    }

    // In-memory MongoDB only for local non-production development
    if (process.env.NODE_ENV !== "production") {
      console.log("[Database] Starting in-memory MongoDB server for local development...");
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      const conn = await mongoose.connect(uri, {
        dbName: targetDbName,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      console.log(`[Database] In-memory MongoDB connected: ${uri}, DB: ${targetDbName}`);
      return conn;
    }

    throw new Error("No MongoDB connection URI provided and not running in development mode.");
  })();

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    console.error("[Database] DB Connection Error:", err);
    throw err;
  }
};

export default connectDB;