import "./i18n";
import "../css/signup.css";
import { getAppContext, t } from "./core/app";
import { setupAuthTheme } from "./core/auth-theme";
import { register } from "./core/services";

const form = document.getElementById("signup-form") as HTMLFormElement | null;
const messageBox = document.getElementById("form-message") as HTMLElement | null;
const submitButton = document.querySelector(".submit-button") as HTMLButtonElement | null;

setupAuthTheme();

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearErrors();

  const name = readValue("name");
  const email = readValue("email");
  const password = readValue("password");
  const confirmPassword = readValue("confirm-password");
  let isValid = true;

  if (!name) {
    setFieldError("name", t("signup.validation.nameRequired"));
    isValid = false;
  } else if (name.length < 2) {
    setFieldError("name", t("signup.validation.nameShort"));
    isValid = false;
  }

  if (!email) {
    setFieldError("email", t("signup.validation.emailRequired"));
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFieldError("email", t("signup.validation.emailInvalid"));
    isValid = false;
  }

  if (!password) {
    setFieldError("password", t("signup.validation.passwordRequired"));
    isValid = false;
  } else if (password.length < 6) {
    setFieldError("password", t("signup.validation.passwordShort"));
    isValid = false;
  }

  if (!confirmPassword) {
    setFieldError("confirm-password", t("signup.validation.confirmRequired"));
    isValid = false;
  } else if (confirmPassword !== password) {
    setFieldError("confirm-password", t("signup.validation.confirmMismatch"));
    isValid = false;
  }

  if (!isValid) {
    showMessage(t("signup.validation.fix"), "error");
    return;
  }

  setSubmitting(true, t("signup.submitting"));

  try {
    await register(name, email, password);
    showMessage(t("signup.success"), "success");
    form?.reset();
    window.setTimeout(() => {
      window.location.href = getAppContext().routes.login;
    }, 800);
  } catch (error) {
    showMessage(error instanceof Error ? error.message : t("signup.failedDefault"), "error");
  } finally {
    setSubmitting(false, t("signup.submit"));
  }
});

function readValue(id: string): string {
  return (document.getElementById(id) as HTMLInputElement | null)?.value.trim() || "";
}

function setFieldError(fieldId: string, text: string): void {
  const input = document.getElementById(fieldId) as HTMLInputElement | null;
  const errorBox = document.querySelector(`[data-error-for="${fieldId}"]`) as HTMLElement | null;
  input?.classList.add("input-error");
  if (errorBox) {
    errorBox.textContent = text;
  }
}

function clearErrors(): void {
  if (messageBox) {
    messageBox.textContent = "";
    messageBox.className = "form-message";
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
  messageBox.className = `form-message ${type}`;
}

function setSubmitting(isSubmitting: boolean, label: string): void {
  if (!submitButton) {
    return;
  }

  submitButton.disabled = isSubmitting;
  submitButton.textContent = label;
}
