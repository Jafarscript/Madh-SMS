import app from "./app";
import connectDB from "./config/db";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 10000;

async function startServer() {
  // Root status route for standalone backend hosts (e.g. Render)
  app.get("/", (_req, res) => {
    res.status(200).json({
      status: "ok",
      message: "School Management System Backend API is running",
    });
  });

  // Start HTTP server immediately so Render port binding & health checks succeed right away
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Standalone API Server running on port ${PORT}`);
  });

  // Warm up database connection in the background without blocking startup or seeding
  connectDB().catch((err) => {
    console.warn("[Database] Initial connection notice:", (err as Error).message);
  });
}

startServer().catch((err) => {
  console.error("Failed to start standalone server:", err);
  process.exit(1);
});
