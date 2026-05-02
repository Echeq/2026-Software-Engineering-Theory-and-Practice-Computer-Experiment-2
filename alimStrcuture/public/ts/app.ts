declare const htmx: {
  onLoad(callback: (root: ParentNode) => void): void;
};

function wireConfirmations(root: ParentNode = document): void {
  const forms = root.querySelectorAll<HTMLFormElement>("form[data-confirm]");

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

function dismissFlash(root: ParentNode = document): void {
  const flashes = root.querySelectorAll<HTMLElement>("[data-flash]");
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
