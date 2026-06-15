"use strict";
(function () {
  const i18n = (key, values) => window.I18n?.t(key, values) || key;
  const notificationFallbacks = {
    en: {
      buttonLabel: "Notifications",
      title: "Notifications",
      close: "Close notifications",
      dismiss: "Dismiss"
    },
    ru: {
      buttonLabel: "Уведомления",
      title: "Уведомления",
      close: "Закрыть уведомления",
      dismiss: "Закрыть"
    },
    zh: {
      buttonLabel: "通知",
      title: "通知",
      close: "关闭通知",
      dismiss: "忽略"
    },
    es: {
      buttonLabel: "Notificaciones",
      title: "Notificaciones",
      close: "Cerrar notificaciones",
      dismiss: "Descartar"
    }
  };

  function getNotificationText(field, key) {
    const language = window.I18n?.getLanguage?.() || localStorage.getItem("app-language") || "en";
    const translated = i18n(key);
    if (translated !== key && translated !== "Notifications") {
      return translated;
    }
    return (notificationFallbacks[language] || notificationFallbacks.en)[field];
  }

  function refreshNotificationCenter() {
    document.querySelectorAll(".notification-center").forEach((center) => {
      const trigger = center.querySelector(".notification-center-trigger");
      const triggerLabel = center.querySelector(".notification-center-label");
      const panel = center.querySelector(".notification-center-panel");
      const title = center.querySelector(".notification-center-header strong");
      const closeButton = center.querySelector(".notification-center-close");
      const dismissButtons = center.querySelectorAll("[data-dismiss-notification]");

      if (trigger) {
        trigger.setAttribute("aria-label", getNotificationText("buttonLabel", "notifications.buttonLabel"));
      }
      if (triggerLabel) {
        triggerLabel.textContent = getNotificationText("buttonLabel", "notifications.buttonLabel");
      }
      if (panel) {
        panel.setAttribute("aria-label", getNotificationText("title", "notifications.title"));
      }
      if (title) {
        title.textContent = getNotificationText("title", "notifications.title");
      }
      if (closeButton) {
        closeButton.setAttribute("aria-label", getNotificationText("close", "notifications.close"));
        closeButton.setAttribute("title", getNotificationText("close", "notifications.close"));
      }
      dismissButtons.forEach((button) => {
        button.setAttribute("aria-label", getNotificationText("dismiss", "notifications.dismiss"));
        button.setAttribute("title", getNotificationText("dismiss", "notifications.dismiss"));
      });
    });
  }

  function refreshDashboardCharts() {
    if (!window.Chart || !window.Chart.instances) {
      return;
    }
    Object.values(window.Chart.instances).forEach((chart) => {
      const canvasId = chart?.canvas?.id;
      if (canvasId === "project-status-chart") {
        chart.data.labels = [
          i18n("status.planning"),
          i18n("status.active"),
          i18n("status.inReview"),
          i18n("status.done")
        ];
        chart.update();
      }
      if (canvasId === "task-overview-chart") {
        chart.data.labels = [
          i18n("tasks.status.todo"),
          i18n("tasks.status.inProgress"),
          i18n("tasks.status.done")
        ];
        if (chart.data.datasets && chart.data.datasets[0]) {
          chart.data.datasets[0].label = i18n("dashboard.taskOverviewTitle");
        }
        chart.update();
      }
    });
  }

  function applyLiveFixes() {
    window.I18n?.applyTranslations?.(document);
    refreshNotificationCenter();
    refreshDashboardCharts();
  }

  document.addEventListener("DOMContentLoaded", applyLiveFixes);
  document.addEventListener("app-language-change", applyLiveFixes);
})();
