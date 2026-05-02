import dotenv from "dotenv";
import express from "express";
import path from "path";
import { closeDatabase, getDatabase } from "./database";
import { attachCurrentUser, AuthRequest } from "./middleware/auth";
import authRoutes from "./routes/auth";
import dashboardRoutes from "./routes/dashboard";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const viewsPath = path.join(process.cwd(), "src", "views");
const publicPath = path.join(process.cwd(), "public");

app.set("view engine", "ejs");
app.set("views", viewsPath);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(publicPath));
app.use(attachCurrentUser);

app.get("/", (req: AuthRequest, res) => {
  if (req.currentUser) {
    res.redirect("/dashboard");
    return;
  }

  res.redirect("/login");
});

app.use(authRoutes);
app.use(dashboardRoutes);

app.use((req, res) => {
  res.status(404).render("pages/not-found", {
    pageTitle: "Not found",
    currentUser: res.locals.currentUser ?? null
  });
});

app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", error);
  res.status(500).render("pages/error", {
    pageTitle: "Server error",
    errorMessage: "The server hit an unexpected error.",
    currentUser: res.locals.currentUser ?? null
  });
});

async function start(): Promise<void> {
  await getDatabase();

  app.listen(port, () => {
    console.log(`SPMP running at http://localhost:${port}`);
  });
}

process.on("SIGINT", () => {
  closeDatabase();
  process.exit(0);
});

process.on("SIGTERM", () => {
  closeDatabase();
  process.exit(0);
});

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

export default app;
