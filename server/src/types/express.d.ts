import type { AuthSession } from "../services/authService.js";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        token: string;
        accountId: number;
        profileId: number;
        account: AuthSession["account"];
        profile: AuthSession["profile"];
      };
    }
  }
}

export {};

