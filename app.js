(() => {
  "use strict";

  const STORAGE_KEY = "taskflow.tasks.v1";
  const THEME_KEY = "taskflow.theme.v1";
  const $ = (selector) => document.querySelector(selector);

  const elements = {
    taskList: $("#taskList"), emptyState: $("#emptyState"), emptyTitle: $("#emptyTitle"),
    emptyCopy: $("#emptyCopy"), modalBackdrop: $("#modalBackdrop"), taskForm: $("#taskForm"),
    modalTitle: $("#modalTitle"), taskId: $("#taskId"), taskTitle: $("#taskTitle"),
    taskDescription: $("#taskDescription"), taskDueDate: $("#taskDueDate"),
    taskPriority: $("#taskPriority"), formError: $("#formError"), saveTaskButton: $("#saveTaskButton"),
    searchInput: $("#searchInput"), priorityFilter: $("#priorityFilter"), toast: $("#toast")
  };

  let tasks = loadTasks();
  let currentView = "all";
  let editingId = null;
  let toastTimer = null;

  function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function loadTasks() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((task) => task && typeof task.id === "string" && typeof task.title === "string")
        .map((task) => ({
          id: task.id,
          title: task.title.slice(0, 100),
          description: typeof task.description === "string" ? task.description.slice(0, 300) : "",
          dueDate: typeof task.dueDate === "string" ? task.dueDate : "",
          priority: ["low", "medium", "high"].includes(task.priority) ? task.priority : "medium",
          completed: Boolean(task.completed),
          createdAt: typeof task.createdAt === "string" ? task.createdAt : new Date().toISOString(),
          completedAt: typeof task.completedAt === "string" ? task.completedAt : null
        }));
    } catch (error) {
      console.warn("Taskflow could not read saved tasks:", error);
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.error("Taskflow could not save tasks:", error);
      showToast("Could not save data. Check browser storage settings.");
      return false;
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function formatDate(dateString, options = { month: "short", day: "numeric" }) {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("en", options).format(date);
  }

  function isToday(task) { return task.dueDate === localDateString() && !task.completed; }
  function isUpcoming(task) { return Boolean(task.dueDate && task.dueDate > localDateString() && !task.completed); }
  function isOverdue(task) { return Boolean(task.dueDate && task.dueDate < localDateString() && !task.completed); }

  function getVisibleTasks() {
    const query = elements.searchInput.value.trim().toLowerCase();
    const priority = elements.priorityFilter.value;
    return tasks.filter((task) => {
      const matchesView = currentView === "all"
        || (currentView === "today" && isToday(task))
        || (currentView === "upcoming" && isUpcoming(task))
        || (currentView === "completed" && task.completed);
      const matchesSearch = !query || `${task.title} ${task.description}`.toLowerCase().includes(query);
      const matchesPriority = priority === "all" || task.priority === priority;
      return matchesView && matchesSearch && matchesPriority;
    }).sort((a, b) => {
      if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
      const dateA = a.dueDate || "9999-12-31";
      const dateB = b.dueDate || "9999-12-31";
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      const priorityRank = { high: 0, medium: 1, low: 2 };
      return priorityRank[a.priority] - priorityRank[b.priority];
    });
  }

  function renderTask(task) {
    const dueLabel = task.dueDate ? formatDate(task.dueDate) : "No due date";
    const overdueClass = isOverdue(task) ? " overdue" : "";
    const overdueLabel = isOverdue(task) ? `Overdue · ${dueLabel}` : dueLabel;
    return `
      <article class="task-row ${task.completed ? "is-completed" : ""}" data-task-id="${escapeHtml(task.id)}">
        <input class="task-check" type="checkbox" aria-label="Mark ${escapeHtml(task.title)} complete" ${task.completed ? "checked" : ""}>
        <div class="task-main">
          <p class="task-title">${escapeHtml(task.title)}</p>
          ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ""}
        </div>
        <div class="task-meta">
          <span class="priority ${task.priority}">${task.priority[0].toUpperCase() + task.priority.slice(1)}</span>
          <span class="due-date${overdueClass}">${escapeHtml(overdueLabel)}</span>
        </div>
        <div class="task-actions">
          <button class="task-action edit" type="button" aria-label="Edit ${escapeHtml(task.title)}" title="Edit task">✎</button>
          <button class="task-action delete" type="button" aria-label="Delete ${escapeHtml(task.title)}" title="Delete task">×</button>
        </div>
      </article>`;
  }

  function renderEmptyState(visibleTasks) {
    const hasAnyTasks = tasks.length > 0;
    elements.emptyState.classList.toggle("visible", visibleTasks.length === 0);
    elements.taskList.style.display = visibleTasks.length === 0 ? "none" : "block";
    if (visibleTasks.length > 0) return;
    if (elements.searchInput.value.trim() || elements.priorityFilter.value !== "all") {
      elements.emptyTitle.textContent = "No matching tasks";
      elements.emptyCopy.textContent = "Try a different search term or priority filter.";
    } else if (currentView === "completed" && hasAnyTasks) {
      elements.emptyTitle.textContent = "Nothing completed yet";
      elements.emptyCopy.textContent = "Complete a task and it will show up here.";
    } else if (currentView === "today" || currentView === "upcoming") {
      elements.emptyTitle.textContent = currentView === "today" ? "Nothing due today" : "No upcoming tasks";
      elements.emptyCopy.textContent = "Enjoy the breathing room, or add a task for later.";
    } else {
      elements.emptyTitle.textContent = "A fresh start";
      elements.emptyCopy.textContent = "Add your first task and make today count.";
    }
  }

  function render() {
    const visibleTasks = getVisibleTasks();
    elements.taskList.innerHTML = visibleTasks.map(renderTask).join("");
    renderEmptyState(visibleTasks);

    const completed = tasks.filter((task) => task.completed).length;
    const pending = tasks.length - completed;
    const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    const todayCount = tasks.filter(isToday).length;

    $("#allCount").textContent = tasks.length;
    $("#todayCount").textContent = todayCount;
    $("#completedCount").textContent = completed;
    $("#totalStat").textContent = tasks.length;
    $("#progressStat").textContent = pending;
    $("#doneStat").textContent = completed;
    $("#completionRate").textContent = `${completionRate}%`;
    $("#sidebarProgress").style.width = `${completionRate}%`;
    $("#progressLabel").textContent = `${completionRate}%`;
    $("#visibleCount").textContent = visibleTasks.length;
    $("#footerSummary").textContent = `Showing ${visibleTasks.length} of ${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;
    $("#clearCompletedButton").style.visibility = completed ? "visible" : "hidden";
  }

  function setView(view) {
    currentView = view;
    const labels = { all: "All tasks", today: "Today", upcoming: "Upcoming", completed: "Completed" };
    document.querySelectorAll(".nav-item").forEach((button) => {
      const active = button.dataset.view === view;
      button.classList.toggle("active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });
    $("#breadcrumbCurrent").textContent = labels[view];
    $("#pageTitle").innerHTML = `${labels[view]}<span class="heading-period">.</span>`;
    $("#listHeading").childNodes[0].textContent = view === "all" ? "Your tasks " : `${labels[view]} `;
    const subtitles = {
      all: "A clear mind starts with a clear plan.",
      today: "Focus on what needs your attention today.",
      upcoming: "A little planning goes a long way.",
      completed: "Look at how far you've come."
    };
    $("#pageSubtitle").textContent = subtitles[view];
    render();
  }

  function openModal(task = null) {
    editingId = task ? task.id : null;
    elements.taskForm.reset();
    elements.formError.textContent = "";
    elements.taskId.value = task ? task.id : "";
    elements.taskTitle.value = task ? task.title : "";
    elements.taskDescription.value = task ? task.description : "";
    elements.taskDueDate.value = task ? task.dueDate : "";
    elements.taskPriority.value = task ? task.priority : "medium";
    elements.modalTitle.textContent = task ? "Edit task" : "Create a task";
    elements.saveTaskButton.innerHTML = task ? "Save changes <span>↗</span>" : "Create task <span>↗</span>";
    elements.modalBackdrop.hidden = false;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => elements.taskTitle.focus(), 30);
  }

  function closeModal() {
    elements.modalBackdrop.hidden = true;
    document.body.style.overflow = "";
    editingId = null;
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("show"), 2600);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const title = elements.taskTitle.value.trim();
    if (!title) {
      elements.formError.textContent = "Please enter a task name.";
      elements.taskTitle.focus();
      return;
    }
    const dueDate = elements.taskDueDate.value;
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      elements.formError.textContent = "Please choose a valid due date.";
      return;
    }

    if (editingId) {
      const task = tasks.find((item) => item.id === editingId);
      if (!task) return;
      Object.assign(task, {
        title, description: elements.taskDescription.value.trim(),
        dueDate, priority: elements.taskPriority.value
      });
      saveTasks();
      closeModal();
      render();
      showToast("Task updated successfully");
    } else {
      tasks.unshift({
        id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `task-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title, description: elements.taskDescription.value.trim(), dueDate,
        priority: elements.taskPriority.value, completed: false,
        createdAt: new Date().toISOString(), completedAt: null
      });
      saveTasks();
      closeModal();
      render();
      showToast("Task created successfully");
    }
  }

  function handleTaskListClick(event) {
    const row = event.target.closest("[data-task-id]");
    if (!row) return;
    const task = tasks.find((item) => item.id === row.dataset.taskId);
    if (!task) return;
    if (event.target.matches(".task-check")) {
      task.completed = event.target.checked;
      task.completedAt = task.completed ? new Date().toISOString() : null;
      saveTasks();
      render();
      showToast(task.completed ? "Nice work — task completed!" : "Task marked as in progress");
    } else if (event.target.closest(".edit")) {
      openModal(task);
    } else if (event.target.closest(".delete")) {
      if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
      tasks = tasks.filter((item) => item.id !== task.id);
      saveTasks();
      render();
      showToast("Task deleted");
    }
  }

  function setDateLabels() {
    const now = new Date();
    $("#topDate").textContent = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(now);
    $("#fullDate").textContent = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(now);
    const hour = now.getHours();
    $("#greeting").textContent = hour < 12 ? "GOOD MORNING — YOUR DAY, YOUR PACE" : hour < 17 ? "GOOD AFTERNOON — YOUR DAY, YOUR PACE" : "GOOD EVENING — YOUR DAY, YOUR PACE";
  }

  function applyTheme(theme) {
    document.body.classList.toggle("dark-mode", theme === "dark");
    $("#themeButton").textContent = theme === "dark" ? "☀" : "☾";
    $("#themeButton").setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) { /* Theme still works for this session. */ }
  }

  function init() {
    setDateLabels();
    let savedTheme = "light";
    try { savedTheme = localStorage.getItem(THEME_KEY) || "light"; } catch (_) { /* Use light mode if storage is unavailable. */ }
    applyTheme(savedTheme);

    document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
    $("#topAddButton").addEventListener("click", () => openModal());
    $("#emptyAddButton").addEventListener("click", () => openModal());
    $("#closeModalButton").addEventListener("click", closeModal);
    $("#cancelButton").addEventListener("click", closeModal);
    elements.modalBackdrop.addEventListener("click", (event) => { if (event.target === elements.modalBackdrop) closeModal(); });
    elements.taskForm.addEventListener("submit", handleSubmit);
    elements.taskList.addEventListener("click", handleTaskListClick);
    elements.searchInput.addEventListener("input", render);
    elements.priorityFilter.addEventListener("change", render);
    $("#themeButton").addEventListener("click", () => applyTheme(document.body.classList.contains("dark-mode") ? "light" : "dark"));
    $("#clearCompletedButton").addEventListener("click", () => {
      const count = tasks.filter((task) => task.completed).length;
      if (!count || !window.confirm(`Remove ${count} completed ${count === 1 ? "task" : "tasks"}?`)) return;
      tasks = tasks.filter((task) => !task.completed);
      saveTasks();
      render();
      showToast("Completed tasks cleared");
    });
    document.addEventListener("keydown", (event) => {
      const tag = document.activeElement && document.activeElement.tagName;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(tag) || document.activeElement?.isContentEditable;
      if (event.key === "Escape" && !elements.modalBackdrop.hidden) closeModal();
      if (!typing && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        openModal();
      }
      if (!typing && event.key === "/") {
        event.preventDefault();
        elements.searchInput.focus();
      }
    });
    render();
  }

  init();
})();
