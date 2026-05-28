"use strict";
(() => {
  // src/i18n.ts
  var LANGUAGE_STORAGE_KEY = "app-language";
  var DEFAULT_LANGUAGE = "en";
  var LANGUAGE_OPTIONS = {
    en: {
      label: "English",
      flag: "\u{1F1FA}\u{1F1F8}"
    },
    zh: {
      label: "\u4E2D\u6587",
      flag: "\u{1F1E8}\u{1F1F3}"
    },
    es: {
      label: "Espa\xF1ol",
      flag: "\u{1F1EA}\u{1F1F8}"
    }
  };
  var languageMenuEventsBound = false;
  var notificationCenterEventsBound = false;
  var NOTIFICATION_COUNT = 3;
  var translations = {
    en: {
      "language.english": "English",
      "language.chinese": "Chinese",
      "language.spanish": "Spanish",
      "notifications.buttonLabel": "Notifications",
      "notifications.title": "Notifications",
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
      "signup.namePlaceholder": "Anna Ivanova",
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
      "dashboard.title": "Projects Dashboard",
      "dashboard.subtitle": "A focused workspace for tracking projects, planning new work, and staying organized across your study flow.",
      "dashboard.currentView": "Current View",
      "dashboard.currentViewName": "Dashboard Overview",
      "dashboard.currentViewText": "Review active projects and create a new workspace when needed.",
      "dashboard.createProject": "Create New Project",
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
      "projects.kanbanTag": "Kanban",
      "projects.flowTitle": "Project Flow",
      "projects.flowSubtitle": "Each column groups projects by their current delivery phase.",
      "projects.preview": "Preview mode: the projects board is shown with demo data.",
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
      "settings.namePlaceholder": "Anna Ivanova",
      "settings.email": "Email",
      "settings.emailPlaceholder": "student@example.com",
      "settings.accountTitle": "Account",
      "settings.accountText": "Account security actions are available here as frontend-only interactions.",
      "settings.changePassword": "Change Password",
      "settings.changePasswordHint": "Password change is not connected to the backend in this frontend-only view.",
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
      "common.you": "You",
      "common.unavailable": "Unavailable",
      "common.tasksCount": "{count} tasks",
      "common.createdRecently": "Created recently",
      "common.createdDate": "Created {date}",
      "auth.sessionExpired": "Your session has expired. Please log in again."
    },
    zh: {
      "language.english": "English",
      "language.chinese": "\u4E2D\u6587",
      "language.spanish": "Espa\xF1ol",
      "login.title": "\u767B\u5F55",
      "login.subtitle": "\u7528\u4E8E\u7BA1\u7406\u9879\u76EE\u548C\u4EFB\u52A1\u7684\u5E73\u53F0\u3002",
      "login.email": "\u90AE\u7BB1",
      "login.emailPlaceholder": "student@example.com",
      "login.password": "\u5BC6\u7801",
      "login.passwordPlaceholder": "\u8F93\u5165\u4F60\u7684\u5BC6\u7801",
      "login.submit": "\u767B\u5F55",
      "login.submitting": "\u6B63\u5728\u767B\u5F55...",
      "login.noAccount": "\u8FD8\u6CA1\u6709\u8D26\u53F7\uFF1F",
      "login.signUpLink": "\u6CE8\u518C",
      "login.success": "\u767B\u5F55\u6210\u529F\uFF0C\u6B63\u5728\u8DF3\u8F6C\u5230\u4EEA\u8868\u76D8...",
      "login.failed": "\u767B\u5F55\u5931\u8D25\u3002",
      "login.failedDefault": "\u767B\u5F55\u5931\u8D25\u3002\u8BF7\u68C0\u67E5\u51ED\u636E\u6216\u670D\u52A1\u5668\u72B6\u6001\u3002",
      "login.validation.fix": "\u8BF7\u4FEE\u6B63\u8868\u5355\u9519\u8BEF\u540E\u91CD\u8BD5\u3002",
      "login.validation.emailRequired": "\u8BF7\u8F93\u5165\u90AE\u7BB1\u3002",
      "login.validation.emailInvalid": "\u8BF7\u8F93\u5165\u6709\u6548\u7684\u90AE\u7BB1\u5730\u5740\u3002",
      "login.validation.passwordRequired": "\u8BF7\u8F93\u5165\u5BC6\u7801\u3002",
      "login.validation.passwordShort": "\u5BC6\u7801\u81F3\u5C11\u9700\u8981 6 \u4E2A\u5B57\u7B26\u3002",
      "signup.title": "\u521B\u5EFA\u8D26\u53F7",
      "signup.subtitle": "\u521B\u5EFA\u8D26\u53F7\u4EE5\u5F00\u59CB\u7BA1\u7406\u9879\u76EE\u548C\u4EFB\u52A1\u3002",
      "signup.name": "\u59D3\u540D",
      "signup.namePlaceholder": "Anna Ivanova",
      "signup.email": "\u90AE\u7BB1",
      "signup.emailPlaceholder": "student@example.com",
      "signup.password": "\u5BC6\u7801",
      "signup.passwordPlaceholder": "\u521B\u5EFA\u5BC6\u7801",
      "signup.confirmPassword": "\u786E\u8BA4\u5BC6\u7801",
      "signup.confirmPasswordPlaceholder": "\u518D\u6B21\u8F93\u5165\u5BC6\u7801",
      "signup.submit": "\u6CE8\u518C",
      "signup.submitting": "\u6B63\u5728\u521B\u5EFA\u8D26\u53F7...",
      "signup.haveAccount": "\u5DF2\u7ECF\u6709\u8D26\u53F7\uFF1F",
      "signup.loginLink": "\u767B\u5F55",
      "signup.success": "\u8D26\u53F7\u521B\u5EFA\u6210\u529F\uFF0C\u6B63\u5728\u8DF3\u8F6C\u5230\u767B\u5F55\u9875...",
      "signup.failed": "\u6CE8\u518C\u5931\u8D25\u3002",
      "signup.failedDefault": "\u6CE8\u518C\u5931\u8D25\u3002\u8BF7\u68C0\u67E5\u8F93\u5165\u6570\u636E\u6216\u670D\u52A1\u5668\u72B6\u6001\u3002",
      "signup.validation.fix": "\u8BF7\u4FEE\u6B63\u8868\u5355\u9519\u8BEF\u540E\u91CD\u8BD5\u3002",
      "signup.validation.nameRequired": "\u8BF7\u8F93\u5165\u59D3\u540D\u3002",
      "signup.validation.nameShort": "\u59D3\u540D\u81F3\u5C11\u9700\u8981 2 \u4E2A\u5B57\u7B26\u3002",
      "signup.validation.emailRequired": "\u8BF7\u8F93\u5165\u90AE\u7BB1\u3002",
      "signup.validation.emailInvalid": "\u8BF7\u8F93\u5165\u6709\u6548\u7684\u90AE\u7BB1\u5730\u5740\u3002",
      "signup.validation.passwordRequired": "\u8BF7\u8F93\u5165\u5BC6\u7801\u3002",
      "signup.validation.passwordShort": "\u5BC6\u7801\u81F3\u5C11\u9700\u8981 6 \u4E2A\u5B57\u7B26\u3002",
      "signup.validation.confirmRequired": "\u8BF7\u786E\u8BA4\u5BC6\u7801\u3002",
      "signup.validation.confirmMismatch": "\u4E24\u6B21\u8F93\u5165\u7684\u5BC6\u7801\u4E0D\u4E00\u81F4\u3002",
      "sidebar.workspace": "\u9879\u76EE\u5DE5\u4F5C\u533A",
      "sidebar.dashboard": "\u4EEA\u8868\u76D8",
      "sidebar.projects": "\u9879\u76EE",
      "sidebar.tasks": "\u4EFB\u52A1",
      "sidebar.settings": "\u8BBE\u7F6E",
      "sidebar.signedInAs": "\u5F53\u524D\u767B\u5F55\u7528\u6237",
      "sidebar.logout": "\u9000\u51FA\u767B\u5F55",
      "theme.dark": "\u6DF1\u8272\u6A21\u5F0F",
      "theme.light": "\u6D45\u8272\u6A21\u5F0F",
      "theme.toDark": "\u5207\u6362\u5230\u6DF1\u8272\u6A21\u5F0F",
      "theme.toLight": "\u5207\u6362\u5230\u6D45\u8272\u6A21\u5F0F",
      "dashboard.topbarTag": "\u5DE5\u4F5C\u533A",
      "dashboard.topbarLabel": "\u5C06\u5BFC\u822A\u3001\u9879\u76EE\u548C\u8D26\u6237\u64CD\u4F5C\u96C6\u4E2D\u5728\u4E00\u4E2A\u5730\u65B9\u3002",
      "dashboard.greetingMorning": "\u65E9\u4E0A\u597D\uFF0C{name}",
      "dashboard.greetingMorningFallback": "\u65E9\u4E0A\u597D",
      "dashboard.title": "\u9879\u76EE\u4EEA\u8868\u76D8",
      "dashboard.subtitle": "\u4E00\u4E2A\u4E13\u6CE8\u7684\u5DE5\u4F5C\u533A\uFF0C\u7528\u4E8E\u8DDF\u8E2A\u9879\u76EE\u3001\u89C4\u5212\u5DE5\u4F5C\uFF0C\u5E76\u8BA9\u5B66\u4E60\u6D41\u7A0B\u4FDD\u6301\u6709\u5E8F\u3002",
      "dashboard.currentView": "\u5F53\u524D\u89C6\u56FE",
      "dashboard.currentViewName": "\u4EEA\u8868\u76D8\u603B\u89C8",
      "dashboard.currentViewText": "\u67E5\u770B\u6D3B\u8DC3\u9879\u76EE\uFF0C\u5E76\u5728\u9700\u8981\u65F6\u521B\u5EFA\u65B0\u7684\u5DE5\u4F5C\u533A\u3002",
      "dashboard.createProject": "\u521B\u5EFA\u65B0\u9879\u76EE",
      "dashboard.projectsTag": "\u9879\u76EE",
      "dashboard.projectsTitle": "\u6211\u7684\u9879\u76EE",
      "dashboard.projectsSubtitle": "\u8BA9\u9879\u76EE\u5DE5\u4F5C\u533A\u66F4\u6E05\u6670\u3001\u66F4\u6709\u6761\u7406\u3001\u66F4\u6613\u4E8E\u6D4F\u89C8\u3002",
      "dashboard.search": "\u641C\u7D22",
      "dashboard.sort": "\u6392\u5E8F",
      "dashboard.sortNewest": "\u6700\u65B0\u4F18\u5148",
      "dashboard.sortOldest": "\u6700\u65E9\u4F18\u5148",
      "dashboard.sortAZ": "A-Z",
      "dashboard.searchPlaceholder": "\u641C\u7D22\u9879\u76EE",
      "dashboard.filter.all": "\u5168\u90E8",
      "dashboard.filter.active": "\u8FDB\u884C\u4E2D",
      "dashboard.filter.inReview": "\u8BC4\u5BA1\u4E2D",
      "dashboard.filter.planning": "\u89C4\u5212\u4E2D",
      "dashboard.loadingTitle": "\u6B63\u5728\u52A0\u8F7D\u9879\u76EE...",
      "dashboard.loadingText": "\u6B63\u5728\u83B7\u53D6\u4F60\u7684\u5DE5\u4F5C\u533A\u3002",
      "dashboard.noProjects": "\u8FD8\u6CA1\u6709\u9879\u76EE",
      "dashboard.noProjectsText": "\u521B\u5EFA\u4F60\u7684\u7B2C\u4E00\u4E2A\u9879\u76EE\uFF0C\u5F00\u59CB\u7EC4\u7EC7\u4EFB\u52A1\u548C\u4EA4\u4ED8\u5185\u5BB9\u3002",
      "dashboard.noProjectsFound": "\u672A\u627E\u5230\u9879\u76EE",
      "dashboard.noProjectsFoundText": "\u5C1D\u8BD5\u5176\u4ED6\u641C\u7D22\u6216\u7B5B\u9009\u6761\u4EF6\uFF0C\u6216\u8005\u521B\u5EFA\u4E00\u4E2A\u65B0\u9879\u76EE\u3002",
      "dashboard.projectsUnavailable": "\u9879\u76EE\u4E0D\u53EF\u7528",
      "dashboard.preview": "\u9884\u89C8\u6A21\u5F0F\uFF1A\u5F53\u524D\u5C55\u793A\u7684\u662F\u5E26\u6709\u793A\u4F8B\u6570\u636E\u7684\u4EEA\u8868\u76D8\u6837\u5F0F\u3002",
      "dashboard.previewProjectCreated": "\u9884\u89C8\u9879\u76EE\u521B\u5EFA\u6210\u529F\u3002",
      "dashboard.projectCreated": "\u9879\u76EE\u521B\u5EFA\u6210\u529F\u3002",
      "dashboard.projectCreateFailed": "\u521B\u5EFA\u9879\u76EE\u5931\u8D25\u3002",
      "dashboard.projectModalTitle": "\u521B\u5EFA\u65B0\u9879\u76EE",
      "dashboard.projectModalSubtitle": "\u5C06\u65B0\u9879\u76EE\u6DFB\u52A0\u5230\u4F60\u7684\u4EEA\u8868\u76D8\u3002",
      "dashboard.projectName": "\u9879\u76EE\u540D\u79F0",
      "dashboard.projectNamePlaceholder": "Semester Project Planner",
      "dashboard.projectDescription": "\u63CF\u8FF0",
      "dashboard.projectDescriptionPlaceholder": "\u7B80\u8981\u63CF\u8FF0\u8BE5\u9879\u76EE\u7684\u76EE\u6807",
      "dashboard.cancel": "\u53D6\u6D88",
      "dashboard.projectSubmit": "\u521B\u5EFA\u9879\u76EE",
      "dashboard.projectSubmitting": "\u521B\u5EFA\u4E2D...",
      "dashboard.validation.projectRequired": "\u8BF7\u8F93\u5165\u9879\u76EE\u540D\u79F0\u3002",
      "dashboard.validation.projectShort": "\u9879\u76EE\u540D\u79F0\u81F3\u5C11\u9700\u8981 2 \u4E2A\u5B57\u7B26\u3002",
      "dashboard.validation.projectDescriptionLong": "\u63CF\u8FF0\u4E0D\u80FD\u8D85\u8FC7 500 \u4E2A\u5B57\u7B26\u3002",
      "dashboard.validation.fix": "\u8BF7\u4FEE\u6B63\u8868\u5355\u9519\u8BEF\u540E\u91CD\u8BD5\u3002",
      "projects.pageTag": "\u9879\u76EE",
      "projects.topbarLabel": "\u5728\u5F85\u5F00\u59CB\u3001\u8FDB\u884C\u4E2D\u548C\u5DF2\u5B8C\u6210\u7684\u5DE5\u4F5C\u4E4B\u95F4\u8DDF\u8E2A\u9879\u76EE\u6D41\u7A0B\u3002",
      "projects.title": "\u9879\u76EE\u770B\u677F",
      "projects.subtitle": "\u4E00\u4E2A\u770B\u677F\u5F0F\u89C6\u56FE\uFF0C\u7528\u6765\u51B3\u5B9A\u63A5\u4E0B\u6765\u8981\u5F00\u59CB\u4EC0\u4E48\u3001\u5F53\u524D\u5728\u63A8\u8FDB\u4EC0\u4E48\u3001\u4EE5\u53CA\u4EC0\u4E48\u5DF2\u7ECF\u5B8C\u6210\u3002",
      "projects.boardMode": "\u770B\u677F\u6A21\u5F0F",
      "projects.boardModeName": "\u9879\u76EE\u6D41\u7A0B",
      "projects.boardModeText": "\u6253\u5F00\u4EFB\u610F\u9879\u76EE\u5361\u7247\u4EE5\u7EE7\u7EED\u8FDB\u5165\u4EFB\u52A1\u89C6\u56FE\u3002",
      "projects.kanbanTag": "\u770B\u677F",
      "projects.flowTitle": "\u9879\u76EE\u6D41",
      "projects.flowSubtitle": "\u6BCF\u4E00\u5217\u6309\u5F53\u524D\u4EA4\u4ED8\u9636\u6BB5\u5BF9\u9879\u76EE\u8FDB\u884C\u5206\u7EC4\u3002",
      "projects.preview": "\u9884\u89C8\u6A21\u5F0F\uFF1A\u5F53\u524D\u5C55\u793A\u7684\u662F\u5E26\u6709\u793A\u4F8B\u6570\u636E\u7684\u9879\u76EE\u770B\u677F\u3002",
      "projects.loadingText": "\u6B63\u5728\u51C6\u5907\u4F60\u7684\u9879\u76EE\u770B\u677F\u3002",
      "projects.emptyColumn": "\u6CA1\u6709\u9879\u76EE",
      "projects.emptyColumnText": "\u5F53\u524D\u6CA1\u6709\u9879\u76EE\u5206\u914D\u5230\u8FD9\u4E00\u5217\u3002",
      "projects.startNext": "\u63A5\u4E0B\u6765\u5F00\u59CB",
      "projects.startNextCaption": "\u6392\u961F\u4E2D\u3001\u89C4\u5212\u4E2D\u4EE5\u53CA\u4E0B\u4E00\u6B65\u8981\u505A\u7684\u5DE5\u4F5C\u3002",
      "projects.inProgress": "\u8FDB\u884C\u4E2D",
      "projects.inProgressCaption": "\u5F53\u524D\u6B63\u5728\u63A8\u8FDB\u548C\u8BC4\u5BA1\u7684\u5DE5\u4F5C\u3002",
      "projects.done": "\u5DF2\u5B8C\u6210",
      "projects.doneCaption": "\u5DF2\u5B8C\u6210\u5E76\u53EF\u4F9B\u53C2\u8003\u7684\u5DE5\u4F5C\u3002",
      "tasks.pageTag": "\u4EFB\u52A1",
      "tasks.topbarLabel": "\u6240\u9009\u9879\u76EE\u7684\u4EFB\u52A1\u7EA7\u89C6\u56FE\u3002",
      "tasks.title": "\u4EFB\u52A1\u5DE5\u4F5C\u533A",
      "tasks.subtitleDefault": "\u4ECE\u9879\u76EE\u770B\u677F\u4E2D\u6253\u5F00\u4E00\u4E2A\u9879\u76EE\u4EE5\u7EE7\u7EED\u5176\u4EFB\u52A1\u6D41\u7A0B\u3002",
      "tasks.selectedProject": "\u5DF2\u9009\u9879\u76EE",
      "tasks.noProject": "\u672A\u9009\u62E9\u9879\u76EE",
      "tasks.noProjectMeta": "\u4ECE\u9879\u76EE\u770B\u677F\u4E2D\u9009\u62E9\u4E00\u4E2A\u9879\u76EE\u5361\u7247\u4EE5\u67E5\u770B\u4EFB\u52A1\u4E0A\u4E0B\u6587\u3002",
      "tasks.sectionTag": "\u4EFB\u52A1",
      "tasks.sectionTitle": "\u4EFB\u52A1\u770B\u677F\u5360\u4F4D\u533A",
      "tasks.sectionSubtitle": "\u6B64\u9875\u9762\u5DF2\u51C6\u5907\u597D\u4F5C\u4E3A\u9879\u76EE\u5361\u7247\u7684\u5BFC\u822A\u76EE\u6807\u3002",
      "tasks.detailText": "\u6240\u9009\u9879\u76EE\u7684\u4E0A\u4E0B\u6587\u6765\u81EA\u9879\u76EE\u770B\u677F\u3002\u8FD9\u4FDD\u8BC1\u4E86\u5F53\u524D\u70B9\u51FB\u8DF3\u8F6C\u6D41\u7A0B\u53EF\u7528\uFF0C\u5E76\u4E3A\u540E\u7EED\u66F4\u5B8C\u6574\u7684\u4EFB\u52A1\u770B\u677F\u9884\u7559\u7A7A\u95F4\u3002",
      "tasks.subtitleProject": "\u7EE7\u7EED\u4E3A {projectName} \u89C4\u5212\u548C\u63A8\u8FDB\u5DE5\u4F5C\u3002",
      "settings.pageTag": "\u8BBE\u7F6E",
      "settings.topbarLabel": "\u7BA1\u7406\u4F60\u7684\u4E2A\u4EBA\u8D44\u6599\u3001\u8D26\u6237\u64CD\u4F5C\u548C\u5916\u89C2\u504F\u597D\u3002",
      "settings.title": "\u5DE5\u4F5C\u533A\u8BBE\u7F6E",
      "settings.subtitle": "\u8C03\u6574\u4EC5\u5728\u524D\u7AEF\u4FDD\u5B58\u7684\u4E2A\u4EBA\u8D44\u6599\u8868\u5355\u548C\u5916\u89C2\u504F\u597D\u3002",
      "settings.stateLabel": "\u672C\u5730\u72B6\u6001",
      "settings.stateName": "\u524D\u7AEF\u5B58\u50A8",
      "settings.stateText": "\u4E2A\u4EBA\u8D44\u6599\u4FEE\u6539\u4EC5\u4FDD\u5B58\u5728\u672C\u5730\u72B6\u6001\u4E2D\uFF0C\u4E0D\u4F1A\u53D1\u9001\u5230\u540E\u7AEF\u3002",
      "settings.sectionTag": "\u504F\u597D",
      "settings.sectionTitle": "\u8BBE\u7F6E\u8868\u5355",
      "settings.sectionSubtitle": "\u66F4\u65B0\u672C\u5730\u8D44\u6599\u8F93\u5165\u3001\u8D26\u6237\u64CD\u4F5C\u548C\u5916\u89C2\u63A7\u5236\u3002",
      "settings.profileTitle": "\u4E2A\u4EBA\u8D44\u6599",
      "settings.profileText": "\u5728\u672C\u5730\u524D\u7AEF\u72B6\u6001\u4E2D\u7F16\u8F91\u4F60\u7684\u59D3\u540D\u548C\u90AE\u7BB1\u3002",
      "settings.name": "\u59D3\u540D",
      "settings.namePlaceholder": "Anna Ivanova",
      "settings.email": "\u90AE\u7BB1",
      "settings.emailPlaceholder": "student@example.com",
      "settings.accountTitle": "\u8D26\u6237",
      "settings.accountText": "\u8FD9\u91CC\u7684\u8D26\u6237\u5B89\u5168\u64CD\u4F5C\u4EC5\u4F5C\u4E3A\u524D\u7AEF\u4EA4\u4E92\u5C55\u793A\u3002",
      "settings.changePassword": "\u4FEE\u6539\u5BC6\u7801",
      "settings.changePasswordHint": "\u5F53\u524D\u524D\u7AEF\u89C6\u56FE\u4E2D\u7684\u4FEE\u6539\u5BC6\u7801\u529F\u80FD\u672A\u8FDE\u63A5\u540E\u7AEF\u3002",
      "settings.accountHint": "\u8FD9\u4E2A\u6309\u94AE\u53EA\u662F\u524D\u7AEF\u5360\u4F4D\uFF0C\u4E0D\u4F1A\u53D1\u9001\u540E\u7AEF\u8BF7\u6C42\u3002",
      "settings.notificationsTitle": "\u901A\u77E5\u504F\u597D",
      "settings.notificationsText": "\u9009\u62E9\u5728\u6B64\u8BBE\u5907\u4E0A\u4FDD\u7559\u542F\u7528\u7684\u63D0\u9192\u65B9\u5F0F\u3002",
      "settings.emailNotifications": "\u90AE\u4EF6\u901A\u77E5",
      "settings.browserNotifications": "\u6D4F\u89C8\u5668\u901A\u77E5",
      "settings.toggleOn": "\u5F00\u542F",
      "settings.toggleOff": "\u5173\u95ED",
      "settings.appearanceTitle": "\u5916\u89C2",
      "settings.appearanceText": "\u5728\u6D45\u8272\u548C\u6DF1\u8272\u6A21\u5F0F\u4E4B\u95F4\u5207\u6362\uFF0C\u5E76\u5C06\u9009\u62E9\u4FDD\u5B58\u5728\u672C\u5730\u72B6\u6001\u4E2D\u3002",
      "settings.themeSwitchLabel": "\u4E3B\u9898",
      "settings.appearanceHint": "\u6240\u9009\u6A21\u5F0F\u4F1A\u540C\u6B65\u5230\u9876\u90E8\u680F\u4E3B\u9898\u63A7\u5236\u3002",
      "settings.displayTitle": "\u663E\u793A\u504F\u597D",
      "settings.displayText": "\u9009\u62E9\u6B64\u8BBE\u5907\u4E0A\u9879\u76EE\u9875\u9762\u9ED8\u8BA4\u6253\u5F00\u7684\u89C6\u56FE\u3002",
      "settings.defaultProjectView": "\u9ED8\u8BA4\u9879\u76EE\u89C6\u56FE",
      "settings.viewGrid": "\u7F51\u683C",
      "settings.viewList": "\u5217\u8868",
      "settings.dangerTitle": "\u91CD\u7F6E\u4E0E\u6E05\u9664",
      "settings.dangerText": "\u79FB\u9664\u6B64\u6D4F\u89C8\u5668\u4E2D\u672C\u5730\u4FDD\u5B58\u7684\u504F\u597D\u8BBE\u7F6E\u548C\u4F1A\u8BDD\u6570\u636E\u3002",
      "settings.clearLocalData": "\u6E05\u9664\u6240\u6709\u672C\u5730\u6570\u636E",
      "status.planning": "\u89C4\u5212\u4E2D",
      "status.active": "\u8FDB\u884C\u4E2D",
      "status.inReview": "\u8BC4\u5BA1\u4E2D",
      "status.done": "\u5DF2\u5B8C\u6210",
      "common.you": "\u4F60",
      "common.unavailable": "\u4E0D\u53EF\u7528",
      "common.tasksCount": "{count} \u4E2A\u4EFB\u52A1",
      "common.createdRecently": "\u6700\u8FD1\u521B\u5EFA",
      "common.createdDate": "\u521B\u5EFA\u4E8E {date}",
      "auth.sessionExpired": "\u767B\u5F55\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55\u3002"
    },
    es: {
      "language.english": "English",
      "language.chinese": "\u4E2D\u6587",
      "language.spanish": "Espa\xF1ol",
      "login.title": "Iniciar sesi\xF3n",
      "login.subtitle": "Una plataforma para gestionar proyectos y tareas.",
      "login.email": "Correo electr\xF3nico",
      "login.emailPlaceholder": "student@example.com",
      "login.password": "Contrase\xF1a",
      "login.passwordPlaceholder": "Introduce tu contrase\xF1a",
      "login.submit": "Iniciar sesi\xF3n",
      "login.submitting": "Iniciando sesi\xF3n...",
      "login.noAccount": "\xBFNo tienes cuenta?",
      "login.signUpLink": "Registrarse",
      "login.success": "Inicio de sesi\xF3n correcto. Redirigiendo al panel...",
      "login.failed": "Error al iniciar sesi\xF3n.",
      "login.failedDefault": "Error al iniciar sesi\xF3n. Revisa tus credenciales o el estado del servidor.",
      "login.validation.fix": "Corrige los errores del formulario e int\xE9ntalo de nuevo.",
      "login.validation.emailRequired": "El correo es obligatorio.",
      "login.validation.emailInvalid": "Introduce un correo v\xE1lido.",
      "login.validation.passwordRequired": "La contrase\xF1a es obligatoria.",
      "login.validation.passwordShort": "La contrase\xF1a debe tener al menos 6 caracteres.",
      "signup.title": "Crear cuenta",
      "signup.subtitle": "Crea tu cuenta para empezar a gestionar proyectos y tareas.",
      "signup.name": "Nombre completo",
      "signup.namePlaceholder": "Anna Ivanova",
      "signup.email": "Correo electr\xF3nico",
      "signup.emailPlaceholder": "student@example.com",
      "signup.password": "Contrase\xF1a",
      "signup.passwordPlaceholder": "Crea una contrase\xF1a",
      "signup.confirmPassword": "Confirmar contrase\xF1a",
      "signup.confirmPasswordPlaceholder": "Repite tu contrase\xF1a",
      "signup.submit": "Registrarse",
      "signup.submitting": "Creando cuenta...",
      "signup.haveAccount": "\xBFYa tienes cuenta?",
      "signup.loginLink": "Iniciar sesi\xF3n",
      "signup.success": "Cuenta creada correctamente. Redirigiendo a la p\xE1gina de inicio de sesi\xF3n...",
      "signup.failed": "Error al registrarse.",
      "signup.failedDefault": "Error al registrarse. Revisa los datos o el estado del servidor.",
      "signup.validation.fix": "Corrige los errores del formulario e int\xE9ntalo de nuevo.",
      "signup.validation.nameRequired": "El nombre completo es obligatorio.",
      "signup.validation.nameShort": "El nombre completo debe tener al menos 2 caracteres.",
      "signup.validation.emailRequired": "El correo es obligatorio.",
      "signup.validation.emailInvalid": "Introduce un correo v\xE1lido.",
      "signup.validation.passwordRequired": "La contrase\xF1a es obligatoria.",
      "signup.validation.passwordShort": "La contrase\xF1a debe tener al menos 6 caracteres.",
      "signup.validation.confirmRequired": "Confirma tu contrase\xF1a.",
      "signup.validation.confirmMismatch": "Las contrase\xF1as no coinciden.",
      "sidebar.workspace": "Espacio de proyectos",
      "sidebar.dashboard": "Panel",
      "sidebar.projects": "Proyectos",
      "sidebar.tasks": "Tareas",
      "sidebar.settings": "Configuraci\xF3n",
      "sidebar.signedInAs": "Sesi\xF3n iniciada como",
      "sidebar.logout": "Cerrar sesi\xF3n",
      "theme.dark": "Modo oscuro",
      "theme.light": "Modo claro",
      "theme.toDark": "Cambiar a modo oscuro",
      "theme.toLight": "Cambiar a modo claro",
      "dashboard.topbarTag": "Espacio de trabajo",
      "dashboard.topbarLabel": "Navegaci\xF3n, proyectos y controles de cuenta en un solo lugar.",
      "dashboard.greetingMorning": "Buenos d\xEDas, {name}",
      "dashboard.greetingMorningFallback": "Buenos d\xEDas",
      "dashboard.title": "Panel de proyectos",
      "dashboard.subtitle": "Un espacio enfocado para seguir proyectos, planificar trabajo nuevo y mantener todo organizado.",
      "dashboard.currentView": "Vista actual",
      "dashboard.currentViewName": "Resumen del panel",
      "dashboard.currentViewText": "Revisa los proyectos activos y crea un nuevo espacio cuando lo necesites.",
      "dashboard.createProject": "Crear nuevo proyecto",
      "dashboard.projectsTag": "Proyectos",
      "dashboard.projectsTitle": "Mis proyectos",
      "dashboard.projectsSubtitle": "Mant\xE9n los proyectos visibles, organizados y f\xE1ciles de revisar.",
      "dashboard.search": "Buscar",
      "dashboard.sort": "Ordenar",
      "dashboard.sortNewest": "M\xE1s recientes primero",
      "dashboard.sortOldest": "M\xE1s antiguos primero",
      "dashboard.sortAZ": "A-Z",
      "dashboard.searchPlaceholder": "Buscar proyectos",
      "dashboard.filter.all": "Todos",
      "dashboard.filter.active": "Activos",
      "dashboard.filter.inReview": "En revisi\xF3n",
      "dashboard.filter.planning": "Planificaci\xF3n",
      "dashboard.loadingTitle": "Cargando proyectos...",
      "dashboard.loadingText": "Obteniendo tu espacio de trabajo.",
      "dashboard.noProjects": "A\xFAn no hay proyectos",
      "dashboard.noProjectsText": "Crea tu primer proyecto para empezar a organizar tareas y entregables.",
      "dashboard.noProjectsFound": "No se encontraron proyectos",
      "dashboard.noProjectsFoundText": "Prueba otra b\xFAsqueda o filtro, o crea un proyecto nuevo.",
      "dashboard.projectsUnavailable": "Proyectos no disponibles",
      "dashboard.preview": "Modo de vista previa: se muestra el estilo del panel con datos de demostraci\xF3n.",
      "dashboard.previewProjectCreated": "Proyecto de vista previa creado correctamente.",
      "dashboard.projectCreated": "Proyecto creado correctamente.",
      "dashboard.projectCreateFailed": "No se pudo crear el proyecto.",
      "dashboard.projectModalTitle": "Crear nuevo proyecto",
      "dashboard.projectModalSubtitle": "A\xF1ade un nuevo proyecto a tu panel.",
      "dashboard.projectName": "Nombre del proyecto",
      "dashboard.projectNamePlaceholder": "Semester Project Planner",
      "dashboard.projectDescription": "Descripci\xF3n",
      "dashboard.projectDescriptionPlaceholder": "Describe brevemente el objetivo de este proyecto",
      "dashboard.cancel": "Cancelar",
      "dashboard.projectSubmit": "Crear proyecto",
      "dashboard.projectSubmitting": "Creando...",
      "dashboard.validation.projectRequired": "El nombre del proyecto es obligatorio.",
      "dashboard.validation.projectShort": "El nombre del proyecto debe tener al menos 2 caracteres.",
      "dashboard.validation.projectDescriptionLong": "La descripci\xF3n debe tener 500 caracteres o menos.",
      "dashboard.validation.fix": "Corrige los errores del formulario e int\xE9ntalo de nuevo.",
      "projects.pageTag": "Proyectos",
      "projects.topbarLabel": "Sigue tu flujo de trabajo entre pr\xF3ximos pasos, trabajo activo y completado.",
      "projects.title": "Tablero de proyectos",
      "projects.subtitle": "Una vista tipo kanban para decidir qu\xE9 empezar despu\xE9s, qu\xE9 est\xE1 en marcha y qu\xE9 ya se complet\xF3.",
      "projects.boardMode": "Modo tablero",
      "projects.boardModeName": "Flujo de proyectos",
      "projects.boardModeText": "Abre cualquier tarjeta de proyecto para continuar en la vista de tareas.",
      "projects.kanbanTag": "Kanban",
      "projects.flowTitle": "Flujo del proyecto",
      "projects.flowSubtitle": "Cada columna agrupa proyectos por su fase actual.",
      "projects.preview": "Modo de vista previa: el tablero de proyectos se muestra con datos de demostraci\xF3n.",
      "projects.loadingText": "Preparando tu tablero kanban.",
      "projects.emptyColumn": "Sin proyectos",
      "projects.emptyColumnText": "No hay proyectos asignados a esta columna.",
      "projects.startNext": "Empezar despu\xE9s",
      "projects.startNextCaption": "Trabajo en cola, planificaci\xF3n y siguiente en la lista.",
      "projects.inProgress": "En progreso",
      "projects.inProgressCaption": "Trabajo activo y revisi\xF3n en este momento.",
      "projects.done": "Hecho",
      "projects.doneCaption": "Trabajo completado y listo para consulta.",
      "tasks.pageTag": "Tareas",
      "tasks.topbarLabel": "Vista de tareas para el proyecto seleccionado.",
      "tasks.title": "Espacio de tareas",
      "tasks.subtitleDefault": "Abre un proyecto desde el tablero para continuar con su flujo de tareas.",
      "tasks.selectedProject": "Proyecto seleccionado",
      "tasks.noProject": "Ning\xFAn proyecto seleccionado",
      "tasks.noProjectMeta": "Elige una tarjeta del tablero para ver el contexto de tareas.",
      "tasks.sectionTag": "Tareas",
      "tasks.sectionTitle": "Marcador de tablero de tareas",
      "tasks.sectionSubtitle": "Esta p\xE1gina est\xE1 lista como destino de navegaci\xF3n para las tarjetas de proyecto.",
      "tasks.detailText": "El contexto del proyecto seleccionado se carga desde el tablero de proyectos. Esto mantiene el flujo actual y deja espacio para un tablero de tareas m\xE1s completo m\xE1s adelante.",
      "tasks.subtitleProject": "Contin\xFAa planificando y ejecutando para {projectName}.",
      "settings.pageTag": "Configuraci\xF3n",
      "settings.topbarLabel": "Gestiona los datos de tu perfil, acciones de cuenta y preferencias de apariencia.",
      "settings.title": "Configuraci\xF3n del espacio",
      "settings.subtitle": "Ajusta el formulario de perfil y las preferencias de apariencia guardadas solo en este dispositivo.",
      "settings.stateLabel": "Estado local",
      "settings.stateName": "Store frontend",
      "settings.stateText": "Los cambios del perfil se guardan solo en el estado local. No se env\xEDa ninguna actualizaci\xF3n al backend.",
      "settings.sectionTag": "Preferencias",
      "settings.sectionTitle": "Formulario de configuraci\xF3n",
      "settings.sectionSubtitle": "Actualiza entradas locales de perfil, acciones de cuenta y controles de apariencia.",
      "settings.profileTitle": "Perfil",
      "settings.profileText": "Edita tu nombre y correo en el estado local del frontend.",
      "settings.name": "Nombre",
      "settings.namePlaceholder": "Anna Ivanova",
      "settings.email": "Correo electr\xF3nico",
      "settings.emailPlaceholder": "student@example.com",
      "settings.accountTitle": "Cuenta",
      "settings.accountText": "Las acciones de seguridad de la cuenta est\xE1n disponibles aqu\xED como interacciones solo de frontend.",
      "settings.changePassword": "Cambiar contrase\xF1a",
      "settings.changePasswordHint": "El cambio de contrase\xF1a no est\xE1 conectado al backend en esta vista solo de frontend.",
      "settings.accountHint": "Este bot\xF3n es un marcador frontend y no env\xEDa ninguna solicitud al backend.",
      "settings.notificationsTitle": "Preferencias de notificaciones",
      "settings.notificationsText": "Elige qu\xE9 alertas permanecen activas en este dispositivo.",
      "settings.emailNotifications": "Notificaciones por correo",
      "settings.browserNotifications": "Notificaciones del navegador",
      "settings.toggleOn": "Activado",
      "settings.toggleOff": "Desactivado",
      "settings.appearanceTitle": "Apariencia",
      "settings.appearanceText": "Cambia entre modo claro y oscuro y guarda la elecci\xF3n en el estado local.",
      "settings.themeSwitchLabel": "Tema",
      "settings.appearanceHint": "El modo seleccionado tambi\xE9n se sincroniza con el control de tema del encabezado.",
      "settings.displayTitle": "Preferencias de visualizaci\xF3n",
      "settings.displayText": "Elige c\xF3mo debe abrirse por defecto la p\xE1gina de proyectos en este dispositivo.",
      "settings.defaultProjectView": "Vista predeterminada de proyectos",
      "settings.viewGrid": "Cuadr\xEDcula",
      "settings.viewList": "Lista",
      "settings.dangerTitle": "Restablecer y borrar",
      "settings.dangerText": "Elimina de este navegador todas las preferencias guardadas localmente y los datos de sesi\xF3n.",
      "settings.clearLocalData": "Borrar todos los datos locales",
      "status.planning": "Planificaci\xF3n",
      "status.active": "Activo",
      "status.inReview": "En revisi\xF3n",
      "status.done": "Hecho",
      "common.you": "T\xFA",
      "common.unavailable": "No disponible",
      "common.tasksCount": "{count} tareas",
      "common.createdRecently": "Creado recientemente",
      "common.createdDate": "Creado {date}",
      "auth.sessionExpired": "Tu sesi\xF3n ha expirado. Inicia sesi\xF3n de nuevo."
    }
  };
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
  function applyTranslations(root = document) {
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
    root.querySelectorAll(".language-input").forEach((input) => {
      input.value = getLanguage();
    });
    document.documentElement.lang = getLanguage() === "zh" ? "zh" : getLanguage();
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
      } else {
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
        trigger.setAttribute("aria-label", `Language: ${option.label}`);
      }
    });
  }
  function refreshHtmxProjectsList() {
    const searchInput = document.getElementById("project-search-input");
    if (searchInput && window.htmx) {
      window.htmx.trigger(searchInput, "search");
    }
  }
  function setLanguage(language) {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    applyTranslations();
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
    const optionMarkup = buttons.map((button) => {
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
    }).join("");
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
  function closeNotificationCenters() {
    document.querySelectorAll(".notification-center.is-open").forEach((center) => {
      setNotificationCenterOpen(center, false);
    });
  }
  function bindNotificationCenterEvents() {
    if (notificationCenterEventsBound) {
      return;
    }
    document.addEventListener("click", (event) => {
      if (!(event.target instanceof Element) || !event.target.closest(".notification-center")) {
        closeNotificationCenters();
      }
    });
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
      closeNotificationCenters();
      setNotificationCenterOpen(center, shouldOpen);
    });
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
      <span class="notification-badge" aria-hidden="true">${NOTIFICATION_COUNT}</span>
      <span class="notification-center-label">${t("notifications.buttonLabel")}</span>
    </button>

    <section class="notification-center-panel" role="dialog" aria-label="${t("notifications.title")}" hidden>
      <div class="notification-center-header">
        <strong>${t("notifications.title")}</strong>
        <span class="notification-center-count">${NOTIFICATION_COUNT}</span>
      </div>
      <div class="notification-center-list">
        <article class="notification-item">
          <p>${t("notifications.item1")}</p>
        </article>
        <article class="notification-item">
          <p>${t("notifications.item2")}</p>
        </article>
        <article class="notification-item">
          <p>${t("notifications.item3")}</p>
        </article>
      </div>
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
    <button type="button" class="language-option" data-language="zh">\u4E2D\u6587</button>
    <button type="button" class="language-option" data-language="es">Espa\xF1ol</button>
  `;
    wrapper.querySelectorAll(".language-option").forEach((button) => {
      button.addEventListener("click", () => {
        const language = button.dataset.language;
        if (language === "en" || language === "zh" || language === "es") {
          setLanguage(language);
        }
      });
    });
    const authPageControls = document.querySelector(".auth-page-controls");
    const dashboardTopbarActions = document.querySelector(".topbar-actions");
    if (dashboardTopbarActions) {
      dashboardTopbarActions.appendChild(wrapper);
    } else if (authPageControls) {
      authPageControls.appendChild(wrapper);
    } else {
      const loginPage = document.querySelector(".login-page");
      if (loginPage?.parentElement) {
        loginPage.insertAdjacentElement("afterend", wrapper);
      } else {
        document.body.appendChild(wrapper);
      }
    }
    updateSwitcherSelection();
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
    getLanguage,
    setLanguage,
    t
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeI18n, { once: true });
  } else {
    initializeI18n();
  }

  // src/core/app.ts
  var DEFAULT_CONTEXT = {
    pageId: "login",
    routes: {
      login: "/",
      dashboard: "/dashboard",
      projects: "/dashboard/projects",
      tasks: "/dashboard/tasks",
      settings: "/dashboard/settings",
      apiBase: "/api"
    }
  };
  var STORAGE_KEYS = {
    csrfToken: "spmp-csrf-token",
    theme: "dashboard-theme",
    settings: "dashboard-settings-state"
  };
  function getAppContext() {
    return window.__APP_CONTEXT__ || DEFAULT_CONTEXT;
  }
  function t2(key, values) {
    return window.I18n?.t(key, values) || key;
  }
  function readCsrfToken() {
    return localStorage.getItem(STORAGE_KEYS.csrfToken)?.trim() || "";
  }
  function clearSessionStorage() {
    localStorage.removeItem(STORAGE_KEYS.csrfToken);
  }
  function getAuthErrorMessage() {
    return t2("auth.sessionExpired");
  }

  // src/core/services.ts
  var ApiError = class extends Error {
    constructor(status, message) {
      super(message);
      this.status = status;
    }
  };
  async function request(path, init = {}) {
    const response = await fetch(`${getAppContext().routes.apiBase}${path}`, {
      ...init,
      credentials: "same-origin",
      headers: buildHeaders(init)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = readMessage(payload, "Request failed.");
      const error = new ApiError(response.status, message);
      if (response.status === 401 || response.status === 403) {
        clearSessionStorage();
      }
      throw error;
    }
    return payload;
  }
  function buildHeaders(init) {
    const headers = new Headers(init.headers);
    const method = (init.method || "GET").toUpperCase();
    if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
      const csrfToken = readCsrfToken();
      if (csrfToken) {
        headers.set("X-CSRF-Token", csrfToken);
      }
    }
    return headers;
  }
  function readMessage(data, fallback) {
    if (typeof data === "object" && data !== null && "message" in data) {
      const message = data.message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
    return fallback;
  }
  async function logout() {
    try {
      await request("/auth/logout", {
        method: "POST"
      });
    } finally {
      clearSessionStorage();
    }
  }
  async function getCurrentUser() {
    const data = await request("/auth/me");
    return data.user;
  }
  function isSessionError(error) {
    return error instanceof ApiError && (error.status === 401 || error.status === 403 || error.message === getAuthErrorMessage());
  }

  // src/settings.ts
  var SettingsPage;
  ((SettingsPage2) => {
    const THEME_STORAGE_KEY = "dashboard-theme";
    const SETTINGS_STORAGE_KEY = "dashboard-settings-state";
    const MOBILE_SIDEBAR_BREAKPOINT = 960;
    const i18n = (key, values) => window.I18n?.t(key, values) || key;
    let currentUser = null;
    let settingsState = {
      profileName: "",
      profileEmail: "",
      emailNotifications: true,
      browserNotifications: false,
      defaultProjectView: "grid",
      theme: "light"
    };
    let userNameElement = null;
    let userAvatarElement = null;
    let logoutButton = null;
    let themeToggleButton = null;
    let appearanceThemeSwitchButton = null;
    let appearanceThemeValueElement = null;
    let changePasswordButton = null;
    let settingsMessageBox = null;
    let nameInput = null;
    let emailInput = null;
    let emailNotificationsSwitchButton = null;
    let browserNotificationsSwitchButton = null;
    let emailNotificationsValueElement = null;
    let browserNotificationsValueElement = null;
    let projectViewButtons;
    let clearLocalDataButton = null;
    let sidebarToggleButton = null;
    let sidebarElement = null;
    let sidebarBackdropElement = null;
    document.addEventListener("DOMContentLoaded", () => {
      void initializeSettingsPage();
    });
    async function initializeSettingsPage() {
      cacheElements();
      initializeTheme();
      syncSidebarState();
      setupEventListeners();
      hydrateState();
      renderSettingsState();
      await loadUserData();
    }
    function cacheElements() {
      userNameElement = document.getElementById("user-name");
      userAvatarElement = document.getElementById("user-avatar");
      logoutButton = document.getElementById("logout-btn");
      themeToggleButton = document.getElementById("theme-toggle-btn");
      appearanceThemeSwitchButton = document.getElementById("appearance-theme-switch");
      appearanceThemeValueElement = document.getElementById("appearance-theme-value");
      changePasswordButton = document.getElementById("change-password-btn");
      settingsMessageBox = document.getElementById("settings-message");
      nameInput = document.getElementById("settings-name");
      emailInput = document.getElementById("settings-email");
      emailNotificationsSwitchButton = document.getElementById("email-notifications-switch");
      browserNotificationsSwitchButton = document.getElementById("browser-notifications-switch");
      emailNotificationsValueElement = document.getElementById("email-notifications-value");
      browserNotificationsValueElement = document.getElementById("browser-notifications-value");
      projectViewButtons = document.querySelectorAll("[data-project-view]");
      clearLocalDataButton = document.getElementById("clear-local-data-btn");
      sidebarToggleButton = document.getElementById("sidebar-toggle-btn");
      sidebarElement = document.getElementById("dashboard-sidebar");
      sidebarBackdropElement = document.getElementById("sidebar-backdrop");
    }
    function setupEventListeners() {
      logoutButton?.addEventListener("click", handleLogout);
      themeToggleButton?.addEventListener("click", () => setTheme(getNextTheme()));
      appearanceThemeSwitchButton?.addEventListener("click", () => setTheme(getNextTheme()));
      changePasswordButton?.addEventListener("click", handleChangePasswordClick);
      nameInput?.addEventListener("input", handleNameInput);
      emailInput?.addEventListener("input", handleEmailInput);
      emailNotificationsSwitchButton?.addEventListener("click", () => setEmailNotifications(!settingsState.emailNotifications));
      browserNotificationsSwitchButton?.addEventListener("click", () => setBrowserNotifications(!settingsState.browserNotifications));
      projectViewButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const view = button.dataset.projectView;
          if (view === "grid" || view === "list") {
            setDefaultProjectView(view);
          }
        });
      });
      clearLocalDataButton?.addEventListener("click", clearAllLocalData);
      sidebarToggleButton?.addEventListener("click", toggleSidebar);
      sidebarBackdropElement?.addEventListener("click", handleSidebarBackdropClick);
      window.addEventListener("resize", syncSidebarState);
      document.addEventListener("keydown", handleEscapeKey);
      document.addEventListener("app-language-change", renderSettingsState);
      document.querySelectorAll(".sidebar-link").forEach((link) => {
        link.addEventListener("click", () => {
          if (isMobileViewport()) {
            closeSidebar();
          }
        });
      });
    }
    function initializeTheme() {
      const storedTheme = readStoredTheme();
      const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      settingsState.theme = storedTheme || preferredTheme;
      applyTheme(settingsState.theme);
    }
    function hydrateState() {
      const stored = readStoredSettingsState();
      if (stored) {
        settingsState = {
          profileName: stored.profileName,
          profileEmail: stored.profileEmail,
          emailNotifications: stored.emailNotifications,
          browserNotifications: stored.browserNotifications,
          defaultProjectView: stored.defaultProjectView,
          theme: stored.theme
        };
        applyTheme(settingsState.theme);
        return;
      }
      settingsState = {
        profileName: "",
        profileEmail: "",
        emailNotifications: true,
        browserNotifications: false,
        defaultProjectView: "grid",
        theme: settingsState.theme
      };
      persistSettingsState();
    }
    function readStoredTheme() {
      const value = localStorage.getItem(THEME_STORAGE_KEY);
      return value === "light" || value === "dark" ? value : "";
    }
    function readStoredSettingsState() {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed.profileName === "string" && typeof parsed.profileEmail === "string" && typeof parsed.emailNotifications === "boolean" && typeof parsed.browserNotifications === "boolean" && (parsed.defaultProjectView === "grid" || parsed.defaultProjectView === "list") && (parsed.theme === "light" || parsed.theme === "dark")) {
          return {
            profileName: parsed.profileName,
            profileEmail: parsed.profileEmail,
            emailNotifications: parsed.emailNotifications,
            browserNotifications: parsed.browserNotifications,
            defaultProjectView: parsed.defaultProjectView,
            theme: parsed.theme
          };
        }
      } catch (error) {
        console.warn("Failed to parse settings state:", error);
      }
      return null;
    }
    function persistSettingsState() {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsState));
    }
    function renderSettingsState() {
      if (nameInput) {
        nameInput.value = settingsState.profileName;
      }
      if (emailInput) {
        emailInput.value = settingsState.profileEmail;
      }
      if (appearanceThemeValueElement) {
        appearanceThemeValueElement.textContent = settingsState.theme === "dark" ? i18n("theme.dark") : i18n("theme.light");
      }
      if (appearanceThemeSwitchButton) {
        const isDarkTheme = settingsState.theme === "dark";
        appearanceThemeSwitchButton.setAttribute("aria-checked", String(isDarkTheme));
        appearanceThemeSwitchButton.classList.toggle("is-dark", isDarkTheme);
      }
      renderPreferenceSwitch(
        emailNotificationsSwitchButton,
        emailNotificationsValueElement,
        settingsState.emailNotifications
      );
      renderPreferenceSwitch(
        browserNotificationsSwitchButton,
        browserNotificationsValueElement,
        settingsState.browserNotifications
      );
      projectViewButtons.forEach((button) => {
        const isActive = button.dataset.projectView === settingsState.defaultProjectView;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });
    }
    function handleNameInput(event) {
      const target = event.target;
      settingsState.profileName = target?.value ?? "";
      persistSettingsState();
    }
    function handleEmailInput(event) {
      const target = event.target;
      settingsState.profileEmail = target?.value ?? "";
      persistSettingsState();
    }
    function setEmailNotifications(isEnabled) {
      settingsState.emailNotifications = isEnabled;
      persistSettingsState();
      renderSettingsState();
    }
    function setBrowserNotifications(isEnabled) {
      settingsState.browserNotifications = isEnabled;
      persistSettingsState();
      renderSettingsState();
    }
    function setDefaultProjectView(view) {
      settingsState.defaultProjectView = view;
      persistSettingsState();
      renderSettingsState();
    }
    function getNextTheme() {
      return settingsState.theme === "dark" ? "light" : "dark";
    }
    function setTheme(theme) {
      settingsState.theme = theme;
      applyTheme(theme);
      persistSettingsState();
    }
    function applyTheme(theme) {
      document.body.dataset.theme = theme;
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      if (themeToggleButton) {
        const isDarkTheme = theme === "dark";
        themeToggleButton.textContent = isDarkTheme ? i18n("theme.light") : i18n("theme.dark");
        themeToggleButton.setAttribute("aria-pressed", String(isDarkTheme));
        themeToggleButton.setAttribute("aria-label", isDarkTheme ? i18n("theme.toLight") : i18n("theme.toDark"));
      }
      renderSettingsState();
    }
    function handleChangePasswordClick() {
      showSettingsMessage(i18n("settings.changePasswordHint"), "success");
    }
    function renderPreferenceSwitch(button, valueElement, isEnabled) {
      if (button) {
        button.setAttribute("aria-checked", String(isEnabled));
        button.classList.toggle("is-active", isEnabled);
      }
      if (valueElement) {
        valueElement.textContent = isEnabled ? i18n("settings.toggleOn") : i18n("settings.toggleOff");
      }
    }
    function clearAllLocalData() {
      localStorage.clear();
      window.location.reload();
    }
    function showSettingsMessage(text, type = "") {
      if (!settingsMessageBox) {
        return;
      }
      settingsMessageBox.textContent = text;
      settingsMessageBox.className = type ? `form-message ${type}` : "form-message";
    }
    function isMobileViewport() {
      return window.innerWidth <= MOBILE_SIDEBAR_BREAKPOINT;
    }
    function syncSidebarState() {
      if (!sidebarElement || !sidebarToggleButton || !sidebarBackdropElement) {
        return;
      }
      if (!isMobileViewport()) {
        document.body.classList.remove("sidebar-open");
      }
      const isSidebarOpen = !isMobileViewport() || document.body.classList.contains("sidebar-open");
      sidebarElement.setAttribute("aria-hidden", String(!isSidebarOpen));
      sidebarToggleButton.setAttribute("aria-expanded", String(isMobileViewport() && document.body.classList.contains("sidebar-open")));
      sidebarToggleButton.setAttribute(
        "aria-label",
        document.body.classList.contains("sidebar-open") ? "Close navigation menu" : "Open navigation menu"
      );
      sidebarBackdropElement.hidden = !(isMobileViewport() && document.body.classList.contains("sidebar-open"));
    }
    function openSidebar() {
      if (!isMobileViewport()) {
        return;
      }
      document.body.classList.add("sidebar-open");
      syncSidebarState();
    }
    function closeSidebar() {
      document.body.classList.remove("sidebar-open");
      syncSidebarState();
    }
    function toggleSidebar() {
      if (document.body.classList.contains("sidebar-open")) {
        closeSidebar();
        return;
      }
      openSidebar();
    }
    function handleSidebarBackdropClick(event) {
      const target = event.target;
      if (target?.dataset.closeSidebar === "true") {
        closeSidebar();
      }
    }
    function handleEscapeKey(event) {
      if (event.key === "Escape" && document.body.classList.contains("sidebar-open")) {
        closeSidebar();
      }
    }
    async function loadUserData() {
      try {
        currentUser = await getCurrentUser();
        if (!settingsState.profileName) {
          settingsState.profileName = currentUser.name;
        }
        if (!settingsState.profileEmail) {
          settingsState.profileEmail = currentUser.email;
        }
        persistSettingsState();
        renderSettingsState();
        if (userNameElement) {
          userNameElement.textContent = currentUser.name;
        }
        updateUserAvatar(currentUser.name);
      } catch (error) {
        if (isSessionError(error)) {
          redirectToLogin();
          return;
        }
        if (userNameElement) {
          userNameElement.textContent = i18n("common.unavailable");
        }
        updateUserAvatar(i18n("common.unavailable"));
      }
    }
    function redirectToLogin() {
      window.location.href = "/";
    }
    async function handleLogout() {
      closeSidebar();
      await logout();
      redirectToLogin();
    }
    function updateUserAvatar(name) {
      if (!userAvatarElement) {
        return;
      }
      userAvatarElement.textContent = getInitials(name);
    }
    function getInitials(name) {
      const parts = name.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) {
        return "U";
      }
      if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
      }
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
  })(SettingsPage || (SettingsPage = {}));
})();
