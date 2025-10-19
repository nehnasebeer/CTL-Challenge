<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyCkTG00WHDtt5D3HAwsuX377FH6x_2CDuY",
    authDomain: "ctl-challenge-sunday.firebaseapp.com",
    projectId: "ctl-challenge-sunday",
    storageBucket: "ctl-challenge-sunday.firebasestorage.app",
    messagingSenderId: "53064067313",
    appId: "1:53064067313:web:df9e667545de55b38ea150",
    measurementId: "G-BPWWLBWJR1"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
