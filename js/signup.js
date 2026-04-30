const API_BASE_URL = "http://localhost:3000/api";

const form = document.getElementById("signup-form");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
const messageBox = document.getElementById("form-message");
const submitButton = document.querySelector(".submit-button");

form.addEventListener("submit", handleFormSubmit);

async function handleFormSubmit(event) {
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
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    setLoadingState(false);
  }
}

function validateForm(name, email, password, confirmPassword) {
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

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setFieldError(fieldId, text) {
  const input = document.getElementById(fieldId);
  const errorBox = document.querySelector(`[data-error-for="${fieldId}"]`);

  input.classList.add("input-error");
  errorBox.textContent = text;
}

function resetErrors() {
  messageBox.textContent = "";
  messageBox.className = "form-message";

  document.querySelectorAll(".field-error").forEach((element) => {
    element.textContent = "";
  });

  document.querySelectorAll(".input-error").forEach((input) => {
    input.classList.remove("input-error");
  });
}

function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = `form-message ${type}`;
}

function setLoadingState(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Creating account..." : "Sign Up";
}

async function registerUser(name, email, password) {
  // Confirm the final endpoint and field names with the backend team.
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
