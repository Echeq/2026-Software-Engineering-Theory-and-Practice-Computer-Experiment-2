"use strict";
(() => {
    const API_BASE_URL = `${window.location.origin}/api`;
    const form = document.getElementById("login-form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const messageBox = document.getElementById("form-message");
    const submitButton = document.querySelector(".submit-button");
    form.addEventListener("submit", handleFormSubmit);
    async function handleFormSubmit(event) {
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
            setTimeout(() => {
                window.location.href = "./dashboard/index.html";
            }, 1000);
        }
        catch (error) {
            showMessage(error instanceof Error ? error.message : "Login failed.", "error");
        }
        finally {
            setLoadingState(false);
        }
    }
    function validateForm(email, password) {
        let isValid = true;
        if (!email) {
            setFieldError("email", "Email is required.");
            isValid = false;
        }
        else if (!isEmailValid(email)) {
            setFieldError("email", "Enter a valid email address.");
            isValid = false;
        }
        if (!password) {
            setFieldError("password", "Password is required.");
            isValid = false;
        }
        else if (password.length < 6) {
            setFieldError("password", "Password must be at least 6 characters.");
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
        submitButton.textContent = isLoading ? "Logging in..." : "Log In";
    }
    async function loginUser(email, password) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || "Login failed. Check your credentials or server status.");
        }
        return data;
    }
})();
//# sourceMappingURL=login.js.map