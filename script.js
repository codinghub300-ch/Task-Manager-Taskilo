// =================== TASK MANAGEMENT =================== //

// Add Task Function
function addTask() {
    let input = document.getElementById('newTask');
    let taskText = input.value.trim();
    if (taskText === '') return;

    let task = createTaskElement(taskText, 'medium'); // Default priority: Medium
    document.getElementById('todo').querySelector('.task-list').appendChild(task); // Always adds to "To Do"

    saveTasks();
    input.value = '';
}

// Create Task Element
function createTaskElement(taskText, priority = 'medium') {
    let task = document.createElement('div');
    task.className = `task ${priority}`;
    task.setAttribute('draggable', true);

    let textSpan = document.createElement('span');
    textSpan.textContent = taskText;
    textSpan.classList.add('task-text');

    let priorityDropdown = createPriorityDropdown(priority);
    let deleteButton = createDeleteButton();

    task.appendChild(textSpan);
    task.appendChild(priorityDropdown);
    task.appendChild(deleteButton);

    // Add event listeners
    task.addEventListener('dragstart', dragStart);
    task.addEventListener('dragend', dragEnd);
    task.addEventListener('dblclick', editTask);

    return task;
}

// Create Priority Dropdown
function createPriorityDropdown(selectedPriority) {
    let select = document.createElement('select');
    select.className = 'priority-dropdown';

    const options = {
        high: '🔥 High',
        medium: '⚡ Medium',
        low: '✅ Low'
    };

    for (let [value, label] of Object.entries(options)) {
        let option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        if (value === selectedPriority) option.selected = true;
        select.appendChild(option);
    }

    select.addEventListener('change', function () {
        let task = this.parentElement;
        task.classList.remove('high', 'medium', 'low');
        task.classList.add(this.value);
        saveTasks();
    });

    return select;
}

// Create Delete Button
function createDeleteButton() {
    let button = document.createElement('button');
    button.textContent = '❌';
    button.className = 'delete-btn';
    button.addEventListener('click', function () {
        this.parentElement.remove();
        saveTasks();
    });
    return button;
}

// =================== DRAG & DROP =================== //

let draggedTask = null;

function dragStart(event) {
    draggedTask = event.target;
    event.target.classList.add('dragging');
}

function dragEnd(event) {
    event.target.classList.remove('dragging');
    draggedTask = null;
    saveTasks();
}

document.querySelectorAll('.task-category').forEach(category => {
    category.addEventListener('dragover', event => {
        event.preventDefault();
        category.classList.add('drag-over');
        let draggingElement = document.querySelector('.dragging');
        let afterElement = getDragAfterElement(category, event.clientY);
        let taskList = category.querySelector('.task-list');
        if (afterElement == null) {
            taskList.appendChild(draggingElement);
        } else {
            taskList.insertBefore(draggingElement, afterElement);
        }
    });

    category.addEventListener('dragleave', () => {
        category.classList.remove('drag-over');
    });

    category.addEventListener('drop', event => {
        event.preventDefault();
        category.classList.remove('drag-over');
        saveTasks();
    });
});

function getDragAfterElement(container, y) {
    let draggableElements = [...container.querySelectorAll('.task:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        let box = child.getBoundingClientRect();
        let offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// =================== TASK EDITING FEATURE =================== //
function editTask(event) {
    let task = event.target.closest('.task');
    let textSpan = task.querySelector('.task-text');
    let oldText = textSpan.textContent;

    let input = document.createElement('input');
    input.type = 'text';
    input.value = oldText;
    input.classList.add('edit-input');

    task.replaceChild(input, textSpan);
    input.focus();

    input.addEventListener('blur', () => {
        let newText = input.value.trim();
        if (newText === '') newText = oldText;
        let newSpan = document.createElement('span');
        newSpan.textContent = newText;
        newSpan.classList.add('task-text');
        task.replaceChild(newSpan, input);
        saveTasks();
    });

    input.addEventListener('keypress', event => {
        if (event.key === 'Enter') input.blur();
    });
}

// =================== TASK STORAGE (LOCAL STORAGE) =================== //

function saveTasks() {
    let tasksData = {};
    document.querySelectorAll('.task-category').forEach(category => {
        let categoryId = category.id;
        let tasks = Array.from(category.querySelectorAll('.task')).map(task => ({
            text: task.querySelector('.task-text').textContent,
            priority: task.classList.contains('high') ? 'high' :
                      task.classList.contains('low') ? 'low' : 'medium'
        }));
        tasksData[categoryId] = tasks;
    });
    localStorage.setItem('tasks', JSON.stringify(tasksData));
    updateGoldCharts(); // Update charts when tasks change
}

function loadTasks() {
    let tasksData = JSON.parse(localStorage.getItem('tasks'));
    if (!tasksData) return;
    for (let category in tasksData) {
        let taskList = document.getElementById(category).querySelector('.task-list');
        tasksData[category].forEach(taskData => {
            let task = createTaskElement(taskData.text, taskData.priority);
            taskList.appendChild(task);
        });
    }
    updateGoldCharts();
}

// =================== THEME TOGGLE =================== //

document.getElementById('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');

    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        document.body.classList.remove('light-mode');
    } else {
        localStorage.setItem('theme', 'light');
        document.body.classList.add('light-mode');
    }

    updateGoldCharts(); // Update chart colors on theme change
});

window.onload = function() {
    let theme = localStorage.getItem('theme');

    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.add('light-mode'); // Ensures correct theme
    }

    loadTasks();
};

// =================== NAVIGATION HIGHLIGHT =================== //
document.querySelectorAll("nav ul li a").forEach(link => {
    if (link.href === window.location.href) {
        link.classList.add("active");
    }
});

// =================== CHARTS (GOLD THEMED) =================== //

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded and parsed");
    updateGoldCharts();
});

let goldPieChart, goldBarChart;

function getTaskStats() {
    const todoCount = document.getElementById("todo")?.querySelectorAll(".task").length || 0;
    const inProgressCount = document.getElementById("in-progress")?.querySelectorAll(".task").length || 0;
    const completedCount = document.getElementById("completed")?.querySelectorAll(".task").length || 0;
    console.log("Task stats:", { todoCount, inProgressCount, completedCount });
    return { todoCount, inProgressCount, completedCount };
}

function updateGoldCharts() {
    const stats = getTaskStats();
    const { todoCount, inProgressCount, completedCount } = stats;

    const ctxPie = document.getElementById("goldPieChart")?.getContext("2d");
    const ctxBar = document.getElementById("goldBarChart")?.getContext("2d");

    if (!ctxPie || !ctxBar) {
        console.error("Canvas elements not found");
        return;
    }

    const pieData = {
        labels: ["To Do", "In Progress", "Completed"],
        datasets: [{
            data: [todoCount, inProgressCount, completedCount],
            backgroundColor: ["#ffd700", "#ffdf00", "#e6ac00"], // Gold hues
            borderColor: ["#b8860b", "#b8860b", "#b8860b"],
            borderWidth: 2
        }]
    };

    const barData = {
        labels: ["To Do", "In Progress", "Completed"],
        datasets: [{
            label: "Tasks",
            data: [todoCount, inProgressCount, completedCount],
            backgroundColor: ["#ffd700", "#ffdf00", "#e6ac00"],
            borderColor: "#b8860b",
            borderWidth: 2
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: document.body.classList.contains("dark-mode") ? "#fff" : "#333",
                    font: { size: 14 }
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => `${context.label}: ${context.raw} tasks`
                }
            }
        },
        animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
        }
    };

    if (goldPieChart) goldPieChart.destroy();
    if (goldBarChart) goldBarChart.destroy();

    goldPieChart = new Chart(ctxPie, {
        type: "doughnut",
        data: pieData,
        options: chartOptions
    });

    goldBarChart = new Chart(ctxBar, {
        type: "bar",
        data: barData,
        options: chartOptions
    });

    console.log("Charts updated");
}
//==================== SUMMARY PROGRESS ==================//
function updateProgressSummary() {
    // Retrieve task statistics from your existing function
    const stats = getTaskStats(); // { todoCount, inProgressCount, completedCount }
    const totalTasks = stats.todoCount + stats.inProgressCount + stats.completedCount;
    const progressPercentage = totalTasks > 0 ? Math.round((stats.completedCount / totalTasks) * 100) : 0;

    // Update the progress bar width and text
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");
    if (progressBar && progressText) {
        progressBar.style.width = progressPercentage + "%";
        progressText.textContent = progressPercentage + "% Completed";
    }
}

// Call updateProgressSummary() whenever tasks are added, removed, or updated
// For example, add it at the end of saveTasks():
function saveTasks() {
    let tasksData = {};
    document.querySelectorAll('.task-category').forEach(category => {
        let categoryId = category.id;
        let tasks = Array.from(category.querySelectorAll('.task')).map(task => ({
            text: task.querySelector('.task-text').textContent,
            priority: task.classList.contains('high') ? 'high' :
                      task.classList.contains('low') ? 'low' : 'medium'
        }));
        tasksData[categoryId] = tasks;
    });
    localStorage.setItem('tasks', JSON.stringify(tasksData));
    updateGoldCharts(); // Update your charts
    updateProgressSummary(); // Update the progress summary panel
}
