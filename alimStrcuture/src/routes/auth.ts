import { Router, Response } from "express";
import { AuthRequest, clearAuthCookie, redirectResponse, setAuthCookie } from "../middleware/auth";
import { CreateUserInput, UserModel } from "../models/User";

const router = Router();

function renderAuthPage(
  req: AuthRequest,
  res: Response,
  page: "login" | "signup",
  options: {
    error?: string;
    values?: Record<string, string>;
  } = {}
): void {
  if (req.currentUser) {
    res.redirect("/dashboard");
    return;
  }

  res.render(`pages/${page}`, {
    pageTitle: page === "login" ? "Login" : "Create account",
    error: options.error ?? null,
    values: options.values ?? {}
  });
}

router.get("/login", (req: AuthRequest, res: Response) => {
  renderAuthPage(req, res, "login");
});

router.post("/login", async (req: AuthRequest, res: Response) => {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "").trim();

  if (!email || !password) {
    renderAuthPage(req, res, "login", {
      error: "Email and password are required.",
      values: { email }
    });
    return;
  }

  const user = UserModel.findByEmail(email);
  if (!user) {
    renderAuthPage(req, res, "login", {
      error: "Invalid email or password.",
      values: { email }
    });
    return;
  }

  const passwordMatches = await UserModel.verifyPassword(password, user.password_hash);
  if (!passwordMatches) {
    renderAuthPage(req, res, "login", {
      error: "Invalid email or password.",
      values: { email }
    });
    return;
  }

  setAuthCookie(res, user.id);
  redirectResponse(req, res, "/dashboard");
});

router.get("/signup", (req: AuthRequest, res: Response) => {
  renderAuthPage(req, res, "signup");
});

router.post("/signup", async (req: AuthRequest, res: Response) => {
  const payload: CreateUserInput = {
    name: String(req.body.name ?? "").trim(),
    email: String(req.body.email ?? "").trim().toLowerCase(),
    password: String(req.body.password ?? "").trim()
  };
  const confirmPassword = String(req.body.confirmPassword ?? "").trim();

  if (!payload.name || !payload.email || !payload.password) {
    renderAuthPage(req, res, "signup", {
      error: "Name, email, and password are required.",
      values: {
        name: payload.name,
        email: payload.email
      }
    });
    return;
  }

  if (payload.password.length < 6) {
    renderAuthPage(req, res, "signup", {
      error: "Password must be at least 6 characters.",
      values: {
        name: payload.name,
        email: payload.email
      }
    });
    return;
  }

  if (payload.password !== confirmPassword) {
    renderAuthPage(req, res, "signup", {
      error: "Passwords do not match.",
      values: {
        name: payload.name,
        email: payload.email
      }
    });
    return;
  }

  if (UserModel.findByEmail(payload.email)) {
    renderAuthPage(req, res, "signup", {
      error: "That email is already registered.",
      values: {
        name: payload.name,
        email: payload.email
      }
    });
    return;
  }

  const user = await UserModel.create(payload);
  setAuthCookie(res, user.id);
  redirectResponse(req, res, "/dashboard");
});

router.post("/logout", (req: AuthRequest, res: Response) => {
  clearAuthCookie(res);
  redirectResponse(req, res, "/login");
});

export default router;
