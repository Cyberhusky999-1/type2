const STORAGE_KEY = 'daily-calorie-counter-state';
const todayKey = new Date().toISOString().slice(0, 10);

const state = loadState();
const mealForm = document.querySelector('#mealForm');
const goalForm = document.querySelector('#goalForm');
const resetDay = document.querySelector('#resetDay');
const profileForm = document.querySelector('#profileForm');
const foodLog = document.querySelector('#foodLog');
const emptyState = document.querySelector('#emptyState');
const progressCircle = document.querySelector('#progressCircle');

function loadState() {
  const fallback = { date: todayKey, goal: 2000, entries: [], profile: { weight: '', age: '', height: '' } };
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');

  if (!saved || saved.date !== todayKey) {
    return fallback;
  }

  return { ...fallback, ...saved, profile: { ...fallback.profile, ...saved.profile } };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatCalories(value) {
  return Number(value).toLocaleString();
}

function formatProfileValue(value) {
  return value ? Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 }) : '';
}

function calculateBmi(weight, height) {
  if (!weight || !height) return null;
  return (weight / (height * height)) * 703;
}

function updateDashboard() {
  const total = state.entries.reduce((sum, entry) => sum + entry.calories, 0);
  const remaining = state.goal - total;
  const average = state.entries.length ? Math.round(total / state.entries.length) : 0;
  const progress = state.goal ? Math.min(total / state.goal, 1) : 0;
  const circumference = 327;

  document.querySelector('#totalCalories').textContent = formatCalories(total);
  document.querySelector('#goalCalories').textContent = formatCalories(state.goal);
  document.querySelector('#remainingCalories').textContent = formatCalories(Math.max(remaining, 0));
  document.querySelector('#mealCount').textContent = state.entries.length;
  document.querySelector('#averageCalories').textContent = formatCalories(average);
  document.querySelector('#dailyGoal').value = state.goal;
  document.querySelector('#weight').value = state.profile.weight;
  document.querySelector('#age').value = state.profile.age;
  document.querySelector('#height').value = state.profile.height;
  document.querySelector('#todayDate').textContent = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  document.querySelector('#goalSummary').textContent = remaining >= 0
    ? `${formatCalories(remaining)} calories left from ${formatCalories(state.goal)}`
    : `${formatCalories(Math.abs(remaining))} calories over goal`;
  progressCircle.style.strokeDashoffset = circumference - (circumference * progress);
  progressCircle.style.stroke = remaining >= 0 ? 'var(--brand)' : 'var(--danger)';
  updateProfileSummary();

  renderEntries();
}

function updateProfileSummary() {
  const { weight, age, height } = state.profile;
  const summary = document.querySelector('#profileSummary');
  const bmi = calculateBmi(Number(weight), Number(height));
  const details = [];

  if (weight) details.push(`${formatProfileValue(weight)} lb`);
  if (age) details.push(`${age} years old`);
  if (height) details.push(`${formatProfileValue(height)} in tall`);

  if (!details.length) {
    summary.textContent = 'Add weight, age, and height when you are ready.';
    return;
  }

  summary.textContent = bmi
    ? `${details.join(' • ')} • BMI ${bmi.toFixed(1)}`
    : details.join(' • ');
}

function renderEntries() {
  foodLog.innerHTML = '';
  emptyState.hidden = state.entries.length > 0;

  state.entries.forEach((entry) => {
    const item = document.createElement('li');
    const details = document.createElement('div');
    const name = document.createElement('strong');
    const meta = document.createElement('small');
    const calories = document.createElement('span');
    const deleteButton = document.createElement('button');

    name.textContent = entry.name;
    meta.textContent = `${entry.type} • ${entry.time}`;
    calories.className = 'calorie-pill';
    calories.textContent = `${formatCalories(entry.calories)} cal`;
    deleteButton.className = 'delete-button';
    deleteButton.type = 'button';
    deleteButton.dataset.id = entry.id;
    deleteButton.textContent = 'Delete';

    details.append(name, meta);
    item.append(details, calories, deleteButton);
    foodLog.append(item);
  });
}

mealForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(mealForm);
  const calories = Number(formData.get('foodCalories'));

  if (!calories || calories < 1) {
    return;
  }

  state.entries.unshift({
    id: crypto.randomUUID(),
    name: formData.get('foodName').trim(),
    calories,
    type: formData.get('mealType'),
    time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
  });

  mealForm.reset();
  saveState();
  updateDashboard();
});

profileForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(profileForm);

  state.profile = {
    weight: formData.get('weight'),
    age: formData.get('age'),
    height: formData.get('height'),
  };

  saveState();
  updateDashboard();
});

goalForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const goal = Number(document.querySelector('#dailyGoal').value);

  if (goal > 0) {
    state.goal = goal;
    saveState();
    updateDashboard();
  }
});

foodLog.addEventListener('click', (event) => {
  const button = event.target.closest('[data-id]');
  if (!button) return;

  state.entries = state.entries.filter((entry) => entry.id !== button.dataset.id);
  saveState();
  updateDashboard();
});

resetDay.addEventListener('click', () => {
  state.entries = [];
  saveState();
  updateDashboard();
});

updateDashboard();
