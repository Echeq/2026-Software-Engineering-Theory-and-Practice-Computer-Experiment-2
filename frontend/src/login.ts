import "../css/login.css";
import "./i18n";

(() => {
    const API_BASE_URL = `${window.location.origin}/api`;
    const THEME_STORAGE_KEY = "dashboard-theme";
    const i18n = (
        key: string,
        values?: Record<string, string | number>,
    ): string => window.I18n?.t(key, values) || key;

    interface LoginResponse {
        csrfToken?: string;
        message: string;
    }

    const form = document.getElementById("login-form") as HTMLFormElement;
    const emailInput = document.getElementById("email") as HTMLInputElement;
    const passwordInput = document.getElementById(
        "password",
    ) as HTMLInputElement;
    const messageBox = document.getElementById("form-message") as HTMLElement;
    const submitButton = document.querySelector(
        ".submit-button",
    ) as HTMLButtonElement;
    const themeToggleButton = document.getElementById(
        "theme-toggle-btn",
    ) as HTMLButtonElement | null;
    let alertTimeoutId = 0;

    initializeTheme();
    initializeParticles();
    updateThemeToggle();
    form.addEventListener("submit", handleFormSubmit);
    themeToggleButton?.addEventListener("click", toggleTheme);
    document.addEventListener("app-language-change", updateThemeToggle);

    function initializeTheme(): void {
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)")
            .matches
            ? "dark"
            : "light";
        document.body.dataset.theme =
            storedTheme === "dark" || storedTheme === "light"
                ? storedTheme
                : preferredTheme;
    }

    function toggleTheme(): void {
        const nextTheme =
            document.body.dataset.theme === "dark" ? "light" : "dark";
        document.body.dataset.theme = nextTheme;
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        updateThemeToggle();
    }

    function updateThemeToggle(): void {
        if (!themeToggleButton) {
            return;
        }

        const isDarkTheme = document.body.dataset.theme === "dark";
        const nextThemeLabel = isDarkTheme
            ? i18n("theme.toLight")
            : i18n("theme.toDark");

        themeToggleButton.setAttribute("aria-pressed", String(isDarkTheme));
        themeToggleButton.setAttribute("aria-label", nextThemeLabel);
        themeToggleButton.setAttribute("title", nextThemeLabel);
        themeToggleButton.classList.toggle("is-dark", isDarkTheme);
    }

    function initializeParticles(): void {
        const particlesJs = (window as Window & { particlesJS?: (tagId: string, config: Record<string, unknown>) => void }).particlesJS;
        if (typeof particlesJs !== "function" || !document.getElementById("particles-js")) {
            return;
        }

        const isDarkTheme = document.body.dataset.theme === "dark";
        const particleColor = isDarkTheme ? "#FFFFFF" : "#6366F1";
        const particleOpacity = isDarkTheme ? 0.6 : 0.8;
        const particleCount = isDarkTheme ? 56 : 80;
        const linkColor = isDarkTheme ? "#6366F1" : "#4F46E5";
        const linkOpacity = isDarkTheme ? 0.25 : 0.3;

        particlesJs("particles-js", {
            particles: {
                number: { value: particleCount, density: { enable: true, value_area: 900 } },
                color: { value: particleColor },
                shape: { type: "circle" },
                opacity: { value: particleOpacity },
                size: { value: 4, random: true },
                line_linked: {
                    enable: true,
                    distance: 140,
                    color: linkColor,
                    opacity: linkOpacity,
                    width: 1.5
                },
                move: {
                    enable: true,
                    speed: 1.1,
                    direction: "none",
                    random: false,
                    straight: false,
                    out_mode: "out"
                }
            },
            interactivity: {
                detect_on: "canvas",
                events: {
                    onhover: { enable: false },
                    onclick: { enable: false },
                    resize: true
                }
            },
            retina_detect: true
        });
    }

    async function handleFormSubmit(event: Event): Promise<void> {
        event.preventDefault();
        resetErrors();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const isValid = validateForm(email, password);

        if (!isValid) {
            showMessage(i18n("login.validation.fix"), "error");
            return;
        }

        setLoadingState(true);

        try {
            const data = await loginUser(email, password);

            if (data.csrfToken) {
                localStorage.setItem("spmp-csrf-token", data.csrfToken);
            }

            showMessage(i18n("login.success"), "success");
            form.reset();

            setTimeout(() => {
                window.location.href = "./dashboard/index.html";
            }, 1000);
        } catch (error: unknown) {
            showMessage(
                error instanceof Error ? error.message : i18n("login.failed"),
                "error",
            );
        } finally {
            setLoadingState(false);
        }
    }

    function validateForm(email: string, password: string): boolean {
        let isValid = true;

        if (!email) {
            setFieldError("email", i18n("login.validation.emailRequired"));
            isValid = false;
        } else if (!isEmailValid(email)) {
            setFieldError("email", i18n("login.validation.emailInvalid"));
            isValid = false;
        }

        if (!password) {
            setFieldError(
                "password",
                i18n("login.validation.passwordRequired"),
            );
            isValid = false;
        } else if (password.length < 6) {
            setFieldError("password", i18n("login.validation.passwordShort"));
            isValid = false;
        }

        return isValid;
    }

    function isEmailValid(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function setFieldError(fieldId: string, text: string): void {
        const input = document.getElementById(fieldId) as HTMLInputElement;
        const errorBox = document.querySelector(
            `[data-error-for="${fieldId}"]`,
        ) as HTMLElement;

        input.classList.add("input-error");
        errorBox.textContent = text;
    }

    function resetErrors(): void {
        clearMessage();

        document.querySelectorAll(".field-error").forEach((element) => {
            element.textContent = "";
        });

        document.querySelectorAll(".input-error").forEach((input) => {
            input.classList.remove("input-error");
        });
    }

    function showMessage(text: string, type: string): void {
        if (alertTimeoutId) {
            window.clearTimeout(alertTimeoutId);
        }

        messageBox.textContent = text;
        messageBox.className = `form-message is-visible ${type}`;

        alertTimeoutId = window.setTimeout(() => {
            clearMessage();
        }, 3000);
    }

    function clearMessage(): void {
        if (alertTimeoutId) {
            window.clearTimeout(alertTimeoutId);
            alertTimeoutId = 0;
        }

        messageBox.textContent = "";
        messageBox.className = "form-message";
    }

    function setLoadingState(isLoading: boolean): void {
        submitButton.disabled = isLoading;
        submitButton.textContent = isLoading
            ? i18n("login.submitting")
            : i18n("login.submit");
    }

    async function loginUser(
        email: string,
        password: string,
    ): Promise<LoginResponse> {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "same-origin",
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || i18n("login.failedDefault"));
        }

        return data;
    }
})();
