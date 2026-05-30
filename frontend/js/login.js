"use strict";
(() => {
    const API_BASE_URL = `${window.location.origin}/api`;
    const THEME_STORAGE_KEY = "theme";
    const LEGACY_THEME_STORAGE_KEY = "dashboard-theme";
    const i18n = (key, values) => window.I18n?.t(key, values) || key;
    const setDynamicText = (element, key, values) => {
        if (!element) {
            return;
        }
        if (typeof window.I18n?.setDynamicTranslation === "function") {
            window.I18n.setDynamicTranslation(element, key, values);
            return;
        }
        element.textContent = i18n(key, values);
    };
    const clearDynamicText = (element) => {
        if (!element) {
            return;
        }
        window.I18n?.clearDynamicTranslation?.(element);
    };
    const form = document.getElementById("login-form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const messageBox = document.getElementById("form-message");
    const submitButton = document.querySelector(".submit-button");
    const themeToggleButton = document.getElementById("theme-toggle-btn");
    let alertTimeoutId = 0;
    initializeTheme();
    initializeParticles();
    updateThemeToggle();
    form.addEventListener("submit", handleFormSubmit);
    themeToggleButton?.addEventListener("click", toggleTheme);
    document.addEventListener("app-language-change", handleLanguageChange);
    function initializeTheme() {
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
        const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        const theme = storedTheme === "dark" || storedTheme === "light" ? storedTheme : preferredTheme;
        document.body.dataset.theme = theme;
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        localStorage.setItem(LEGACY_THEME_STORAGE_KEY, theme);
    }
    function initializeParticles() {
        if (typeof window.particlesJS !== "function" || !document.getElementById("particles-js")) {
            return;
        }
        const isDarkTheme = document.body.dataset.theme === "dark";
        const particleColor = isDarkTheme ? "#FFFFFF" : "#6366F1";
        const particleOpacity = isDarkTheme ? 0.6 : 0.8;
        const particleSize = 4;
        const particleCount = isDarkTheme ? 56 : 80;
        const linkColor = isDarkTheme ? "#6366F1" : "#4F46E5";
        const linkOpacity = isDarkTheme ? 0.25 : 0.3;
        const linkWidth = 1.5;
        window.particlesJS("particles-js", {
            particles: {
                number: {
                    value: particleCount,
                    density: {
                        enable: true,
                        value_area: 900
                    }
                },
                color: {
                    value: particleColor
                },
                shape: {
                    type: "circle"
                },
                opacity: {
                    value: particleOpacity
                },
                size: {
                    value: particleSize,
                    random: true
                },
                line_linked: {
                    enable: true,
                    distance: 140,
                    color: linkColor,
                    opacity: linkOpacity,
                    width: linkWidth
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
                    onhover: {
                        enable: false
                    },
                    onclick: {
                        enable: false
                    },
                    resize: true
                }
            },
            retina_detect: true
        });
    }
    function refreshParticles() {
        destroyParticles();
        initializeParticles();
    }
    function destroyParticles() {
        const particlesContainer = document.getElementById("particles-js");
        if (Array.isArray(window.pJSDom)) {
            window.pJSDom.forEach((instance) => {
                instance?.pJS?.fn?.vendors?.destroypJS?.();
            });
            window.pJSDom = [];
        }
        if (particlesContainer) {
            particlesContainer.innerHTML = "";
        }
    }
    function toggleTheme() {
        const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
        document.body.dataset.theme = nextTheme;
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        localStorage.setItem(LEGACY_THEME_STORAGE_KEY, nextTheme);
        refreshParticles();
        updateThemeToggle();
    }
    function updateThemeToggle() {
        if (!themeToggleButton) {
            return;
        }
        const isDarkTheme = document.body.dataset.theme === "dark";
        const nextThemeLabel = isDarkTheme ? i18n("theme.toLight") : i18n("theme.toDark");
        themeToggleButton.setAttribute("aria-pressed", String(isDarkTheme));
        themeToggleButton.setAttribute("aria-label", nextThemeLabel);
        themeToggleButton.setAttribute("title", nextThemeLabel);
        themeToggleButton.classList.toggle("is-dark", isDarkTheme);
    }
    async function handleFormSubmit(event) {
        event.preventDefault();
        resetErrors();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const isValid = validateForm(email, password);
        if (!isValid) {
            showMessage("", "error", "login.validation.fix");
            return;
        }
        setLoadingState(true);
        try {
            const data = await loginUser(email, password);
            if (data.token) {
                localStorage.setItem("token", data.token);
            }
            showMessage("", "success", "login.success");
            form.reset();
            setTimeout(() => {
                window.location.href = "./dashboard/index.html";
            }, 1000);
        }
        catch (error) {
            showMessage(error instanceof Error ? error.message : "", "error", error instanceof Error ? "" : "login.failed");
        }
        finally {
            setLoadingState(false);
        }
    }
    function validateForm(email, password) {
        let isValid = true;
        if (!email) {
            setFieldError("email", "login.validation.emailRequired");
            isValid = false;
        }
        else if (!isEmailValid(email)) {
            setFieldError("email", "login.validation.emailInvalid");
            isValid = false;
        }
        if (!password) {
            setFieldError("password", "login.validation.passwordRequired");
            isValid = false;
        }
        else if (password.length < 6) {
            setFieldError("password", "login.validation.passwordShort");
            isValid = false;
        }
        return isValid;
    }
    function isEmailValid(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    function setFieldError(fieldId, key) {
        const input = document.getElementById(fieldId);
        const errorBox = document.querySelector(`[data-error-for="${fieldId}"]`);
        input.classList.add("input-error");
        setDynamicText(errorBox, key);
    }
    function resetErrors() {
        clearMessage();
        document.querySelectorAll(".field-error").forEach((element) => {
            clearDynamicText(element);
            element.textContent = "";
        });
        document.querySelectorAll(".input-error").forEach((input) => {
            input.classList.remove("input-error");
        });
    }
    function showMessage(text, type, key = "", values) {
        if (alertTimeoutId) {
            window.clearTimeout(alertTimeoutId);
        }
        if (key) {
            setDynamicText(messageBox, key, values);
        }
        else {
            clearDynamicText(messageBox);
            messageBox.textContent = text;
        }
        messageBox.className = `form-message is-visible ${type}`;
        alertTimeoutId = window.setTimeout(() => {
            clearMessage();
        }, 3000);
    }
    function clearMessage() {
        if (alertTimeoutId) {
            window.clearTimeout(alertTimeoutId);
            alertTimeoutId = 0;
        }
        clearDynamicText(messageBox);
        messageBox.textContent = "";
        messageBox.className = "form-message";
    }
    function setLoadingState(isLoading) {
        submitButton.disabled = isLoading;
        if (isLoading) {
            setDynamicText(submitButton, "login.submitting");
            return;
        }
        clearDynamicText(submitButton);
        submitButton.textContent = i18n("login.submit");
    }
    function handleLanguageChange() {
        updateThemeToggle();
        setLoadingState(Boolean(submitButton?.disabled));
    }
    async function loginUser(email, password) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({ email, password })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || i18n("login.failedDefault"));
        }
        return data;
    }
})();
//# sourceMappingURL=login.js.map
