"use strict";
const LANGUAGE_STORAGE_KEY = "app-language";
const DEFAULT_LANGUAGE = "en";
const LANGUAGE_ORDER = ["en", "zh", "es"];
const LANGUAGE_OPTIONS = {
    en: {
        label: "English",
        flag: "\u{1F1FA}\u{1F1F8}"
    },
    zh: {
        label: "\u4E2D\u6587",
        flag: "\u{1F1E8}\u{1F1F3}"
    },
    es: {
        label: "Espa\u00F1ol",
        flag: "\u{1F1EA}\u{1F1F8}"
    }
};
let languageMenuEventsBound = false;
let notificationCenterEventsBound = false;
const NOTIFICATIONS_STORAGE_KEY = "app-notifications-state";
const DEFAULT_NOTIFICATIONS = [
    { id: "notification-design-review", key: "notifications.item1", read: false },
    { id: "notification-project-comment", key: "notifications.item2", read: false },
    { id: "notification-workspace-saved", key: "notifications.item3", read: false }
];
const translations = {
    en: {
        "language.english": "English",
        "language.chinese": "Chinese",
        "language.spanish": "Spanish",
        "language.current": "Language: {language}",
        "notifications.buttonLabel": "Notifications",
        "notifications.title": "Notifications",
        "notifications.close": "Close notifications",
        "notifications.dismiss": "Dismiss notification",
        "notifications.empty": "No notifications right now.",
        "notifications.item1": "Design review has been scheduled for tomorrow morning.",
        "notifications.item2": "A new comment was added to the Frontend Showcase project.",
        "notifications.item3": "Your workspace preferences were saved on this device.",
        "login.title": "Log In",
        "login.subtitle": "A platform for managing projects and tasks.",
        "login.email": "Email",
        "login.emailPlaceholder": "student@example.com",
        "login.password": "Password",
        "login.passwordPlaceholder": "Enter your password",
        "login.submit": "Log In",
        "login.submitting": "Logging in...",
        "login.noAccount": "Don't have an account?",
        "login.signUpLink": "Sign Up",
        "login.success": "Login successful. Redirecting to dashboard...",
        "login.failed": "Login failed.",
        "login.failedDefault": "Login failed. Check your credentials or server status.",
        "login.validation.fix": "Fix the form errors and try again.",
        "login.validation.emailRequired": "Email is required.",
        "login.validation.emailInvalid": "Enter a valid email address.",
        "login.validation.passwordRequired": "Password is required.",
        "login.validation.passwordShort": "Password must be at least 6 characters.",
        "signup.title": "Create Account",
        "signup.subtitle": "Create your account to start managing projects and tasks.",
        "signup.name": "Full Name",
        "signup.namePlaceholder": "Regular User",
        "signup.email": "Email",
        "signup.emailPlaceholder": "student@example.com",
        "signup.password": "Password",
        "signup.passwordPlaceholder": "Create a password",
        "signup.confirmPassword": "Confirm Password",
        "signup.confirmPasswordPlaceholder": "Repeat your password",
        "signup.submit": "Sign Up",
        "signup.submitting": "Creating account...",
        "signup.haveAccount": "Already have an account?",
        "signup.loginLink": "Log In",
        "signup.success": "Account created successfully. Redirecting to the login page...",
        "signup.failed": "Sign up failed.",
        "signup.failedDefault": "Sign up failed. Check the data or server status.",
        "signup.validation.fix": "Fix the form errors and try again.",
        "signup.validation.nameRequired": "Full name is required.",
        "signup.validation.nameShort": "Full name must be at least 2 characters.",
        "signup.validation.emailRequired": "Email is required.",
        "signup.validation.emailInvalid": "Enter a valid email address.",
        "signup.validation.passwordRequired": "Password is required.",
        "signup.validation.passwordShort": "Password must be at least 6 characters.",
        "signup.validation.confirmRequired": "Confirm your password.",
        "signup.validation.confirmMismatch": "Passwords do not match.",
        "sidebar.workspace": "Project workspace",
        "sidebar.dashboard": "Dashboard",
        "sidebar.projects": "Projects",
        "sidebar.tasks": "Tasks",
        "sidebar.settings": "Settings",
        "sidebar.signedInAs": "Signed in as",
        "sidebar.logout": "Log Out",
        "theme.dark": "Dark Mode",
        "theme.light": "Light Mode",
        "theme.toDark": "Switch to dark mode",
        "theme.toLight": "Switch to light mode",
        "dashboard.topbarTag": "Workspace",
        "dashboard.topbarLabel": "Navigation, projects, and account controls in one place.",
        "dashboard.greetingMorning": "Good morning, {name}",
        "dashboard.greetingMorningFallback": "Good morning",
        "dashboard.greetingAfternoonFallback": "Good afternoon",
        "dashboard.greetingEveningFallback": "Good evening",
        "dashboard.greetingNightFallback": "Good night",
        "dashboard.title": "Projects Dashboard",
        "dashboard.subtitle": "A focused workspace for tracking projects, planning new work, and staying organized across your study flow.",
        "dashboard.currentView": "Current View",
        "dashboard.currentViewName": "Dashboard Overview",
        "dashboard.currentViewText": "Review active projects and create a new workspace when needed.",
        "dashboard.createProject": "Create New Project",
        "dashboard.statisticsTag": "Statistics",
        "dashboard.statisticsTitle": "Dashboard Statistics",
        "dashboard.statisticsSubtitle": "A quick visual summary of project and task progress on this device.",
        "dashboard.projectStatusTitle": "Project Status",
        "dashboard.taskOverviewTitle": "Task Overview",
        "dashboard.projectStatusChartAriaLabel": "Project status chart",
        "dashboard.taskOverviewChartAriaLabel": "Task overview chart",
        "dashboard.projectsTag": "Projects",
        "dashboard.projectsTitle": "My Projects",
        "dashboard.projectsSubtitle": "Keep project workspaces visible, organized, and easy to scan.",
        "dashboard.search": "Search",
        "dashboard.sort": "Sort",
        "dashboard.sortNewest": "Newest first",
        "dashboard.sortOldest": "Oldest first",
        "dashboard.sortAZ": "A-Z",
        "dashboard.searchPlaceholder": "Search projects",
        "dashboard.filter.all": "All",
        "dashboard.filter.active": "Active",
        "dashboard.filter.inReview": "In Review",
        "dashboard.filter.planning": "Planning",
        "dashboard.loadingTitle": "Loading projects...",
        "dashboard.loadingText": "Fetching your workspace.",
        "dashboard.noProjects": "No projects yet",
        "dashboard.noProjectsText": "Create your first project to start organizing tasks and deliverables.",
        "dashboard.noProjectsFound": "No projects found",
        "dashboard.noProjectsFoundText": "Try another search or filter, or create a new project.",
        "dashboard.projectsUnavailable": "Projects unavailable",
        "dashboard.preview": "Preview mode: dashboard style is shown with demo data.",
        "dashboard.previewProject1Name": "Semester Project Planner",
        "dashboard.previewProject1Description": "Track milestones, assignments, and deadlines for the current term.",
        "dashboard.previewProject2Name": "UX Research Board",
        "dashboard.previewProject2Description": "Collect interview notes, usability feedback, and iteration ideas.",
        "dashboard.previewProject3Name": "Frontend Showcase",
        "dashboard.previewProject3Description": "A visual preview project to review the dashboard style without backend data.",
        "dashboard.previewProjectCreated": "Preview project created successfully.",
        "dashboard.projectCreated": "Project created successfully.",
        "dashboard.projectCreateFailed": "Failed to create project.",
        "dashboard.projectModalTitle": "Create New Project",
        "dashboard.projectModalSubtitle": "Add a new project to your dashboard.",
        "dashboard.projectName": "Project Name",
        "dashboard.projectNamePlaceholder": "Semester Project Planner",
        "dashboard.projectDescription": "Description",
        "dashboard.projectDescriptionPlaceholder": "Briefly describe the goal of this project",
        "dashboard.cancel": "Cancel",
        "dashboard.projectSubmit": "Create Project",
        "dashboard.projectSubmitting": "Creating...",
        "dashboard.validation.projectRequired": "Project name is required.",
        "dashboard.validation.projectShort": "Project name must be at least 2 characters.",
        "dashboard.validation.projectDescriptionLong": "Description must be 500 characters or fewer.",
        "dashboard.validation.fix": "Fix the form errors and try again.",
        "projects.pageTag": "Projects",
        "projects.topbarLabel": "Track your project pipeline across start-next, active, and completed work.",
        "projects.title": "Projects Board",
        "projects.subtitle": "A kanban-style view for deciding what to start next, what is moving now, and what has already shipped.",
        "projects.boardMode": "Board Mode",
        "projects.boardModeName": "Projects Pipeline",
        "projects.boardModeText": "Open any project card to continue into the tasks view.",
        "projects.kanbanTag": "Board",
        "projects.flowTitle": "Project Flow",
        "projects.flowSubtitle": "Each column groups projects by their current delivery phase.",
        "projects.preview": "Preview mode: the projects board is shown with demo data.",
        "projects.previewProject1Name": "Semester Project Planner",
        "projects.previewProject1Description": "Plan milestones, deadlines, and release order before implementation begins.",
        "projects.previewProject2Name": "Research Collaboration Hub",
        "projects.previewProject2Description": "Coordinate active project updates, meeting notes, and shared feedback across the team.",
        "projects.previewProject3Name": "Frontend Showcase",
        "projects.previewProject3Description": "Completed presentation-ready project used to review the latest interface iteration.",
        "projects.loadingText": "Preparing your kanban board.",
        "projects.emptyColumn": "No projects",
        "projects.emptyColumnText": "No projects are currently assigned to this column.",
        "projects.startNext": "Start Next",
        "projects.startNextCaption": "Queued, planning, and next-up work.",
        "projects.inProgress": "In Progress",
        "projects.inProgressCaption": "Active delivery and review right now.",
        "projects.done": "Done",
        "projects.doneCaption": "Completed work ready for reference.",
        "tasks.pageTag": "Tasks",
        "tasks.topbarLabel": "Task-level view for the selected project.",
        "tasks.title": "Tasks Workspace",
        "tasks.subtitleDefault": "Open a project from the projects board to continue into its task workflow.",
        "tasks.selectedProject": "Selected Project",
        "tasks.noProject": "No project selected",
        "tasks.noProjectMeta": "Choose a project card from the projects board to view task context.",
        "tasks.sectionTag": "Tasks",
        "tasks.sectionTitle": "Task Board Placeholder",
        "tasks.sectionSubtitle": "This page is ready as the navigation target for project cards.",
        "tasks.detailText": "The selected project context is loaded from the projects board. This keeps the click-through flow working now and leaves room for a fuller task board later.",
        "tasks.subtitleProject": "Continue planning and delivery for {projectName}.",
        "tasks.subtitleLocalProject": "Local task workflow for {projectName}.",
        "tasks.subtitleLocalDefault": "Create tasks locally and optionally attach them to a selected project.",
        "tasks.noProjectStatus": "No status",
        "tasks.noProjectContextSaved": "No project context saved yet. Open a project card from Projects or choose one in the form.",
        "tasks.localStorageTag": "Local Tasks",
        "tasks.localBoardTitle": "Local Task Board",
        "tasks.localBoardSubtitle": "Your local task board saved on this device.",
        "tasks.addTask": "Add Task",
        "tasks.saveTask": "Save Task",
        "tasks.loadingTitle": "Loading tasks...",
        "tasks.loadingText": "Opening your saved local tasks.",
        "tasks.unavailableTitle": "Tasks unavailable",
        "tasks.modalSubtitle": "Create a task and save it locally on this device.",
        "tasks.closeTaskDialog": "Close add task dialog",
        "tasks.form.title": "Title",
        "tasks.form.titlePlaceholder": "Add a clear task title",
        "tasks.form.description": "Description",
        "tasks.form.descriptionPlaceholder": "Optional notes, links, or acceptance criteria",
        "tasks.form.status": "Status",
        "tasks.form.priority": "Priority",
        "tasks.form.dueDate": "Due Date",
        "tasks.form.dueDatePlaceholder": "YYYY-MM-DD",
        "tasks.form.project": "Project",
        "tasks.filters.priority": "Priority",
        "tasks.filters.status": "Status",
        "tasks.clearFilters": "Clear filters",
        "tasks.status.todo": "To-Do",
        "tasks.status.inProgress": "In Progress",
        "tasks.status.done": "Done",
        "tasks.column.todoCaption": "Planned work that still needs to start.",
        "tasks.column.inProgressCaption": "Tasks actively being worked on right now.",
        "tasks.column.doneCaption": "Completed tasks ready for review or reference.",
        "tasks.emptyColumnText": "Add a task to start filling this {column} column.",
        "tasks.form.noProjectOption": "No project",
        "tasks.validation.titleRequired": "Title is required.",
        "tasks.validation.invalidDueDate": "Use the due date format YYYY-MM-DD.",
        "tasks.message.saved": "Task saved locally.",
        "tasks.message.saveFailed": "Failed to save task locally. Please try again.",
        "tasks.message.deleted": "Task deleted locally.",
        "tasks.message.deleteFailed": "Failed to delete task locally. Please try again.",
        "tasks.message.statusUpdateFailed": "Failed to update task status locally. Please try again.",
        "tasks.card.noDescription": "No description provided.",
        "tasks.card.noDueDate": "No due date",
        "tasks.card.invalidDate": "Invalid date",
        "tasks.card.delete": "Delete",
        "tasks.card.projectLabel": "Project:",
        "tasks.card.dueLabel": "Due:",
        "tasks.priority.low": "Low",
        "tasks.priority.medium": "Medium",
        "tasks.priority.high": "High",
        "settings.pageTag": "Settings",
        "settings.topbarLabel": "Manage your profile details, account actions, and appearance preferences.",
        "settings.title": "Workspace Settings",
        "settings.subtitle": "Adjust the frontend-only profile form and appearance preferences stored on this device.",
        "settings.stateLabel": "Local State",
        "settings.stateName": "Frontend Store",
        "settings.stateText": "Profile changes stay in local state only. No backend update is sent.",
        "settings.sectionTag": "Preferences",
        "settings.sectionTitle": "Settings Form",
        "settings.sectionSubtitle": "Update local profile inputs, account actions, and appearance controls.",
        "settings.profileTitle": "Profile",
        "settings.profileText": "Edit your name and email in local frontend state.",
        "settings.name": "Name",
        "settings.namePlaceholder": "Regular User",
        "settings.email": "Email",
        "settings.emailPlaceholder": "student@example.com",
        "settings.profileSave": "Save Changes",
        "settings.profileConfirmTitle": "Confirm your identity",
        "settings.profileConfirmPassword": "Password",
        "settings.profileConfirmPasswordPlaceholder": "Enter your password",
        "settings.profileConfirmCancel": "Cancel",
        "settings.profileConfirmConfirm": "Confirm",
        "settings.profileConfirmRequired": "Password is required.",
        "settings.profileSaveSuccess": "Profile changes saved successfully.",
        "settings.accountTitle": "Account",
        "settings.accountText": "Account security actions are available here as frontend-only interactions.",
        "settings.changePassword": "Change Password",
        "settings.changePasswordHint": "Password change is not connected to the backend in this frontend-only view.",
        "settings.passwordModalTitle": "Change Password",
        "settings.passwordModalSubtitle": "Validate the form locally and keep the entire flow on the frontend.",
        "settings.passwordModalClose": "Close change password dialog",
        "settings.currentPassword": "Current Password",
        "settings.currentPasswordPlaceholder": "Enter your current password",
        "settings.newPassword": "New Password",
        "settings.newPasswordPlaceholder": "Enter a new password",
        "settings.confirmNewPassword": "Confirm New Password",
        "settings.confirmNewPasswordPlaceholder": "Re-enter the new password",
        "settings.passwordSave": "Save",
        "settings.passwordValidation.currentRequired": "Current Password is required.",
        "settings.passwordValidation.newTooShort": "New Password must be at least 8 characters.",
        "settings.passwordValidation.confirmMismatch": "Confirm New Password must match New Password exactly.",
        "settings.passwordSuccess": "Password updated successfully.",
        "settings.accountHint": "This button is a frontend placeholder and does not send a backend request.",
        "settings.notificationsTitle": "Notification preferences",
        "settings.notificationsText": "Choose which alerts stay enabled on this device.",
        "settings.emailNotifications": "Email notifications",
        "settings.browserNotifications": "Browser notifications",
        "settings.toggleOn": "On",
        "settings.toggleOff": "Off",
        "settings.appearanceTitle": "Appearance",
        "settings.appearanceText": "Switch between light and dark mode and keep the choice in local state.",
        "settings.themeSwitchLabel": "Theme",
        "settings.appearanceHint": "The selected mode also syncs with the header theme control.",
        "settings.displayTitle": "Display preferences",
        "settings.displayText": "Choose how the projects page should open by default on this device.",
        "settings.defaultProjectView": "Default project view",
        "settings.viewGrid": "Grid",
        "settings.viewList": "List",
        "settings.dangerTitle": "Reset & Clear",
        "settings.dangerText": "Remove all locally saved preferences and session data from this browser.",
        "settings.clearLocalData": "Clear all local data",
        "status.planning": "Planning",
        "status.active": "Active",
        "status.inReview": "In Review",
        "status.done": "Done",
        "status.todo": "To-Do",
        "common.you": "You",
        "common.loading": "Loading...",
        "common.unavailable": "Unavailable",
        "common.tasksCount": "{count} tasks",
        "common.tasksCompletedCounter": "{completed} of {total} tasks completed",
        "common.createdRecently": "Created recently",
        "common.createdDate": "Created {date}",
        "common.percentComplete": "{percent}% complete",
        "common.noTasksYet": "No tasks yet",
        "auth.sessionExpired": "Your session has expired. Please log in again."
    },
    zh: {
        "language.english": "English",
        "language.chinese": "дё­ж–‡",
        "language.spanish": "EspaГ±ol",
        "language.current": "иЇ­иЁЂпјљ{language}",
        "login.title": "з™»еЅ•",
        "login.subtitle": "з”ЁдєЋз®Ўзђ†йЎ№з›®е’Њд»»еЉЎзљ„е№іеЏ°гЂ‚",
        "login.email": "й‚®з®±",
        "login.emailPlaceholder": "student@example.com",
        "login.password": "еЇ†з Ѓ",
        "login.passwordPlaceholder": "иѕ“е…ҐдЅ зљ„еЇ†з Ѓ",
        "login.submit": "з™»еЅ•",
        "login.submitting": "ж­ЈењЁз™»еЅ•...",
        "login.noAccount": "иїжІЎжњ‰иґ¦еЏ·пјџ",
        "login.signUpLink": "жіЁе†Њ",
        "login.success": "з™»еЅ•ж€ђеЉџпјЊж­ЈењЁи·іиЅ¬е€°д»ЄиЎЁз›...",
        "login.failed": "з™»еЅ•е¤±иґҐгЂ‚",
        "login.failedDefault": "з™»еЅ•е¤±иґҐгЂ‚иЇ·жЈЂжџҐе‡­жЌ®ж€–жњЌеЉЎе™ЁзЉ¶жЂЃгЂ‚",
        "login.validation.fix": "иЇ·дї®ж­ЈиЎЁеЌ•й”™иЇЇеђЋй‡ЌиЇ•гЂ‚",
        "login.validation.emailRequired": "иЇ·иѕ“е…Ґй‚®з®±гЂ‚",
        "login.validation.emailInvalid": "иЇ·иѕ“е…Ґжњ‰ж•€зљ„й‚®з®±ењ°еќЂгЂ‚",
        "login.validation.passwordRequired": "иЇ·иѕ“е…ҐеЇ†з ЃгЂ‚",
        "login.validation.passwordShort": "еЇ†з Ѓи‡іе°‘йњЂи¦Ѓ 6 дёЄе­—з¬¦гЂ‚",
        "signup.title": "е€›е»єиґ¦еЏ·",
        "signup.subtitle": "е€›е»єиґ¦еЏ·д»ҐејЂе§‹з®Ўзђ†йЎ№з›®е’Њд»»еЉЎгЂ‚",
        "signup.name": "е§“еђЌ",
        "signup.namePlaceholder": "Regular User",
        "signup.email": "й‚®з®±",
        "signup.emailPlaceholder": "student@example.com",
        "signup.password": "еЇ†з Ѓ",
        "signup.passwordPlaceholder": "е€›е»єеЇ†з Ѓ",
        "signup.confirmPassword": "зЎ®и®¤еЇ†з Ѓ",
        "signup.confirmPasswordPlaceholder": "е†Ќж¬Ўиѕ“е…ҐеЇ†з Ѓ",
        "signup.submit": "жіЁе†Њ",
        "signup.submitting": "ж­ЈењЁе€›е»єиґ¦еЏ·...",
        "signup.haveAccount": "е·Із»Џжњ‰иґ¦еЏ·пјџ",
        "signup.loginLink": "з™»еЅ•",
        "signup.success": "иґ¦еЏ·е€›е»єж€ђеЉџпјЊж­ЈењЁи·іиЅ¬е€°з™»еЅ•йЎµ...",
        "signup.failed": "жіЁе†Ње¤±иґҐгЂ‚",
        "signup.failedDefault": "жіЁе†Ње¤±иґҐгЂ‚иЇ·жЈЂжџҐиѕ“е…Ґж•°жЌ®ж€–жњЌеЉЎе™ЁзЉ¶жЂЃгЂ‚",
        "signup.validation.fix": "иЇ·дї®ж­ЈиЎЁеЌ•й”™иЇЇеђЋй‡ЌиЇ•гЂ‚",
        "signup.validation.nameRequired": "иЇ·иѕ“е…Ґе§“еђЌгЂ‚",
        "signup.validation.nameShort": "е§“еђЌи‡іе°‘йњЂи¦Ѓ 2 дёЄе­—з¬¦гЂ‚",
        "signup.validation.emailRequired": "иЇ·иѕ“е…Ґй‚®з®±гЂ‚",
        "signup.validation.emailInvalid": "иЇ·иѕ“е…Ґжњ‰ж•€зљ„й‚®з®±ењ°еќЂгЂ‚",
        "signup.validation.passwordRequired": "иЇ·иѕ“е…ҐеЇ†з ЃгЂ‚",
        "signup.validation.passwordShort": "еЇ†з Ѓи‡іе°‘йњЂи¦Ѓ 6 дёЄе­—з¬¦гЂ‚",
        "signup.validation.confirmRequired": "иЇ·зЎ®и®¤еЇ†з ЃгЂ‚",
        "signup.validation.confirmMismatch": "дё¤ж¬Ўиѕ“е…Ґзљ„еЇ†з ЃдёЌдёЂи‡ґгЂ‚",
        "sidebar.workspace": "йЎ№з›®е·ҐдЅњеЊє",
        "sidebar.dashboard": "д»ЄиЎЁз›",
        "sidebar.projects": "йЎ№з›®",
        "sidebar.tasks": "д»»еЉЎ",
        "sidebar.settings": "и®ѕзЅ®",
        "sidebar.signedInAs": "еЅ“е‰Ќз™»еЅ•з”Ёж€·",
        "sidebar.logout": "йЂЂе‡єз™»еЅ•",
        "theme.dark": "ж·±и‰ІжЁЎејЏ",
        "theme.light": "жµ…и‰ІжЁЎејЏ",
        "theme.toDark": "е€‡жЌўе€°ж·±и‰ІжЁЎејЏ",
        "theme.toLight": "е€‡жЌўе€°жµ…и‰ІжЁЎејЏ",
        "dashboard.topbarTag": "е·ҐдЅњеЊє",
        "dashboard.topbarLabel": "е°†еЇји€ЄгЂЃйЎ№з›®е’Њиґ¦ж€·ж“ЌдЅњй›†дё­ењЁдёЂдёЄењ°ж–№гЂ‚",
        "dashboard.greetingMorning": "\u65e9\u4e0a\u597d\uff0c{name}",
        "dashboard.greetingMorningFallback": "\u65e9\u4e0a\u597d",
        "dashboard.title": "йЎ№з›®д»ЄиЎЁз›",
        "dashboard.subtitle": "дёЂдёЄдё“жіЁзљ„е·ҐдЅњеЊєпјЊз”ЁдєЋи·џиёЄйЎ№з›®гЂЃи§„е€’е·ҐдЅњпјЊе№¶и®©е­¦д№ жµЃзЁ‹дїќжЊЃжњ‰еєЏгЂ‚",
        "dashboard.currentView": "еЅ“е‰Ќи§†е›ѕ",
        "dashboard.currentViewName": "д»ЄиЎЁз›жЂ»и§€",
        "dashboard.currentViewText": "жџҐзњ‹жґ»и·ѓйЎ№з›®пјЊе№¶ењЁйњЂи¦Ѓж—¶е€›е»єж–°зљ„е·ҐдЅњеЊєгЂ‚",
        "dashboard.createProject": "е€›е»єж–°йЎ№з›®",
        "dashboard.projectsTag": "йЎ№з›®",
        "dashboard.projectsTitle": "ж€‘зљ„йЎ№з›®",
        "dashboard.projectsSubtitle": "и®©йЎ№з›®е·ҐдЅњеЊєж›ґжё…ж™°гЂЃж›ґжњ‰жќЎзђ†гЂЃж›ґж“дєЋжµЏи§€гЂ‚",
        "dashboard.search": "жђњзґў",
        "dashboard.sort": "жЋ’еєЏ",
        "dashboard.sortNewest": "жњЂж–°дје…€",
        "dashboard.sortOldest": "жњЂж—©дје…€",
        "dashboard.sortAZ": "A-Z",
        "dashboard.searchPlaceholder": "жђњзґўйЎ№з›®",
        "dashboard.filter.all": "е…ЁйѓЁ",
        "dashboard.filter.active": "иї›иЎЊдё­",
        "dashboard.filter.inReview": "иЇ„е®Ўдё­",
        "dashboard.filter.planning": "и§„е€’дё­",
        "dashboard.loadingTitle": "ж­ЈењЁеЉ иЅЅйЎ№з›®...",
        "dashboard.loadingText": "ж­ЈењЁиЋ·еЏ–дЅ зљ„е·ҐдЅњеЊєгЂ‚",
        "dashboard.noProjects": "иїжІЎжњ‰йЎ№з›®",
        "dashboard.noProjectsText": "е€›е»єдЅ зљ„з¬¬дёЂдёЄйЎ№з›®пјЊејЂе§‹з»„з»‡д»»еЉЎе’Њдє¤д»е†…е®№гЂ‚",
        "dashboard.noProjectsFound": "жњЄж‰ѕе€°йЎ№з›®",
        "dashboard.noProjectsFoundText": "е°ќиЇ•е…¶д»–жђњзґўж€–з­›йЂ‰жќЎд»¶пјЊж€–иЂ…е€›е»єдёЂдёЄж–°йЎ№з›®гЂ‚",
        "dashboard.projectsUnavailable": "йЎ№з›®дёЌеЏЇз”Ё",
        "dashboard.preview": "йў„и§€жЁЎејЏпјљеЅ“е‰Ќе±•з¤єзљ„жЇеё¦жњ‰з¤єдѕ‹ж•°жЌ®зљ„д»ЄиЎЁз›ж ·ејЏгЂ‚",
        "dashboard.previewProject1Name": "е­¦жњџйЎ№з›®и§„е€’е™Ё",
        "dashboard.previewProject1Description": "и·џиёЄжњ¬е­¦жњџзљ„й‡ЊзЁ‹зў‘гЂЃдЅњдёље’Њж€Єж­ўж—ҐжњџгЂ‚",
        "dashboard.previewProject2Name": "з”Ёж€·дЅ“йЄЊз ”з©¶зњ‹жќї",
        "dashboard.previewProject2Description": "ж”¶й›†и®їи°€и®°еЅ•гЂЃеЏЇз”ЁжЂ§еЏЌй¦€е’Њиї­д»Јжѓіжі•гЂ‚",
        "dashboard.previewProject3Name": "е‰Ќз«Їе±•з¤є",
        "dashboard.previewProject3Description": "дёЂдёЄз”ЁдєЋењЁжІЎжњ‰еђЋз«Їж•°жЌ®ж—¶йў„и§€д»ЄиЎЁз›ж ·ејЏзљ„з¤єдѕ‹йЎ№з›®гЂ‚",
        "dashboard.previewProjectCreated": "йў„и§€йЎ№з›®е€›е»єж€ђеЉџгЂ‚",
        "dashboard.projectCreated": "йЎ№з›®е€›е»єж€ђеЉџгЂ‚",
        "dashboard.projectCreateFailed": "е€›е»єйЎ№з›®е¤±иґҐгЂ‚",
        "dashboard.projectModalTitle": "е€›е»єж–°йЎ№з›®",
        "dashboard.projectModalSubtitle": "е°†ж–°йЎ№з›®ж·»еЉ е€°дЅ зљ„д»ЄиЎЁз›гЂ‚",
        "dashboard.projectName": "йЎ№з›®еђЌз§°",
        "dashboard.projectNamePlaceholder": "Semester Project Planner",
        "dashboard.projectDescription": "жЏЏиї°",
        "dashboard.projectDescriptionPlaceholder": "з®Ђи¦ЃжЏЏиї°иЇҐйЎ№з›®зљ„з›®ж ‡",
        "dashboard.cancel": "еЏ–ж¶€",
        "dashboard.projectSubmit": "е€›е»єйЎ№з›®",
        "dashboard.projectSubmitting": "е€›е»єдё­...",
        "dashboard.validation.projectRequired": "иЇ·иѕ“е…ҐйЎ№з›®еђЌз§°гЂ‚",
        "dashboard.validation.projectShort": "йЎ№з›®еђЌз§°и‡іе°‘йњЂи¦Ѓ 2 дёЄе­—з¬¦гЂ‚",
        "dashboard.validation.projectDescriptionLong": "жЏЏиї°дёЌиѓЅи¶…иї‡ 500 дёЄе­—з¬¦гЂ‚",
        "dashboard.validation.fix": "иЇ·дї®ж­ЈиЎЁеЌ•й”™иЇЇеђЋй‡ЌиЇ•гЂ‚",
        "projects.pageTag": "йЎ№з›®",
        "projects.topbarLabel": "ењЁеѕ…ејЂе§‹гЂЃиї›иЎЊдё­е’Ње·Іе®Њж€ђзљ„е·ҐдЅњд№‹й—ґи·џиёЄйЎ№з›®жµЃзЁ‹гЂ‚",
        "projects.title": "йЎ№з›®зњ‹жќї",
        "projects.subtitle": "дёЂдёЄзњ‹жќїејЏи§†е›ѕпјЊз”ЁжќҐе†іе®љжЋҐдё‹жќҐи¦ЃејЂе§‹д»Ђд№€гЂЃеЅ“е‰ЌењЁжЋЁиї›д»Ђд№€гЂЃд»ҐеЏЉд»Ђд№€е·Із»Џе®Њж€ђгЂ‚",
        "projects.boardMode": "зњ‹жќїжЁЎејЏ",
        "projects.boardModeName": "йЎ№з›®жµЃзЁ‹",
        "projects.boardModeText": "ж‰“ејЂд»»ж„ЏйЎ№з›®еЌЎз‰‡д»Ґз»§з»­иї›е…Ґд»»еЉЎи§†е›ѕгЂ‚",
        "projects.kanbanTag": "зњ‹жќї",
        "projects.flowTitle": "йЎ№з›®жµЃ",
        "projects.flowSubtitle": "жЇЏдёЂе€—жЊ‰еЅ“е‰Ќдє¤д»й¶ж®µеЇ№йЎ№з›®иї›иЎЊе€†з»„гЂ‚",
        "projects.preview": "йў„и§€жЁЎејЏпјљеЅ“е‰Ќе±•з¤єзљ„жЇеё¦жњ‰з¤єдѕ‹ж•°жЌ®зљ„йЎ№з›®зњ‹жќїгЂ‚",
        "projects.previewProject1Name": "е­¦жњџйЎ№з›®и§„е€’е™Ё",
        "projects.previewProject1Description": "ењЁе®ћзЋ°ејЂе§‹е‰Ќи§„е€’й‡ЊзЁ‹зў‘гЂЃж€Єж­ўж—¶й—ґе’ЊеЏ‘еёѓйЎєеєЏгЂ‚",
        "projects.previewProject2Name": "з ”з©¶еЌЏдЅњдё­еїѓ",
        "projects.previewProject2Description": "еЌЏи°ѓе›ўйџдё­зљ„йЎ№з›®ж›ґж–°гЂЃдјљи®®и®°еЅ•е’Ње…±дє«еЏЌй¦€гЂ‚",
        "projects.previewProject3Name": "е‰Ќз«Їе±•з¤є",
        "projects.previewProject3Description": "дёЂдёЄе·Іе®Њж€ђгЂЃеЏЇз”ЁдєЋе±•з¤єжњЂж–°з•Њйќўиї­д»Јж€ђжћњзљ„йЎ№з›®гЂ‚",
        "projects.loadingText": "ж­ЈењЁе‡†е¤‡дЅ зљ„йЎ№з›®зњ‹жќїгЂ‚",
        "projects.emptyColumn": "жІЎжњ‰йЎ№з›®",
        "projects.emptyColumnText": "еЅ“е‰ЌжІЎжњ‰йЎ№з›®е€†й…Ќе€°иї™дёЂе€—гЂ‚",
        "projects.startNext": "жЋҐдё‹жќҐејЂе§‹",
        "projects.startNextCaption": "жЋ’йџдё­гЂЃи§„е€’дё­д»ҐеЏЉдё‹дёЂж­Ґи¦ЃеЃљзљ„е·ҐдЅњгЂ‚",
        "projects.inProgress": "иї›иЎЊдё­",
        "projects.inProgressCaption": "еЅ“е‰Ќж­ЈењЁжЋЁиї›е’ЊиЇ„е®Ўзљ„е·ҐдЅњгЂ‚",
        "projects.done": "е·Іе®Њж€ђ",
        "projects.doneCaption": "е·Іе®Њж€ђе№¶еЏЇдѕ›еЏ‚иЂѓзљ„е·ҐдЅњгЂ‚",
        "tasks.pageTag": "д»»еЉЎ",
        "tasks.topbarLabel": "ж‰ЂйЂ‰йЎ№з›®зљ„д»»еЉЎзє§и§†е›ѕгЂ‚",
        "tasks.title": "д»»еЉЎе·ҐдЅњеЊє",
        "tasks.subtitleDefault": "д»ЋйЎ№з›®зњ‹жќїдё­ж‰“ејЂдёЂдёЄйЎ№з›®д»Ґз»§з»­е…¶д»»еЉЎжµЃзЁ‹гЂ‚",
        "tasks.selectedProject": "е·ІйЂ‰йЎ№з›®",
        "tasks.noProject": "жњЄйЂ‰ж‹©йЎ№з›®",
        "tasks.noProjectMeta": "д»ЋйЎ№з›®зњ‹жќїдё­йЂ‰ж‹©дёЂдёЄйЎ№з›®еЌЎз‰‡д»ҐжџҐзњ‹д»»еЉЎдёЉдё‹ж–‡гЂ‚",
        "tasks.sectionTag": "д»»еЉЎ",
        "tasks.sectionTitle": "д»»еЉЎзњ‹жќїеЌ дЅЌеЊє",
        "tasks.sectionSubtitle": "ж­¤йЎµйќўе·Іе‡†е¤‡еҐЅдЅњдёєйЎ№з›®еЌЎз‰‡зљ„еЇји€Єз›®ж ‡гЂ‚",
        "tasks.detailText": "ж‰ЂйЂ‰йЎ№з›®зљ„дёЉдё‹ж–‡жќҐи‡ЄйЎ№з›®зњ‹жќїгЂ‚иї™дїќиЇЃдє†еЅ“е‰Ќз‚№е‡»и·іиЅ¬жµЃзЁ‹еЏЇз”ЁпјЊе№¶дёєеђЋз»­ж›ґе®Њж•ґзљ„д»»еЉЎзњ‹жќїйў„з•™з©єй—ґгЂ‚",
        "tasks.subtitleProject": "з»§з»­дёє {projectName} и§„е€’е’ЊжЋЁиї›е·ҐдЅњгЂ‚",
        "settings.pageTag": "и®ѕзЅ®",
        "settings.topbarLabel": "з®Ўзђ†дЅ зљ„дёЄдєєиµ„ж–™гЂЃиґ¦ж€·ж“ЌдЅње’Ње¤–и§‚еЃЏеҐЅгЂ‚",
        "settings.title": "е·ҐдЅњеЊєи®ѕзЅ®",
        "settings.subtitle": "и°ѓж•ґд»…ењЁе‰Ќз«Їдїќе­зљ„дёЄдєєиµ„ж–™иЎЁеЌ•е’Ње¤–и§‚еЃЏеҐЅгЂ‚",
        "settings.stateLabel": "жњ¬ењ°зЉ¶жЂЃ",
        "settings.stateName": "е‰Ќз«Їе­е‚Ё",
        "settings.stateText": "дёЄдєєиµ„ж–™дї®ж”№д»…дїќе­ењЁжњ¬ењ°зЉ¶жЂЃдё­пјЊдёЌдјљеЏ‘йЂЃе€°еђЋз«ЇгЂ‚",
        "settings.sectionTag": "еЃЏеҐЅ",
        "settings.sectionTitle": "и®ѕзЅ®иЎЁеЌ•",
        "settings.sectionSubtitle": "ж›ґж–°жњ¬ењ°иµ„ж–™иѕ“е…ҐгЂЃиґ¦ж€·ж“ЌдЅње’Ње¤–и§‚жЋ§е€¶гЂ‚",
        "settings.profileTitle": "дёЄдєєиµ„ж–™",
        "settings.profileText": "ењЁжњ¬ењ°е‰Ќз«ЇзЉ¶жЂЃдё­зј–иѕ‘дЅ зљ„е§“еђЌе’Њй‚®з®±гЂ‚",
        "settings.name": "е§“еђЌ",
        "settings.namePlaceholder": "Regular User",
        "settings.email": "й‚®з®±",
        "settings.emailPlaceholder": "student@example.com",
        "settings.accountTitle": "иґ¦ж€·",
        "settings.accountText": "иї™й‡Њзљ„иґ¦ж€·е®‰е…Ёж“ЌдЅњд»…дЅњдёєе‰Ќз«Їдє¤дє’е±•з¤єгЂ‚",
        "settings.changePassword": "дї®ж”№еЇ†з Ѓ",
        "settings.changePasswordHint": "еЅ“е‰Ќе‰Ќз«Їи§†е›ѕдё­зљ„дї®ж”№еЇ†з ЃеЉџиѓЅжњЄиїћжЋҐеђЋз«ЇгЂ‚",
        "settings.accountHint": "иї™дёЄжЊ‰й’®еЏЄжЇе‰Ќз«ЇеЌ дЅЌпјЊдёЌдјљеЏ‘йЂЃеђЋз«ЇиЇ·ж±‚гЂ‚",
        "settings.notificationsTitle": "йЂљзџҐеЃЏеҐЅ",
        "settings.notificationsText": "йЂ‰ж‹©ењЁж­¤и®ѕе¤‡дёЉдїќз•™еђЇз”Ёзљ„жЏђй†’ж–№ејЏгЂ‚",
        "settings.emailNotifications": "й‚®д»¶йЂљзџҐ",
        "settings.browserNotifications": "жµЏи§€е™ЁйЂљзџҐ",
        "settings.toggleOn": "ејЂеђЇ",
        "settings.toggleOff": "е…ій—­",
        "settings.appearanceTitle": "е¤–и§‚",
        "settings.appearanceText": "ењЁжµ…и‰Іе’Њж·±и‰ІжЁЎејЏд№‹й—ґе€‡жЌўпјЊе№¶е°†йЂ‰ж‹©дїќе­ењЁжњ¬ењ°зЉ¶жЂЃдё­гЂ‚",
        "settings.themeSwitchLabel": "дё»йў",
        "settings.appearanceHint": "ж‰ЂйЂ‰жЁЎејЏдјљеђЊж­Ґе€°йЎ¶йѓЁж Џдё»йўжЋ§е€¶гЂ‚",
        "settings.displayTitle": "жѕз¤єеЃЏеҐЅ",
        "settings.displayText": "йЂ‰ж‹©ж­¤и®ѕе¤‡дёЉйЎ№з›®йЎµйќўй»и®¤ж‰“ејЂзљ„и§†е›ѕгЂ‚",
        "settings.defaultProjectView": "й»и®¤йЎ№з›®и§†е›ѕ",
        "settings.viewGrid": "зЅ‘ж ј",
        "settings.viewList": "е€—иЎЁ",
        "settings.dangerTitle": "й‡ЌзЅ®дёЋжё…й™¤",
        "settings.dangerText": "з§»й™¤ж­¤жµЏи§€е™Ёдё­жњ¬ењ°дїќе­зљ„еЃЏеҐЅи®ѕзЅ®е’ЊдјљиЇќж•°жЌ®гЂ‚",
        "settings.clearLocalData": "жё…й™¤ж‰Ђжњ‰жњ¬ењ°ж•°жЌ®",
        "status.planning": "и§„е€’дё­",
        "status.active": "иї›иЎЊдё­",
        "status.inReview": "иЇ„е®Ўдё­",
        "status.done": "е·Іе®Њж€ђ",
        "common.you": "дЅ ",
        "common.unavailable": "дёЌеЏЇз”Ё",
        "common.tasksCount": "{count} дёЄд»»еЉЎ",
        "common.tasksCompletedCounter": "е·Іе®Њж€ђ {total} дёЄд»»еЉЎдё­зљ„ {completed} дёЄ",
        "common.createdRecently": "жњЂиї‘е€›е»є",
        "common.createdDate": "е€›е»єдєЋ {date}",
        "common.noTasksYet": "иїжІЎжњ‰д»»еЉЎ",
        "auth.sessionExpired": "з™»еЅ•е·Іиї‡жњџпјЊиЇ·й‡Ќж–°з™»еЅ•гЂ‚"
    },
    es: {
        "language.english": "English",
        "language.chinese": "дё­ж–‡",
        "language.spanish": "EspaГ±ol",
        "language.current": "Idioma: {language}",
        "login.title": "Iniciar sesiГіn",
        "login.subtitle": "Una plataforma para gestionar proyectos y tareas.",
        "login.email": "Correo electrГіnico",
        "login.emailPlaceholder": "student@example.com",
        "login.password": "ContraseГ±a",
        "login.passwordPlaceholder": "Introduce tu contraseГ±a",
        "login.submit": "Iniciar sesiГіn",
        "login.submitting": "Iniciando sesiГіn...",
        "login.noAccount": "ВїNo tienes cuenta?",
        "login.signUpLink": "Registrarse",
        "login.success": "Inicio de sesiГіn correcto. Redirigiendo al panel...",
        "login.failed": "Error al iniciar sesiГіn.",
        "login.failedDefault": "Error al iniciar sesiГіn. Revisa tus credenciales o el estado del servidor.",
        "login.validation.fix": "Corrige los errores del formulario e intГ©ntalo de nuevo.",
        "login.validation.emailRequired": "El correo es obligatorio.",
        "login.validation.emailInvalid": "Introduce un correo vГЎlido.",
        "login.validation.passwordRequired": "La contraseГ±a es obligatoria.",
        "login.validation.passwordShort": "La contraseГ±a debe tener al menos 6 caracteres.",
        "signup.title": "Crear cuenta",
        "signup.subtitle": "Crea tu cuenta para empezar a gestionar proyectos y tareas.",
        "signup.name": "Nombre completo",
        "signup.namePlaceholder": "Regular User",
        "signup.email": "Correo electrГіnico",
        "signup.emailPlaceholder": "student@example.com",
        "signup.password": "ContraseГ±a",
        "signup.passwordPlaceholder": "Crea una contraseГ±a",
        "signup.confirmPassword": "Confirmar contraseГ±a",
        "signup.confirmPasswordPlaceholder": "Repite tu contraseГ±a",
        "signup.submit": "Registrarse",
        "signup.submitting": "Creando cuenta...",
        "signup.haveAccount": "ВїYa tienes cuenta?",
        "signup.loginLink": "Iniciar sesiГіn",
        "signup.success": "Cuenta creada correctamente. Redirigiendo a la pГЎgina de inicio de sesiГіn...",
        "signup.failed": "Error al registrarse.",
        "signup.failedDefault": "Error al registrarse. Revisa los datos o el estado del servidor.",
        "signup.validation.fix": "Corrige los errores del formulario e intГ©ntalo de nuevo.",
        "signup.validation.nameRequired": "El nombre completo es obligatorio.",
        "signup.validation.nameShort": "El nombre completo debe tener al menos 2 caracteres.",
        "signup.validation.emailRequired": "El correo es obligatorio.",
        "signup.validation.emailInvalid": "Introduce un correo vГЎlido.",
        "signup.validation.passwordRequired": "La contraseГ±a es obligatoria.",
        "signup.validation.passwordShort": "La contraseГ±a debe tener al menos 6 caracteres.",
        "signup.validation.confirmRequired": "Confirma tu contraseГ±a.",
        "signup.validation.confirmMismatch": "Las contraseГ±as no coinciden.",
        "sidebar.workspace": "Espacio de proyectos",
        "sidebar.dashboard": "Panel",
        "sidebar.projects": "Proyectos",
        "sidebar.tasks": "Tareas",
        "sidebar.settings": "ConfiguraciГіn",
        "sidebar.signedInAs": "SesiГіn iniciada como",
        "sidebar.logout": "Cerrar sesiГіn",
        "theme.dark": "Modo oscuro",
        "theme.light": "Modo claro",
        "theme.toDark": "Cambiar a modo oscuro",
        "theme.toLight": "Cambiar a modo claro",
        "dashboard.topbarTag": "Espacio de trabajo",
        "dashboard.topbarLabel": "NavegaciГіn, proyectos y controles de cuenta en un solo lugar.",
        "dashboard.greetingMorning": "Buenos d\u00edas, {name}",
        "dashboard.greetingMorningFallback": "Buenos d\u00edas",
        "dashboard.title": "Panel de proyectos",
        "dashboard.subtitle": "Un espacio enfocado para seguir proyectos, planificar trabajo nuevo y mantener todo organizado.",
        "dashboard.currentView": "Vista actual",
        "dashboard.currentViewName": "Resumen del panel",
        "dashboard.currentViewText": "Revisa los proyectos activos y crea un nuevo espacio cuando lo necesites.",
        "dashboard.createProject": "Crear nuevo proyecto",
        "dashboard.projectsTag": "Proyectos",
        "dashboard.projectsTitle": "Mis proyectos",
        "dashboard.projectsSubtitle": "MantГ©n los proyectos visibles, organizados y fГЎciles de revisar.",
        "dashboard.search": "Buscar",
        "dashboard.sort": "Ordenar",
        "dashboard.sortNewest": "MГЎs recientes primero",
        "dashboard.sortOldest": "MГЎs antiguos primero",
        "dashboard.sortAZ": "A-Z",
        "dashboard.searchPlaceholder": "Buscar proyectos",
        "dashboard.filter.all": "Todos",
        "dashboard.filter.active": "Activos",
        "dashboard.filter.inReview": "En revisiГіn",
        "dashboard.filter.planning": "PlanificaciГіn",
        "dashboard.loadingTitle": "Cargando proyectos...",
        "dashboard.loadingText": "Obteniendo tu espacio de trabajo.",
        "dashboard.noProjects": "AГєn no hay proyectos",
        "dashboard.noProjectsText": "Crea tu primer proyecto para empezar a organizar tareas y entregables.",
        "dashboard.noProjectsFound": "No se encontraron proyectos",
        "dashboard.noProjectsFoundText": "Prueba otra bГєsqueda o filtro, o crea un proyecto nuevo.",
        "dashboard.projectsUnavailable": "Proyectos no disponibles",
        "dashboard.preview": "Modo de vista previa: se muestra el estilo del panel con datos de demostraciГіn.",
        "dashboard.previewProject1Name": "Planificador del proyecto semestral",
        "dashboard.previewProject1Description": "Sigue hitos, tareas y fechas limite del trimestre actual.",
        "dashboard.previewProject2Name": "Tablero de investigacion UX",
        "dashboard.previewProject2Description": "Reune notas de entrevistas, comentarios de usabilidad e ideas de iteracion.",
        "dashboard.previewProject3Name": "Vitrina frontend",
        "dashboard.previewProject3Description": "Un proyecto de vista previa visual para revisar el estilo del panel sin datos del backend.",
        "dashboard.previewProjectCreated": "Proyecto de vista previa creado correctamente.",
        "dashboard.projectCreated": "Proyecto creado correctamente.",
        "dashboard.projectCreateFailed": "No se pudo crear el proyecto.",
        "dashboard.projectModalTitle": "Crear nuevo proyecto",
        "dashboard.projectModalSubtitle": "AГ±ade un nuevo proyecto a tu panel.",
        "dashboard.projectName": "Nombre del proyecto",
        "dashboard.projectNamePlaceholder": "Semester Project Planner",
        "dashboard.projectDescription": "DescripciГіn",
        "dashboard.projectDescriptionPlaceholder": "Describe brevemente el objetivo de este proyecto",
        "dashboard.cancel": "Cancelar",
        "dashboard.projectSubmit": "Crear proyecto",
        "dashboard.projectSubmitting": "Creando...",
        "dashboard.validation.projectRequired": "El nombre del proyecto es obligatorio.",
        "dashboard.validation.projectShort": "El nombre del proyecto debe tener al menos 2 caracteres.",
        "dashboard.validation.projectDescriptionLong": "La descripciГіn debe tener 500 caracteres o menos.",
        "dashboard.validation.fix": "Corrige los errores del formulario e intГ©ntalo de nuevo.",
        "projects.pageTag": "Proyectos",
        "projects.topbarLabel": "Sigue tu flujo de trabajo entre prГіximos pasos, trabajo activo y completado.",
        "projects.title": "Tablero de proyectos",
        "projects.subtitle": "Una vista tipo kanban para decidir quГ© empezar despuГ©s, quГ© estГЎ en marcha y quГ© ya se completГі.",
        "projects.boardMode": "Modo tablero",
        "projects.boardModeName": "Flujo de proyectos",
        "projects.boardModeText": "Abre cualquier tarjeta de proyecto para continuar en la vista de tareas.",
        "projects.kanbanTag": "Board",
        "projects.flowTitle": "Flujo del proyecto",
        "projects.flowSubtitle": "Cada columna agrupa proyectos por su fase actual.",
        "projects.preview": "Modo de vista previa: el tablero de proyectos se muestra con datos de demostraciГіn.",
        "projects.previewProject1Name": "Planificador del proyecto semestral",
        "projects.previewProject1Description": "Planifica hitos, fechas limite y orden de lanzamientos antes de empezar la implementacion.",
        "projects.previewProject2Name": "Centro de colaboracion de investigacion",
        "projects.previewProject2Description": "Coordina actualizaciones activas del proyecto, notas de reuniones y comentarios compartidos del equipo.",
        "projects.previewProject3Name": "Vitrina frontend",
        "projects.previewProject3Description": "Proyecto completado y listo para presentacion para revisar la ultima iteracion de la interfaz.",
        "projects.loadingText": "Preparando tu tablero kanban.",
        "projects.emptyColumn": "Sin proyectos",
        "projects.emptyColumnText": "No hay proyectos asignados a esta columna.",
        "projects.startNext": "Empezar despuГ©s",
        "projects.startNextCaption": "Trabajo en cola, planificaciГіn y siguiente en la lista.",
        "projects.inProgress": "En progreso",
        "projects.inProgressCaption": "Trabajo activo y revisiГіn en este momento.",
        "projects.done": "Hecho",
        "projects.doneCaption": "Trabajo completado y listo para consulta.",
        "tasks.pageTag": "Tareas",
        "tasks.topbarLabel": "Vista de tareas para el proyecto seleccionado.",
        "tasks.title": "Espacio de tareas",
        "tasks.subtitleDefault": "Abre un proyecto desde el tablero para continuar con su flujo de tareas.",
        "tasks.selectedProject": "Proyecto seleccionado",
        "tasks.noProject": "NingГєn proyecto seleccionado",
        "tasks.noProjectMeta": "Elige una tarjeta del tablero para ver el contexto de tareas.",
        "tasks.sectionTag": "Tareas",
        "tasks.sectionTitle": "Marcador de tablero de tareas",
        "tasks.sectionSubtitle": "Esta pГЎgina estГЎ lista como destino de navegaciГіn para las tarjetas de proyecto.",
        "tasks.detailText": "El contexto del proyecto seleccionado se carga desde el tablero de proyectos. Esto mantiene el flujo actual y deja espacio para un tablero de tareas mГЎs completo mГЎs adelante.",
        "tasks.subtitleProject": "ContinГєa planificando y ejecutando para {projectName}.",
        "settings.pageTag": "ConfiguraciГіn",
        "settings.topbarLabel": "Gestiona los datos de tu perfil, acciones de cuenta y preferencias de apariencia.",
        "settings.title": "ConfiguraciГіn del espacio",
        "settings.subtitle": "Ajusta el formulario de perfil y las preferencias de apariencia guardadas solo en este dispositivo.",
        "settings.stateLabel": "Estado local",
        "settings.stateName": "Store frontend",
        "settings.stateText": "Los cambios del perfil se guardan solo en el estado local. No se envГ­a ninguna actualizaciГіn al backend.",
        "settings.sectionTag": "Preferencias",
        "settings.sectionTitle": "Formulario de configuraciГіn",
        "settings.sectionSubtitle": "Actualiza entradas locales de perfil, acciones de cuenta y controles de apariencia.",
        "settings.profileTitle": "Perfil",
        "settings.profileText": "Edita tu nombre y correo en el estado local del frontend.",
        "settings.name": "Nombre",
        "settings.namePlaceholder": "Regular User",
        "settings.email": "Correo electrГіnico",
        "settings.emailPlaceholder": "student@example.com",
        "settings.accountTitle": "Cuenta",
        "settings.accountText": "Las acciones de seguridad de la cuenta estГЎn disponibles aquГ­ como interacciones solo de frontend.",
        "settings.changePassword": "Cambiar contraseГ±a",
        "settings.changePasswordHint": "El cambio de contraseГ±a no estГЎ conectado al backend en esta vista solo de frontend.",
        "settings.accountHint": "Este botГіn es un marcador frontend y no envГ­a ninguna solicitud al backend.",
        "settings.notificationsTitle": "Preferencias de notificaciones",
        "settings.notificationsText": "Elige quГ© alertas permanecen activas en este dispositivo.",
        "settings.emailNotifications": "Notificaciones por correo",
        "settings.browserNotifications": "Notificaciones del navegador",
        "settings.toggleOn": "Activado",
        "settings.toggleOff": "Desactivado",
        "settings.appearanceTitle": "Apariencia",
        "settings.appearanceText": "Cambia entre modo claro y oscuro y guarda la elecciГіn en el estado local.",
        "settings.themeSwitchLabel": "Tema",
        "settings.appearanceHint": "El modo seleccionado tambiГ©n se sincroniza con el control de tema del encabezado.",
        "settings.displayTitle": "Preferencias de visualizaciГіn",
        "settings.displayText": "Elige cГіmo debe abrirse por defecto la pГЎgina de proyectos en este dispositivo.",
        "settings.defaultProjectView": "Vista predeterminada de proyectos",
        "settings.viewGrid": "CuadrГ­cula",
        "settings.viewList": "Lista",
        "settings.dangerTitle": "Restablecer y borrar",
        "settings.dangerText": "Elimina de este navegador todas las preferencias guardadas localmente y los datos de sesiГіn.",
        "settings.clearLocalData": "Borrar todos los datos locales",
        "status.planning": "PlanificaciГіn",
        "status.active": "Activo",
        "status.inReview": "En revisiГіn",
        "status.done": "Hecho",
        "common.you": "TГє",
        "common.unavailable": "No disponible",
        "common.tasksCount": "{count} tareas",
        "common.tasksCompletedCounter": "{completed} de {total} tareas completadas",
        "common.createdRecently": "Creado recientemente",
        "common.createdDate": "Creado {date}",
        "common.noTasksYet": "AГєn no hay tareas",
        "auth.sessionExpired": "Tu sesiГіn ha expirado. Inicia sesiГіn de nuevo."
    }
};
Object.assign(translations.en, {
    "app.title.login": "SPMP | Login",
    "app.title.signup": "SPMP | Sign Up",
    "app.title.dashboard": "SPMP | Dashboard",
    "app.title.projects": "SPMP | Projects",
    "app.title.tasks": "SPMP | Tasks",
    "app.title.settings": "SPMP | Settings",
    "app.aria.primaryNavigation": "Primary navigation",
    "app.aria.workspaceNavigation": "Workspace navigation",
    "app.aria.dashboardHome": "SPMP dashboard home",
    "app.aria.openNavigationMenu": "Open navigation menu",
    "app.aria.closeNavigationMenu": "Close navigation menu",
    "app.aria.projectViewMode": "Project view mode",
    "app.aria.projectSearchFilters": "Project search and filters",
    "app.aria.projectStatusFilters": "Filter projects by status",
    "app.aria.dailyGreeting": "Daily greeting",
    "app.brand.workspace": "Project workspace",
    "app.password.show": "Show",
    "app.password.hide": "Hide",
    "dashboard.closeProjectDialog": "Close create project dialog",
    "dashboard.projectFallbackDescription": "No description yet.",
    "dashboard.projectsLoadFailed": "Failed to load projects. Please refresh the page.",
    "dashboard.greetingAfternoonFallback": "Good afternoon",
    "dashboard.greetingEveningFallback": "Good evening",
    "dashboard.greetingNightFallback": "Good night",
    "dashboard.statisticsTag": "Statistics",
    "dashboard.statisticsTitle": "Dashboard Statistics",
    "dashboard.statisticsSubtitle": "A quick visual summary of project and task progress on this device.",
    "dashboard.projectStatusTitle": "Project Status",
    "dashboard.taskOverviewTitle": "Task Overview",
    "dashboard.projectStatusChartAriaLabel": "Project status chart",
    "dashboard.taskOverviewChartAriaLabel": "Task overview chart",
    "tasks.subtitleLocalProject": "Local task workflow for {projectName}.",
    "tasks.subtitleLocalDefault": "Create tasks locally and optionally attach them to a selected project.",
    "tasks.noProjectStatus": "No status",
    "tasks.noProjectContextSaved": "No project context saved yet. Open a project card from Projects or choose one in the form.",
    "tasks.localStorageTag": "Local Tasks",
    "tasks.localBoardTitle": "Local Task Board",
    "tasks.localBoardSubtitle": "Your local task board saved on this device.",
    "tasks.storageOpenFailed": "Failed to open local task storage. Please refresh the page.",
    "tasks.addTask": "Add Task",
    "tasks.saveTask": "Save Task",
    "tasks.loadingTitle": "Loading tasks...",
    "tasks.loadingText": "Opening your saved local tasks.",
    "tasks.unavailableTitle": "Tasks unavailable",
    "tasks.modalSubtitle": "Create a task and save it locally on this device.",
    "tasks.closeTaskDialog": "Close add task dialog",
    "tasks.form.title": "Title",
    "tasks.form.titlePlaceholder": "Add a clear task title",
    "tasks.form.description": "Description",
    "tasks.form.descriptionPlaceholder": "Optional notes, links, or acceptance criteria",
    "tasks.form.status": "Status",
    "tasks.form.priority": "Priority",
    "tasks.form.dueDate": "Due Date",
    "tasks.form.dueDatePlaceholder": "YYYY-MM-DD",
    "tasks.form.project": "Project",
    "tasks.filters.priority": "Priority",
    "tasks.filters.status": "Status",
    "tasks.clearFilters": "Clear filters",
    "tasks.sort.label": "Sort",
    "tasks.sort.createdDesc": "Date created: newest first",
    "tasks.sort.createdAsc": "Date created: oldest first",
    "tasks.sort.dueAsc": "Due date: earliest first",
    "tasks.sort.dueDesc": "Due date: latest first",
    "tasks.sort.priorityDesc": "Priority: High to Low",
    "tasks.status.todo": "To-Do",
    "tasks.status.inProgress": "In Progress",
    "tasks.status.done": "Done",
    "tasks.column.todoCaption": "Planned work that still needs to start.",
    "tasks.column.inProgressCaption": "Tasks actively being worked on right now.",
    "tasks.column.doneCaption": "Completed tasks ready for review or reference.",
    "tasks.emptyColumnText": "Add a task to start filling this {column} column.",
    "tasks.form.noProjectOption": "No project",
    "tasks.validation.titleRequired": "Title is required.",
    "tasks.validation.invalidDueDate": "Use the due date format YYYY-MM-DD.",
    "tasks.message.saved": "Task saved locally.",
    "tasks.message.saveFailed": "Failed to save task locally. Please try again.",
    "tasks.message.deleted": "Task deleted locally.",
    "tasks.message.deleteFailed": "Failed to delete task locally. Please try again.",
    "tasks.message.statusUpdateFailed": "Failed to update task status locally. Please try again.",
    "tasks.card.noDescription": "No description provided.",
    "tasks.card.noDueDate": "No due date",
    "tasks.card.invalidDate": "Invalid date",
    "tasks.card.delete": "Delete",
    "tasks.card.projectLabel": "Project:",
    "tasks.card.dueLabel": "Due:",
    "tasks.priority.low": "Low",
    "tasks.priority.medium": "Medium",
    "tasks.priority.high": "High",
    "projects.viewGridAria": "Grid view",
    "projects.viewListAria": "List view",
    "status.todo": "To-Do",
    "common.loading": "Loading...",
    "common.percentComplete": "{percent}% complete",
    "common.tasksCompletedCounter": "{completed} of {total} tasks completed",
    "common.noTasksYet": "No tasks yet"
});
Object.assign(translations.zh, {
    "app.title.login": "SPMP | з™»еЅ•",
    "app.title.signup": "SPMP | жіЁе†Њ",
    "app.title.dashboard": "SPMP | д»ЄиЎЁз›",
    "app.title.projects": "SPMP | йЎ№з›®",
    "app.title.tasks": "SPMP | д»»еЉЎ",
    "app.title.settings": "SPMP | и®ѕзЅ®",
    "app.aria.primaryNavigation": "дё»еЇји€Є",
    "app.aria.workspaceNavigation": "е·ҐдЅњеЊєеЇји€Є",
    "app.aria.dashboardHome": "SPMP д»ЄиЎЁз›й¦–йЎµ",
    "app.aria.openNavigationMenu": "ж‰“ејЂеЇји€ЄиЏњеЌ•",
    "app.aria.closeNavigationMenu": "е…ій—­еЇји€ЄиЏњеЌ•",
    "app.aria.projectViewMode": "йЎ№з›®и§†е›ѕжЁЎејЏ",
    "app.aria.projectSearchFilters": "йЎ№з›®жђњзґўе’Њз­›йЂ‰",
    "app.aria.projectStatusFilters": "жЊ‰зЉ¶жЂЃз­›йЂ‰йЎ№з›®",
    "app.aria.dailyGreeting": "жЇЏж—Ґй—®еЂ™",
    "app.brand.workspace": "йЎ№з›®е·ҐдЅњеЊє",
    "app.password.show": "жѕз¤є",
    "app.password.hide": "йљђи—Џ",
    "notifications.close": "е…ій—­йЂљзџҐ",
    "dashboard.closeProjectDialog": "е…ій—­е€›е»єйЎ№з›®еЇ№иЇќжЎ†",
    "dashboard.projectFallbackDescription": "е°љж— жЏЏиї°гЂ‚",
    "dashboard.projectsLoadFailed": "еЉ иЅЅйЎ№з›®е¤±иґҐпјЊиЇ·е€·ж–°йЎµйќўгЂ‚",
    "dashboard.greetingAfternoonFallback": "дё‹еЌ€еҐЅ",
    "dashboard.greetingEveningFallback": "ж™љдёЉеҐЅ",
    "dashboard.greetingNightFallback": "е¤њж·±дє†",
    "dashboard.statisticsTag": "з»џи®Ў",
    "dashboard.statisticsTitle": "д»ЄиЎЁз›з»џи®Ў",
    "dashboard.statisticsSubtitle": "еї«йЂџжџҐзњ‹ж­¤и®ѕе¤‡дёЉзљ„йЎ№з›®дёЋд»»еЉЎиї›еє¦ж¦‚и§€гЂ‚",
    "dashboard.projectStatusTitle": "йЎ№з›®зЉ¶жЂЃ",
    "dashboard.taskOverviewTitle": "д»»еЉЎж¦‚и§€",
    "dashboard.projectStatusChartAriaLabel": "йЎ№з›®зЉ¶жЂЃе›ѕиЎЁ",
    "dashboard.taskOverviewChartAriaLabel": "д»»еЉЎж¦‚и§€е›ѕиЎЁ",
    "tasks.subtitleLocalProject": "{projectName} зљ„жњ¬ењ°д»»еЉЎжµЃзЁ‹гЂ‚",
    "tasks.subtitleLocalDefault": "ењЁжњ¬ењ°е€›е»єд»»еЉЎпјЊе№¶еЏЇйЂ‰ж‹©е…іиЃ”е€°еЅ“е‰ЌйЎ№з›®гЂ‚",
    "tasks.noProjectStatus": "ж— зЉ¶жЂЃ",
        "tasks.noProjectContextSaved": "е°љжњЄдїќе­йЎ№з›®дёЉдё‹ж–‡гЂ‚иЇ·д»ЋйЎ№з›®йЎµж‰“ејЂдёЂдёЄйЎ№з›®еЌЎз‰‡пјЊж€–ењЁиЎЁеЌ•дё­йЂ‰ж‹©йЎ№з›®гЂ‚",
        "tasks.localStorageTag": "жњ¬ењ°д»»еЉЎ",
        "tasks.localBoardTitle": "жњ¬ењ°д»»еЉЎзњ‹жќї",
        "tasks.localBoardSubtitle": "дЅ зљ„жњ¬ењ°д»»еЉЎдјљдїќе­ењЁиї™еЏ°и®ѕе¤‡дёЉгЂ‚",
    "tasks.storageOpenFailed": "ж‰“ејЂжњ¬ењ°д»»еЉЎе­е‚Ёе¤±иґҐпјЊиЇ·е€·ж–°йЎµйќўгЂ‚",
    "tasks.addTask": "ж·»еЉ д»»еЉЎ",
        "tasks.saveTask": "дїќе­д»»еЉЎ",
        "tasks.loadingTitle": "ж­ЈењЁеЉ иЅЅд»»еЉЎ...",
        "tasks.loadingText": "ж­ЈењЁж‰“ејЂдЅ дїќе­ењЁжњ¬ењ°зљ„д»»еЉЎгЂ‚",
        "tasks.unavailableTitle": "д»»еЉЎдёЌеЏЇз”Ё",
        "tasks.modalSubtitle": "е€›е»єд»»еЉЎе№¶е°†е…¶дїќе­ењЁиї™еЏ°и®ѕе¤‡дёЉгЂ‚",
    "tasks.closeTaskDialog": "е…ій—­ж·»еЉ д»»еЉЎеЇ№иЇќжЎ†",
    "tasks.form.title": "ж ‡йў",
    "tasks.form.titlePlaceholder": "иѕ“е…Ґжё…ж™°зљ„д»»еЉЎж ‡йў",
    "tasks.form.description": "жЏЏиї°",
    "tasks.form.descriptionPlaceholder": "еЏЇйЂ‰е¤‡жіЁгЂЃй“ѕжЋҐж€–йЄЊж”¶ж ‡е‡†",
    "tasks.form.status": "зЉ¶жЂЃ",
    "tasks.form.priority": "дје…€зє§",
    "tasks.form.dueDate": "ж€Єж­ўж—Ґжњџ",
    "tasks.form.dueDatePlaceholder": "YYYY-MM-DD",
    "tasks.form.project": "йЎ№з›®",
    "tasks.filters.priority": "дје…€зє§",
    "tasks.filters.status": "зЉ¶жЂЃ",
    "tasks.clearFilters": "жё…й™¤з­›йЂ‰",
    "tasks.sort.label": "жЋ’еєЏ",
    "tasks.sort.createdDesc": "е€›е»єж—¶й—ґпјљжњЂж–°ењЁе‰Ќ",
    "tasks.sort.createdAsc": "е€›е»єж—¶й—ґпјљжњЂж—§ењЁе‰Ќ",
    "tasks.sort.dueAsc": "ж€Єж­ўж—ҐжњџпјљжњЂж—©ењЁе‰Ќ",
    "tasks.sort.dueDesc": "ж€Єж­ўж—ҐжњџпјљжњЂж™љењЁе‰Ќ",
    "tasks.sort.priorityDesc": "дје…€зє§пјљй«е€°дЅЋ",
    "tasks.status.todo": "еѕ…еЉћ",
    "tasks.status.inProgress": "иї›иЎЊдё­",
    "tasks.status.done": "е·Іе®Њж€ђ",
    "tasks.column.todoCaption": "е°љжњЄејЂе§‹зљ„и®Ўе€’е·ҐдЅњгЂ‚",
    "tasks.column.inProgressCaption": "еЅ“е‰Ќж­ЈењЁжЋЁиї›зљ„д»»еЉЎгЂ‚",
    "tasks.column.doneCaption": "е·Іе®Њж€ђгЂЃеЏЇдѕ›жџҐзњ‹ж€–е¤Ќз”Ёзљ„д»»еЉЎгЂ‚",
    "tasks.emptyColumnText": "ж·»еЉ дёЂдёЄд»»еЉЎд»ҐејЂе§‹еЎ«е……вЂњ{column}вЂќе€—гЂ‚",
    "tasks.form.noProjectOption": "ж— йЎ№з›®",
    "tasks.validation.titleRequired": "ж ‡йўдёєеї…еЎ«йЎ№гЂ‚",
    "tasks.validation.invalidDueDate": "ж€Єж­ўж—ҐжњџиЇ·дЅїз”Ё YYYY-MM-DD ж јејЏгЂ‚",
    "tasks.message.saved": "д»»еЉЎе·Ідїќе­ењЁжњ¬ењ°гЂ‚",
    "tasks.message.saveFailed": "жњ¬ењ°дїќе­д»»еЉЎе¤±иґҐпјЊиЇ·й‡ЌиЇ•гЂ‚",
    "tasks.message.deleted": "д»»еЉЎе·Ід»Ћжњ¬ењ°е€ й™¤гЂ‚",
    "tasks.message.deleteFailed": "жњ¬ењ°е€ й™¤д»»еЉЎе¤±иґҐпјЊиЇ·й‡ЌиЇ•гЂ‚",
    "tasks.message.statusUpdateFailed": "жњ¬ењ°ж›ґж–°д»»еЉЎзЉ¶жЂЃе¤±иґҐпјЊиЇ·й‡ЌиЇ•гЂ‚",
    "tasks.card.noDescription": "жњЄжЏђдѕ›жЏЏиї°гЂ‚",
    "tasks.card.noDueDate": "ж— ж€Єж­ўж—Ґжњџ",
    "tasks.card.invalidDate": "ж—Ґжњџж— ж•€",
    "tasks.card.delete": "е€ й™¤",
    "tasks.card.projectLabel": "йЎ№з›®пјљ",
    "tasks.card.dueLabel": "ж€Єж­ўпјљ",
    "tasks.priority.low": "дЅЋ",
    "tasks.priority.medium": "дё­",
    "tasks.priority.high": "й«",
    "projects.viewGridAria": "зЅ‘ж ји§†е›ѕ",
    "projects.viewListAria": "е€—иЎЁи§†е›ѕ",
    "status.todo": "еѕ…еЉћ",
    "common.loading": "еЉ иЅЅдё­...",
    "common.percentComplete": "е·Іе®Њж€ђ {percent}%",
    "common.tasksCompletedCounter": "е·Іе®Њж€ђ {total} дёЄд»»еЉЎдё­зљ„ {completed} дёЄ",
    "common.noTasksYet": "иїжІЎжњ‰д»»еЉЎ"
});
Object.assign(translations.es, {
    "app.title.login": "SPMP | Iniciar sesiГіn",
    "app.title.signup": "SPMP | Registrarse",
    "app.title.dashboard": "SPMP | Panel",
    "app.title.projects": "SPMP | Proyectos",
    "app.title.tasks": "SPMP | Tareas",
    "app.title.settings": "SPMP | ConfiguraciГіn",
    "app.aria.primaryNavigation": "NavegaciГіn principal",
    "app.aria.workspaceNavigation": "NavegaciГіn del espacio de trabajo",
    "app.aria.dashboardHome": "Inicio del panel de SPMP",
    "app.aria.openNavigationMenu": "Abrir menГє de navegaciГіn",
    "app.aria.closeNavigationMenu": "Cerrar menГє de navegaciГіn",
    "app.aria.projectViewMode": "Modo de vista de proyectos",
    "app.aria.projectSearchFilters": "BГєsqueda y filtros de proyectos",
    "app.aria.projectStatusFilters": "Filtrar proyectos por estado",
    "app.aria.dailyGreeting": "Saludo diario",
    "app.brand.workspace": "Espacio de proyectos",
    "app.password.show": "Mostrar",
    "app.password.hide": "Ocultar",
    "notifications.close": "Cerrar notificaciones",
    "dashboard.closeProjectDialog": "Cerrar diГЎlogo de crear proyecto",
    "dashboard.projectFallbackDescription": "TodavГ­a no hay descripciГіn.",
    "dashboard.projectsLoadFailed": "No se pudieron cargar los proyectos. Actualiza la pГЎgina.",
    "dashboard.greetingAfternoonFallback": "Buenas tardes",
    "dashboard.greetingEveningFallback": "Buenas noches",
    "dashboard.greetingNightFallback": "Buenas noches",
    "dashboard.statisticsTag": "EstadГ­sticas",
    "dashboard.statisticsTitle": "EstadГ­sticas del panel",
    "dashboard.statisticsSubtitle": "Un resumen visual rГЎpido del progreso de proyectos y tareas en este dispositivo.",
    "dashboard.projectStatusTitle": "Estado del proyecto",
    "dashboard.taskOverviewTitle": "Resumen de tareas",
    "dashboard.projectStatusChartAriaLabel": "GrГЎfico del estado del proyecto",
    "dashboard.taskOverviewChartAriaLabel": "GrГЎfico de resumen de tareas",
    "tasks.subtitleLocalProject": "Flujo local de tareas para {projectName}.",
    "tasks.subtitleLocalDefault": "Crea tareas localmente y, si quieres, asГ­gnalas al proyecto seleccionado.",
    "tasks.noProjectStatus": "Sin estado",
        "tasks.noProjectContextSaved": "TodavГ­a no hay contexto de proyecto guardado. Abre una tarjeta desde Proyectos o elige uno en el formulario.",
        "tasks.localStorageTag": "Tareas locales",
        "tasks.localBoardTitle": "Tablero local de tareas",
        "tasks.localBoardSubtitle": "Tus tareas locales se guardan en este dispositivo.",
    "tasks.storageOpenFailed": "No se pudo abrir el almacenamiento local de tareas. Actualiza la pГЎgina.",
    "tasks.addTask": "AГ±adir tarea",
        "tasks.saveTask": "Guardar tarea",
        "tasks.loadingTitle": "Cargando tareas...",
        "tasks.loadingText": "Abriendo tus tareas guardadas localmente.",
        "tasks.unavailableTitle": "Tareas no disponibles",
        "tasks.modalSubtitle": "Crea una tarea y guГЎrdala localmente en este dispositivo.",
    "tasks.closeTaskDialog": "Cerrar diГЎlogo de aГ±adir tarea",
    "tasks.form.title": "TГ­tulo",
    "tasks.form.titlePlaceholder": "AГ±ade un tГ­tulo claro para la tarea",
    "tasks.form.description": "DescripciГіn",
    "tasks.form.descriptionPlaceholder": "Notas opcionales, enlaces o criterios de aceptaciГіn",
    "tasks.form.status": "Estado",
    "tasks.form.priority": "Prioridad",
    "tasks.form.dueDate": "Fecha lГ­mite",
    "tasks.form.dueDatePlaceholder": "YYYY-MM-DD",
    "tasks.form.project": "Proyecto",
    "tasks.filters.priority": "Prioridad",
    "tasks.filters.status": "Estado",
    "tasks.clearFilters": "Limpiar filtros",
    "tasks.sort.label": "Ordenar",
    "tasks.sort.createdDesc": "Fecha de creaciГіn: mГЎs recientes primero",
    "tasks.sort.createdAsc": "Fecha de creaciГіn: mГЎs antiguos primero",
    "tasks.sort.dueAsc": "Fecha lГ­mite: mГЎs prГіximas primero",
    "tasks.sort.dueDesc": "Fecha lГ­mite: mГЎs lejanas primero",
    "tasks.sort.priorityDesc": "Prioridad: Alta a Baja",
    "tasks.status.todo": "Por hacer",
    "tasks.status.inProgress": "En progreso",
    "tasks.status.done": "Hecho",
    "tasks.column.todoCaption": "Trabajo planificado que todavГ­a no ha comenzado.",
    "tasks.column.inProgressCaption": "Tareas en las que se estГЎ trabajando ahora mismo.",
    "tasks.column.doneCaption": "Tareas completadas listas para consulta o revisiГіn.",
    "tasks.emptyColumnText": "AГ±ade una tarea para empezar a llenar la columna {column}.",
    "tasks.form.noProjectOption": "Sin proyecto",
    "tasks.validation.titleRequired": "El tГ­tulo es obligatorio.",
    "tasks.validation.invalidDueDate": "Usa el formato de fecha YYYY-MM-DD.",
    "tasks.message.saved": "Tarea guardada localmente.",
    "tasks.message.saveFailed": "No se pudo guardar la tarea localmente. IntГ©ntalo de nuevo.",
    "tasks.message.deleted": "Tarea eliminada localmente.",
    "tasks.message.deleteFailed": "No se pudo eliminar la tarea localmente. IntГ©ntalo de nuevo.",
    "tasks.message.statusUpdateFailed": "No se pudo actualizar el estado de la tarea localmente. IntГ©ntalo de nuevo.",
    "tasks.card.noDescription": "No se proporcionГі descripciГіn.",
    "tasks.card.noDueDate": "Sin fecha lГ­mite",
    "tasks.card.invalidDate": "Fecha no vГЎlida",
    "tasks.card.delete": "Eliminar",
    "tasks.card.projectLabel": "Proyecto:",
    "tasks.card.dueLabel": "Vence:",
    "tasks.priority.low": "Baja",
    "tasks.priority.medium": "Media",
    "tasks.priority.high": "Alta",
    "projects.viewGridAria": "Vista de cuadrГ­cula",
    "projects.viewListAria": "Vista de lista",
    "status.todo": "Por hacer",
    "common.loading": "Cargando...",
    "common.percentComplete": "{percent}% completado",
    "common.tasksCompletedCounter": "{completed} de {total} tareas completadas",
    "common.noTasksYet": "AГєn no hay tareas"
});
Object.assign(translations.en, {
    "settings.profileSave": "Save Changes",
    "settings.passwordModalTitle": "Change Password",
    "settings.currentPassword": "Current Password",
    "settings.currentPasswordPlaceholder": "Enter your current password",
    "settings.newPassword": "New Password",
    "settings.newPasswordPlaceholder": "Enter a new password",
    "settings.confirmNewPassword": "Confirm New Password",
    "settings.confirmNewPasswordPlaceholder": "Re-enter the new password",
    "settings.passwordSave": "Save",
    "settings.profileConfirmTitle": "Confirm your identity",
    "settings.profileConfirmPassword": "Password",
    "settings.profileConfirmPasswordPlaceholder": "Enter your password",
    "settings.profileConfirmCancel": "Cancel",
    "settings.profileConfirmConfirm": "Confirm"
});
Object.assign(translations.zh, {
    "dashboard.greetingMorningFallback": "ж—©дёЉеҐЅ",
    "settings.profileSave": "дїќе­ж›ґж”№",
    "settings.passwordModalTitle": "дї®ж”№еЇ†з Ѓ",
    "settings.currentPassword": "еЅ“е‰ЌеЇ†з Ѓ",
    "settings.currentPasswordPlaceholder": "иѕ“е…ҐеЅ“е‰ЌеЇ†з Ѓ",
    "settings.newPassword": "ж–°еЇ†з Ѓ",
    "settings.newPasswordPlaceholder": "иѕ“е…Ґж–°еЇ†з Ѓ",
    "settings.confirmNewPassword": "зЎ®и®¤ж–°еЇ†з Ѓ",
    "settings.confirmNewPasswordPlaceholder": "е†Ќж¬Ўиѕ“е…Ґж–°еЇ†з Ѓ",
    "settings.passwordSave": "дїќе­",
    "settings.profileConfirmTitle": "зЎ®и®¤дЅ зљ„иє«д»Ѕ",
    "settings.profileConfirmPassword": "еЇ†з Ѓ",
    "settings.profileConfirmPasswordPlaceholder": "иѕ“е…ҐдЅ зљ„еЇ†з Ѓ",
    "settings.profileConfirmCancel": "еЏ–ж¶€",
    "settings.profileConfirmConfirm": "зЎ®и®¤"
});
Object.assign(translations.es, {
    "dashboard.greetingMorningFallback": "Buenos dГ­as",
    "settings.profileSave": "Guardar cambios",
    "settings.passwordModalTitle": "Cambiar contraseГ±a",
    "settings.currentPassword": "ContraseГ±a actual",
    "settings.currentPasswordPlaceholder": "Introduce tu contraseГ±a actual",
    "settings.newPassword": "Nueva contraseГ±a",
    "settings.newPasswordPlaceholder": "Introduce una nueva contraseГ±a",
    "settings.confirmNewPassword": "Confirmar nueva contraseГ±a",
    "settings.confirmNewPasswordPlaceholder": "Vuelve a introducir la nueva contraseГ±a",
    "settings.passwordSave": "Guardar",
    "settings.profileConfirmTitle": "Confirma tu identidad",
    "settings.profileConfirmPassword": "ContraseГ±a",
    "settings.profileConfirmPasswordPlaceholder": "Introduce tu contraseГ±a",
    "settings.profileConfirmCancel": "Cancelar",
    "settings.profileConfirmConfirm": "Confirmar"
});
Object.assign(translations.zh, {
    "notifications.buttonLabel": "йЂљзџҐ",
    "notifications.title": "йЂљзџҐ",
    "notifications.dismiss": "е…ій—­ж­¤жќЎйЂљзџҐ",
    "notifications.empty": "еЅ“е‰ЌжІЎжњ‰йЂљзџҐгЂ‚",
    "notifications.item1": "жЋе¤©дёЉеЌ€е·Іе®‰жЋ’и®ѕи®ЎиЇ„е®ЎгЂ‚",
    "notifications.item2": "Frontend Showcase йЎ№з›®ж–°еўћдє†дёЂжќЎиЇ„и®єгЂ‚",
    "notifications.item3": "дЅ зљ„е·ҐдЅњеЊєеЃЏеҐЅе·Ідїќе­ењЁж­¤и®ѕе¤‡дёЉгЂ‚"
});
Object.assign(translations.es, {
    "notifications.buttonLabel": "Notificaciones",
    "notifications.title": "Notificaciones",
    "notifications.dismiss": "Descartar notificaciГіn",
    "notifications.empty": "No hay notificaciones en este momento.",
    "notifications.item1": "Se ha programado una revisiГіn de diseГ±o para maГ±ana por la maГ±ana.",
    "notifications.item2": "Se aГ±adiГі un comentario nuevo al proyecto Frontend Showcase.",
    "notifications.item3": "Tus preferencias del espacio de trabajo se guardaron en este dispositivo."
});
Object.assign(translations.en, {
    "tasks.editTask": "Edit Task",
    "tasks.saveEdit": "Save Changes",
    "tasks.message.updated": "Task updated locally.",
    "tasks.card.edit": "Edit",
    "settings.profileConfirmIncorrectPassword": "Incorrect password"
});
Object.assign(translations.zh, {
    "tasks.editTask": "зј–иѕ‘д»»еЉЎ",
    "tasks.saveEdit": "дїќе­ж›ґж”№",
    "tasks.message.updated": "д»»еЉЎе·ІењЁжњ¬ењ°ж›ґж–°гЂ‚",
    "tasks.card.edit": "зј–иѕ‘",
    "settings.profileConfirmIncorrectPassword": "еЇ†з Ѓй”™иЇЇ"
});
Object.assign(translations.es, {
    "tasks.editTask": "Editar tarea",
    "tasks.saveEdit": "Guardar cambios",
    "tasks.message.updated": "Tarea actualizada localmente.",
    "tasks.card.edit": "Editar",
    "settings.profileConfirmIncorrectPassword": "ContraseГ±a incorrecta"
});
Object.assign(translations.zh, {
    "tasks.editTask": "\u7f16\u8f91\u4efb\u52a1",
    "tasks.saveEdit": "\u4fdd\u5b58\u66f4\u6539",
    "tasks.message.updated": "\u4efb\u52a1\u5df2\u5728\u672c\u5730\u66f4\u65b0\u3002",
    "tasks.card.edit": "\u7f16\u8f91"
});
Object.assign(translations.es, {
    "tasks.editTask": "Editar tarea",
    "tasks.saveEdit": "Guardar cambios",
    "tasks.message.updated": "Tarea actualizada localmente.",
    "tasks.card.edit": "Editar"
});
function createDefaultNotifications() {
    return DEFAULT_NOTIFICATIONS.map((notification) => ({ ...notification }));
}
function sanitizeNotificationState(value) {
    if (!Array.isArray(value)) {
        return createDefaultNotifications();
    }
    const fallbackById = new Map(DEFAULT_NOTIFICATIONS.map((notification) => [notification.id, notification]));
    return value
        .filter((item) => item && typeof item.id === "string")
        .map((item) => {
        const fallback = fallbackById.get(item.id);
        if (!fallback) {
            return null;
        }
        return {
            id: fallback.id,
            key: typeof item.key === "string" ? item.key : fallback.key,
            read: Boolean(item.read)
        };
    })
        .filter(Boolean);
}
function loadNotificationState() {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
        const defaults = createDefaultNotifications();
        saveNotificationState(defaults);
        return defaults;
    }
    try {
        const notifications = sanitizeNotificationState(JSON.parse(raw));
        saveNotificationState(notifications);
        return notifications;
    }
    catch (_error) {
        const defaults = createDefaultNotifications();
        saveNotificationState(defaults);
        return defaults;
    }
}
function saveNotificationState(notifications) {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
}
function getUnreadNotificationCount(notifications) {
    return Array.isArray(notifications) ? notifications.length : 0;
}
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
function buildNotificationItemsMarkup(notifications) {
    if (!notifications.length) {
        return `
      <article class="notification-item">
        <p>${escapeHtml(t("notifications.empty"))}</p>
      </article>
    `;
    }
    return notifications.map((notification) => `
      <article class="notification-item${notification.read ? "" : " is-unread"}" data-notification-id="${escapeHtml(notification.id)}">
        <p>${escapeHtml(t(notification.key))}</p>
        <button
          type="button"
          class="close-btn notification-item-dismiss"
          data-dismiss-notification="${escapeHtml(notification.id)}"
          aria-label="${escapeHtml(t("notifications.dismiss"))}"
          title="${escapeHtml(t("notifications.dismiss"))}"
        >&times;</button>
      </article>
    `).join("");
}
function dismissNotification(notificationId) {
    saveNotificationState(loadNotificationState().filter((notification) => notification.id !== notificationId));
}
function interpolate(template, values = {}) {
    return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
}
function getPreferredLanguage() {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "en" || stored === "zh" || stored === "es") {
        return stored;
    }
    const browserLanguage = navigator.language.toLowerCase();
    if (browserLanguage.startsWith("zh")) {
        return "zh";
    }
    if (browserLanguage.startsWith("es")) {
        return "es";
    }
    return DEFAULT_LANGUAGE;
}
function t(key, values) {
    const language = getLanguage();
    const dictionary = translations[language] || translations[DEFAULT_LANGUAGE];
    const template = dictionary[key] || translations[DEFAULT_LANGUAGE][key] || key;
    return interpolate(template, values);
}
function getLanguage() {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored === "en" || stored === "zh" || stored === "es" ? stored : DEFAULT_LANGUAGE;
}
function getLanguageOption(language) {
    return LANGUAGE_OPTIONS[language];
}
function readDynamicTranslationValues(raw) {
    if (!raw) {
        return undefined;
    }
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : undefined;
    }
    catch (_error) {
        return undefined;
    }
}
function applyDynamicTranslations(root = document) {
    const elements = root === document
        ? document.querySelectorAll("[data-i18n-dynamic-key]")
        : root.querySelectorAll("[data-i18n-dynamic-key]");
    elements.forEach((element) => {
        const key = element.dataset.i18nDynamicKey;
        if (!key) {
            return;
        }
        element.textContent = t(key, readDynamicTranslationValues(element.dataset.i18nDynamicValues || ""));
    });
}
function setDynamicTranslation(element, key, values) {
    if (!element) {
        return;
    }
    element.dataset.i18nDynamicKey = key;
    if (values && Object.keys(values).length > 0) {
        element.dataset.i18nDynamicValues = JSON.stringify(values);
    }
    else {
        delete element.dataset.i18nDynamicValues;
    }
    element.textContent = t(key, values);
}
function clearDynamicTranslation(element) {
    if (!element) {
        return;
    }
    delete element.dataset.i18nDynamicKey;
    delete element.dataset.i18nDynamicValues;
}
function applyTranslations(root = document) {
    if (root === document) {
        document.querySelectorAll("[data-i18n-document-title]").forEach((element) => {
            const key = element.dataset.i18nDocumentTitle;
            if (key) {
                element.textContent = t(key);
            }
        });
    }
    root.querySelectorAll("[data-i18n]").forEach((element) => {
        element.textContent = t(element.dataset.i18n || "");
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
        const key = element.dataset.i18nPlaceholder;
        if (key) {
            element.placeholder = t(key);
        }
    });
    root.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
        const key = element.dataset.i18nAriaLabel;
        if (key) {
            element.setAttribute("aria-label", t(key));
        }
    });
    root.querySelectorAll("[data-i18n-title]").forEach((element) => {
        const key = element.dataset.i18nTitle;
        if (key) {
            element.setAttribute("title", t(key));
        }
    });
    root.querySelectorAll(".language-input").forEach((input) => {
        input.value = getLanguage();
    });
    document.documentElement.lang = getLanguage() === "zh" ? "zh" : getLanguage();
    applyDynamicTranslations(root);
}
function updateSwitcherSelection() {
    const currentLanguage = getLanguage();
    document.querySelectorAll(".language-option").forEach((button) => {
        const language = button.dataset.language;
        if (language !== "en" && language !== "zh" && language !== "es") {
            return;
        }
        const option = getLanguageOption(language);
        const labelElement = button.querySelector(".language-option-label");
        const flagElement = button.querySelector(".language-option-flag");
        const isActive = language === currentLanguage;
        if (labelElement) {
            labelElement.textContent = option.label;
        }
        else {
            button.textContent = option.label;
        }
        if (flagElement) {
            flagElement.textContent = option.flag;
        }
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
        if (button.getAttribute("role") === "menuitemradio") {
            button.setAttribute("aria-checked", String(isActive));
        }
    });
    document.querySelectorAll(".language-switcher--dropdown").forEach((switcher) => {
        const option = getLanguageOption(currentLanguage);
        const currentFlag = switcher.querySelector(".language-switcher-current-flag");
        const currentLabel = switcher.querySelector(".language-switcher-current-label");
        const trigger = switcher.querySelector(".language-switcher-trigger");
        if (currentFlag) {
            currentFlag.textContent = option.flag;
        }
        if (currentLabel) {
            currentLabel.textContent = option.label;
        }
        if (trigger) {
            trigger.setAttribute("aria-label", t("language.current", { language: option.label }));
        }
    });
}
function refreshHtmxProjectsList() {
    const searchInput = document.getElementById("project-search-input");
    if (searchInput && window.htmx) {
        window.htmx.trigger(searchInput, "search");
    }
}
function refreshNotificationCenterTranslations() {
    document.querySelectorAll(".notification-center").forEach((center) => {
        renderNotificationCenter(center);
    });
}
function setLanguage(language) {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    applyTranslations();
    refreshNotificationCenterTranslations();
    updateSwitcherSelection();
    refreshHtmxProjectsList();
    document.dispatchEvent(new CustomEvent("app-language-change", { detail: { language } }));
}
function setLanguageMenuOpen(switcher, isOpen) {
    const trigger = switcher.querySelector(".language-switcher-trigger");
    const menu = switcher.querySelector(".language-switcher-menu");
    if (!trigger || !menu) {
        return;
    }
    switcher.classList.toggle("is-open", isOpen);
    trigger.setAttribute("aria-expanded", String(isOpen));
    menu.hidden = !isOpen;
}
function closeLanguageMenus() {
    document.querySelectorAll(".language-switcher--dropdown.is-open").forEach((switcher) => {
        setLanguageMenuOpen(switcher, false);
    });
}
function bindLanguageMenuEvents() {
    if (languageMenuEventsBound) {
        return;
    }
    document.addEventListener("click", (event) => {
        if (!(event.target instanceof Element) || !event.target.closest(".language-switcher--dropdown")) {
            closeLanguageMenus();
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeLanguageMenus();
        }
    });
    languageMenuEventsBound = true;
}
function upgradeExistingLanguageSwitcher(switcher) {
    if (!switcher || switcher.classList.contains("language-switcher--dropdown")) {
        return;
    }
    const buttons = Array.from(switcher.querySelectorAll(".language-option"));
    if (!buttons.length) {
        return;
    }
    const optionMarkup = buttons
        .map((button) => {
        const language = button.dataset.language;
        if (language !== "en" && language !== "zh" && language !== "es") {
            return "";
        }
        const option = getLanguageOption(language);
        return `
        <button type="button" class="language-option" role="menuitemradio" aria-checked="false" data-language="${language}">
          <span class="language-option-flag" aria-hidden="true">${option.flag}</span>
          <span class="language-option-label">${option.label}</span>
        </button>
      `;
    })
        .join("");
    switcher.classList.add("language-switcher--dropdown");
    switcher.innerHTML = `
    <button type="button" class="language-switcher-trigger" aria-haspopup="menu" aria-expanded="false">
      <span class="language-switcher-current">
        <span class="language-switcher-current-flag" aria-hidden="true"></span>
        <span class="language-switcher-current-label"></span>
      </span>
      <span class="language-switcher-caret" aria-hidden="true"></span>
    </button>
    <div class="language-switcher-menu" role="menu" hidden>
      ${optionMarkup}
    </div>
  `;
    switcher.querySelector(".language-switcher-trigger")?.addEventListener("click", () => {
        const shouldOpen = !switcher.classList.contains("is-open");
        closeLanguageMenus();
        setLanguageMenuOpen(switcher, shouldOpen);
    });
    switcher.querySelectorAll(".language-option").forEach((button) => {
        button.addEventListener("click", () => {
            const language = button.dataset.language;
            if (language === "en" || language === "zh" || language === "es") {
                setLanguage(language);
                setLanguageMenuOpen(switcher, false);
            }
        });
    });
    bindLanguageMenuEvents();
    updateSwitcherSelection();
}
function setNotificationCenterOpen(center, isOpen) {
    const trigger = center.querySelector(".notification-center-trigger");
    const panel = center.querySelector(".notification-center-panel");
    if (!trigger || !panel) {
        return;
    }
    center.classList.toggle("is-open", isOpen);
    trigger.setAttribute("aria-expanded", String(isOpen));
    panel.hidden = !isOpen;
}
function renderNotificationCenter(center) {
    if (!center) {
        return;
    }
    const notifications = loadNotificationState();
    const unreadCount = getUnreadNotificationCount(notifications);
    const trigger = center.querySelector(".notification-center-trigger");
    const triggerLabel = center.querySelector(".notification-center-label");
    const panel = center.querySelector(".notification-center-panel");
    const titleElement = center.querySelector(".notification-center-header strong");
    const closeButton = center.querySelector(".notification-center-close");
    const badge = center.querySelector(".notification-badge");
    const countElement = center.querySelector(".notification-center-count");
    const list = center.querySelector(".notification-center-list");
    if (trigger) {
        trigger.setAttribute("aria-label", t("notifications.buttonLabel"));
    }
    if (triggerLabel) {
        triggerLabel.textContent = t("notifications.buttonLabel");
    }
    if (panel) {
        panel.setAttribute("aria-label", t("notifications.title"));
    }
    if (titleElement) {
        titleElement.textContent = t("notifications.title");
    }
    if (closeButton) {
        closeButton.setAttribute("aria-label", t("notifications.close"));
        closeButton.setAttribute("title", t("notifications.close"));
    }
    if (list) {
        list.innerHTML = buildNotificationItemsMarkup(notifications);
    }
    if (badge) {
        badge.textContent = String(unreadCount);
        badge.hidden = unreadCount === 0;
        badge.style.display = unreadCount === 0 ? "none" : "";
        badge.classList.toggle("hidden", unreadCount === 0);
    }
    if (countElement) {
        countElement.textContent = String(unreadCount);
        countElement.hidden = unreadCount === 0;
    }
    center.dataset.hasUnread = unreadCount > 0 ? "true" : "false";
}
function closeNotificationCenters() {
    document.querySelectorAll(".notification-center.is-open").forEach((center) => {
        closeNotificationCenter(center, false);
    });
}
function closeNotificationCentersSilently() {
    document.querySelectorAll(".notification-center.is-open").forEach((center) => {
        setNotificationCenterOpen(center, false);
    });
}
function closeNotificationCenter(center, shouldRestoreFocus = false) {
    if (!center) {
        return;
    }
    setNotificationCenterOpen(center, false);
    renderNotificationCenter(center);
    if (shouldRestoreFocus) {
        center.querySelector(".notification-center-trigger")?.focus();
    }
}
function bindNotificationCenterEvents() {
    if (notificationCenterEventsBound) {
        return;
    }
    document.addEventListener("click", (event) => {
        const openCenters = Array.from(document.querySelectorAll(".notification-center.is-open"));
        const target = event.target;
        if (openCenters.length === 0) {
            return;
        }
        if (!(target instanceof Node) || !openCenters.some((center) => center.contains(target))) {
            closeNotificationCenters();
        }
    }, true);
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeNotificationCenters();
        }
    });
    notificationCenterEventsBound = true;
}
function upgradeNotificationCenter(center) {
    if (!center || center.dataset.upgraded === "true") {
        return;
    }
    center.dataset.upgraded = "true";
    center.querySelector(".notification-center-trigger")?.addEventListener("click", () => {
        const shouldOpen = !center.classList.contains("is-open");
        closeNotificationCentersSilently();
        setNotificationCenterOpen(center, shouldOpen);
        renderNotificationCenter(center);
    });
    center.querySelector(".notification-center-close")?.addEventListener("click", () => {
        closeNotificationCenter(center, true);
    });
    center.querySelector(".notification-center-list")?.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }
        const dismissButton = target.closest("[data-dismiss-notification]");
        if (!dismissButton) {
            return;
        }
        const notificationId = dismissButton.getAttribute("data-dismiss-notification")?.trim() || "";
        if (!notificationId) {
            return;
        }
        dismissNotification(notificationId);
        renderNotificationCenter(center);
    });
    renderNotificationCenter(center);
    bindNotificationCenterEvents();
}
function injectNotificationCenter() {
    const dashboardTopbarActions = document.querySelector(".topbar-actions");
    if (!dashboardTopbarActions || dashboardTopbarActions.querySelector(".notification-center")) {
        return;
    }
    const wrapper = document.createElement("div");
    wrapper.className = "notification-center";
    wrapper.innerHTML = `
    <button
      type="button"
      class="notification-center-trigger"
      aria-haspopup="dialog"
      aria-expanded="false"
      aria-label="${t("notifications.buttonLabel")}"
    >
      <span class="notification-bell-icon" aria-hidden="true">
        <svg viewBox="0 0 20 20" focusable="false">
          <path d="M10 3.5a4 4 0 0 0-4 4v1.1c0 .9-.26 1.78-.74 2.54L4 13.1h12l-1.26-1.96A4.7 4.7 0 0 1 14 8.6V7.5a4 4 0 0 0-4-4Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M8.2 15.2a2 2 0 0 0 3.6 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        </svg>
      </span>
      <span class="notification-badge" aria-hidden="true"></span>
      <span class="notification-center-label">${t("notifications.buttonLabel")}</span>
    </button>

    <section class="notification-center-panel" role="dialog" aria-label="${t("notifications.title")}" hidden>
      <div class="notification-center-header">
        <strong>${t("notifications.title")}</strong>
        <div class="notification-center-header-actions">
          <span class="notification-center-count"></span>
          <button
            type="button"
            class="close-btn notification-center-close"
            aria-label="${t("notifications.close")}"
          >&times;</button>
        </div>
      </div>
      <div class="notification-center-list"></div>
    </section>
  `;
    dashboardTopbarActions.insertAdjacentElement("afterbegin", wrapper);
    upgradeNotificationCenter(wrapper);
}
function upgradeDashboardLanguageSwitcher() {
    const topbarActions = document.querySelector(".topbar-actions");
    upgradeExistingLanguageSwitcher(topbarActions?.querySelector(".language-switcher") || null);
}
function upgradeLoginLanguageSwitcher() {
    // Keep the login page switcher as the same fixed button group used on signup.
    return;
}
function injectLanguageSwitcher() {
    const existing = document.querySelector(".language-switcher");
    if (existing) {
        return;
    }
    const wrapper = document.createElement("div");
    wrapper.className = "language-switcher";
    wrapper.innerHTML = `
    <button type="button" class="language-option" data-language="en">English</button>
    <button type="button" class="language-option" data-language="zh">中文</button>
    <button type="button" class="language-option" data-language="es">Español</button>
    <button type="button" class="language-option" data-language="ru">Русский</button>
  `;
    wrapper.querySelectorAll(".language-option").forEach((button) => {
        button.addEventListener("click", () => {
            const language = button.dataset.language;
            if (language === "en" || language === "zh" || language === "es" || language === "ru") {
                setLanguage(language);
            }
        });
    });
    const authPageControls = document.querySelector(".auth-page-controls");
    const dashboardTopbarActions = document.querySelector(".topbar-actions");
    if (dashboardTopbarActions) {
        dashboardTopbarActions.appendChild(wrapper);
    }
    else if (authPageControls) {
        authPageControls.appendChild(wrapper);
    }
    else {
        const loginPage = document.querySelector(".login-page");
        const signupPage = document.querySelector(".signup-page");
        const target = signupPage || loginPage || document.body;
        target.insertBefore(wrapper, target.firstChild);
    }
}
function initializeI18n() {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, getPreferredLanguage());
    injectNotificationCenter();
    injectLanguageSwitcher();
    upgradeNotificationCenter(document.querySelector(".notification-center"));
    upgradeDashboardLanguageSwitcher();
    upgradeLoginLanguageSwitcher();
    applyTranslations();
}
window.I18n = {
    applyTranslations,
    clearDynamicTranslation,
    getLanguage,
    setLanguage,
    setDynamicTranslation,
    t
};
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeI18n, { once: true });
}
else {
    initializeI18n();
}
//# sourceMappingURL=i18n.js.map

