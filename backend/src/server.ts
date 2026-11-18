import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";

async function bootstrap() {
  if (env.MONGODB_URI) {
    await connectDatabase();
  } else if (env.NODE_ENV === "production") {
    throw new Error("MONGODB_URI is required in production");
  } else {
    console.warn("MongoDB not configured yet. Running API foundation only.");
  }

  app.listen(env.PORT, () => {
    console.log(`NuurMart API running on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error: unknown) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});
