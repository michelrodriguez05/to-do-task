// ------------------- CONFIG -------------------
const API_URL = 'https://693840b44618a71d77cf8cee.mockapi.io/api/v1/tasks';

// ------------------- DOM -------------------
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const tasksList = document.getElementById('tasksList');

// ------------------- HELPERS -------------------
async function apiFetch(path = '', options = {}) {
  const url = API_URL + path;
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status} - ${text}`);
    }
    // MockAPI returns json on GET/POST etc.
    return await res.json();
  } catch (err) {
    console.error('API error:', err);
    alert('Error con la API: ' + err.message);
    throw err;
  }
}

function createTaskNode(task) {
  const li = document.createElement('li');
  li.className = 'task-item';
  li.dataset.id = task.id;

  const left = document.createElement('div');
  left.className = 'task-left';

  const title = document.createElement('div');
  title.className = 'task-title' + (task.completed ? ' completed' : '');
  title.textContent = task.title || '(sin título)';

  left.appendChild(title);

  const actions = document.createElement('div');
  actions.className = 'task-actions';

  // toggle button (check)
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'icon-btn toggle';
  toggleBtn.title = task.completed ? 'Marcar como no hecho' : 'Marcar como hecho';
  toggleBtn.innerHTML = task.completed ? '✓' : '✔';

  toggleBtn.addEventListener('click', () => toggleTask(task, title, toggleBtn));

  // delete button (trash)
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'icon-btn delete';
  deleteBtn.title = 'Eliminar tarea';
  deleteBtn.innerHTML = '🗑';
  deleteBtn.addEventListener('click', () => deleteTask(task.id, li));

  actions.appendChild(toggleBtn);
  actions.appendChild(deleteBtn);

  li.appendChild(left);
  li.appendChild(actions);

  return li;
}

// ------------------- CRUD -------------------

// Cargar todas las tareas y renderizar
async function loadTasks() {
  try {
    tasksList.innerHTML = '<li style="opacity:0.6; padding:8px">Cargando...</li>';
    const tasks = await apiFetch(''); // GET to API_URL
    tasksList.innerHTML = '';
    if (Array.isArray(tasks) === false || tasks.length === 0) {
      
      return;
    }
    tasks.sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    tasks.forEach(t => tasksList.appendChild(createTaskNode(t)));
  } catch (err) {
    tasksList.innerHTML = '<li style="color:#f66; padding:8px">No se pudieron cargar las tareas.</li>';
  }
}

// Crear nueva tarea (POST)
async function addTask() {
  const title = taskInput.value.trim();
  if (!title) {
    taskInput.focus();
    return;
  }
  const payload = { title, completed: false };
  try {
    const newTask = await apiFetch('', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    // añadir al DOM al inicio
    const node = createTaskNode(newTask);
    tasksList.insertBefore(node, tasksList.firstChild);
    taskInput.value = '';
    taskInput.focus();
  } catch (err) {
    console.error('addTask error', err);
  }
}

// Toggle completed (PUT)
async function toggleTask(task, titleNode, toggleBtn) {
  const newCompleted = !task.completed;
  try {
    const updated = await apiFetch('/' + task.id, {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ ...task, completed: newCompleted })
    });
    task.completed = updated.completed;
    // actualizar UI
    titleNode.classList.toggle('completed', task.completed);
    toggleBtn.innerHTML = task.completed ? '✓' : '✔';
    toggleBtn.title = task.completed ? 'Marcar como no hecho' : 'Marcar como hecho';
  } catch (err) {
    console.error('toggleTask error', err);
  }
}

// Eliminar tarea (DELETE)
async function deleteTask(id, listItemNode) {
  if (!confirm('¿Eliminar esta tarea?')) return;
  try {
    await apiFetch('/' + id, { method: 'DELETE' });
    listItemNode.remove();
    if (tasksList.children.length === 0) tasksList.innerHTML = '<li style="opacity:0.6; padding:8px">No hay tareas aún</li>';
  } catch (err) {
    console.error('deleteTask error', err);
  }
}

// ------------------- EVENTOS -------------------
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

// load on start
if (!API_URL || API_URL.includes('REPLACE_WITH')) {
  alert('⚠️ Pega la URL de tu recurso "tasks" de MockAPI en app.js (const API_URL).');
} else {
  loadTasks();
}
