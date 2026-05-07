const API_BASE_URL = "http://localhost:3000/api";

interface LoginResponse {
  token?: string;
  message: string;
}

const form = document.getElementById("login-form") as HTMLFormElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const messageBox = document.getElementById("form-message") as HTMLElement;
const submitButton = document.querySelector(".submit-button") as HTMLButtonElement;

form.addEventListener("submit", handleFormSubmit);

async function handleFormSubmit(event: Event): Promise<void> {
  event.preventDefault();
  resetErrors();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const isValid = validateForm(email, password);
  if (!isValid) {
    showMessage("Fix the form errors and try again.", "error");
    return;
  }
  setLoadingState(true);
  try {
    const data = await loginUser(email, password);
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    showMessage("Login successful. Redirecting to dashboard...", "success");
    form.reset();
    setTimeout(() => { window.location.href = "./dashboard/index.html"; }, 1000);
  } catch (error: any) {
    showMessage(error.message, "error");
  } finally {
    setLoadingState(false);
  }
}

function validateForm(email: string, password: string): boolean {
  let isValid = true;
  if (!email) {
    setFieldError("email", "Email is required.");
    isValid = false;
  } else if (!isEmailValid(email)) {
    setFieldError("email", "Enter a valid email address.");
    isValid = false;
  }
  if (!password) {
    setFieldError("password", "Password is required.");
    isValid = false;
  } else if (password.length < 6) {
    setFieldError("password", "Password must be at least 6 characters.");
    isValid = false;
  }
  return isValid;
}

function isEmailValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setFieldError(fieldId: string, text: string): void {
  const input = document.getElementById(fieldId) as HTMLInputElement;
  const errorBox = document.querySelector(`[data-error-for="${fieldId}"]`) as HTMLElement;
  input.classList.add("input-error");
  errorBox.textContent = text;
}

function resetErrors(): void {
  messageBox.textContent = "";
  messageBox.className = "form-message";
  document.querySelectorAll(".field-error").forEach((el) => { (el as HTMLElement).textContent = ""; });
  document.querySelectorAll(".input-error").forEach((el) => { el.classList.remove("input-error"); });
}

function showMessage(text: string, type: string): void {
  messageBox.textContent = text;
  messageBox.className = `form-message ${type}`;
}

function setLoadingState(isLoading: boolean): void {
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Logging in..." : "Log In";
}

async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Login failed. Check your credentials or server status.");
  }
  return data;
}
