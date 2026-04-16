import express, { type Express } from "express";
import { env } from "../../config/env";
import { InMemoryCredentialService } from "../../domain/credential.service";
import { createOllamaProxy } from "./adapters/ollama.proxy";
import { createAuthMiddleware } from "./middlewares/auth.middleware";
import { buildOpenApiDocument } from "./openapi";

interface OllamaTagsResponse {
  models?: Array<{ name?: string }>;
}

async function getAvailableOllamaModels(): Promise<string[]> {
  try {
    const response = await fetch(`${env.OLLAMA_URL}/api/tags`);

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as OllamaTagsResponse;

    return (payload.models ?? [])
      .map((item) => item.name?.trim() ?? "")
      .filter((name) => name.length > 0);
  } catch {
    return [];
  }
}

export function createServer(): Express {
  const app = express();
  const credentialService = new InMemoryCredentialService();
  const authMiddleware = createAuthMiddleware(credentialService);
  const ollamaProxy = createOllamaProxy(env);

  app.disable("x-powered-by");

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.get("/openapi.json", (_req, res) => {
    res.status(200).json(buildOpenApiDocument());
  });

  app.get("/ollama/hello", async (req, res) => {
    const requestedModel =
      typeof req.query.model === "string" && req.query.model.trim().length > 0
        ? req.query.model.trim()
        : undefined;

    const autoDiscoveredModels = requestedModel
      ? []
      : await getAvailableOllamaModels();

    const model = requestedModel ?? autoDiscoveredModels[0] ?? "llama3.1";

    try {
      const response = await fetch(`${env.OLLAMA_URL}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: "hola como estas?"
            }
          ],
          stream: false
        })
      });

      const rawBody = await response.text();

      if (!response.ok) {
        let availableModels: string[] = [];

        if (response.status === 404 && rawBody.includes("not found")) {
          availableModels = await getAvailableOllamaModels();
        }

        res.status(502).json({
          error: {
            message: "Ollama returned an error",
            type: "upstream_error",
            code: "ollama_error",
            upstreamStatus: response.status,
            upstreamBody: rawBody,
            availableModels,
            hint:
              availableModels.length > 0
                ? `Use one of the available models, e.g. /ollama/hello?model=${availableModels[0]}`
                : "Pull a model in Ollama and retry, e.g. ollama pull llama3.1"
          }
        });
        return;
      }

      const parsed = JSON.parse(rawBody) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = parsed.choices?.[0]?.message?.content ?? rawBody;

      res.status(200).json({
        prompt: "hola como estas?",
        model,
        reply: content
      });
    } catch (error) {
      res.status(502).json({
        error: {
          message: "Could not reach Ollama",
          type: "upstream_error",
          code: "ollama_unreachable",
          details: error instanceof Error ? error.message : "Unknown error"
        }
      });
    }
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
