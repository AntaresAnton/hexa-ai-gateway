import { env } from "../config/env";

export interface CredentialService {
  isValidToken(token: string): boolean;
}

export class InMemoryCredentialService implements CredentialService {
  private readonly validCredentials = new Map<string, string>([
    [env.GATEWAY_API_KEY, "default-client"]
  ]);

  isValidToken(token: string): boolean {
    return this.validCredentials.has(token);
  }
}
