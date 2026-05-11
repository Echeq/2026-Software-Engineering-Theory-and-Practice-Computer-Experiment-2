type Language = "en" | "zh" | "es";

type TranslationValues = Record<string, string | number>;

interface I18nApi {
  applyTranslations(root?: ParentNode): void;
  getLanguage(): Language;
  setLanguage(language: Language): void;
  t(key: string, values?: TranslationValues): string;
}

interface TranslationDictionary {
  [key: string]: string;
}

interface Window {
  I18n?: I18nApi;
  htmx?: {
    trigger(element: Element, eventName: string): void;
  };
}

const LANGUAGE_STORAGE_KEY = "app-language";
const DEFAULT_LANGUAGE: Language = "en";
const LANGUAGE_ORDER: Language[] = ["en", "zh", "es"];
const LANGUAGE_OPTIONS: Record<Language, { label: string; flag: string }> = {
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
const NOTIFICATION_COUNT = 3;

const translations: Record<Language, TranslationDictionary> = {
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
    "language.chinese": "中文",
    "language.spanish": "Español",
    "login.title": "登录",
    "login.subtitle": "用于管理项目和任务的平台。",
    "login.email": "邮箱",
    "login.emailPlaceholder": "student@example.com",
    "login.password": "密码",
    "login.passwordPlaceholder": "输入你的密码",
    "login.submit": "登录",
    "login.submitting": "正在登录...",
    "login.noAccount": "还没有账号？",
    "login.signUpLink": "注册",
    "login.success": "登录成功，正在跳转到仪表盘...",
    "login.failed": "登录失败。",
    "login.failedDefault": "登录失败。请检查凭据或服务器状态。",
    "login.validation.fix": "请修正表单错误后重试。",
    "login.validation.emailRequired": "请输入邮箱。",
    "login.validation.emailInvalid": "请输入有效的邮箱地址。",
    "login.validation.passwordRequired": "请输入密码。",
    "login.validation.passwordShort": "密码至少需要 6 个字符。",
    "signup.title": "创建账号",
    "signup.subtitle": "创建账号以开始管理项目和任务。",
    "signup.name": "姓名",
    "signup.namePlaceholder": "Anna Ivanova",
    "signup.email": "邮箱",
    "signup.emailPlaceholder": "student@example.com",
    "signup.password": "密码",
    "signup.passwordPlaceholder": "创建密码",
    "signup.confirmPassword": "确认密码",
    "signup.confirmPasswordPlaceholder": "再次输入密码",
    "signup.submit": "注册",
    "signup.submitting": "正在创建账号...",
    "signup.haveAccount": "已经有账号？",
    "signup.loginLink": "登录",
    "signup.success": "账号创建成功，正在跳转到登录页...",
    "signup.failed": "注册失败。",
    "signup.failedDefault": "注册失败。请检查输入数据或服务器状态。",
    "signup.validation.fix": "请修正表单错误后重试。",
    "signup.validation.nameRequired": "请输入姓名。",
    "signup.validation.nameShort": "姓名至少需要 2 个字符。",
    "signup.validation.emailRequired": "请输入邮箱。",
    "signup.validation.emailInvalid": "请输入有效的邮箱地址。",
    "signup.validation.passwordRequired": "请输入密码。",
    "signup.validation.passwordShort": "密码至少需要 6 个字符。",
    "signup.validation.confirmRequired": "请确认密码。",
    "signup.validation.confirmMismatch": "两次输入的密码不一致。",
    "sidebar.workspace": "项目工作区",
    "sidebar.dashboard": "仪表盘",
    "sidebar.projects": "项目",
    "sidebar.tasks": "任务",
    "sidebar.settings": "设置",
    "sidebar.signedInAs": "当前登录用户",
    "sidebar.logout": "退出登录",
    "theme.dark": "深色模式",
    "theme.light": "浅色模式",
    "theme.toDark": "切换到深色模式",
    "theme.toLight": "切换到浅色模式",
    "dashboard.topbarTag": "工作区",
    "dashboard.topbarLabel": "将导航、项目和账户操作集中在一个地方。",
    "dashboard.greetingMorning": "\u65e9\u4e0a\u597d\uff0c{name}",
    "dashboard.greetingMorningFallback": "\u65e9\u4e0a\u597d",
    "dashboard.title": "项目仪表盘",
    "dashboard.subtitle": "一个专注的工作区，用于跟踪项目、规划工作，并让学习流程保持有序。",
    "dashboard.currentView": "当前视图",
    "dashboard.currentViewName": "仪表盘总览",
    "dashboard.currentViewText": "查看活跃项目，并在需要时创建新的工作区。",
    "dashboard.createProject": "创建新项目",
    "dashboard.projectsTag": "项目",
    "dashboard.projectsTitle": "我的项目",
    "dashboard.projectsSubtitle": "让项目工作区更清晰、更有条理、更易于浏览。",
    "dashboard.search": "搜索",
    "dashboard.sort": "排序",
    "dashboard.sortNewest": "最新优先",
    "dashboard.sortOldest": "最早优先",
    "dashboard.sortAZ": "A-Z",
    "dashboard.searchPlaceholder": "搜索项目",
    "dashboard.filter.all": "全部",
    "dashboard.filter.active": "进行中",
    "dashboard.filter.inReview": "评审中",
    "dashboard.filter.planning": "规划中",
    "dashboard.loadingTitle": "正在加载项目...",
    "dashboard.loadingText": "正在获取你的工作区。",
    "dashboard.noProjects": "还没有项目",
    "dashboard.noProjectsText": "创建你的第一个项目，开始组织任务和交付内容。",
    "dashboard.noProjectsFound": "未找到项目",
    "dashboard.noProjectsFoundText": "尝试其他搜索或筛选条件，或者创建一个新项目。",
    "dashboard.projectsUnavailable": "项目不可用",
    "dashboard.preview": "预览模式：当前展示的是带有示例数据的仪表盘样式。",
    "dashboard.previewProjectCreated": "预览项目创建成功。",
    "dashboard.projectCreated": "项目创建成功。",
    "dashboard.projectCreateFailed": "创建项目失败。",
    "dashboard.projectModalTitle": "创建新项目",
    "dashboard.projectModalSubtitle": "将新项目添加到你的仪表盘。",
    "dashboard.projectName": "项目名称",
    "dashboard.projectNamePlaceholder": "Semester Project Planner",
    "dashboard.projectDescription": "描述",
    "dashboard.projectDescriptionPlaceholder": "简要描述该项目的目标",
    "dashboard.cancel": "取消",
    "dashboard.projectSubmit": "创建项目",
    "dashboard.projectSubmitting": "创建中...",
    "dashboard.validation.projectRequired": "请输入项目名称。",
    "dashboard.validation.projectShort": "项目名称至少需要 2 个字符。",
    "dashboard.validation.projectDescriptionLong": "描述不能超过 500 个字符。",
    "dashboard.validation.fix": "请修正表单错误后重试。",
    "projects.pageTag": "项目",
    "projects.topbarLabel": "在待开始、进行中和已完成的工作之间跟踪项目流程。",
    "projects.title": "项目看板",
    "projects.subtitle": "一个看板式视图，用来决定接下来要开始什么、当前在推进什么、以及什么已经完成。",
    "projects.boardMode": "看板模式",
    "projects.boardModeName": "项目流程",
    "projects.boardModeText": "打开任意项目卡片以继续进入任务视图。",
    "projects.kanbanTag": "看板",
    "projects.flowTitle": "项目流",
    "projects.flowSubtitle": "每一列按当前交付阶段对项目进行分组。",
    "projects.preview": "预览模式：当前展示的是带有示例数据的项目看板。",
    "projects.loadingText": "正在准备你的项目看板。",
    "projects.emptyColumn": "没有项目",
    "projects.emptyColumnText": "当前没有项目分配到这一列。",
    "projects.startNext": "接下来开始",
    "projects.startNextCaption": "排队中、规划中以及下一步要做的工作。",
    "projects.inProgress": "进行中",
    "projects.inProgressCaption": "当前正在推进和评审的工作。",
    "projects.done": "已完成",
    "projects.doneCaption": "已完成并可供参考的工作。",
    "tasks.pageTag": "任务",
    "tasks.topbarLabel": "所选项目的任务级视图。",
    "tasks.title": "任务工作区",
    "tasks.subtitleDefault": "从项目看板中打开一个项目以继续其任务流程。",
    "tasks.selectedProject": "已选项目",
    "tasks.noProject": "未选择项目",
    "tasks.noProjectMeta": "从项目看板中选择一个项目卡片以查看任务上下文。",
    "tasks.sectionTag": "任务",
    "tasks.sectionTitle": "任务看板占位区",
    "tasks.sectionSubtitle": "此页面已准备好作为项目卡片的导航目标。",
    "tasks.detailText": "所选项目的上下文来自项目看板。这保证了当前点击跳转流程可用，并为后续更完整的任务看板预留空间。",
    "tasks.subtitleProject": "继续为 {projectName} 规划和推进工作。",
    "settings.pageTag": "设置",
    "settings.topbarLabel": "管理你的个人资料、账户操作和外观偏好。",
    "settings.title": "工作区设置",
    "settings.subtitle": "调整仅在前端保存的个人资料表单和外观偏好。",
    "settings.stateLabel": "本地状态",
    "settings.stateName": "前端存储",
    "settings.stateText": "个人资料修改仅保存在本地状态中，不会发送到后端。",
    "settings.sectionTag": "偏好",
    "settings.sectionTitle": "设置表单",
    "settings.sectionSubtitle": "更新本地资料输入、账户操作和外观控制。",
    "settings.profileTitle": "个人资料",
    "settings.profileText": "在本地前端状态中编辑你的姓名和邮箱。",
    "settings.name": "姓名",
    "settings.namePlaceholder": "Anna Ivanova",
    "settings.email": "邮箱",
    "settings.emailPlaceholder": "student@example.com",
    "settings.accountTitle": "账户",
    "settings.accountText": "这里的账户安全操作仅作为前端交互展示。",
    "settings.changePassword": "修改密码",
    "settings.changePasswordHint": "当前前端视图中的修改密码功能未连接后端。",
    "settings.accountHint": "这个按钮只是前端占位，不会发送后端请求。",
    "settings.notificationsTitle": "通知偏好",
    "settings.notificationsText": "选择在此设备上保留启用的提醒方式。",
    "settings.emailNotifications": "邮件通知",
    "settings.browserNotifications": "浏览器通知",
    "settings.toggleOn": "开启",
    "settings.toggleOff": "关闭",
    "settings.appearanceTitle": "外观",
    "settings.appearanceText": "在浅色和深色模式之间切换，并将选择保存在本地状态中。",
    "settings.themeSwitchLabel": "主题",
    "settings.appearanceHint": "所选模式会同步到顶部栏主题控制。",
    "settings.displayTitle": "显示偏好",
    "settings.displayText": "选择此设备上项目页面默认打开的视图。",
    "settings.defaultProjectView": "默认项目视图",
    "settings.viewGrid": "网格",
    "settings.viewList": "列表",
    "settings.dangerTitle": "重置与清除",
    "settings.dangerText": "移除此浏览器中本地保存的偏好设置和会话数据。",
    "settings.clearLocalData": "清除所有本地数据",
    "status.planning": "规划中",
    "status.active": "进行中",
    "status.inReview": "评审中",
    "status.done": "已完成",
    "common.you": "你",
    "common.unavailable": "不可用",
    "common.tasksCount": "{count} 个任务",
    "common.createdRecently": "最近创建",
    "common.createdDate": "创建于 {date}",
    "auth.sessionExpired": "登录已过期，请重新登录。"
  },
  es: {
    "language.english": "English",
    "language.chinese": "中文",
    "language.spanish": "Español",
    "login.title": "Iniciar sesión",
    "login.subtitle": "Una plataforma para gestionar proyectos y tareas.",
    "login.email": "Correo electrónico",
    "login.emailPlaceholder": "student@example.com",
    "login.password": "Contraseña",
    "login.passwordPlaceholder": "Introduce tu contraseña",
    "login.submit": "Iniciar sesión",
    "login.submitting": "Iniciando sesión...",
    "login.noAccount": "¿No tienes cuenta?",
    "login.signUpLink": "Registrarse",
    "login.success": "Inicio de sesión correcto. Redirigiendo al panel...",
    "login.failed": "Error al iniciar sesión.",
    "login.failedDefault": "Error al iniciar sesión. Revisa tus credenciales o el estado del servidor.",
    "login.validation.fix": "Corrige los errores del formulario e inténtalo de nuevo.",
    "login.validation.emailRequired": "El correo es obligatorio.",
    "login.validation.emailInvalid": "Introduce un correo válido.",
    "login.validation.passwordRequired": "La contraseña es obligatoria.",
    "login.validation.passwordShort": "La contraseña debe tener al menos 6 caracteres.",
    "signup.title": "Crear cuenta",
    "signup.subtitle": "Crea tu cuenta para empezar a gestionar proyectos y tareas.",
    "signup.name": "Nombre completo",
    "signup.namePlaceholder": "Anna Ivanova",
    "signup.email": "Correo electrónico",
    "signup.emailPlaceholder": "student@example.com",
    "signup.password": "Contraseña",
    "signup.passwordPlaceholder": "Crea una contraseña",
    "signup.confirmPassword": "Confirmar contraseña",
    "signup.confirmPasswordPlaceholder": "Repite tu contraseña",
    "signup.submit": "Registrarse",
    "signup.submitting": "Creando cuenta...",
    "signup.haveAccount": "¿Ya tienes cuenta?",
    "signup.loginLink": "Iniciar sesión",
    "signup.success": "Cuenta creada correctamente. Redirigiendo a la página de inicio de sesión...",
    "signup.failed": "Error al registrarse.",
    "signup.failedDefault": "Error al registrarse. Revisa los datos o el estado del servidor.",
    "signup.validation.fix": "Corrige los errores del formulario e inténtalo de nuevo.",
    "signup.validation.nameRequired": "El nombre completo es obligatorio.",
    "signup.validation.nameShort": "El nombre completo debe tener al menos 2 caracteres.",
    "signup.validation.emailRequired": "El correo es obligatorio.",
    "signup.validation.emailInvalid": "Introduce un correo válido.",
    "signup.validation.passwordRequired": "La contraseña es obligatoria.",
    "signup.validation.passwordShort": "La contraseña debe tener al menos 6 caracteres.",
    "signup.validation.confirmRequired": "Confirma tu contraseña.",
    "signup.validation.confirmMismatch": "Las contraseñas no coinciden.",
    "sidebar.workspace": "Espacio de proyectos",
    "sidebar.dashboard": "Panel",
    "sidebar.projects": "Proyectos",
    "sidebar.tasks": "Tareas",
    "sidebar.settings": "Configuración",
    "sidebar.signedInAs": "Sesión iniciada como",
    "sidebar.logout": "Cerrar sesión",
    "theme.dark": "Modo oscuro",
    "theme.light": "Modo claro",
    "theme.toDark": "Cambiar a modo oscuro",
    "theme.toLight": "Cambiar a modo claro",
    "dashboard.topbarTag": "Espacio de trabajo",
    "dashboard.topbarLabel": "Navegación, proyectos y controles de cuenta en un solo lugar.",
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
    "dashboard.projectsSubtitle": "Mantén los proyectos visibles, organizados y fáciles de revisar.",
    "dashboard.search": "Buscar",
    "dashboard.sort": "Ordenar",
    "dashboard.sortNewest": "Más recientes primero",
    "dashboard.sortOldest": "Más antiguos primero",
    "dashboard.sortAZ": "A-Z",
    "dashboard.searchPlaceholder": "Buscar proyectos",
    "dashboard.filter.all": "Todos",
    "dashboard.filter.active": "Activos",
    "dashboard.filter.inReview": "En revisión",
    "dashboard.filter.planning": "Planificación",
    "dashboard.loadingTitle": "Cargando proyectos...",
    "dashboard.loadingText": "Obteniendo tu espacio de trabajo.",
    "dashboard.noProjects": "Aún no hay proyectos",
    "dashboard.noProjectsText": "Crea tu primer proyecto para empezar a organizar tareas y entregables.",
    "dashboard.noProjectsFound": "No se encontraron proyectos",
    "dashboard.noProjectsFoundText": "Prueba otra búsqueda o filtro, o crea un proyecto nuevo.",
    "dashboard.projectsUnavailable": "Proyectos no disponibles",
    "dashboard.preview": "Modo de vista previa: se muestra el estilo del panel con datos de demostración.",
    "dashboard.previewProjectCreated": "Proyecto de vista previa creado correctamente.",
    "dashboard.projectCreated": "Proyecto creado correctamente.",
    "dashboard.projectCreateFailed": "No se pudo crear el proyecto.",
    "dashboard.projectModalTitle": "Crear nuevo proyecto",
    "dashboard.projectModalSubtitle": "Añade un nuevo proyecto a tu panel.",
    "dashboard.projectName": "Nombre del proyecto",
    "dashboard.projectNamePlaceholder": "Semester Project Planner",
    "dashboard.projectDescription": "Descripción",
    "dashboard.projectDescriptionPlaceholder": "Describe brevemente el objetivo de este proyecto",
    "dashboard.cancel": "Cancelar",
    "dashboard.projectSubmit": "Crear proyecto",
    "dashboard.projectSubmitting": "Creando...",
    "dashboard.validation.projectRequired": "El nombre del proyecto es obligatorio.",
    "dashboard.validation.projectShort": "El nombre del proyecto debe tener al menos 2 caracteres.",
    "dashboard.validation.projectDescriptionLong": "La descripción debe tener 500 caracteres o menos.",
    "dashboard.validation.fix": "Corrige los errores del formulario e inténtalo de nuevo.",
    "projects.pageTag": "Proyectos",
    "projects.topbarLabel": "Sigue tu flujo de trabajo entre próximos pasos, trabajo activo y completado.",
    "projects.title": "Tablero de proyectos",
    "projects.subtitle": "Una vista tipo kanban para decidir qué empezar después, qué está en marcha y qué ya se completó.",
    "projects.boardMode": "Modo tablero",
    "projects.boardModeName": "Flujo de proyectos",
    "projects.boardModeText": "Abre cualquier tarjeta de proyecto para continuar en la vista de tareas.",
    "projects.kanbanTag": "Kanban",
    "projects.flowTitle": "Flujo del proyecto",
    "projects.flowSubtitle": "Cada columna agrupa proyectos por su fase actual.",
    "projects.preview": "Modo de vista previa: el tablero de proyectos se muestra con datos de demostración.",
    "projects.loadingText": "Preparando tu tablero kanban.",
    "projects.emptyColumn": "Sin proyectos",
    "projects.emptyColumnText": "No hay proyectos asignados a esta columna.",
    "projects.startNext": "Empezar después",
    "projects.startNextCaption": "Trabajo en cola, planificación y siguiente en la lista.",
    "projects.inProgress": "En progreso",
    "projects.inProgressCaption": "Trabajo activo y revisión en este momento.",
    "projects.done": "Hecho",
    "projects.doneCaption": "Trabajo completado y listo para consulta.",
    "tasks.pageTag": "Tareas",
    "tasks.topbarLabel": "Vista de tareas para el proyecto seleccionado.",
    "tasks.title": "Espacio de tareas",
    "tasks.subtitleDefault": "Abre un proyecto desde el tablero para continuar con su flujo de tareas.",
    "tasks.selectedProject": "Proyecto seleccionado",
    "tasks.noProject": "Ningún proyecto seleccionado",
    "tasks.noProjectMeta": "Elige una tarjeta del tablero para ver el contexto de tareas.",
    "tasks.sectionTag": "Tareas",
    "tasks.sectionTitle": "Marcador de tablero de tareas",
    "tasks.sectionSubtitle": "Esta página está lista como destino de navegación para las tarjetas de proyecto.",
    "tasks.detailText": "El contexto del proyecto seleccionado se carga desde el tablero de proyectos. Esto mantiene el flujo actual y deja espacio para un tablero de tareas más completo más adelante.",
    "tasks.subtitleProject": "Continúa planificando y ejecutando para {projectName}.",
    "settings.pageTag": "Configuración",
    "settings.topbarLabel": "Gestiona los datos de tu perfil, acciones de cuenta y preferencias de apariencia.",
    "settings.title": "Configuración del espacio",
    "settings.subtitle": "Ajusta el formulario de perfil y las preferencias de apariencia guardadas solo en este dispositivo.",
    "settings.stateLabel": "Estado local",
    "settings.stateName": "Store frontend",
    "settings.stateText": "Los cambios del perfil se guardan solo en el estado local. No se envía ninguna actualización al backend.",
    "settings.sectionTag": "Preferencias",
    "settings.sectionTitle": "Formulario de configuración",
    "settings.sectionSubtitle": "Actualiza entradas locales de perfil, acciones de cuenta y controles de apariencia.",
    "settings.profileTitle": "Perfil",
    "settings.profileText": "Edita tu nombre y correo en el estado local del frontend.",
    "settings.name": "Nombre",
    "settings.namePlaceholder": "Anna Ivanova",
    "settings.email": "Correo electrónico",
    "settings.emailPlaceholder": "student@example.com",
    "settings.accountTitle": "Cuenta",
    "settings.accountText": "Las acciones de seguridad de la cuenta están disponibles aquí como interacciones solo de frontend.",
    "settings.changePassword": "Cambiar contraseña",
    "settings.changePasswordHint": "El cambio de contraseña no está conectado al backend en esta vista solo de frontend.",
    "settings.accountHint": "Este botón es un marcador frontend y no envía ninguna solicitud al backend.",
    "settings.notificationsTitle": "Preferencias de notificaciones",
    "settings.notificationsText": "Elige qué alertas permanecen activas en este dispositivo.",
    "settings.emailNotifications": "Notificaciones por correo",
    "settings.browserNotifications": "Notificaciones del navegador",
    "settings.toggleOn": "Activado",
    "settings.toggleOff": "Desactivado",
    "settings.appearanceTitle": "Apariencia",
    "settings.appearanceText": "Cambia entre modo claro y oscuro y guarda la elección en el estado local.",
    "settings.themeSwitchLabel": "Tema",
    "settings.appearanceHint": "El modo seleccionado también se sincroniza con el control de tema del encabezado.",
    "settings.displayTitle": "Preferencias de visualización",
    "settings.displayText": "Elige cómo debe abrirse por defecto la página de proyectos en este dispositivo.",
    "settings.defaultProjectView": "Vista predeterminada de proyectos",
    "settings.viewGrid": "Cuadrícula",
    "settings.viewList": "Lista",
    "settings.dangerTitle": "Restablecer y borrar",
    "settings.dangerText": "Elimina de este navegador todas las preferencias guardadas localmente y los datos de sesión.",
    "settings.clearLocalData": "Borrar todos los datos locales",
    "status.planning": "Planificación",
    "status.active": "Activo",
    "status.inReview": "En revisión",
    "status.done": "Hecho",
    "common.you": "Tú",
    "common.unavailable": "No disponible",
    "common.tasksCount": "{count} tareas",
    "common.createdRecently": "Creado recientemente",
    "common.createdDate": "Creado {date}",
    "auth.sessionExpired": "Tu sesión ha expirado. Inicia sesión de nuevo."
  }
};

function interpolate(template: string, values: TranslationValues = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

function getPreferredLanguage(): Language {
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

function t(key: string, values?: TranslationValues): string {
  const language = getLanguage();
  const dictionary = translations[language] || translations[DEFAULT_LANGUAGE];
  const template = dictionary[key] || translations[DEFAULT_LANGUAGE][key] || key;
  return interpolate(template, values);
}

function getLanguage(): Language {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === "en" || stored === "zh" || stored === "es" ? stored : DEFAULT_LANGUAGE;
}

function getLanguageOption(language: Language): { label: string; flag: string } {
  return LANGUAGE_OPTIONS[language];
}

function applyTranslations(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n || "");
  });

  root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-i18n-placeholder]").forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    if (key) {
      element.placeholder = t(key);
    }
  });

  root.querySelectorAll<HTMLElement>("[data-i18n-aria-label]").forEach((element) => {
    const key = element.dataset.i18nAriaLabel;
    if (key) {
      element.setAttribute("aria-label", t(key));
    }
  });

  root.querySelectorAll<HTMLInputElement>(".language-input").forEach((input) => {
    input.value = getLanguage();
  });

  document.documentElement.lang = getLanguage() === "zh" ? "zh" : getLanguage();
}

function updateSwitcherSelection(): void {
  const currentLanguage = getLanguage();

  document.querySelectorAll<HTMLButtonElement>(".language-option").forEach((button) => {
    const language = button.dataset.language;
    if (language !== "en" && language !== "zh" && language !== "es") {
      return;
    }

    const option = getLanguageOption(language);
    const labelElement = button.querySelector<HTMLElement>(".language-option-label");
    const flagElement = button.querySelector<HTMLElement>(".language-option-flag");
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

  document.querySelectorAll<HTMLElement>(".language-switcher--dropdown").forEach((switcher) => {
    const option = getLanguageOption(currentLanguage);
    const currentFlag = switcher.querySelector<HTMLElement>(".language-switcher-current-flag");
    const currentLabel = switcher.querySelector<HTMLElement>(".language-switcher-current-label");
    const trigger = switcher.querySelector<HTMLButtonElement>(".language-switcher-trigger");

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

function refreshHtmxProjectsList(): void {
  const searchInput = document.getElementById("project-search-input");
  if (searchInput && window.htmx) {
    window.htmx.trigger(searchInput, "search");
  }
}

function setLanguage(language: Language): void {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  applyTranslations();
  updateSwitcherSelection();
  refreshHtmxProjectsList();
  document.dispatchEvent(new CustomEvent("app-language-change", { detail: { language } }));
}

function setLanguageMenuOpen(switcher: HTMLElement, isOpen: boolean): void {
  const trigger = switcher.querySelector<HTMLButtonElement>(".language-switcher-trigger");
  const menu = switcher.querySelector<HTMLElement>(".language-switcher-menu");

  if (!trigger || !menu) {
    return;
  }

  switcher.classList.toggle("is-open", isOpen);
  trigger.setAttribute("aria-expanded", String(isOpen));
  menu.hidden = !isOpen;
}

function closeLanguageMenus(): void {
  document.querySelectorAll<HTMLElement>(".language-switcher--dropdown.is-open").forEach((switcher) => {
    setLanguageMenuOpen(switcher, false);
  });
}

function bindLanguageMenuEvents(): void {
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

function upgradeExistingLanguageSwitcher(switcher: HTMLElement | null): void {
  if (!switcher || switcher.classList.contains("language-switcher--dropdown")) {
    return;
  }

  const buttons = Array.from(switcher.querySelectorAll<HTMLButtonElement>(".language-option"));
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

  switcher.querySelector<HTMLButtonElement>(".language-switcher-trigger")?.addEventListener("click", () => {
    const shouldOpen = !switcher.classList.contains("is-open");
    closeLanguageMenus();
    setLanguageMenuOpen(switcher, shouldOpen);
  });

  switcher.querySelectorAll<HTMLButtonElement>(".language-option").forEach((button) => {
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

function setNotificationCenterOpen(center: HTMLElement, isOpen: boolean): void {
  const trigger = center.querySelector<HTMLButtonElement>(".notification-center-trigger");
  const panel = center.querySelector<HTMLElement>(".notification-center-panel");

  if (!trigger || !panel) {
    return;
  }

  center.classList.toggle("is-open", isOpen);
  trigger.setAttribute("aria-expanded", String(isOpen));
  panel.hidden = !isOpen;
}

function closeNotificationCenters(): void {
  document.querySelectorAll<HTMLElement>(".notification-center.is-open").forEach((center) => {
    setNotificationCenterOpen(center, false);
  });
}

function bindNotificationCenterEvents(): void {
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

function upgradeNotificationCenter(center: HTMLElement | null): void {
  if (!center || center.dataset.upgraded === "true") {
    return;
  }

  center.dataset.upgraded = "true";

  center.querySelector<HTMLButtonElement>(".notification-center-trigger")?.addEventListener("click", () => {
    const shouldOpen = !center.classList.contains("is-open");
    closeNotificationCenters();
    setNotificationCenterOpen(center, shouldOpen);
  });

  bindNotificationCenterEvents();
}

function injectNotificationCenter(): void {
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

function upgradeDashboardLanguageSwitcher(): void {
  const topbarActions = document.querySelector(".topbar-actions");
  upgradeExistingLanguageSwitcher(topbarActions?.querySelector<HTMLElement>(".language-switcher") || null);
}

function upgradeLoginLanguageSwitcher(): void {
  upgradeExistingLanguageSwitcher(document.querySelector<HTMLElement>(".login-page + .language-switcher"));
}

function injectLanguageSwitcher(): void {
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
  `;

  wrapper.querySelectorAll<HTMLButtonElement>(".language-option").forEach((button) => {
    button.addEventListener("click", () => {
      const language = button.dataset.language;
      if (language === "en" || language === "zh" || language === "es") {
        setLanguage(language);
      }
    });
  });

  const dashboardTopbarActions = document.querySelector(".topbar-actions");
  if (dashboardTopbarActions) {
    dashboardTopbarActions.appendChild(wrapper);
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

function initializeI18n(): void {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, getPreferredLanguage());
  injectNotificationCenter();
  injectLanguageSwitcher();
  upgradeNotificationCenter(document.querySelector<HTMLElement>(".notification-center"));
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
