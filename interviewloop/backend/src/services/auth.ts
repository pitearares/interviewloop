import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma.js";

/**
 * Password + session-token auth with zero external dependencies:
 *  - passwords hashed with Node's scrypt (salt:hash, hex)
 *  - login issues an opaque random token persisted in AuthSession, delivered
 *    as an httpOnly cookie — server-side storage means logout truly revokes
 *
 * The frontend talks to /api through the Vite proxy, so the cookie rides on
 * same-origin requests without any CORS-credentials ceremony.
 */

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const COOKIE_NAME = "il_token";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = await scryptAsync(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;
  const actual = await scryptAsync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function createAuthSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.authSession.create({ data: { token, userId, expiresAt } });
  return { token, expiresAt };
}

export function setAuthCookie(res: Response, token: string, expiresAt: Date): void {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}`,
  );
}

export function clearAuthCookie(res: Response): void {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function readToken(req: Request): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE_NAME) return rest.join("=") || null;
  }
  return null;
}

export interface AuthedRequest extends Request {
  userId?: string;
  userName?: string;
  userEmail?: string;
}

/** Resolves the cookie token to a user (if any) without rejecting the request. */
export async function attachUser(req: AuthedRequest, _res: Response, next: NextFunction) {
  try {
    const token = readToken(req);
    if (token) {
      const session = await prisma.authSession.findUnique({
        where: { token },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      if (session && session.expiresAt > new Date()) {
        req.userId = session.user.id;
        req.userName = session.user.name;
        req.userEmail = session.user.email;
      }
    }
  } catch {
    // Auth resolution must never take the API down; fall through anonymous.
  }
  next();
}

/** Rejects with 401 unless attachUser found a valid session. */
export function requireUser(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ error: "Sign in to continue." });
  }
  next();
}

export async function revokeToken(req: Request): Promise<void> {
  const token = readToken(req);
  if (!token) return;
  await prisma.authSession.deleteMany({ where: { token } });
}
