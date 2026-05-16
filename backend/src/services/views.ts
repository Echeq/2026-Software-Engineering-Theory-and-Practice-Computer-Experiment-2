import fs from "fs";
import path from "path";
import type { Express } from "express";

type RenderFunction = (data: Record<string, unknown>) => string;
const doT: { template(source: string): RenderFunction } = require("dot");

const viewsRoot = path.join(__dirname, "../../src/views");
const cache = new Map<string, RenderFunction>();

export function configureViews(app: Express): void {
  app.set("views", viewsRoot);
  app.set("view engine", "dot");
  app.engine("dot", (filePath, options, callback) => {
    try {
      callback(null, renderFile(filePath, options as Record<string, unknown>));
    } catch (error) {
      callback(error as Error);
    }
  });
}

export function renderNamedTemplate(name: string, data: Record<string, unknown>): string {
  return renderFile(path.join(viewsRoot, `${name}.dot`), data);
}

export function serializeForScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function renderFile(filePath: string, data: Record<string, unknown>): string {
  const template = getCompiledTemplate(filePath);
  return template(data);
}

function getCompiledTemplate(filePath: string): RenderFunction {
  const cached = cache.get(filePath);
  if (cached) {
    return cached;
  }

  const source = fs.readFileSync(filePath, "utf-8");
  const template = doT.template(source);
  cache.set(filePath, template);
  return template;
}
