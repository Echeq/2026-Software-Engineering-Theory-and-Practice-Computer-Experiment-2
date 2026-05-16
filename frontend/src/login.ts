import "./i18n";
import "../css/login.css";
import { getAppContext, t } from "./core/app";
import { setupAuthTheme } from "./core/auth-theme";
import { login } from "./core/services";

const form = document.getElementById("login-form") as HTMLFormElement | null;
const emailInput = document.getElementById("email") as HTMLInputElement | null;
const passwordInput = document.getElementById("password") as HTMLInputElement | null;
const messageBox = document.getElementById("form-message") as HTMLElement | null;
const submitButton = document.querySelector(".submit-button") as HTMLButtonElement | null;

setupAuthTheme();

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearErrors();

  const email = emailInput?.value.trim() || "";
  const password = passwordInput?.value.trim() || "";
  let isValid = true;

  if (!email) {
    setFieldError("email", t("login.validation.emailRequired"));
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFieldError("email", t("login.validation.emailInvalid"));
    isValid = false;
  }

  if (!password) {
    setFieldError("password", t("login.validation.passwordRequired"));
    isValid = false;
  } else if (password.length < 6) {
    setFieldError("password", t("login.validation.passwordShort"));
    isValid = false;
  }

  if (!isValid) {
    showMessage(t("login.validation.fix"), "error");
    return;
  }

  setSubmitting(true, t("login.submitting"));

  try {
    const response = await login(email, password);
    showMessage(t("login.success"), "success");
    form?.reset();
    window.setTimeout(() => {
      window.location.href = response.redirectTo || getAppContext().routes.dashboard;
    }, 500);
  } catch (error) {
    showMessage(error instanceof Error ? error.message : t("login.failedDefault"), "error");
  } finally {
    setSubmitting(false, t("login.submit"));
  }
});

function setFieldError(fieldId: string, text: string): void {
  const input = document.getElementById(fieldId) as HTMLInputElement | null;
  const errorBox = document.querySelector(`[data-error-for="${fieldId}"]`) as HTMLElement | null;
  input?.classList.add("input-error");
  if (errorBox) {
    errorBox.textContent = text;
  }
}

function clearErrors(): void {
  messageBox?.classList.remove("error", "success", "is-visible");
  if (messageBox) {
    messageBox.textContent = "";
  }

  document.querySelectorAll(".field-error").forEach((element) => {
    element.textContent = "";
  });

  document.querySelectorAll(".input-error").forEach((element) => {
    element.classList.remove("input-error");
  });
}

function showMessage(text: string, type: "error" | "success"): void {
  if (!messageBox) {
    return;
  }

  messageBox.textContent = text;
  messageBox.className = `form-message is-visible ${type}`;
}

function setSubmitting(isSubmitting: boolean, label: string): void {
  if (!submitButton) {
    return;
  }

  submitButton.disabled = isSubmitting;
  submitButton.textContent = label;
}
