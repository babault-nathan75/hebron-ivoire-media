import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { registerOAuthRoutes } from "./oauth";
import { registerSeoRoutes } from "./seo";
import { registerStorageProxy } from "./storageProxy";

/** The API + SEO routes, shared by the long-running Node server and the Netlify function. */
export function createApp() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.set("trust proxy", 1);
  registerStorageProxy(app);
  registerSeoRoutes(app);
  registerOAuthRoutes(app);
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
  return app;
}
