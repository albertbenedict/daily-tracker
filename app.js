// Daily Tracker — Todos + Habits (vanilla JS)
// Storage keys - keep separate from portfolio theme key
const TODO_KEY = 'daily-tracker-todos';
const HABIT_KEY = 'daily-tracker-habits';

// --- helpers ---
function getTodayString() {
  // YYYY-MM-DD in local time, easy to compare
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

// --- theme toggle (same as portfolio js/script.js:13) ---
const themeSwitch = document.getElementById('theme-switch');
if (themeSwitch) {
  themeSwitch.checked = document.documentElement.getAttribute('data-theme') === 'dark';
  themeSwitch.addEventListener('change', () => {
    const t = themeSwitch.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
  });
}

// --- tabs ---
const tabBtns = document.querySelectorAll('.tab-btn');
const panels = { todos: document.getElementById('todos-panel'), habits: document.getElementById('habits-panel') };
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    Object.values(panels).forEach(p => p.classList.remove('active'));
    panels[btn.dataset.tab].classList.add('active');
  });
});

// --- TODOS ---
let todos = loadJSON(TODO_KEY, []); // {id, text, completed}
let todoFilter = 'all';

const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoDuration = document.getElementById('todo-duration');
const todoUnit = document.getElementById('todo-unit');
const todoList = document.getElementById('todo-list');
const todoEmpty = document.getElementById('todo-empty');
const todoStats = document.getElementById('todo-stats');
const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');

todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = todoInput.value.trim();
  const durVal = todoDuration.value ? parseInt(todoDuration.value, 10) : null;
  const unitVal = todoUnit.value;
  if (!text) return;
  if (todos.some(t => t.text.toLowerCase() === text.toLowerCase())) {
    alert(`Todo "${text}" already exists.`);
    return;
  }
  todos.unshift({ id: Date.now().toString(), text, completed: false, duration: durVal, unit: unitVal });
  todoInput.value = '';
  todoDuration.value = '';
  todoInput.focus();
  saveJSON(TODO_KEY, todos);
  renderTodos();
});

filterBtns.forEach(b => b.addEventListener('click', () => {
  filterBtns.forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  todoFilter = b.dataset.filter;
  renderTodos();
}));

document.getElementById('clear-completed').addEventListener('click', () => {
  todos = todos.filter(t => !t.completed); // keep only active
  saveJSON(TODO_KEY, todos);
  renderTodos();
});

function renderTodos() {
  const filtered = todos.filter(t => {
    if (todoFilter === 'active') return !t.completed;
    if (todoFilter === 'completed') return t.completed;
    return true;
  });

  const activeCount = todos.filter(t => !t.completed).length;
  todoStats.textContent = `${activeCount} left • ${todos.length} total`;
  todoEmpty.style.display = filtered.length ? 'none' : 'block';
  document.getElementById('clear-completed').style.display = todos.some(t => t.completed) ? 'block' : 'none';

  todoList.innerHTML = '';
  filtered.forEach(todo => {
    const li = document.createElement('li');
    li.className = 'item';
    const durLabel = todo.duration ? ` • ${todo.duration}${todo.unit || 'm'}` : '';
    li.innerHTML = `
      <input type="checkbox" ${todo.completed ? 'checked' : ''} aria-label="toggle">
      <span class="item-text ${todo.completed ? 'done' : ''}"></span>
      <span class="item-meta">${durLabel}</span>
      <button class="icon-btn" title="Delete">×</button>
    `;
    li.querySelector('.item-text').textContent = todo.text;
    li.querySelector('.item-meta').textContent = durLabel ? durLabel.trim().slice(2) : '';
    const cb = li.querySelector('input');
    cb.addEventListener('change', () => {
      todo.completed = cb.checked;
      saveJSON(TODO_KEY, todos);
      if (todo.completed) upsertHabitFromTodo(todo.text, todo.duration, todo.unit);
      renderTodos();
    });
    li.querySelector('.icon-btn').addEventListener('click', () => {
      todos = todos.filter(t => t.id !== todo.id);
      saveJSON(TODO_KEY, todos);
      renderTodos();
    });
    todoList.appendChild(li);
  });
}

// --- HABITS ---
// habit: {id, name, streak, lastDone: 'YYYY-MM-DD'|null} — auto-derived from todos
let habits = loadJSON(HABIT_KEY, []);

const habitList = document.getElementById('habit-list');
const habitEmpty = document.getElementById('habit-empty');

function upsertHabitFromTodo(todoText, todoDuration, todoUnit) {
  const name = todoText.trim();
  if (!name) return;
  let habit = habits.find(h => h.name.toLowerCase() === name.toLowerCase());
  if (habit) {
    // if not already done today, mark done and handle streak
    if (!isDoneToday(habit)) toggleHabitToday(habit);
  } else {
    habit = { id: Date.now().toString(), name, streak: 1, lastDone: getTodayString(), duration: todoDuration || null, unit: todoUnit || 'm' };
    habits.unshift(habit);
    saveJSON(HABIT_KEY, habits);
    renderHabits();
  }
}

function isDoneToday(h) { return h.lastDone === getTodayString(); }

function toggleHabitToday(habit) {
  const today = getTodayString();
  if (isDoneToday(habit)) {
    // undo today — decrement streak, clear lastDone to yesterday logic simplified
    habit.lastDone = null;
    habit.streak = Math.max(0, habit.streak - 1);
  } else {
    // check if consecutive: if lastDone was yesterday, increment, else start at 1
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);
    if (habit.lastDone === yStr) habit.streak += 1;
    else if (habit.lastDone === today) { /* already done */ }
    else habit.streak = habit.streak === 0 ? 1 : habit.streak + 1;
    // Correction: if gap >1 day and streak>0, reset to 1
    // We detect gap by not yesterday and not null
    if (habit.lastDone && habit.lastDone !== yStr && habit.lastDone !== today) {
      habit.streak = 1;
    }
    habit.lastDone = today;
  }
  saveJSON(HABIT_KEY, habits);
  renderHabits();
}

function renderHabits() {
  habitEmpty.style.display = habits.length ? 'none' : 'block';
  habitList.innerHTML = '';
  habits.forEach(h => {
    const done = isDoneToday(h);
    const li = document.createElement('li');
    li.className = 'item';
    const hDur = h.duration ? `${h.duration}${h.unit || 'm'} • ` : '';
    li.innerHTML = `
      <input type="checkbox" ${done ? 'checked' : ''} aria-label="mark done today">
      <span class="item-text ${done ? 'done' : ''}"></span>
      <span class="item-meta">${hDur}🔥 ${h.streak} day${h.streak !== 1 ? 's' : ''}</span>
      <button class="icon-btn" title="Delete">×</button>
    `;
    li.querySelector('.item-text').textContent = h.name;
    li.querySelector('input').addEventListener('change', () => toggleHabitToday(h));
    li.querySelector('.icon-btn').addEventListener('click', () => {
      habits = habits.filter(x => x.id !== h.id);
      saveJSON(HABIT_KEY, habits);
      renderHabits();
    });
    habitList.appendChild(li);
  });
}

// initial render
renderTodos();
renderHabits();
