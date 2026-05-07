"use strict";
(() => {
    const API_BASE_URL = `${window.location.origin}/api`;
    const THEME_STORAGE_KEY = "dashboard-theme";
    const i18n = (key, values) => window.I18n?.t(key, values) || key;
    const form = document.getElementById("login-form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const messageBox = document.getElementById("form-message");
    const submitButton = document.querySelector(".submit-button");
    let alertTimeoutId = 0;
    initializeTheme();
    form.addEventListener("submit", handleFormSubmit);
    function initializeTheme() {
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        document.body.dataset.theme = storedTheme === "dark" || storedTheme === "light" ? storedTheme : preferredTheme;
    }
    async function handleFormSubmit(event) {
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
            if (data.token) {
                localStorage.setItem("token", data.token);
            }
            showMessage(i18n("login.success"), "success");
            form.reset();
            setTimeout(() => {
                window.location.href = "./dashboard/index.html";
            }, 1000);
        }
        catch (error) {
            showMessage(error instanceof Error ? error.message : i18n("login.failed"), "error");
        }
        finally {
            setLoadingState(false);
        }
    }
    function validateForm(email, password) {
        let isValid = true;
        if (!email) {
            setFieldError("email", i18n("login.validation.emailRequired"));
            isValid = false;
        }
        else if (!isEmailValid(email)) {
            setFieldError("email", i18n("login.validation.emailInvalid"));
            isValid = false;
        }
        if (!password) {
            setFieldError("password", i18n("login.validation.passwordRequired"));
            isValid = false;
        }
        else if (password.length < 6) {
            setFieldError("password", i18n("login.validation.passwordShort"));
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
        clearMessage();
        document.querySelectorAll(".field-error").forEach((element) => {
            element.textContent = "";
        });
        document.querySelectorAll(".input-error").forEach((input) => {
            input.classList.remove("input-error");
        });
    }
    function showMessage(text, type) {
        if (alertTimeoutId) {
            window.clearTimeout(alertTimeoutId);
        }
        messageBox.textContent = text;
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
        messageBox.textContent = "";
        messageBox.className = "form-message";
    }
    function setLoadingState(isLoading) {
        submitButton.disabled = isLoading;
        submitButton.textContent = isLoading ? i18n("login.submitting") : i18n("login.submit");
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