import { createProxyMiddleware } from "http-proxy-middleware";
import type { Env } from "../../../config/env";

export function createOllamaProxy(env: Env) {
  return createProxyMiddleware({
    target: env.OLLAMA_URL,
    changeOrigin: true,
    xfwd: true,
    pathRewrite: (path) => {
      return path.startsWith("/v1") ? path : `/v1${path}`;
    },
    proxyTimeout: 60_000,
    timeout: 60_000
  });
}
