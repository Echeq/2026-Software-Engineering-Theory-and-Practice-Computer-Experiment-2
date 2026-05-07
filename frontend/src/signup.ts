const API_BASE_URL = "http://localhost:3000/api";

interface RegisterResponse {
  message: string;
  user?: { id: string; name: string; email: string; role: string };
}

const form = document.getElementById("signup-form") as HTMLFormElement;
const nameInput = document.getElementById("name") as HTMLInputElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const confirmPasswordInput = document.getElementById("confirm-password") as HTMLInputElement;
const messageBox = document.getElementById("form-message") as HTMLElement;
const submitButton = document.querySelector(".submit-button") as HTMLButtonElement;

// If a manager is already logged in, switch the UI to "Create Member Account" mode
const existingToken = localStorage.getItem("token");
if (existingToken) {
  const titleEl = document.getElementById("signup-title");
  const subtitleEl = document.querySelector(".subtitle");
  const authSwitch = document.querySelector(".auth-switch");
  if (titleEl) titleEl.textContent = "Create Member Account";
  if (subtitleEl) subtitleEl.textContent = "Create a new member account for your team.";
  if (authSwitch) authSwitch.innerHTML = '<a href="./dashboard/index.html" class="auth-link">Back to Dashboard</a>';
}

form.addEventListener("submit", handleFormSubmit);

async function handleFormSubmit(event: Event): Promise<void> {
  event.preventDefault();
  resetErrors();
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();
  const isValid = validateForm(name, email, password, confirmPassword);
  if (!isValid) {
    showMessage("Fix the form errors and try again.", "error");
    return;
  }
  setLoadingState(true);
  try {
    const token = localStorage.getItem("token");
    await registerUser(name, email, password, token);
    if (token) {
      showMessage(`Member account created for ${email}.`, "success");
      form.reset();
    } else {
      showMessage("Manager account created. Redirecting to login...", "success");
      form.reset();
      setTimeout(() => { window.location.href = "./index.html"; }, 1500);
    }
  } catch (error: any) {
    showMessage(error.message, "error");
  } finally {
    setLoadingState(false);
  }
}

function validateForm(name: string, email: string, password: string, confirmPassword: string): boolean {
  let isValid = true;
  if (!name) {
    setFieldError("name", "Full name is required.");
    isValid = false;
  } else if (name.length < 2) {
    setFieldError("name", "Full name must be at least 2 characters.");
    isValid = false;
  }
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
  if (!confirmPassword) {
    setFieldError("confirm-password", "Confirm your password.");
    isValid = false;
  } else if (password !== confirmPassword) {
    setFieldError("confirm-password", "Passwords do not match.");
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
  submitButton.textContent = isLoading ? "Creating account..." : "Sign Up";
}

async function registerUser(name: string, email: string, password: string, token: string | null): Promise<RegisterResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name, email, password })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Sign up failed. Check the data or server status.");
  }
  return data;
}
