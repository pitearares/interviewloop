import { Router } from "express";
import { prisma } from "../db/prisma.js";
import {
  clearAuthCookie,
  createAuthSession,
  hashPassword,
  revokeToken,
  setAuthCookie,
  verifyPassword,
  type AuthedRequest,
} from "../services/auth.js";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// POST /api/auth/register — create an account and sign in immediately
router.post("/register", async (req, res) => {
  const { email, name, password } = req.body as {
    email?: string;
    name?: string;
    password?: string;
  };

  const cleanEmail = email?.trim().toLowerCase() ?? "";
  const cleanName = name?.trim() ?? "";
  if (!EMAIL_RE.test(cleanEmail)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }
  if (cleanName.length < 2) {
    return res.status(400).json({ error: "Enter your name (at least 2 characters)." });
  }
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return res
      .status(400)
      .json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
  }

  const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const user = await prisma.user.create({
    data: { email: cleanEmail, name: cleanName, passwordHash: await hashPassword(password) },
  });

  const { token, expiresAt } = await createAuthSession(user.id);
  setAuthCookie(res, token, expiresAt);
  res.status(201).json({ id: user.id, name: user.name, email: user.email });
});

// POST /api/auth/login — verify credentials and issue a session cookie
router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  const cleanEmail = email?.trim().toLowerCase() ?? "";

  const user = cleanEmail
    ? await prisma.user.findUnique({ where: { email: cleanEmail } })
    : null;
  // One generic message for both wrong-email and wrong-password: don't leak
  // which emails have accounts.
  if (!user || !password || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const { token, expiresAt } = await createAuthSession(user.id);
  setAuthCookie(res, token, expiresAt);
  res.json({ id: user.id, name: user.name, email: user.email });
});

// POST /api/auth/logout — revoke the server-side session and clear the cookie
router.post("/logout", async (req, res) => {
  await revokeToken(req);
  clearAuthCookie(res);
  res.json({ ok: true });
});

// GET /api/auth/me — who am I? (null when signed out)
router.get("/me", (req: AuthedRequest, res) => {
  if (!req.userId) return res.json({ user: null });
  res.json({ user: { id: req.userId, name: req.userName, email: req.userEmail } });
});

export default router;
