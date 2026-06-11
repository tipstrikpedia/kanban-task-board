// Utility to generate unique IDs for tasks
function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

// Load tasks from localStorage
function loadTasks() {
  const tasks = localStorage.getItem('kanbanTasks');
  return tasks ? JSON.parse(tasks) : [];
}

// Save tasks to localStorage
function saveTasks(tasks) {
  localStorage.setItem('kanbanTasks', JSON.stringify(tasks));
}

// Render tasks into columns based on status
function renderTasks() {
  // Clear existing tasks
  ['todo', 'inprogress', 'done'].forEach((status) => {
    const list = document.getElementById(`${status}-list`);
    list.innerHTML = '';
  });
  const tasks = loadTasks();
  tasks.forEach((task) => {
    const card = document.createElement('div');
    card.classList.add('task-card');
    card.setAttribute('draggable', 'true');
    card.dataset.id = task.id;
    card.dataset.status = task.status;
    card.innerHTML = `
      <h4>${task.title}</h4>
      <p>${task.description || ''}</p>
      <div class="task-actions">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;
    // Drag events
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    // Buttons
    card.querySelector('.edit-btn').addEventListener('click', () => openEditModal(task));
    card.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));
    // Append to appropriate column
    const list = document.getElementById(`${task.status}-list`);
    list.appendChild(card);
  });
}

// Add a new task
function addTask(title, description) {
  const tasks = loadTasks();
  const newTask = {
    id: generateId(),
    title,
    description,
    status: 'todo',
  };
  tasks.push(newTask);
  saveTasks(tasks);
  renderTasks();
}

// Delete a task
function deleteTask(id) {
  const tasks = loadTasks().filter((task) => task.id !== id);
  saveTasks(tasks);
  renderTasks();
}

// Update a task
function updateTask(updatedTask) {
  const tasks = loadTasks().map((task) => {
    if (task.id === updatedTask.id) {
      return updatedTask;
    }
    return task;
  });
  saveTasks(tasks);
  renderTasks();
}

// Drag and Drop handlers
let draggedCard = null;
function handleDragStart(e) {
  draggedCard = e.target;
  e.target.classList.add('dragging');
}
function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  draggedCard = null;
}

function handleDragOver(e) {
  e.preventDefault();
}
function handleDrop(e) {
  e.preventDefault();
  const column = e.currentTarget;
  if (!draggedCard) return;
  const status = column.dataset.status;
  const id = draggedCard.dataset.id;
  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === id);
  if (task && task.status !== status) {
    task.status = status;
    saveTasks(tasks);
    renderTasks();
  }
}

// Modal functionality
const modal = document.getElementById('modal');
const closeModalBtn = document.getElementById('close-modal');
let currentEditId = null;

function openEditModal(task) {
  currentEditId = task.id;
  document.getElementById('edit-title').value = task.title;
  document.getElementById('edit-desc').value = task.description;
  document.getElementById('edit-status').value = task.status;
  modal.classList.remove('hidden');
}

function closeEditModal() {
  modal.classList.add('hidden');
  currentEditId = null;
}

closeModalBtn.addEventListener('click', closeEditModal);

// Theme toggle
const themeToggle = document.getElementById('theme-toggle');
// Initialize theme based on stored preference
function initTheme() {
  const storedTheme = localStorage.getItem('kanbanTheme') || 'light';
  document.body.setAttribute('data-theme', storedTheme);
  themeToggle.checked = storedTheme === 'dark';
}
themeToggle.addEventListener('change', () => {
  const newTheme = themeToggle.checked ? 'dark' : 'light';
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('kanbanTheme', newTheme);
});

// Event listeners
document.getElementById('task-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('task-title').value.trim();
  const desc = document.getElementById('task-desc').value.trim();
  if (title) {
    addTask(title, desc);
    document.getElementById('task-form').reset();
  }
});

document.getElementById('edit-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!currentEditId) return;
  const title = document.getElementById('edit-title').value.trim();
  const desc = document.getElementById('edit-desc').value.trim();
  const status = document.getElementById('edit-status').value;
  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === currentEditId);
  if (task) {
    task.title = title;
    task.description = desc;
    task.status = status;
    saveTasks(tasks);
    renderTasks();
    closeEditModal();
  }
});

// Allow drop on columns
document.querySelectorAll('.column').forEach((col) => {
  col.addEventListener('dragover', handleDragOver);
  col.addEventListener('drop', handleDrop);
});

// Initialize app
function init() {
  initTheme();
  renderTasks();
}

document.addEventListener('DOMContentLoaded', init);