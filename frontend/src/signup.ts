(() => {
  const API_BASE_URL = `${window.location.origin}/api`;
  const THEME_STORAGE_KEY = "dashboard-theme";
  const i18n = (key: string, values?: Record<string, string | number>): string => window.I18n?.t(key, values) || key;

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

  initializeTheme();
  form.addEventListener("submit", handleFormSubmit);

  function initializeTheme(): void {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.body.dataset.theme = storedTheme === "dark" || storedTheme === "light" ? storedTheme : preferredTheme;
  }

  async function handleFormSubmit(event: Event): Promise<void> {
    event.preventDefault();
    resetErrors();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();
    const isValid = validateForm(name, email, password, confirmPassword);

    if (!isValid) {
      showMessage(i18n("signup.validation.fix"), "error");
      return;
    }

    setLoadingState(true);

    try {
      await registerUser(name, email, password);
      showMessage(i18n("signup.success"), "success");

      form.reset();
      setTimeout(() => {
        window.location.href = "./index.html";
      }, 1500);
    } catch (error: unknown) {
      showMessage(error instanceof Error ? error.message : i18n("signup.failed"), "error");
    } finally {
      setLoadingState(false);
    }
  }

  function validateForm(name: string, email: string, password: string, confirmPassword: string): boolean {
    let isValid = true;

    if (!name) {
      setFieldError("name", i18n("signup.validation.nameRequired"));
      isValid = false;
    } else if (name.length < 2) {
      setFieldError("name", i18n("signup.validation.nameShort"));
      isValid = false;
    }

    if (!email) {
      setFieldError("email", i18n("signup.validation.emailRequired"));
      isValid = false;
    } else if (!isEmailValid(email)) {
      setFieldError("email", i18n("signup.validation.emailInvalid"));
      isValid = false;
    }

    if (!password) {
      setFieldError("password", i18n("signup.validation.passwordRequired"));
      isValid = false;
    } else if (password.length < 6) {
      setFieldError("password", i18n("signup.validation.passwordShort"));
      isValid = false;
    }

    if (!confirmPassword) {
      setFieldError("confirm-password", i18n("signup.validation.confirmRequired"));
      isValid = false;
    } else if (password !== confirmPassword) {
      setFieldError("confirm-password", i18n("signup.validation.confirmMismatch"));
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
    submitButton.textContent = isLoading ? i18n("signup.submitting") : i18n("signup.submit");
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
      throw new Error(data.message || i18n("signup.failedDefault"));
    }

    return data;
  }
})();
