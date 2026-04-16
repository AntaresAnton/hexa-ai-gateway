import dotenv from "dotenv";

dotenv.config();

export interface Env {
  PORT: number;
  OLLAMA_URL: string;
  GATEWAY_API_KEY: string;
}

function readRequiredEnv(name: keyof Omit<Env, "PORT">): string {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

function readPort(): number {
  const rawPort = process.env.PORT ?? "3000";
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("Invalid PORT. Expected an integer between 1 and 65535.");
  }

  return port;
}

export const env: Env = Object.freeze({
  PORT: readPort(),
  OLLAMA_URL: readRequiredEnv("OLLAMA_URL"),
  GATEWAY_API_KEY: readRequiredEnv("GATEWAY_API_KEY")
});
