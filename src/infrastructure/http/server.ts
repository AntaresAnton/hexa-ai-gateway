import express, { type Express } from "express";
import { env } from "../../config/env";
import { InMemoryCredentialService } from "../../domain/credential.service";
import { createOllamaProxy } from "./adapters/ollama.proxy";
import { createAuthMiddleware } from "./middlewares/auth.middleware";

export function createServer(): Express {
  const app = express();
  const credentialService = new InMemoryCredentialService();
  const authMiddleware = createAuthMiddleware(credentialService);
  const ollamaProxy = createOllamaProxy(env);

  app.disable("x-powered-by");

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/v1", authMiddleware, ollamaProxy);

  app.use((_req, res) => {
    res.status(404).json({
      error: {
        message: "Route not found",
        type: "invalid_request_error",
        code: "not_found"
      }
    });
  });

  return app;
}
