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
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return mongoose;
  }

  // 2. If a connection attempt is already in progress, await the existing promise
  // This prevents multiple concurrent requests from creating redundant connection handshakes
  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (err) {
      cached.promise = null;
      cached.conn = null;
      throw err;
    }
  }

  const mongoUri = (process.env.MONGODB_URI || process.env.MONGO_URI)?.trim();

  // Extract database name from connection string if present
  let uriDbName: string | undefined;
  if (mongoUri) {
    try {
      const parsedUrl = new URL(mongoUri.replace(/^mongodb(\+srv)?:\/\//, "https://"));
      const extractedPath = parsedUrl.pathname.replace(/^\//, "").trim();
      if (extractedPath) {
        uriDbName = decodeURIComponent(extractedPath);
      }
    } catch {
      // Ignore URL parse error and let mongoose driver handle
    }
  }

  // Priority: 1) Explicit MONGODB_DB_NAME env var, 2) DB in MONGODB_URI string, 3) default to "test"
  const targetDbName = process.env.MONGODB_DB_NAME?.trim() || uriDbName || "test";

  // On Vercel / Serverless or Render, pool size can be configured via MONGODB_MAX_POOL_SIZE
  const maxPoolSize = Math.max(1, Math.min(20, Number(process.env.MONGODB_MAX_POOL_SIZE) || 10));

  // 8-second timeout fits safely within Vercel's 10-15s serverless function timeout window
  const connectionOptions: mongoose.ConnectOptions = {
    dbName: targetDbName,
    maxPoolSize,
    minPoolSize: 0,
    maxIdleTimeMS: 20000,
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
    socketTimeoutMS: 30000,
  };

  cached.promise = (async () => {
    if (mongoUri) {
      try {
        console.log(`[Database] Connecting to MongoDB Atlas (Pool: ${maxPoolSize}, DB: ${targetDbName || "default"})...`);
        const conn = await mongoose.connect(mongoUri, connectionOptions);
        const activeDb = conn.connection.db?.databaseName || conn.connection.name;
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
        dbName: targetDbName || "test",
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
      console.log(`[Database] In-memory MongoDB connected: ${uri}, DB: ${targetDbName || "test"}`);
      return conn;
    }

    throw new Error(
      "No MongoDB connection URI provided (missing MONGODB_URI) and not running in development mode."
    );
  })();

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    console.error("[Database] DB Connection Error:", (err as Error).message);
    throw err;
  }
};

export default connectDB;