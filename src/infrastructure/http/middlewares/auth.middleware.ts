import type { NextFunction, Request, Response } from "express";
import type { CredentialService } from "../../../domain/credential.service";

export function createAuthMiddleware(credentialService: CredentialService) {
  return function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const authHeader = req.header("authorization");

    if (!authHeader) {
      res.status(401).json({
        error: {
          message: "Authorization header is required.",
          type: "invalid_request_error",
          code: "missing_authorization"
        }
      });
      return;
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme?.toLowerCase() !== "bearer" || !token) {
      res.status(401).json({
        error: {
          message: "Authorization must use Bearer token.",
          type: "invalid_request_error",
          code: "invalid_authorization_format"
        }
      });
      return;
    }

    if (!credentialService.isValidToken(token.trim())) {
      res.status(401).json({
        error: {
          message: "Invalid API key.",
          type: "invalid_request_error",
          code: "invalid_api_key"
        }
      });
      return;
    }

    next();
  };
}
