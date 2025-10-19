import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

// Your config (keep what you already have)
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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Utility: safe name key (exact match – you can change to toLowerCase() if you want case-insensitive)
const studentKeyFromInput = (name) => name.trim();

// Loads: /scriptures (all verses) + /students/<name>/completed
window.loadStudent = async function () {
  const nameInput = document.getElementById("studentName");
  const name = studentKeyFromInput(nameInput.value);
  if (!name) return alert("Please enter your full name.");

  const dbRef = ref(db);
  const [scripturesSnap, completedSnap] = await Promise.all([
    get(child(dbRef, "scriptures")),
    get(child(dbRef, `students/${name}/completed`))
  ]);

  const scriptureList = document.getElementById("scriptureList");
  scriptureList.innerHTML = "";

  if (!scripturesSnap.exists()) {
    scriptureList.innerHTML = "<p>No scriptures found. Ask admin to import them.</p>";
    return;
  }

  const scriptures = scripturesSnap.val();             // { "John 3:16": {text, completed:false}, ... }
  const completed = completedSnap.exists() ? completedSnap.val() : {}; // { "John 3:16": true, ... }

  // Count completed
  const refs = Object.keys(scriptures);
  let done = 0;
  refs.forEach(r => { if (completed[r]) done++; });

  scriptureList.innerHTML += `<h3>${name}'s Scriptures</h3>`;
  scriptureList.innerHTML += `<p>${done} / ${refs.length} completed</p>`;

  // Sort by reference for stable order
  refs.sort((a,b)=> a.localeCompare(b, undefined, {numeric:true}));

  for (const refName of refs) {
    const verseObj = scriptures[refName];
    const isDone = !!completed[refName];

    scriptureList.innerHTML += `
      <div class="verse">
        <strong>${refName}</strong><br/>
        <p>${verseObj.text}</p>
        <span>${isDone ? "✅" : "⬜"}</span>
      </div>
    `;
  }
};

