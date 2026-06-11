const STORAGE_KEY = "kanban-pro-tasks";
const THEME_KEY = "kanban-pro-theme";

const statusMap = {
  todo: "To Do",
  inprogress: "In Progress",
  review: "Review",
  done: "Done"
};

const statusOrder = ["todo", "inprogress", "review", "done"];

const taskForm = document.getElementById("taskForm");
const editForm = document.getElementById("editForm");
const editModal = document.getElementById("editModal");
const closeModalButton = document.getElementById("closeModalButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const themeToggle = document.getElementById("themeToggle");
const toast = document.getElementById("toast");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const priorityFilter = document.getElementById("priorityFilter");

const exportButton = document.getElementById("exportButton");
const sampleDataButton = document.getElementById("sampleDataButton");
const resetFormButton = document.getElementById("resetFormButton");
const clearDoneButton = document.getElementById("clearDoneButton");

let tasks = loadTasks();
let editingId = null;
let draggedId = null;

function createId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function loadTasks() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const parsedTasks = saved ? JSON.parse(saved) : [];

  return parsedTasks.map(task => ({
    id: task.id || createId(),
    title: task.title || "Untitled Task",
    description: task.description || "",
    priority: task.priority || "Medium",
    status: task.status || "todo",
    dueDate: task.dueDate || "",
    category: task.category || "General",
    createdAt: task.createdAt || new Date().toISOString()
  }));
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 2400);
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isOverdue(task) {
  if (!task.dueDate || task.status === "done") return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(`${task.dueDate}T00:00:00`);
  return due < today;
}

function getFilteredTasks() {
  const keyword = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;
  const selectedPriority = priorityFilter.value;

  return tasks.filter(task => {
    const searchable = [
      task.title,
      task.description,
      task.category,
      task.priority,
      statusMap[task.status]
    ].join(" ").toLowerCase();

    const matchesKeyword = !keyword || searchable.includes(keyword);
    const matchesStatus = selectedStatus === "all" || task.status === selectedStatus;
    const matchesPriority = selectedPriority === "all" || task.priority === selectedPriority;

    return matchesKeyword && matchesStatus && matchesPriority;
  });
}

function renderTasks() {
  statusOrder.forEach(status => {
    document.getElementById(`${status}List`).innerHTML = "";
  });

  const filteredTasks = getFilteredTasks();

  statusOrder.forEach(status => {
    const list = document.getElementById(`${status}List`);
    const statusTasks = filteredTasks.filter(task => task.status === status);

    if (statusTasks.length === 0) {
      list.innerHTML = `<div class="empty-state">No tasks here</div>`;
      return;
    }

    statusTasks.forEach(task => {
      list.appendChild(createTaskCard(task));
    });
  });

  updateStats();
}

function createTaskCard(task) {
  const card = document.createElement("article");
  card.className = `task-card priority-${task.priority}`;
  card.draggable = true;
  card.dataset.id = task.id;

  const overdueBadge = isOverdue(task) ? `<span class="badge overdue">Overdue</span>` : "";
  const nextStatus = getNextStatus(task.status);
  const moveButton = nextStatus
    ? `<button class="move-btn" type="button" data-action="move">Move to ${statusMap[nextStatus]}</button>`
    : "";

  card.innerHTML = `
    <h4>${escapeHTML(task.title)}</h4>
    <p class="task-description">${escapeHTML(task.description || "No description")}</p>
    <div class="task-meta">
      <span class="badge priority-${task.priority}">${escapeHTML(task.priority)}</span>
      <span class="badge">${escapeHTML(task.category || "General")}</span>
      <span class="badge">${task.dueDate ? escapeHTML(task.dueDate) : "No due date"}</span>
      ${overdueBadge}
    </div>
    <div class="task-actions">
      ${moveButton}
      <button class="edit-btn" type="button" data-action="edit">Edit</button>
      <button class="delete-btn" type="button" data-action="delete">Delete</button>
    </div>
  `;

  card.addEventListener("dragstart", event => {
    draggedId = task.id;
    event.dataTransfer.effectAllowed = "move";
    card.classList.add("dragging");
  });

  card.addEventListener("dragend", () => {
    draggedId = null;
    card.classList.remove("dragging");
    document.querySelectorAll(".column").forEach(column => column.classList.remove("drag-over"));
  });

  card.addEventListener("click", event => {
    const action = event.target.dataset.action;

    if (action === "edit") openEditModal(task.id);
    if (action === "delete") deleteTask(task.id);
    if (action === "move") moveTaskToNextStatus(task.id);
  });

  return card;
}

function getNextStatus(status) {
  const index = statusOrder.indexOf(status);

  if (index === -1 || index === statusOrder.length - 1) return null;

  return statusOrder[index + 1];
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.status === "done").length;
  const active = total - completed;
  const overdue = tasks.filter(isOverdue).length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById("totalTasks").textContent = total;
  document.getElementById("activeTasks").textContent = active;
  document.getElementById("completedTasks").textContent = completed;
  document.getElementById("overdueTasks").textContent = overdue;

  document.getElementById("progressPercent").textContent = progress;
  document.getElementById("progressBar").style.width = `${progress}%`;
  document.getElementById("progressLabel").textContent = total === 0
    ? "No tasks yet"
    : `${completed} of ${total} tasks done`;

  statusOrder.forEach(status => {
    document.getElementById(`${status}Count`).textContent = tasks.filter(task => task.status === status).length;
  });
}

function getFormData(prefix = "task") {
  return {
    title: document.getElementById(`${prefix}Title`).value.trim(),
    priority: document.getElementById(`${prefix}Priority`).value,
    status: document.getElementById(`${prefix}Status`).value,
    dueDate: document.getElementById(`${prefix}DueDate`).value,
    category: document.getElementById(`${prefix}Category`).value.trim() || "General",
    description: document.getElementById(`${prefix}Description`).value.trim()
  };
}

function addTask(event) {
  event.preventDefault();

  const data = getFormData("task");

  tasks.unshift({
    id: createId(),
    ...data,
    createdAt: new Date().toISOString()
  });

  saveTasks();
  taskForm.reset();
  renderTasks();
  showToast("Task added successfully.");
}

function deleteTask(id) {
  const confirmed = confirm("Delete this task?");

  if (!confirmed) return;

  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderTasks();
  showToast("Task deleted.");
}

function moveTaskToNextStatus(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;

  const nextStatus = getNextStatus(task.status);
  if (!nextStatus) return;

  task.status = nextStatus;
  saveTasks();
  renderTasks();
  showToast(`Moved to ${statusMap[nextStatus]}.`);
}

function openEditModal(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;

  editingId = id;
  document.getElementById("editTitle").value = task.title;
  document.getElementById("editPriority").value = task.priority;
  document.getElementById("editStatus").value = task.status;
  document.getElementById("editDueDate").value = task.dueDate;
  document.getElementById("editCategory").value = task.category;
  document.getElementById("editDescription").value = task.description;
  editModal.classList.remove("hidden");
}

function closeEditModal() {
  editingId = null;
  editModal.classList.add("hidden");
}

function saveEditedTask(event) {
  event.preventDefault();

  const task = tasks.find(item => item.id === editingId);
  if (!task) return;

  Object.assign(task, getFormData("edit"));
  saveTasks();
  closeEditModal();
  renderTasks();
  showToast("Task updated.");
}

function handleDrop(event) {
  event.preventDefault();

  const column = event.currentTarget;
  const status = column.dataset.status;
  const task = tasks.find(item => item.id === draggedId);

  if (task && status) {
    task.status = status;
    saveTasks();
    renderTasks();
    showToast(`Moved to ${statusMap[status]}.`);
  }

  column.classList.remove("drag-over");
}

function exportCSV() {
  if (tasks.length === 0) {
    showToast("No tasks to export.");
    return;
  }

  const headers = ["Title", "Description", "Priority", "Status", "Due Date", "Category", "Created At"];
  const rows = tasks.map(task => [
    task.title,
    task.description,
    task.priority,
    statusMap[task.status],
    task.dueDate,
    task.category,
    task.createdAt
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(value => `"${String(value || "").replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "kanban-tasks.csv";
  link.click();
  URL.revokeObjectURL(url);
  showToast("CSV exported.");
}

function loadSampleData() {
  const confirmed = tasks.length > 0
    ? confirm("This will add sample tasks to your current board. Continue?")
    : true;

  if (!confirmed) return;

  const today = new Date();
  const addDays = days => {
    const date = new Date(today);
    date.setDate(today.getDate() + days);
    return date.toISOString().slice(0, 10);
  };

  const sampleTasks = [
    {
      id: createId(),
      title: "Improve portfolio hero section",
      description: "Make the introduction stronger and add clearer call-to-action buttons.",
      priority: "High",
      status: "todo",
      dueDate: addDays(2),
      category: "Portfolio",
      createdAt: new Date().toISOString()
    },
    {
      id: createId(),
      title: "Review project links",
      description: "Check every live demo and GitHub repository link in the portfolio.",
      priority: "Medium",
      status: "inprogress",
      dueDate: addDays(1),
      category: "Quality Check",
      createdAt: new Date().toISOString()
    },
    {
      id: createId(),
      title: "Prepare resume project section",
      description: "Write short descriptions for the best portfolio projects.",
      priority: "High",
      status: "review",
      dueDate: addDays(4),
      category: "Career",
      createdAt: new Date().toISOString()
    },
    {
      id: createId(),
      title: "Publish Kanban Task Board",
      description: "Deploy the project using GitHub Pages.",
      priority: "Low",
      status: "done",
      dueDate: addDays(-1),
      category: "GitHub",
      createdAt: new Date().toISOString()
    }
  ];

  tasks = [...sampleTasks, ...tasks];
  saveTasks();
  renderTasks();
  showToast("Sample tasks added.");
}

function clearDoneTasks() {
  const doneCount = tasks.filter(task => task.status === "done").length;

  if (doneCount === 0) {
    showToast("No completed tasks to clear.");
    return;
  }

  const confirmed = confirm(`Clear ${doneCount} completed task(s)?`);

  if (!confirmed) return;

  tasks = tasks.filter(task => task.status !== "done");
  saveTasks();
  renderTasks();
  showToast("Completed tasks cleared.");
}

function setTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  themeToggle.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
}

function initTheme() {
  setTheme(localStorage.getItem(THEME_KEY) || "light");
}

function toggleTheme() {
  const currentTheme = document.body.dataset.theme || "light";
  setTheme(currentTheme === "dark" ? "light" : "dark");
}

function initDragAndDrop() {
  document.querySelectorAll(".column").forEach(column => {
    column.addEventListener("dragover", event => {
      event.preventDefault();
      column.classList.add("drag-over");
    });

    column.addEventListener("dragleave", () => {
      column.classList.remove("drag-over");
    });

    column.addEventListener("drop", handleDrop);
  });
}

function init() {
  initTheme();
  initDragAndDrop();
  renderTasks();
}

taskForm.addEventListener("submit", addTask);
editForm.addEventListener("submit", saveEditedTask);
closeModalButton.addEventListener("click", closeEditModal);
cancelEditButton.addEventListener("click", closeEditModal);
editModal.addEventListener("click", event => {
  if (event.target === editModal) closeEditModal();
});

themeToggle.addEventListener("click", toggleTheme);
exportButton.addEventListener("click", exportCSV);
sampleDataButton.addEventListener("click", loadSampleData);
resetFormButton.addEventListener("click", () => taskForm.reset());
clearDoneButton.addEventListener("click", clearDoneTasks);
searchInput.addEventListener("input", renderTasks);
statusFilter.addEventListener("change", renderTasks);
priorityFilter.addEventListener("change", renderTasks);

document.addEventListener("DOMContentLoaded", init);
