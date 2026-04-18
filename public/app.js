// ===================== CONFIG =====================
const DEFAULT_CONFIG = {
  users: {
    u1: { name: 'Usuario 1', avatar: '👤' },
    u2: { name: 'Usuario 2', avatar: '👤' }
  },
  categories: ['Cocina', 'Baño', 'Dormitorio', 'Salón', 'General']
};

const DEFAULT_TASKS = [
  { id: 't1', name: 'Hacer las camas', category: 'Dormitorio', freq: 'daily', active: true },
  { id: 't2', name: 'Limpiar cocina', category: 'Cocina', freq: 'daily', active: true },
  { id: 't3', name: 'Barrer / fregar suelo', category: 'General', freq: 'daily', active: true },
  { id: 't4', name: 'Limpiar baño', category: 'Baño', freq: 'every2days', active: true },
  { id: 't5', name: 'Poner lavadora', category: 'General', freq: 'every2days', active: true },
  { id: 't6', name: 'Recoger salón', category: 'Salón', freq: 'daily', active: true },
];

const FREQ_LABELS = {
  daily: 'Diaria',
  every2days: 'Cada 2 días',
  weekly: 'Semanal',
  asneeded: 'Según necesidad',
  once: 'Puntual'
};

// ===================== STATE =====================
let currentUser = null;
let appState = { tasks: [], completions: {}, categories: [], config: DEFAULT_CONFIG };

function todayStr() { return new Date().toISOString().slice(0, 10); }
function dateStr(d) { return d.toISOString().slice(0, 10); }

async function loadState() {
  try {
    const res = await fetch('/api/state');
    const data = await res.json();
    if (!data.tasks || data.tasks.length === 0) {
      appState = {
        tasks: DEFAULT_TASKS,
        completions: {},
        categories: DEFAULT_CONFIG.categories,
        config: DEFAULT_CONFIG
      };
      await saveState();
    } else {
      if (!data.config) data.config = DEFAULT_CONFIG;
      if (!data.categories) data.categories = DEFAULT_CONFIG.categories;
      appState = data;
    }
  } catch(e) {
    appState = { tasks: DEFAULT_TASKS, completions: {}, categories: DEFAULT_CONFIG.categories, config: DEFAULT_CONFIG };
  }
}

async function saveState() {
  try {
    await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appState)
    });
  } catch(e) { console.error('Error saving', e); }
}

// ===================== HELPERS =====================
function getSpanishDate() {
  const now = new Date();
  const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return days[now.getDay()] + ', ' + now.getDate() + ' de ' + months[now.getMonth()];
}

function getUserName(uid) {
  return appState.config.users[uid] ? appState.config.users[uid].name : uid;
}

function getUserAvatar(uid) {
  return appState.config.users[uid] ? appState.config.users[uid].avatar : '👤';
}

function isTaskDueToday(task) {
  const today = todayStr();
  const completions = appState.completions;
  if (task.freq === 'once') return task.createdOn === today;
  if (task.freq === 'daily' || task.freq === 'asneeded') return true;
  if (task.freq === 'weekly') {
    const now = new Date();
    if (now.getDay() === 1) return true;
    for (let i = 0; i < 7; i++) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      if (completions[dateStr(d) + '_' + task.id]) return false;
    }
    return true;
  }
  if (task.freq === 'every2days') {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (completions[dateStr(yesterday) + '_' + task.id] && !completions[today + '_' + task.id]) return false;
    return true;
  }
  return true;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2500);
}

// ===================== LOGIN =====================
async function login(uid) {
  currentUser = uid;
  showToast('Cargando...');
  await loadState();
  updateUserLabels();
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('app').classList.add('active');
  const display = document.getElementById('current-user-display');
  display.textContent = getUserAvatar(uid) + ' ' + getUserName(uid);
  display.className = 'current-user ' + uid + '-user';
  document.getElementById('header-date').textContent = getSpanishDate();
  showSection('today');
}

function logout() {
  currentUser = null;
  document.getElementById('app').classList.remove('active');
  document.getElementById('login-screen').classList.add('active');
  updateUserLabels();
}

function updateUserLabels() {
  document.getElementById('label-u1').textContent = getUserName('u1');
  document.getElementById('label-u2').textContent = getUserName('u2');
  document.getElementById('avatar-u1').textContent = getUserAvatar('u1');
  document.getElementById('avatar-u2').textContent = getUserAvatar('u2');
}

// ===================== NAVIGATION =====================
function showSection(name) {
  document.querySelectorAll('.content-section').forEach(function(s) { s.classList.remove('active'); });
  document.querySelectorAll('.nav-btn').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById('section-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');
  if (name === 'today') renderToday();
  if (name === 'stats') renderStats();
  if (name === 'manage') renderManage();
  if (name === 'config') renderConfig();
}

// ===================== TODAY =====================
function renderToday() {
  const today = todayStr();
  const dueTasks = appState.tasks.filter(function(t) { return t.active && isTaskDueToday(t); });
  const doneCount = dueTasks.filter(function(t) { return appState.completions[today + '_' + t.id]; }).length;
  const total = dueTasks.length;

  // Summary
  const summary = document.getElementById('today-summary');
  summary.innerHTML =
    '<div class="summary-stat"><div class="summary-num">' + total + '</div><div class="summary-label">Total</div></div>' +
    '<div class="summary-divider"></div>' +
    '<div class="summary-stat"><div class="summary-num" style="color:#22C55E">' + doneCount + '</div><div class="summary-label">Hechas</div></div>' +
    '<div class="summary-divider"></div>' +
    '<div class="summary-stat"><div class="summary-num" style="color:#EF4444">' + (total - doneCount) + '</div><div class="summary-label">Pendientes</div></div>';

  // Group by category
  const container = document.getElementById('categories-container');
  container.innerHTML = '';

  const cats = appState.categories || DEFAULT_CONFIG.categories;
  cats.forEach(function(cat) {
    const catTasks = dueTasks.filter(function(t) { return t.category === cat; });
    if (catTasks.length === 0) return;

    const section = document.createElement('div');
    section.className = 'category-section';

    const title = document.createElement('div');
    title.className = 'category-title';
    title.textContent = cat;
    section.appendChild(title);

    const taskList = document.createElement('div');
    taskList.className = 'category-tasks';

    catTasks.forEach(function(task) {
      const compKey = today + '_' + task.id;
      const comp = appState.completions[compKey];
      const target = task.timesPerDay || 1;
      const currentCount = (comp && comp.count) ? comp.count : 0;
      const fullyDone = currentCount >= target;

      const div = document.createElement('div');
      div.className = 'task-item' + (fullyDone ? ' done' : (currentCount > 0 ? ' partial' : ''));

      const check = document.createElement('div');
      check.className = 'task-check';
      if (fullyDone) check.textContent = '✓';
      else if (currentCount > 0) check.textContent = currentCount;

      const info = document.createElement('div');
      info.className = 'task-info';

      let meta = '<span class="task-freq-badge">' + FREQ_LABELS[task.freq] + (target > 1 ? ' · ' + currentCount + '/' + target + 'x' : '') + '</span>';
      if (comp && comp.entries) {
        comp.entries.forEach(function(e) {
          meta += '<span class="task-done-by"> ' + getUserAvatar(e.user) + ' ' + getUserName(e.user) + ' · ' + e.time + '</span>';
        });
      } else if (comp && comp.user) {
        meta += '<span class="task-done-by"> ' + getUserAvatar(comp.user) + ' ' + getUserName(comp.user) + ' · ' + comp.time + '</span>';
      }
      if (task.freq === 'once') meta = '<span class="task-once-badge">Puntual</span>' + (comp && comp.entries ? comp.entries.map(function(e) { return '<span class="task-done-by"> ✓ ' + getUserName(e.user) + ' · ' + e.time + '</span>'; }).join('') : '');

      info.innerHTML = '<div class="task-name">' + task.name + '</div><div class="task-meta">' + meta + '</div>';

      div.appendChild(check);
      div.appendChild(info);
      div.addEventListener('click', function() { toggleTask(task.id); });
      taskList.appendChild(div);
    });

    section.appendChild(taskList);
    container.appendChild(section);
  });

  // Tareas sin categoría conocida
  const uncategorized = dueTasks.filter(function(t) { return !cats.includes(t.category); });
  if (uncategorized.length > 0) {
    const section = document.createElement('div');
    section.className = 'category-section';
    const title = document.createElement('div');
    title.className = 'category-title';
    title.textContent = 'Otras';
    section.appendChild(title);
    const taskList = document.createElement('div');
    taskList.className = 'category-tasks';
    uncategorized.forEach(function(task) {
      const compKey = today + '_' + task.id;
      const comp = appState.completions[compKey];
      const done = !!comp;
      const div = document.createElement('div');
      div.className = 'task-item' + (done ? ' done' : '');
      const check = document.createElement('div');
      check.className = 'task-check';
      if (done) check.textContent = '✓';
      const info = document.createElement('div');
      info.className = 'task-info';
      info.innerHTML = '<div class="task-name">' + task.name + '</div>';
      div.appendChild(check); div.appendChild(info);
      div.addEventListener('click', function() { toggleTask(task.id); });
      taskList.appendChild(div);
    });
    section.appendChild(taskList);
    container.appendChild(section);
  }
}

async function toggleTask(taskId) {
  const today = todayStr();
  const key = today + '_' + taskId;
  const task = appState.tasks.find(function(t) { return t.id === taskId; });
  const target = (task && task.timesPerDay) ? task.timesPerDay : 1;
  const now = new Date();
  const time = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');

  if (!appState.completions[key]) {
    appState.completions[key] = { count: 1, entries: [{ user: currentUser, time: time }] };
    showToast(target > 1 ? '1/' + target + ' veces' : '✓ Tarea completada!');
  } else if (appState.completions[key].count < target) {
    appState.completions[key].count += 1;
    appState.completions[key].entries.push({ user: currentUser, time: time });
    if (appState.completions[key].count === target) {
      showToast('✓ Completada ' + target + '/' + target + ' veces!');
    } else {
      showToast(appState.completions[key].count + '/' + target + ' veces');
    }
  } else {
    delete appState.completions[key];
    showToast('Tarea desmarcada');
  }
  await saveState();
  renderToday();
}

// ===================== MODAL NUEVA TAREA =====================
function openModal() {
  const select = document.getElementById('modal-cat');
  select.innerHTML = '';
  (appState.categories || DEFAULT_CONFIG.categories).forEach(function(cat) {
    const opt = document.createElement('option');
    opt.value = cat; opt.textContent = cat;
    select.appendChild(opt);
  });
  document.getElementById('modal-name').value = '';
  document.getElementById('modal').style.display = 'flex';
  document.getElementById('modal-name').focus();
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

async function saveModal() {
  const name = document.getElementById('modal-name').value.trim();
  const cat = document.getElementById('modal-cat').value;
  const freq = document.getElementById('modal-freq').value;
  const timesVal = parseInt(document.getElementById('modal-times').value) || 1;
  if (!name) { showToast('Escribe el nombre de la tarea'); return; }
  const task = { id: 't' + Date.now(), name: name, category: cat, freq: freq, active: true, timesPerDay: timesVal };
  if (freq === 'once') task.createdOn = todayStr();
  appState.tasks.push(task);
  await saveState();
  closeModal();
  showToast('Tarea añadida');
  renderToday();
}

// ===================== STATS =====================
function renderStats() {
  const container = document.getElementById('stats-container');
  container.innerHTML = '';
  const today = todayStr();

  // Totales por usuario
  let u1count = 0, u2count = 0;
  Object.values(appState.completions).forEach(function(c) {
    if (c.entries) {
      c.entries.forEach(function(e) {
        if (e.user === 'u1') u1count++;
        else if (e.user === 'u2') u2count++;
      });
    } else if (c.user === 'u1') { u1count++; }
    else if (c.user === 'u2') { u2count++; }
  });
  const total = u1count + u2count || 1;

  const card1 = document.createElement('div');
  card1.className = 'stats-card';
  card1.innerHTML = '<h3>🏆 Ranking total</h3>';
  const rows = [
    { uid: 'u1', count: u1count },
    { uid: 'u2', count: u2count }
  ].sort(function(a,b) { return b.count - a.count; });

  rows.forEach(function(r) {
    const pct = Math.round((r.count / total) * 100);
    const row = document.createElement('div');
    row.className = 'user-stat-row';
    row.innerHTML =
      '<div class="user-stat-label">' + getUserAvatar(r.uid) + ' ' + getUserName(r.uid) + '</div>' +
      '<div class="user-stat-bar-wrap"><div class="user-stat-bar ' + r.uid + '-bar" style="width:' + pct + '%"><span>' + r.count + '</span></div></div>' +
      '<div class="user-stat-count">' + r.count + '</div>';
    card1.appendChild(row);
  });
  container.appendChild(card1);

  // Hoy
  const card2 = document.createElement('div');
  card2.className = 'stats-card';
  card2.innerHTML = '<h3>📋 Hoy</h3>';
  const todayComps = Object.entries(appState.completions).filter(function(e) { return e[0].startsWith(today); });
  let todayU1 = 0, todayU2 = 0;
  todayComps.forEach(function(e) {
    const c = e[1];
    if (c.entries) {
      c.entries.forEach(function(en) {
        if (en.user === 'u1') todayU1++;
        else if (en.user === 'u2') todayU2++;
      });
    } else if (c.user === 'u1') { todayU1++; }
    else if (c.user === 'u2') { todayU2++; }
  });
  const todayTotal = todayU1 + todayU2 || 1;

  [{ uid: 'u1', count: todayU1 }, { uid: 'u2', count: todayU2 }].forEach(function(r) {
    const pct = Math.round((r.count / todayTotal) * 100);
    const row = document.createElement('div');
    row.className = 'user-stat-row';
    row.innerHTML =
      '<div class="user-stat-label">' + getUserAvatar(r.uid) + ' ' + getUserName(r.uid) + '</div>' +
      '<div class="user-stat-bar-wrap"><div class="user-stat-bar ' + r.uid + '-bar" style="width:' + pct + '%"><span>' + r.count + '</span></div></div>' +
      '<div class="user-stat-count">' + r.count + '</div>';
    card2.appendChild(row);
  });
  container.appendChild(card2);

  // Últimos 7 días
  const card3 = document.createElement('div');
  card3.className = 'stats-card';
  card3.innerHTML = '<h3>📅 Últimos 7 días</h3><div style="display:flex;gap:6px;align-items:flex-end;height:80px;margin-top:8px" id="week-bars"></div>';
  container.appendChild(card3);

  const bars = card3.querySelector('#week-bars');
  const dayNames = ['D','L','M','X','J','V','S'];
  let maxDay = 1;
  const weekData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = dateStr(d);
    const count = Object.entries(appState.completions).filter(function(e) { return e[0].startsWith(ds); }).length;
    if (count > maxDay) maxDay = count;
    weekData.push({ day: dayNames[d.getDay()], count: count, ds: ds });
  }
  weekData.forEach(function(wd) {
    const h = Math.max(Math.round((wd.count / maxDay) * 70), wd.count > 0 ? 4 : 2);
    const isToday = wd.ds === today;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;';
    wrap.innerHTML =
      '<div style="font-size:0.65rem;color:var(--text-muted)">' + (wd.count > 0 ? wd.count : '') + '</div>' +
      '<div style="width:100%;height:' + h + 'px;background:' + (isToday ? '#1C1917' : '#D4D4D4') + ';border-radius:4px 4px 0 0"></div>' +
      '<div style="font-size:0.65rem;color:var(--text-muted);font-weight:' + (isToday?'700':'400') + '">' + wd.day + '</div>';
    bars.appendChild(wrap);
  });
}

// ===================== MANAGE =====================
function renderManage() {
  const container = document.getElementById('manage-list');
  container.innerHTML = '';
  const cats = appState.categories || DEFAULT_CONFIG.categories;

  cats.forEach(function(cat) {
    const tasks = appState.tasks.filter(function(t) { return t.active && t.category === cat; });
    if (tasks.length === 0) return;
    const title = document.createElement('div');
    title.className = 'manage-cat-title';
    title.textContent = cat;
    container.appendChild(title);
    tasks.forEach(function(task) { container.appendChild(makeManageRow(task)); });
  });

  const others = appState.tasks.filter(function(t) { return t.active && !cats.includes(t.category); });
  if (others.length > 0) {
    const title = document.createElement('div');
    title.className = 'manage-cat-title';
    title.textContent = 'Otras';
    container.appendChild(title);
    others.forEach(function(task) { container.appendChild(makeManageRow(task)); });
  }
}

function makeManageRow(task) {
  const div = document.createElement('div');
  div.className = 'manage-task-row';
  div.setAttribute('data-id', task.id);

  const info = document.createElement('div');
  info.className = 'manage-task-info';
  info.innerHTML = '<div class="manage-task-name">' + task.name + '</div><div class="manage-task-sub">' + task.category + ' · ' + FREQ_LABELS[task.freq] + '</div>';

  const editBtn = document.createElement('button');
  editBtn.className = 'edit-btn';
  editBtn.textContent = '✏️';
  editBtn.addEventListener('click', function() { startEditTask(task.id, div, task); });

  const delBtn = document.createElement('button');
  delBtn.className = 'delete-btn';
  delBtn.textContent = '🗑';
  delBtn.addEventListener('click', function() { deleteTask(task.id); });

  div.appendChild(info);
  div.appendChild(editBtn);
  div.appendChild(delBtn);
  return div;
}

function startEditTask(taskId, div, task) {
  div.innerHTML = '';
  div.style.flexWrap = 'wrap';
  div.style.gap = '8px';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = task.name;
  nameInput.className = 'form-input';
  nameInput.style.cssText = 'flex:1;min-width:140px;padding:7px 10px;font-size:0.85rem;';

  const catSelect = document.createElement('select');
  catSelect.className = 'form-select';
  catSelect.style.cssText = 'min-width:100px;padding:7px 10px;font-size:0.85rem;';
  (appState.categories || []).forEach(function(cat) {
    const opt = document.createElement('option');
    opt.value = cat; opt.textContent = cat;
    if (cat === task.category) opt.selected = true;
    catSelect.appendChild(opt);
  });

  const saveBtn = document.createElement('button');
  saveBtn.className = 'add-btn';
  saveBtn.textContent = '✓';
  saveBtn.style.cssText = 'padding:7px 14px;background:#16A34A;';
  saveBtn.addEventListener('click', function() {
    saveEditTask(taskId, nameInput.value.trim(), catSelect.value);
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'delete-btn';
  cancelBtn.textContent = '✕';
  cancelBtn.style.cssText = 'font-size:1rem;';
  cancelBtn.addEventListener('click', function() { renderManage(); });

  const freqSelect = document.createElement('select');
  freqSelect.className = 'form-select';
  freqSelect.style.cssText = 'min-width:110px;padding:7px 10px;font-size:0.82rem;';
  Object.entries(FREQ_LABELS).forEach(function(e) {
    const opt = document.createElement('option');
    opt.value = e[0]; opt.textContent = e[1];
    if (e[0] === task.freq) opt.selected = true;
    freqSelect.appendChild(opt);
  });

  const timesInput = document.createElement('input');
  timesInput.type = 'number';
  timesInput.value = task.timesPerDay || 1;
  timesInput.min = 1; timesInput.max = 10;
  timesInput.className = 'form-input';
  timesInput.style.cssText = 'width:58px;padding:7px 8px;font-size:0.82rem;text-align:center;';
  timesInput.title = 'Veces al día';

  div.appendChild(nameInput);
  div.appendChild(catSelect);
  div.appendChild(freqSelect);
  div.appendChild(timesInput);
  div.appendChild(saveBtn);
  div.appendChild(cancelBtn);
  nameInput.focus();
  nameInput.select();
}

async function saveEditTask(taskId, newName, newCat) {
  if (!newName) { showToast('El nombre no puede estar vacío'); return; }
  const task = appState.tasks.find(function(t) { return t.id === taskId; });
  if (task) { task.name = newName; task.category = newCat; }
  await saveState();
  showToast('Tarea actualizada');
  renderManage();
  renderToday();
}

async function deleteTask(taskId) {
  if (!confirm('¿Eliminar esta tarea?')) return;
  const task = appState.tasks.find(function(t) { return t.id === taskId; });
  if (task) task.active = false;
  await saveState();
  showToast('Tarea eliminada');
  renderManage();
  renderToday();
}

// ===================== CONFIG =====================
function renderConfig() {
  const cfg = appState.config || DEFAULT_CONFIG;
  document.getElementById('cfg-name-u1').value = cfg.users.u1.name;
  document.getElementById('cfg-avatar-u1').value = cfg.users.u1.avatar;
  document.getElementById('cfg-name-u2').value = cfg.users.u2.name;
  document.getElementById('cfg-avatar-u2').value = cfg.users.u2.avatar;

  const catsContainer = document.getElementById('cfg-categories');
  catsContainer.innerHTML = '';
  (appState.categories || []).forEach(function(cat) {
    const item = document.createElement('div');
    item.className = 'cat-item';

    const span = document.createElement('span');
    span.textContent = cat;

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = '✏️';
    editBtn.addEventListener('click', function() {
      span.style.display = 'none';
      editBtn.style.display = 'none';
      delBtn.style.display = 'none';

      const input = document.createElement('input');
      input.type = 'text';
      input.value = cat;
      input.className = 'form-input';
      input.style.cssText = 'flex:1;padding:5px 10px;font-size:0.85rem;';

      const saveBtn = document.createElement('button');
      saveBtn.className = 'add-btn';
      saveBtn.textContent = '✓';
      saveBtn.style.cssText = 'padding:5px 12px;background:#16A34A;';
      saveBtn.addEventListener('click', function() { saveEditCategory(cat, input.value.trim()); });

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'delete-btn';
      cancelBtn.textContent = '✕';
      cancelBtn.addEventListener('click', function() { renderConfig(); });

      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') saveEditCategory(cat, input.value.trim());
        if (e.key === 'Escape') renderConfig();
      });

      item.appendChild(input);
      item.appendChild(saveBtn);
      item.appendChild(cancelBtn);
      input.focus(); input.select();
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = '🗑';
    delBtn.addEventListener('click', function() { deleteCategory(cat); });

    item.appendChild(span);
    item.appendChild(editBtn);
    item.appendChild(delBtn);
    catsContainer.appendChild(item);
  });
}

async function saveConfig() {
  const name1 = document.getElementById('cfg-name-u1').value.trim() || 'Usuario 1';
  const avatar1 = document.getElementById('cfg-avatar-u1').value.trim() || '👤';
  const name2 = document.getElementById('cfg-name-u2').value.trim() || 'Usuario 2';
  const avatar2 = document.getElementById('cfg-avatar-u2').value.trim() || '👤';
  if (!appState.config) appState.config = DEFAULT_CONFIG;
  appState.config.users.u1 = { name: name1, avatar: avatar1 };
  appState.config.users.u2 = { name: name2, avatar: avatar2 };
  await saveState();
  updateUserLabels();
  showToast('Configuración guardada');
  const display = document.getElementById('current-user-display');
  display.textContent = getUserAvatar(currentUser) + ' ' + getUserName(currentUser);
}

async function addCategory() {
  const input = document.getElementById('cfg-new-cat');
  const name = input.value.trim();
  if (!name) return;
  if (!appState.categories) appState.categories = [];
  if (appState.categories.includes(name)) { showToast('Ya existe esa categoría'); return; }
  appState.categories.push(name);
  await saveState();
  input.value = '';
  showToast('Categoría añadida');
  renderConfig();
}

async function saveEditCategory(oldName, newName) {
  if (!newName) { showToast('El nombre no puede estar vacío'); return; }
  if (appState.categories.includes(newName) && newName !== oldName) { showToast('Ya existe esa categoría'); return; }
  const idx = appState.categories.indexOf(oldName);
  if (idx !== -1) appState.categories[idx] = newName;
  appState.tasks.forEach(function(t) { if (t.category === oldName) t.category = newName; });
  await saveState();
  showToast('Categoría actualizada');
  renderConfig();
  renderManage();
}

async function deleteCategory(cat) {
  if (!confirm('¿Eliminar categoría "' + cat + '"?')) return;
  appState.categories = appState.categories.filter(function(c) { return c !== cat; });
  await saveState();
  showToast('Categoría eliminada');
  renderConfig();
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('btn-u1').addEventListener('click', function() { login('u1'); });
  document.getElementById('btn-u2').addEventListener('click', function() { login('u2'); });
  document.getElementById('btn-logout').addEventListener('click', function() { logout(); });
  document.getElementById('nav-today').addEventListener('click', function() { showSection('today'); });
  document.getElementById('nav-stats').addEventListener('click', function() { showSection('stats'); });
  document.getElementById('nav-manage').addEventListener('click', function() { showSection('manage'); });
  document.getElementById('nav-config').addEventListener('click', function() { showSection('config'); });
  document.getElementById('btn-fab').addEventListener('click', function() { openModal(); });
  document.getElementById('modal-save').addEventListener('click', function() { saveModal(); });
  document.getElementById('modal-cancel').addEventListener('click', function() { closeModal(); });
  document.getElementById('modal').addEventListener('click', function(e) { if (e.target === this) closeModal(); });
  document.getElementById('btn-save-config').addEventListener('click', function() { saveConfig(); });
  document.getElementById('btn-add-cat').addEventListener('click', function() { addCategory(); });
  updateUserLabels();
});
