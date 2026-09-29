import app from "./app";
import connectDB from "./config/db";
import { ensureDefaultGradingScale } from "./controllers/gradingScaleController";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 10000;

async function startServer() {
  // Connect to database
  await connectDB();
  await ensureDefaultGradingScale();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Standalone API Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start standalone server:", err);
  process.exit(1);
});
