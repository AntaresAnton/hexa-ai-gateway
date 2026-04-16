export interface OpenAPIObject {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{ url: string; description: string }>;
  tags: Array<{ name: string; description: string }>;
  paths: Record<string, unknown>;
  components: {
    securitySchemes: Record<string, unknown>;
    schemas: Record<string, unknown>;
  };
}

export function buildOpenApiDocument(): OpenAPIObject {
  return {
    openapi: "3.1.0",
    info: {
      title: "Hexa AI Gateway API",
      version: "1.0.0",
      description:
        "Gateway que valida API Key y reenvia solicitudes OpenAI-compatible a Ollama."
    },
    servers: [
      {
        url: "http://localhost:9000",
        description: "Host local via Docker Compose"
      },
      {
        url: "http://localhost:3000",
        description: "Host local ejecucion directa"
      }
    ],
    tags: [
      {
        name: "System",
        description: "Endpoints operativos"
      },
      {
        name: "Gateway",
        description: "Entradas del gateway hacia Ollama"
      }
    ],
    paths: {
      "/health": {
        get: {
          tags: ["System"],
          summary: "Healthcheck del gateway",
          responses: {
            "200": {
              description: "Servicio operativo",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" }
                    },
                    required: ["status"]
                  }
                }
              }
            }
          }
        }
      },
      "/ollama/hello": {
        get: {
          tags: ["System"],
          summary: "Prueba de respuesta de Ollama",
          description:
            "Envia el prompt fijo 'hola como estas?' a Ollama. Si no se envia model, selecciona el primer modelo disponible.",
          parameters: [
            {
              name: "model",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Modelo de Ollama a usar"
            }
          ],
          responses: {
            "200": {
              description: "Respuesta satisfactoria de Ollama",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      prompt: { type: "string" },
                      model: { type: "string" },
                      reply: { type: "string" }
                    },
                    required: ["prompt", "model", "reply"]
                  }
                }
              }
            },
            "502": {
              description: "Error upstream en Ollama",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" }
                }
              }
            }
          }
        }
      },
      "/v1/{proxyPath}": {
        parameters: [
          {
            name: "proxyPath",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Ruta variable que se reenvia a Ollama"
          }
        ],
        get: {
          tags: ["Gateway"],
          summary: "Proxy GET OpenAI-compatible",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Respuesta proxyeada desde Ollama" },
            "401": {
              description: "Credencial invalida o ausente",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" }
                }
              }
            }
          }
        },
        post: {
          tags: ["Gateway"],
          summary: "Proxy POST OpenAI-compatible",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Respuesta proxyeada desde Ollama" },
            "401": {
              description: "Credencial invalida o ausente",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" }
                }
              }
            }
          }
        },
        put: {
          tags: ["Gateway"],
          summary: "Proxy PUT OpenAI-compatible",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Respuesta proxyeada desde Ollama" },
            "401": {
              description: "Credencial invalida o ausente",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" }
                }
              }
            }
          }
        },
        patch: {
          tags: ["Gateway"],
          summary: "Proxy PATCH OpenAI-compatible",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Respuesta proxyeada desde Ollama" },
            "401": {
              description: "Credencial invalida o ausente",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" }
                }
              }
            }
          }
        },
        delete: {
          tags: ["Gateway"],
          summary: "Proxy DELETE OpenAI-compatible",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Respuesta proxyeada desde Ollama" },
            "401": {
              description: "Credencial invalida o ausente",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" }
                }
              }
            }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "API Key"
        }
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                message: { type: "string" },
                type: { type: "string" },
                code: { type: "string" }
              },
              required: ["message", "type", "code"]
            }
          },
          required: ["error"]
        }
      }
    }
  };
}
