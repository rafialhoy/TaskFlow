// Get modal element
const modal = document.getElementById("task-modal");
const openModalBtn = document.getElementById("open-modal-btn");
const closeModalBtn = document.getElementById("close-modal-btn");
const taskForm = document.getElementById("task-form");

// Task columns
const pipelineColumn = document.getElementById("pipeline");
const inProgressColumn = document.getElementById("in-progress");
const readyColumn = document.getElementById("ready");
const blockedColumn = document.getElementById("blocked");

// Task counters
const taskCounters = {
  pipeline: document.querySelector(".kanban-column:nth-child(1) .task-count"),
  inProgress: document.querySelector(".kanban-column:nth-child(2) .task-count"),
  ready: document.querySelector(".kanban-column:nth-child(3) .task-count"),
  blocked: document.querySelector(".kanban-column:nth-child(4) .task-count"),
};

// Category colors
const categoryColors = {
  Personal: "#fc7783", // Red-ish
  "Family Office": "#717eee", // Purple
  University: "#fdbb54", // Orange
  "Full-Time Job": "#46bfff", // Light Blue
};

// Initialize tasks from local storage
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// Load tasks on page load
window.addEventListener("DOMContentLoaded", loadTasks);

// Listen for open modal button click
openModalBtn.addEventListener("click", () => {
  modal.style.display = "flex";
});

// Listen for close modal button click
closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

// Close modal if user clicks outside
window.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

// Handle form submission
taskForm.addEventListener("submit", (event) => {
  event.preventDefault(); // Prevent form submission

  // Get form values
  const taskName = document.getElementById("task-name").value;
  const taskDesc = document.getElementById("task-desc").value;
  const taskCategory = document.getElementById("task-category").value;
  const taskDeadline = document.getElementById("task-deadline").value;

  // Create task object
  const task = {
    id: Date.now(), // Use timestamp as unique ID
    name: taskName,
    desc: taskDesc,
    category: taskCategory,
    deadline: taskDeadline,
    column: "pipeline", // Default to pipeline when created
  };

  // Add task to local storage
  tasks.push(task);
  saveTasks();

  // Add task to UI
  createTaskCard(task, pipelineColumn);
  sortTasksInColumn(pipelineColumn);

  // Update task counters
  updateTaskCounters();

  // Clear form and close modal
  taskForm.reset();
  modal.style.display = "none";
});

// Function to create a task card and append to the correct column
function createTaskCard(task, column) {
  const taskCard = document.createElement("div");
  taskCard.classList.add("task-card");
  taskCard.draggable = true;
  taskCard.dataset.id = task.id; // Assign task ID

  // Assign category color
  taskCard.style.backgroundColor = categoryColors[task.category];
  taskCard.style.color = "white"; // Ensuring text contrast

  // Format the deadline
  const formattedDeadline = formatDeadline(task.deadline);

  // Add task info to the card, including a close/delete button (X)
  taskCard.innerHTML = `
      <span class="close-card" data-id="${task.id}">&times;</span>
      <div class="task-card-info">
        <p><strong>${task.name}</strong></p>
        <p>${task.desc}</p>
        <p>Category: ${task.category}</p>
        <p>Deadline: ${formattedDeadline}</p> <!-- Show formatted deadline -->
      </div>
    `;

  // Add special class if the task is due today
  if (isDueToday(task.deadline)) {
    taskCard.classList.add("due-today");
  }

  // Add event listeners for drag functionality
  taskCard.addEventListener("dragstart", dragStart);
  taskCard.addEventListener("dragend", dragEnd);

  // Add event listener for delete functionality
  taskCard.querySelector(".close-card").addEventListener("click", (event) => {
    const taskId = event.target.dataset.id;
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTask(taskId, taskCard);
    }
  });

  // Append task card to the specified column
  column.appendChild(taskCard);
}

// Helper function to parse deadline as a local date (no time zone issues)
function parseLocalDate(deadline) {
  const [year, month, day] = deadline.split("-");
  return new Date(year, month - 1, day); // month is 0-based
}

// Helper function to format the deadline
function formatDeadline(deadline) {
  const date = parseLocalDate(deadline); // Parse the deadline as local date
  const today = new Date();

  // Create copies of 'today' for comparisons
  const yesterday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 1
  ); // Yesterday
  const tomorrow = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  ); // Tomorrow

  // Check if the deadline is today, tomorrow, or yesterday
  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  if (isSameDay(date, tomorrow)) return "Tomorrow";

  // Otherwise, format the date as "Fri 13 Sep"
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// Helper function to check if two dates are the same day
function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Helper function to check if the task is due today
function isDueToday(deadline) {
  const today = new Date();
  const date = parseLocalDate(deadline); // Parse deadline as local date
  return isSameDay(date, today);
}

// Function to update task counters
function updateTaskCounters() {
  taskCounters.pipeline.textContent = pipelineColumn.children.length;
  taskCounters.inProgress.textContent = inProgressColumn.children.length;
  taskCounters.ready.textContent = readyColumn.children.length;
  taskCounters.blocked.textContent = blockedColumn.children.length;
}

// Drag and Drop Functionality
let draggedTask = null;

function dragStart(event) {
  draggedTask = event.target;
  setTimeout(() => (event.target.style.display = "none"), 0); // Hide the dragged task
}

function dragEnd(event) {
  setTimeout(() => {
    draggedTask.style.display = "block"; // Show the dragged task
    draggedTask = null;
  }, 0);
}

// Function to sort tasks in the column by deadline
function sortTasksInColumn(column) {
  const taskCards = Array.from(column.children);

  // Sort task cards by deadline (earliest first)
  taskCards.sort((a, b) => {
    const deadlineA = new Date(
      a.querySelector("p:nth-child(4)").textContent.replace("Deadline: ", "")
    );
    const deadlineB = new Date(
      b.querySelector("p:nth-child(4)").textContent.replace("Deadline: ", "")
    );
    return deadlineA - deadlineB;
  });

  // Append the sorted task cards back into the column
  taskCards.forEach((card) => column.appendChild(card));
}

// Enable drop functionality on columns
[pipelineColumn, inProgressColumn, readyColumn, blockedColumn].forEach(
  (column) => {
    column.addEventListener("dragover", dragOver);
    column.addEventListener("drop", dragDrop);
  }
);

function dragOver(event) {
  event.preventDefault(); // Prevent default to allow dropping
}

function dragDrop(event) {
  event.preventDefault();
  if (draggedTask && event.target.classList.contains("kanban-tasks")) {
    event.target.appendChild(draggedTask);

    // Update the task's column in local storage
    const taskId = draggedTask.dataset.id;
    const newColumn = event.target.id;
    updateTaskColumn(taskId, newColumn);

    // Sort the tasks in the new column
    sortTasksInColumn(event.target);

    updateTaskCounters(); // Update counters after drop
  }
}

// Save tasks to local storage
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Load tasks from local storage and display them
function loadTasks() {
  tasks.forEach((task) => {
    const column = document.getElementById(task.column);
    createTaskCard(task, column);
  });
  updateTaskCounters(); // Update task counts when loading tasks
}

// Update the column of the task in local storage
function updateTaskColumn(taskId, newColumn) {
  tasks = tasks.map((task) => {
    if (task.id == taskId) {
      task.column = newColumn; // Update column
    }
    return task;
  });
  saveTasks(); // Save updated tasks
}

// Delete task
function deleteTask(taskId, taskCard) {
  tasks = tasks.filter((task) => task.id != taskId); // Remove task from array
  taskCard.remove(); // Remove from UI
  saveTasks(); // Save updated tasks
  updateTaskCounters(); // Update counters after deletion
}
