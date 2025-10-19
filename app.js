import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

// Your Firebase configuration
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Load student data
window.loadStudent = async function() {
  const name = document.getElementById("studentName").value.trim();
  if (!name) return alert("Please enter your name!");

  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, `students/${name}`));

  const scriptureList = document.getElementById("scriptureList");
  scriptureList.innerHTML = "";

  if (!snapshot.exists()) {
    scriptureList.innerHTML = `<p>No record found for ${name}. Please ask an admin to add you.</p>`;
    return;
  }

  const data = snapshot.val();
  scriptureList.innerHTML = `<h3>${name}'s Scriptures</h3>`;

  for (let verse in data.scriptures) {
    const s = data.scriptures[verse];
    scriptureList.innerHTML += `
      <div class="verse">
        <strong>${verse}</strong>
        <p>${s.text}</p>
        <span>${s.completed ? "✅" : "⬜"}</span>
      </div>
    `;
  }
};
