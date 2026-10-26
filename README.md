# Taskflow — Personal Task Manager

A responsive task-management web app built with **HTML, CSS, and vanilla JavaScript**. It is designed as a beginner-friendly software developer portfolio project.

## Features

- Create, edit, delete, and complete tasks
- Optional description and due date
- Low, medium, and high priority labels
- Search tasks by title or description
- Filter by priority and by All tasks, Today, Upcoming, or Completed
- Dashboard statistics and completion progress
- LocalStorage persistence across page refreshes
- Light and dark themes
- Responsive layout for desktop and mobile
- Keyboard shortcuts: `N` opens the new-task dialog; `/` focuses search; `Esc` closes the dialog
- Input validation and confirmation before destructive actions

## Tech stack

- HTML5 for semantic structure and forms
- CSS3 for responsive layout, components, and theme variables
- Vanilla JavaScript for state, event handling, rendering, validation, and filtering
- Browser LocalStorage for persistence

## Run locally on Windows

### Option 1: Open directly
1. Extract the project folder.
2. Double-click `index.html` to open it in a modern browser.
3. Add a task and refresh the page to check that it is saved.

### Option 2: Use VS Code (recommended)
1. Install [Visual Studio Code](https://code.visualstudio.com/).
2. Open this folder in VS Code.
3. Install the **Live Server** extension if you want a local development server.
4. Right-click `index.html` and choose **Open with Live Server**.

No Node.js, build step, package installation, or backend server is required.

## Project structure

```text
task-manager-portfolio/
├── index.html    # App structure and dialog form
├── styles.css    # Visual design, responsive layout, light/dark themes
├── app.js        # App logic, filtering, persistence, and interactions
├── README.md     # Setup, features, and portfolio notes
├── TESTING.md    # Manual test checklist
└── INTERVIEW_GUIDE.md
```

## Data and privacy notes

Tasks are stored in the browser's LocalStorage on the device and browser profile where the app is used. This is a frontend-only demo: it does not include accounts, cloud synchronization, or a remote database. Clearing browser site data can remove saved tasks. Do not use it for sensitive information.

## Before publishing

1. Test all scenarios in `TESTING.md`.
2. Add screenshots of your own running app to a `screenshots/` folder if desired.
3. Replace any portfolio-specific details with your own.
4. Make sure you understand the code and can explain it honestly in interviews.

## Deploy with GitHub Pages

1. Create a GitHub repository named `taskflow-task-manager`.
2. Upload `index.html`, `styles.css`, `app.js`, and the Markdown files to the repository root.
3. Open **Settings → Pages** in the repository.
4. Under build/deployment, select **Deploy from a branch**.
5. Choose the `main` branch and `/ (root)` folder, then save.
6. Wait for the Pages deployment to finish. GitHub will display your site URL in the Pages settings.
7. Open the URL and test task creation and persistence.

## Suggested resume entry

**Taskflow — Personal Task Manager | HTML, CSS, JavaScript**

- Built a responsive task-management web app with task CRUD, priority labels, due dates, search, and filtering.
- Implemented persistent browser storage using LocalStorage and added dashboard metrics for completion progress.
- Added input validation, keyboard shortcuts, and a responsive light/dark theme.

Only list features you have tested and can explain. If you extend the app, describe your own contribution accurately.
