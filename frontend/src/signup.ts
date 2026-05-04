const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export {};

interface RegisterResponse {
  message: string;
}

const form = document.getElementById("signup-form") as HTMLFormElement;
const nameInput = document.getElementById("name") as HTMLInputElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const confirmPasswordInput = document.getElementById("confirm-password") as HTMLInputElement;
const messageBox = document.getElementById("form-message") as HTMLElement;
const submitButton = document.querySelector(".submit-button") as HTMLButtonElement;

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
    await registerUser(name, email, password);
    showMessage("Account created successfully. Redirecting to the login page...", "success");

    form.reset();
    setTimeout(() => {
      window.location.href = "./index.html";
    }, 1500);
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

  document.querySelectorAll(".field-error").forEach((element) => {
    element.textContent = "";
  });

  document.querySelectorAll(".input-error").forEach((input) => {
    input.classList.remove("input-error");
  });
}

function showMessage(text: string, type: string): void {
  messageBox.textContent = text;
  messageBox.className = `form-message ${type}`;
}

function setLoadingState(isLoading: boolean): void {
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Creating account..." : "Sign Up";
}

async function registerUser(name: string, email: string, password: string): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, email, password })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Sign up failed. Check the data or server status.");
  }

  return data;
}
