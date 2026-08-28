// Daily Tracker — Todos + Habits (vanilla JS)
// Storage keys - keep separate from portfolio theme key
const TODO_KEY = 'daily-tracker-todos';
const HABIT_KEY = 'daily-tracker-habits';

// --- helpers ---
const toMinutes = (val, unit) => Math.round(parseFloat(val) * (unit === 'h' ? 60 : 1));
const formatDuration = (mins) => {
  if (!mins) return '';
  const h = Math.floor(mins / 60), m = mins % 60;
  return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`;
};

function getTodayString() {
  // YYYY-MM-DD in local time, easy to compare
  const d = new Date();
  return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function getDueLabel(dateStr) {
  if (!dateStr) return '';
  const today = getTodayString();
  const t = new Date(); t.setDate(t.getDate() + 1);
  const tomorrow = new Date(t - t.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  const diff = (new Date(dateStr) - new Date(today)) / 86400000;
  if (diff < 0) return 'Overdue';
  if (diff < 7) return 'This week';
  return 'Later';
}
function getTomorrowString() {
  const t = new Date(); t.setDate(t.getDate() + 1);
  return new Date(t - t.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
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
todos = todos.map(t => {
  if (t.duration != null && t.unit && !t.durationConverted) {
    const isH = t.unit === 'h';
    return { ...t, duration: isH ? t.duration * 60 : t.duration, unit: undefined };
  }
  return t;
});
let todoFilter = 'all';
todos = todos.map(t => t.dueDate ? t : { ...t, dueDate: getTodayString() });

const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoDuration = document.getElementById('todo-duration');
const todoUnit = document.getElementById('todo-unit');
const todoDate = document.getElementById('todo-date');
const todoList = document.getElementById('todo-list');
const todoEmpty = document.getElementById('todo-empty');
const todoStats = document.getElementById('todo-stats');
const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');

todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = todoInput.value.trim();
  const unitVal = todoUnit.value; // move before use
  const raw = todoDuration.value ? parseFloat(todoDuration.value) : null;
  const mins = raw ? toMinutes(raw, unitVal) : null;
  const dueDate = todoDate.value || getTodayString();
  if (!text) return;
  if (todos.some(t => t.text.toLowerCase() === text.toLowerCase() && t.dueDate === dueDate)) {
    alert(`Todo "${text}" already exists for ${getDueLabel(dueDate)}.`);
    return;
  }
  todos.unshift({ id: Date.now().toString(), text, completed: false, duration: mins, dueDate });
  todoInput.value = '';
  todoDuration.value = '';
  todoDate.value = '';
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
    const dueLabel = getDueLabel(todo.dueDate);
    const durText = formatDuration(todo.duration);
    const isHabit = habits.some(h => h.name.toLowerCase() === todo.text.toLowerCase());
    li.innerHTML = `
      <input type="checkbox" ${todo.completed ? 'checked' : ''} aria-label="toggle">
      <span class="item-text ${todo.completed ? 'done' : ''}"></span>
      <div class="pill-group"></div>
      <button class="icon-btn habit-btn" title="Make habit">→ Habit</button>
      <button class="icon-btn delete-btn" title="Delete">×</button>
    `;
    li.querySelector('.item-text').textContent = todo.text;
    const pillGroup = li.querySelector('.pill-group');
    if (dueLabel) { const s=document.createElement('span'); s.className='pill'; s.textContent=dueLabel; pillGroup.appendChild(s); }
    if (durText) { const s=document.createElement('span'); s.className='pill'; s.textContent=durText; pillGroup.appendChild(s); }
    if (isHabit) {
      const s=document.createElement('span'); s.className='pill'; s.textContent='Habits'; pillGroup.appendChild(s);
      li.querySelector('.habit-btn').remove();
    } else {
      li.querySelector('.habit-btn').addEventListener('click', () => {
        if (habits.some(h => h.name.toLowerCase() === todo.text.toLowerCase())) {
          alert(`Habit "${todo.text}" already exists.`);
          return;
        }
        habits.unshift({ id: Date.now().toString(), name: todo.text, completedDates: [], duration: todo.duration });
        saveJSON(HABIT_KEY, habits);
        renderHabits();
        renderTodos();
      });
    }
    const cb = li.querySelector('input');
    cb.addEventListener('change', () => {
      todo.completed = cb.checked;
      saveJSON(TODO_KEY, todos);
      renderTodos();
    });
    li.querySelector('.delete-btn').addEventListener('click', () => {
      todos = todos.filter(t => t.id !== todo.id);
      saveJSON(TODO_KEY, todos);
      renderTodos();
    });
    todoList.appendChild(li);
  });
}

// --- HABITS ---
// habit: {id, name, completedDates: [], duration}
let habits = loadJSON(HABIT_KEY, []);
habits = habits.map(h => {
  if (Array.isArray(h.completedDates)) return h;
  return { id: h.id, name: h.name, completedDates: h.lastDone ? [h.lastDone] : [], duration: h.duration || null, unit: h.unit || 'm' };
});

const habitForm = document.getElementById('habit-form');
const habitInput = document.getElementById('habit-input');
const habitDuration = document.getElementById('habit-duration');
const habitUnit = document.getElementById('habit-unit');
const habitList = document.getElementById('habit-list');
const habitEmpty = document.getElementById('habit-empty');

habitForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = habitInput.value.trim();
  const hUnitVal = habitUnit.value;
  const hRaw = habitDuration.value ? parseFloat(habitDuration.value) : null;
  const hMins = hRaw ? toMinutes(hRaw, hUnitVal) : null;
  if (!name) return;
  if (habits.some(h => h.name.toLowerCase() === name.toLowerCase())) {
    alert(`Habit "${name}" already exists.`);
    return;
  }
  habits.unshift({ id: Date.now().toString(), name, completedDates: [], duration: hMins, });
  habitInput.value = '';
  habitDuration.value = '';
  habitInput.focus();
  saveJSON(HABIT_KEY, habits);
  renderHabits();
});

function isDoneToday(h) { return h.completedDates.includes(getTodayString()); }

function toggleHabitToday(habit) {
  const today = getTodayString();
  if (isDoneToday(habit)) {
    // undo today — decrement streak, clear lastDone to yesterday logic simplified
    habit.completedDates = habit.completedDates.filter(d => d !== today);
  } else {
    habit.completedDates.push(today);
  }
  saveJSON(HABIT_KEY, habits);
  renderHabits();
}

function getStreak(h) {
  const set = new Set(h.completedDates);
  let streak = 0, d = new Date();
  while (true) {
    const s = new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    if (set.has(s)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

function renderHabits() {
  habitEmpty.style.display = habits.length ? 'none' : 'block';
  habitList.innerHTML = '';
  habits.forEach(h => {
    const done = isDoneToday(h);
    const li = document.createElement('li');
    li.className = 'item';
    const hDur = formatDuration(h.duration) ? `${formatDuration(h.duration)} • ` : '';
    li.innerHTML = `
      <input type="checkbox" ${done ? 'checked' : ''} aria-label="mark done today">
      <span class="item-text ${done ? 'done' : ''}"></span>
      <span class="item-meta">${hDur}🔥 ${getStreak(h)} day${getStreak(h) !== 1 ? 's' : ''}</span>
      <button class="icon-btn todo-btn" title="Add to todos (tomorrow)">→ Todo</button>
      <button class="icon-btn" title="Delete">×</button>
    `;
    li.querySelector('.item-text').textContent = h.name;
    li.querySelector('input').addEventListener('change', () => toggleHabitToday(h));
    li.querySelector('.todo-btn').addEventListener('click', () => {
      const tomorrow = getTomorrowString();
      if (todos.some(t => t.text.toLowerCase() === h.name.toLowerCase() && t.dueDate === tomorrow)) {
        alert(`Todo "${h.name}" already exists for Tomorrow.`);
        return;
      }
      todos.unshift({ id: Date.now().toString(), text: h.name, completed: false, duration: h.duration, dueDate: tomorrow });
      saveJSON(TODO_KEY, todos);
      renderTodos();
      alert(`Added "${h.name}" to Tomorrow's todos.`);
    });
    li.querySelector('.icon-btn:last-child').addEventListener('click', () => {
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
