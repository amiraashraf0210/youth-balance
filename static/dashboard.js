// Dashboard JavaScript
// Global variables
let currentSection = 'overview';
let userTasks = [];
let userNotes = [];
let userGoals = [];
// Initialize dashboard
document.addEventListener('DOMContentLoaded', function () {
    initializeDashboard();
    loadAllData();
});
// Initialize dashboard functionality
function initializeDashboard() {
    // Setup navigation
    setupNavigation();
    // Setup forms
    setupForms();
    // Setup modal functionality
    setupModals();
    // Load initial data
    loadDashboardStats();
}
// Setup navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
            // Get section name
            const section = this.getAttribute('data-section');
            // Show corresponding section
            showSection(section);
        });
    });
}
// Show specific section
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    // Show target section
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionName;
        // Load section-specific data
        loadSectionData(sectionName);
    }
}
// Load section-specific data
function loadSectionData(section) {
    switch (section) {
        case 'tasks':
            loadTasks();
            break;
        case 'notes':
            loadNotes();
            break;
        case 'goals':
            loadGoals();
            break;
        case 'overview':
            loadDashboardStats();
            break;
    }
}
// Setup forms
function setupForms() {
    // Task form
    const taskForm = document.getElementById('addTaskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (taskForm.dataset.mode === 'edit') {
                handleUpdateTask(taskForm.dataset.editId, e);
            } else {
                handleAddTask(e);
            }
        });
    }
    // Note form
    const noteForm = document.getElementById('addNoteForm');
    if (noteForm) {
        noteForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (noteForm.dataset.mode === 'edit') {
                handleUpdateNote(noteForm.dataset.editId, e);
            } else {
                handleAddNote(e);
            }
        });
    }
    // Goal form
    const goalForm = document.getElementById('addGoalForm');
    if (goalForm) {
        goalForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (goalForm.dataset.mode === 'edit') {
                handleUpdateGoal(goalForm.dataset.editId, e);
            } else {
                handleAddGoal(e);
            }
        });
    }
}
// Handle add task
async function handleAddTask(e) {
    const formData = new FormData(e.target);
    const taskData = {
        title: formData.get('title'),
        description: formData.get('description'),
        priority: formData.get('priority'),
        category: formData.get('category')
    };
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskData)
        });
        if (response.ok) {
            const result = await response.json();
            showNotification('Task added successfully!', 'success');
            closeModal('addTaskModal');
            e.target.reset();
            loadTasks();
            loadDashboardStats();
        } else {
            showNotification('Error adding task', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error adding task', 'error');
    }
}
// Handle add note
async function handleAddNote(e) {
    const formData = new FormData(e.target);
    const noteData = {
        title: formData.get('title'),
        content: formData.get('content'),
        category: formData.get('category'),
        color: formData.get('color')
    };
    try {
        const response = await fetch('/api/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(noteData)
        });
        if (response.ok) {
            showNotification('Note added successfully!', 'success');
            closeModal('addNoteModal');
            e.target.reset();
            loadNotes();
            loadDashboardStats();
        } else {
            showNotification('Error adding note', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error adding note', 'error');
    }
}
// Handle add goal
async function handleAddGoal(e) {
    const formData = new FormData(e.target);
    const goalData = {
        title: formData.get('title'),
        description: formData.get('description'),
        target_date: formData.get('target_date')
    };
    try {
        const response = await fetch('/api/goals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(goalData)
        });
        if (response.ok) {
            showNotification('Goal added successfully!', 'success');
            closeModal('addGoalModal');
            e.target.reset();
            loadGoals();
            loadDashboardStats();
        } else {
            showNotification('Error adding goal', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error adding goal', 'error');
    }
}
// Load tasks
async function loadTasks() {
    try {
        const response = await fetch('/api/tasks');
        if (response.ok) {
            const tasks = await response.json();
            userTasks = tasks;
            renderTasks(tasks);
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}
// Render tasks
function renderTasks(tasks) {
    const container = document.getElementById('tasks-grid');
    if (!container) return;
    container.innerHTML = '';
    if (tasks.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-tasks"></i><p>No tasks yet. Add your first task!</p></div>';
        return;
    }
    tasks.forEach(task => {
        const taskCard = createTaskCard(task);
        container.appendChild(taskCard);
    });
}
// Create task card
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = `task-card priority-${task.priority} ${task.completed ? 'completed' : ''}`;
    card.innerHTML = `
        <div class="task-header">
            <div class="task-checkbox">
                <input type="checkbox" ${task.completed ? 'checked' : ''}
                       onchange="toggleTask(${task.id})">
            </div>
            <div class="task-priority priority-${task.priority}"></div>
            <div class="task-actions">
                <button class="btn-icon" onclick="editTask(${task.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="task-content">
            <h3 class="task-title">${task.title}</h3>
            <p class="task-description">${task.description || ''}</p>
            <div class="task-meta">
                <span class="task-category">${task.category}</span>
                <span class="task-date">${formatDate(task.created_at)}</span>
            </div>
        </div>
    `;
    return card;
}
// Load notes
async function loadNotes() {
    try {
        const response = await fetch('/api/notes');
        if (response.ok) {
            const notes = await response.json();
            userNotes = notes;
            renderNotes(notes);
        }
    } catch (error) {
        console.error('Error loading notes:', error);
    }
}
// Render notes
function renderNotes(notes) {
    const container = document.getElementById('notes-grid');
    if (!container) return;
    container.innerHTML = '';
    if (notes.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-sticky-note"></i><p>No notes yet. Add your first note!</p></div>';
        return;
    }
    notes.forEach(note => {
        const noteCard = createNoteCard(note);
        container.appendChild(noteCard);
    });
}
// Create note card
function createNoteCard(note) {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.style.borderLeftColor = note.color;
    card.innerHTML = `
        <div class="note-header">
            <h3 class="note-title">${note.title}</h3>
            <div class="note-actions">
                <button class="btn-icon" onclick="editNote(${note.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="deleteNote(${note.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="note-content">
            <p>${note.content || ''}</p>
        </div>
        <div class="note-meta">
            <span class="note-category">${note.category}</span>
            <span class="note-date">${formatDate(note.created_at)}</span>
        </div>
    `;
    return card;
}
// Load goals
async function loadGoals() {
    try {
        const response = await fetch('/api/goals');
        if (response.ok) {
            const goals = await response.json();
            userGoals = goals;
            renderGoals(goals);
        }
    } catch (error) {
        console.error('Error loading goals:', error);
    }
}
// Render goals
function renderGoals(goals) {
    const container = document.getElementById('goals-grid');
    if (!container) return;
    container.innerHTML = '';
    if (goals.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-bullseye"></i><p>No goals yet. Set your first goal!</p></div>';
        return;
    }
    goals.forEach(goal => {
        const goalCard = createGoalCard(goal);
        container.appendChild(goalCard);
    });
}
// Create goal card
function createGoalCard(goal) {
    const card = document.createElement('div');
    card.className = `goal-card status-${goal.status}`;
    card.innerHTML = `
        <div class="goal-header">
            <h3 class="goal-title">${goal.title}</h3>
            <div class="goal-actions">
                <button class="btn-icon" onclick="editGoal(${goal.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="deleteGoal(${goal.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="goal-content">
            <p>${goal.description || ''}</p>
            <div class="goal-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${goal.progress}%"></div>
                </div>
                <span class="progress-text">${goal.progress}%</span>
            </div>
        </div>
        <div class="goal-meta">
            <span class="goal-date">Target: ${formatDate(goal.target_date)}</span>
            <span class="goal-status">${goal.status}</span>
        </div>
    `;
    return card;
}
// Load dashboard stats
async function loadDashboardStats() {
    try {
        const [tasksRes, notesRes, goalsRes] = await Promise.all([
            fetch('/api/tasks'),
            fetch('/api/notes'),
            fetch('/api/goals')
        ]);
        const tasks = await tasksRes.json();
        const notes = await notesRes.json();
        const goals = await goalsRes.json();
        // Update stats
        document.getElementById('tasks-count').textContent = tasks.filter(t => !t.completed).length;
        document.getElementById('notes-count').textContent = notes.length;
        document.getElementById('goals-count').textContent = goals.filter(g => g.status === 'active').length;
        // Calculate progress
        const completedTasks = tasks.filter(t => t.completed).length;
        const totalTasks = tasks.length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        document.getElementById('progress-percent').textContent = progress + '%';
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}
// Load all data
function loadAllData() {
    loadTasks();
    loadNotes();
    loadGoals();
    loadDashboardStats();
}
// Modal functions
function showAddModal() {
    // Show appropriate modal based on current section
    switch (currentSection) {
        case 'tasks':
            showAddTaskModal();
            break;
        case 'notes':
            showAddNoteModal();
            break;
        case 'goals':
            showAddGoalModal();
            break;
        default:
            showAddTaskModal();
    }
}
function showAddTaskModal() {
    document.getElementById('addTaskModal').style.display = 'block';
}
function showAddNoteModal() {
    document.getElementById('addNoteModal').style.display = 'block';
}
function showAddGoalModal() {
    document.getElementById('addGoalModal').style.display = 'block';
}
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    // Reset forms when closing modals
    if (modalId === 'addTaskModal') {
        resetTaskForm();
    } else if (modalId === 'addNoteModal') {
        resetNoteForm();
    } else if (modalId === 'addGoalModal') {
        resetGoalForm();
    }
}
function setupModals() {
    // Close modal when clicking outside
    window.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal')) {
            const modalId = e.target.id;
            e.target.style.display = 'none';
            // Reset forms when closing modals
            if (modalId === 'addTaskModal') {
                resetTaskForm();
            } else if (modalId === 'addNoteModal') {
                resetNoteForm();
            } else if (modalId === 'addGoalModal') {
                resetGoalForm();
            }
        }
    });
}
// Toggle task completion
async function toggleTask(taskId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}/toggle`, {
            method: 'POST'
        });
        if (response.ok) {
            loadTasks();
            loadDashboardStats();
        }
    } catch (error) {
        console.error('Error toggling task:', error);
    }
}
// Delete functions
async function deleteTask(taskId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            showNotification('Task deleted successfully!', 'success');
            loadTasks();
            loadDashboardStats();
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showNotification('Error deleting task', 'error');
    }
}
async function deleteNote(noteId) {
    try {
        const response = await fetch(`/api/notes/${noteId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            showNotification('Note deleted successfully!', 'success');
            loadNotes();
            loadDashboardStats();
        }
    } catch (error) {
        console.error('Error deleting note:', error);
        showNotification('Error deleting note', 'error');
    }
}
async function deleteGoal(goalId) {
    try {
        const response = await fetch(`/api/goals/${goalId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            showNotification('Goal deleted successfully!', 'success');
            loadGoals();
            loadDashboardStats();
        }
    } catch (error) {
        console.error('Error deleting goal:', error);
        showNotification('Error deleting goal', 'error');
    }
}
// Edit functions
function editTask(taskId) {
    const task = userTasks.find(t => t.id === taskId);
    if (!task) return;
    // Populate form with existing data
    document.getElementById('addTaskForm').querySelector('[name="title"]').value = task.title;
    document.getElementById('addTaskForm').querySelector('[name="description"]').value = task.description || '';
    document.getElementById('addTaskForm').querySelector('[name="priority"]').value = task.priority;
    document.getElementById('addTaskForm').querySelector('[name="category"]').value = task.category;
    // Set form to edit mode
    const form = document.getElementById('addTaskForm');
    form.dataset.mode = 'edit';
    form.dataset.editId = taskId;
    // Change modal title
    document.querySelector('#addTaskModal h3').textContent = 'Edit Task';
    // Show modal
    showAddTaskModal();
}
function editNote(noteId) {
    const note = userNotes.find(n => n.id === noteId);
    if (!note) return;
    // Populate form with existing data
    document.getElementById('addNoteForm').querySelector('[name="title"]').value = note.title;
    document.getElementById('addNoteForm').querySelector('[name="content"]').value = note.content || '';
    document.getElementById('addNoteForm').querySelector('[name="category"]').value = note.category;
    document.getElementById('addNoteForm').querySelector('[name="color"]').value = note.color;
    // Set form to edit mode
    const form = document.getElementById('addNoteForm');
    form.dataset.mode = 'edit';
    form.dataset.editId = noteId;
    // Change modal title
    document.querySelector('#addNoteModal h3').textContent = 'Edit Note';
    // Show modal
    showAddNoteModal();
}
function editGoal(goalId) {
    const goal = userGoals.find(g => g.id === goalId);
    if (!goal) return;
    // Populate form with existing data
    document.getElementById('addGoalForm').querySelector('[name="title"]').value = goal.title;
    document.getElementById('addGoalForm').querySelector('[name="description"]').value = goal.description || '';
    document.getElementById('addGoalForm').querySelector('[name="target_date"]').value = goal.target_date;
    // Set form to edit mode
    const form = document.getElementById('addGoalForm');
    form.dataset.mode = 'edit';
    form.dataset.editId = goalId;
    // Change modal title
    document.querySelector('#addGoalModal h3').textContent = 'Edit Goal';
    // Show modal
    showAddGoalModal();
}
// Handle update task
async function handleUpdateTask(taskId, e) {
    const formData = new FormData(e.target);
    const taskData = {
        title: formData.get('title'),
        description: formData.get('description'),
        priority: formData.get('priority'),
        category: formData.get('category')
    };
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskData)
        });
        if (response.ok) {
            showNotification('Task updated successfully!', 'success');
            closeModal('addTaskModal');
            resetTaskForm();
            loadTasks();
            loadDashboardStats();
        } else {
            showNotification('Error updating task', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error updating task', 'error');
    }
}
// Handle update note
async function handleUpdateNote(noteId, e) {
    const formData = new FormData(e.target);
    const noteData = {
        title: formData.get('title'),
        content: formData.get('content'),
        category: formData.get('category'),
        color: formData.get('color')
    };
    try {
        const response = await fetch(`/api/notes/${noteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(noteData)
        });
        if (response.ok) {
            showNotification('Note updated successfully!', 'success');
            closeModal('addNoteModal');
            resetNoteForm();
            loadNotes();
            loadDashboardStats();
        } else {
            showNotification('Error updating note', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error updating note', 'error');
    }
}
// Handle update goal
async function handleUpdateGoal(goalId, e) {
    const formData = new FormData(e.target);
    const goalData = {
        title: formData.get('title'),
        description: formData.get('description'),
        target_date: formData.get('target_date'),
        progress: 0 // Keep existing progress
    };
    try {
        const response = await fetch(`/api/goals/${goalId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(goalData)
        });
        if (response.ok) {
            showNotification('Goal updated successfully!', 'success');
            closeModal('addGoalModal');
            resetGoalForm();
            loadGoals();
            loadDashboardStats();
        } else {
            showNotification('Error updating goal', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error updating goal', 'error');
    }
}
// Reset form functions
function resetTaskForm() {
    const form = document.getElementById('addTaskForm');
    form.reset();
    delete form.dataset.mode;
    delete form.dataset.editId;
    document.querySelector('#addTaskModal h3').textContent = 'Add New Task';
}
function resetNoteForm() {
    const form = document.getElementById('addNoteForm');
    form.reset();
    delete form.dataset.mode;
    delete form.dataset.editId;
    document.querySelector('#addNoteModal h3').textContent = 'Add New Note';
}
function resetGoalForm() {
    const form = document.getElementById('addGoalForm');
    form.reset();
    delete form.dataset.mode;
    delete form.dataset.editId;
    document.querySelector('#addGoalModal h3').textContent = 'Add New Goal';
}
// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}"></i>
        <span>${message}</span>
    `;
    // Add to page
    document.body.appendChild(notification);
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}
