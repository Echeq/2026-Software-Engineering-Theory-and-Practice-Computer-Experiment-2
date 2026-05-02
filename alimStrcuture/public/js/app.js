"use strict";
function wireConfirmations(root = document) {
    const forms = root.querySelectorAll("form[data-confirm]");
    forms.forEach((form) => {
        if (form.dataset.confirmBound === "true") {
            return;
        }
        form.dataset.confirmBound = "true";
        form.addEventListener("submit", (event) => {
            const message = form.dataset.confirm;
            if (message && !window.confirm(message)) {
                event.preventDefault();
            }
        });
    });
}
function dismissFlash(root = document) {
    const flashes = root.querySelectorAll("[data-flash]");
    flashes.forEach((flash) => {
        window.setTimeout(() => {
            flash.classList.add("is-hidden");
        }, 2600);
    });
}
document.addEventListener("DOMContentLoaded", () => {
    wireConfirmations(document);
    dismissFlash(document);
});
document.body.addEventListener("htmx:afterSwap", () => {
    wireConfirmations(document);
    dismissFlash(document);
});
if (typeof htmx !== "undefined") {
    htmx.onLoad((root) => {
        wireConfirmations(root);
        dismissFlash(root);
    });
}
