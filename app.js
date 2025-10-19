// app.js (final)

// Firebase CDN imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

// Firebase config (yours)
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
const normalizeInput = (s) => (s || "").trim();
const toLower = (s) => s.toLowerCase();

// Main: load student view
window.loadStudent = async function () {
  const inputEl = document.getElementById("studentName");
  const listEl = document.getElementById("scriptureList");

  const raw = normalizeInput(inputEl?.value);
  if (!raw) return alert("Please enter your full name.");

  listEl.innerHTML = "<p>Loading…</p>";

  try {
    const dbRef = ref(db);

    // 1) Get the master scriptures once
    const scripturesSnap = await get(child(dbRef, "scriptures"));
    if (!scripturesSnap.exists()) {
      listEl.innerHTML = "<p>No scriptures found. Ask admin to import them.</p>";
      return;
    }
    const scriptures = scripturesSnap.val(); // { "John 3:16": { text, completed? } ... }

    // 2) Try exact student key, then lowercase
    const exactPath = `students/${raw}/completed`;
    const lowerPath = `students/${toLower(raw)}/completed`;

    let completed = {};
    let completedSnap = await get(child(dbRef, exactPath));
    if (!completedSnap.exists()) {
      completedSnap = await get(child(dbRef, lowerPath));
    }
    if (completedSnap.exists()) {
      completed = completedSnap.val(); // { "John 3:16": true, ... }
    }

    // 3) Build UI
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

// (Optional nicety): allow pressing Enter to load
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("studentName");
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") window.loadStudent();
    });
  }
});

