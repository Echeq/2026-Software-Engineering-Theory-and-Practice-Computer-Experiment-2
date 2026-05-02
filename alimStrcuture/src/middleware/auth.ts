import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User, UserModel } from "../models/User";

const AUTH_COOKIE_NAME = "spmp_auth";

export interface AuthRequest extends Request {
  currentUser?: User | null;
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((accumulator, pair) => {
    const [rawKey, ...rawValue] = pair.trim().split("=");
    if (!rawKey) {
      return accumulator;
    }

    accumulator[rawKey] = decodeURIComponent(rawValue.join("="));
    return accumulator;
  }, {});
}

function buildCookieValue(token: string, maxAgeSeconds: number): string {
  const parts = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`
  ];

  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function isHtmxRequest(req: Request): boolean {
  return req.get("HX-Request") === "true";
}

export function attachCurrentUser(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[AUTH_COOKIE_NAME];

    if (!token) {
      req.currentUser = null;
      res.locals.currentUser = null;
      next();
      return;
    }

    const secret = process.env.JWT_SECRET || "default-secret";
    const decoded = jwt.verify(token, secret) as { userId: string };
    const user = UserModel.findById(decoded.userId);

    req.currentUser = user;
    res.locals.currentUser = user;
    next();
  } catch (error) {
    req.currentUser = null;
    res.locals.currentUser = null;
    clearAuthCookie(res);
    next();
  }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.currentUser) {
    next();
    return;
  }

  if (isHtmxRequest(req)) {
    res.setHeader("HX-Redirect", "/login");
    res.status(401).end();
    return;
  }

  res.redirect("/login");
}

export function setAuthCookie(res: Response, userId: string): void {
  const secret = process.env.JWT_SECRET || "default-secret";
  const token = jwt.sign({ userId }, secret, { expiresIn: "7d" });
  res.setHeader("Set-Cookie", buildCookieValue(token, 60 * 60 * 24 * 7));
}

export function clearAuthCookie(res: Response): void {
  res.setHeader("Set-Cookie", [
    `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  ]);
}

export function redirectResponse(req: Request, res: Response, location: string): void {
  if (isHtmxRequest(req)) {
    res.setHeader("HX-Redirect", location);
    res.status(204).end();
    return;
  }

  res.redirect(location);
}
