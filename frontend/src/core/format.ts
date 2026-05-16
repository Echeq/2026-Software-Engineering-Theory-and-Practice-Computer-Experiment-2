import { getLocale, t } from "./app";

export function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function formatStatus(status: string): string {
  return status
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatProjectDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return t("common.createdRecently");
  }

  return t("common.createdDate", {
    date: date.toLocaleDateString(getLocale(), {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  });
}

export function formatGreetingDate(value: Date): string {
  return new Intl.DateTimeFormat(getLocale(), {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(value);
}

export function normalizeProjectColumn(status: string): "start-next" | "in-progress" | "done" {
  const normalized = status.trim().toLowerCase();

  if (["done", "completed", "complete", "closed", "shipped", "finished"].includes(normalized)) {
    return "done";
  }

  if (["active", "in-progress", "in review", "in-review", "review", "blocked"].includes(normalized)) {
    return "in-progress";
  }

  return "start-next";
}

export function normalizeTaskColumn(status: string): "todo" | "doing" | "done" {
  const normalized = status.trim().toLowerCase();

  if (["done", "completed", "complete", "closed"].includes(normalized)) {
    return "done";
  }

  if (["active", "in-progress", "doing", "review"].includes(normalized)) {
    return "doing";
  }

  return "todo";
}
