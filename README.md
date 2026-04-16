# Hexa AI Gateway

API Gateway de IA construido con Node.js, Express y TypeScript.
Valida credenciales via Bearer token y redirige requests OpenAI-compatible hacia una instancia local de Ollama.

## Objetivo

Este servicio funciona como capa de acceso para endpoints bajo `/v1/*`.
Antes de reenviar cada peticion a Ollama:

1. Verifica que exista el header `Authorization`.
2. Verifica formato `Bearer <token>`.
3. Valida el token contra credenciales en memoria.

Si la validacion es correcta, el request se proxyea de forma transparente a `OLLAMA_URL`.

## Stack tecnico

- Node.js 20+
- TypeScript (strict mode)
- Express
- http-proxy-middleware
- dotenv
- Docker (multi-stage)
- Docker Compose

## Configuracion TypeScript

Configuracion actual en tsconfig:

- module: Node16
- moduleResolution: Node16
- strict: true

## Arquitectura

Se aplica una separacion inspirada en Arquitectura Hexagonal / Clean Architecture:

1. `src/config`
	 - Carga y validacion tipada de variables de entorno.
2. `src/domain`
	 - Regla de negocio para validacion de credenciales (`CredentialService`).
3. `src/infrastructure/http`
	 - Middleware de autenticacion.
	 - Adapter de proxy hacia Ollama.
	 - Configuracion del servidor Express.
4. `src/index.ts`
	 - Punto de entrada de la aplicacion.

## Estructura de archivos

```text
.
├─ src/
│  ├─ config/
│  │  └─ env.ts
│  ├─ domain/
│  │  └─ credential.service.ts
│  ├─ infrastructure/
│  │  └─ http/
│  │     ├─ adapters/
│  │     │  └─ ollama.proxy.ts
│  │     ├─ middlewares/
│  │     │  └─ auth.middleware.ts
│  │     └─ server.ts
│  └─ index.ts
├─ .env.example
├─ Dockerfile
├─ docker-compose.yml
├─ package.json
└─ tsconfig.json
```

## Variables de entorno

Las variables se validan en `src/config/env.ts` al iniciar la app.

| Variable | Requerida | Default | Descripcion |
|---|---|---|---|
| `PORT` | No | `3000` | Puerto HTTP interno del gateway |
| `OLLAMA_URL` | Si | - | URL base de Ollama destino |
| `GATEWAY_API_KEY` | Si | - | API Key valida esperada en `Authorization` |

Archivo de ejemplo: `.env.example`

## Instalacion y ejecucion local

1. Instalar dependencias:

```bash
npm install
```

2. Crear archivo de entorno:

```bash
copy .env.example .env
```

3. Ajustar variables en `.env` segun tu entorno.

4. Desarrollo:

```bash
npm run dev
```

5. Build + start produccion:

```bash
npm run build
npm start
```

## Docker

El proyecto incluye `Dockerfile` multi-stage basado en `node:20-slim`:

1. Stage `builder`
	 - Instala dependencias
	 - Compila TypeScript a `dist/`
2. Stage `production`
	 - Instala solo dependencias runtime (`--omit=dev`)
	 - Copia artefactos compilados
	 - Expone puerto `3000`

## Docker Compose

El archivo `docker-compose.yml`:

1. Construye la imagen localmente.
2. Mapea `9000:3000`.
3. Configura `OLLAMA_URL=http://host.docker.internal:11434`.
4. Incluye:

```yaml
extra_hosts:
	- "host.docker.internal:host-gateway"
```

Levantar servicio:

```bash
docker compose up --build
```

## Flujo HTTP

1. Cliente llama `POST /v1/...` en el gateway.
2. Middleware de auth valida Bearer token.
3. Proxy reenvia a Ollama conservando prefijo `/v1`.
4. Respuesta vuelve al cliente sin transformaciones.

## Endpoints disponibles en el gateway

- `GET /health`
	- Healthcheck basico.
- `GET /ollama/hello`
	- Ejecuta una llamada real a Ollama con el prompt fijo `hola como estas?`.
	- Query opcional `model` (default: `llama3.1`).
	- Devuelve `{ prompt, model, reply }`.
	- No requiere API key (endpoint de diagnostico).
- `ANY /v1/*`
	- Requiere Authorization Bearer valido.
	- Se proxyea a Ollama.

## Ejemplo de uso

Request compatible con OpenAI Chat Completions:

```bash
curl -X POST http://localhost:9000/v1/chat/completions \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer changeme-local-key" \
	-d "{\"model\":\"llama3.1\",\"messages\":[{\"role\":\"user\",\"content\":\"Hola\"}],\"stream\":false}"
```

Endpoint de diagnostico de respuesta de Ollama:

```bash
curl "http://localhost:9000/ollama/hello?model=llama3.1"
```

## Respuestas de error de autenticacion

- `401 missing_authorization`
	- Falta header Authorization.
- `401 invalid_authorization_format`
	- Header sin formato Bearer.
- `401 invalid_api_key`
	- Token invalido.

## Scripts NPM

- `npm run dev`: arranque en desarrollo con recarga.
- `npm run build`: compilacion TypeScript.
- `npm start`: ejecucion de `dist/index.js`.

## Requisitos

- Node.js >= 20
- Docker Desktop (opcional, para entorno containerizado)
- Ollama ejecutandose en host local

## Notas tecnicas

1. El servicio no persiste usuarios ni API keys; usa un mapa en memoria.
2. Para manejo multi-tenant real, reemplazar `InMemoryCredentialService` por repositorio externo.
3. Para endurecer produccion, agregar rate limiting, logs estructurados y observabilidad.
