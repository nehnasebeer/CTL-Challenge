// app.js (student + admin, with code gate, logout, roster table, search)

// Firebase CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getDatabase, ref, get, child, set } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

// ---- Change your admin code here
const ADMIN_CODE = "ctl2025";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCkTG00WHDtt5D3HAwsuX377FH6x_2CDuY",
  authDomain: "ctl-challenge-sunday.firebaseapp.com",
  projectId: "ctl-challenge-sunday",
  storageBucket: "ctl-challenge-sunday.firebasestorage.app",
  messagingSenderId: "53064067313",
  appId: "1:53064067313:web:df9e667545de55b38ea150",
  measurementId: "G-BPWWLBWJR1",
  databaseURL: "https://ctl-challenge-sunday-default-rtdb.firebaseio.com/"
};

// Init
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Helpers
const norm = (s) => (s || "").trim();
const toLower = (s) => (s || "").toLowerCase();

// ==================================================
// STUDENT PAGE (read-only)
// ==================================================
window.loadStudent = async function () {
  const inputEl = document.getElementById("studentName");
  const listEl = document.getElementById("scriptureList");
  if (!inputEl || !listEl) return; // not on student page

  const raw = norm(inputEl.value);
  if (!raw) return alert("Please enter your full name.");

  listEl.innerHTML = "<p>Loading…</p>";

  try {
    const dbRef = ref(db);

    // Master scriptures
    const scripturesSnap = await get(child(dbRef, "scriptures"));
    if (!scripturesSnap.exists()) {
      listEl.innerHTML = "<p>No scriptures found. Ask admin to import them.</p>";
      return;
    }
    const scriptures = scripturesSnap.val();

    // Try exact then lowercase student node
    const exactPath = `students/${raw}/completed`;
    const lowerPath = `students/${toLower(raw)}/completed`;

    let completed = {};
    let completedSnap = await get(child(dbRef, exactPath));
    if (!completedSnap.exists()) completedSnap = await get(child(dbRef, lowerPath));
    if (completedSnap.exists()) completed = completedSnap.val();

    const refs = Object.keys(scriptures).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
    const done = refs.reduce((n, r) => n + (completed[r] ? 1 : 0), 0);

    let html = "";
    html += `<h3>${raw}'s Scriptures</h3>`;
    html += `<p>${done} / ${refs.length} completed</p>`;

    for (const refName of refs) {
      const v = scriptures[refName];
      const isDone = !!completed[refName];
      html += `
        <div class="verse">
          <strong>${refName}</strong><br/>
          <p>${v.text}</p>
          <span>${isDone ? "✅" : "⬜"}</span>
        </div>
      `;
    }
    listEl.innerHTML = html;
  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<p style="color:#b00020">Sorry, something went wrong loading your verses.</p>`;
  }
};

// Enter key (student)
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("studentName");
  if (input) input.addEventListener("keydown", (e) => { if (e.key === "Enter") window.loadStudent(); });
});

// ==================================================
// ADMIN PAGE (code gate, logout, roster, detail, save, search)
// ==================================================
function showAdminPanel(show) {
  const login = document.getElementById("adminLoginSection");
  const panel = document.getElementById("adminPanel");
  if (!login || !panel) return;
  login.style.display = show ? "none" : "block";
  panel.style.display = show ? "block" : "none";
}

window.adminLogin = function () {
  const code = norm(document.getElementById("adminCode")?.value);
  if (code === ADMIN_CODE) {
    // require code EACH TIME: do not persist across reloads
    sessionStorage.removeItem("ctl_admin"); // ensure old flags are cleared
    showAdminPanel(true);
    buildRoster();
  } else {
    alert("Incorrect admin code.");
  }
};

window.adminLogout = function () {
  showAdminPanel(false);
  // also clear any verse panel state
  const versesEl = document.getElementById("adminVerses");
  if (versesEl) versesEl.innerHTML = `<p class="muted">Logged out.</p>`;
  const status = document.getElementById("adminStatus");
  if (status) status.textContent = "";
  // clear inputs
  const inp = document.getElementById("adminCode"); if (inp) inp.value = "";
};

// force code on every load (no auto-open)
document.addEventListener("DOMContentLoaded", () => {
  const onAdminPage = !!document.getElementById("adminLoginSection");
  if (onAdminPage) showAdminPanel(false); // always start at login
});

// Create student
window.createStudent = async function () {
  const input = document.getElementById("newStudentName");
  const name = norm(input?.value);
  if (!name) return alert("Enter a full name first.");
  const key = name; // exact spelling

  try {
    await set(ref(db, `students/${key}`), { completed: {} });
    const status = document.getElementById("adminStatus");
    if (status) status.textContent = `Created student: ${key}`;
    input.value = "";
    await buildRoster(); // refresh list
  } catch (e) {
    console.error(e);
    alert("Could not create student. Check rules and databaseURL.");
  }
};

// Build roster table
async function getScripturesCount() {
  const snap = await get(child(ref(db), "scriptures"));
  if (!snap.exists()) return 0;
  return Object.keys(snap.val()).length;
}

window.buildRoster = async function () {
  const tbody = document.getElementById("studentTableBody");
  const status = document.getElementById("adminStatus");
  const totalCountEl = document.getElementById("totalCount");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="3" class="muted">Loading roster…</td></tr>`;
  if (status) status.textContent = "";

  try {
    const [studentsSnap, total] = await Promise.all([
      get(child(ref(db), "students")),
      getScripturesCount()
    ]);

    if (totalCountEl) totalCountEl.textContent = total ? `Total scriptures: ${total}` : "";

    if (!studentsSnap.exists()) {
      tbody.innerHTML = `<tr><td colspan="3" class="muted">No students yet. Add one above.</td></tr>`;
      return;
    }

    const students = studentsSnap.val(); // { name: { completed: {...} } }
    const names = Object.keys(students).sort((a,b)=> a.localeCompare(b));

    let html = "";
    for (const name of names) {
      const completedMap = students[name]?.completed || {};
      const done = Object.keys(completedMap).filter(k => completedMap[k]).length;
      html += `
        <tr data-student-row="${name}">
          <td>${name}</td>
          <td>${done} / ${total}</td>
          <td><button class="btn small" data-open="${name}">Open</button></td>
        </tr>
      `;
    }

    tbody.innerHTML = html;

    // Click delegate for Open buttons
    tbody.onclick = (e) => {
      const btn = e.target.closest("[data-open]");
      if (!btn) return;
      const name = btn.getAttribute("data-open");
      document.getElementById("studentSearch")?.value = name; // reflect in search box
      loadAdminStudent(); // open detail panel for that name
    };

    // apply any filter currently typed
    filterRoster();
  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="3" style="color:#b00020">Failed to load roster.</td></tr>`;
  }
};

// Search filter
window.filterRoster = function () {
  const q = toLower(norm(document.getElementById("studentSearch")?.value));
  const rows = document.querySelectorAll("#studentTableBody tr[data-student-row]");
  rows.forEach(row => {
    const name = toLower(row.getAttribute("data-student-row") || "");
    row.style.display = !q || name.includes(q) ? "" : "none";
  });
};

// Load student detail (verses + checkboxes)
window.loadAdminStudent = async function () {
  const input = document.getElementById("studentSearch");
  const nameRaw = norm(input?.value);
  if (!nameRaw) return alert("Type or select a student name first.");
  const nameExact = nameRaw;
  const nameLower = toLower(nameRaw);

  const versesEl = document.getElementById("adminVerses");
  const status = document.getElementById("adminStatus");
  if (versesEl) versesEl.innerHTML = "<p>Loading…</p>";
  if (status) status.textContent = "";

  try {
    const dbRef = ref(db);
    const scripturesSnap = await get(child(dbRef, "scriptures"));
    if (!scripturesSnap.exists()) { if (versesEl) versesEl.innerHTML = "<p>No scriptures found.</p>"; return; }
    const scriptures = scripturesSnap.val();

    let completedSnap = await get(child(dbRef, `students/${nameExact}/completed`));
    if (!completedSnap.exists()) completedSnap = await get(child(dbRef, `students/${nameLower}/completed`));
    const completed = completedSnap.exists() ? completedSnap.val() : {};

    const refs = Object.keys(scriptures).sort((a,b)=> a.localeCompare(b, undefined, {numeric:true}));
    let html = `<h3>Editing: ${nameRaw}</h3>`;
    html += `<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:10px; margin-top:10px;">`;

    for (const refName of refs) {
      const v = scriptures[refName];
      const isDone = !!completed[refName];
      const id = `cb_${refName.replace(/[^a-z0-9]/gi, "_")}`;
      html += `
        <label for="${id}" class="verse">
          <div style="display:flex; align-items:center; gap:8px;">
            <input type="checkbox" id="${id}" data-ref="${refName}" ${isDone ? "checked" : ""}>
            <strong>${refName}</strong>
          </div>
          <p style="margin:6px 0 0 26px;">${v.text}</p>
        </label>
      `;
    }
    html += `</div>`;
    if (versesEl) versesEl.innerHTML = html;

    // remember who we're editing
    if (versesEl) {
      versesEl.dataset.studentExact = nameExact;
      versesEl.dataset.studentLower = nameLower;
    }
  } catch (e) {
    console.error(e);
    if (versesEl) versesEl.innerHTML = `<p style="color:#b00020">Failed to load student/verses.</p>`;
  }
};

// Check / uncheck all
window.checkAll = function (flag) {
  document.querySelectorAll('#adminVerses input[type="checkbox"]').forEach(cb => { cb.checked = !!flag; });
};

// Save progress to /students/<name>/completed
window.saveAdminProgress = async function () {
  const versesEl = document.getElementById("adminVerses");
  const status = document.getElementById("adminStatus");
  const nameExact = versesEl?.dataset.studentExact;
  const nameLower = versesEl?.dataset.studentLower;
  if (!nameExact) return alert("Open a student first.");

  const completed = {};
  document.querySelectorAll('#adminVerses input[type="checkbox"]').forEach(cb => {
    const refName = cb.getAttribute("data-ref");
    if (cb.checked) completed[refName] = true;
  });

  try {
    await set(ref(db, `students/${nameExact}`), { completed });
    if (status) status.textContent = `Saved progress for ${nameExact}.`;
    // refresh roster counts
    await buildRoster();
  } catch (e) {
    console.error(e);
    if (status) status.textContent = "Failed to save. Check database rules.";
  }
};
