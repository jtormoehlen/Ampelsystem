import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0DpG6n-odd5XX7MEQBgyapug-xVoY_R8",
  authDomain: "ampelsystem-12f61.firebaseapp.com",
  databaseURL: "https://ampelsystem-12f61-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ampelsystem-12f61",
  storageBucket: "ampelsystem-12f61.firebasestorage.app",
  messagingSenderId: "43961851379",
  appId: "1:43961851379:web:839f9d2cc7564669ed8686",
  measurementId: "G-HC2BV52LY4"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let isCooldown = false;

// Diese Funktionen MÜSSEN immer geladen werden (für das HTML)
window.toggleSeat = function(seatId) {
    const el = document.getElementById(seatId);
    if (!el) return;
    let currentState = parseInt(el.getAttribute('data-state')) || 0;
    let newState = (currentState + 1) % 4; // 0, 1, 2, 3 (neu: 3 = "Fertig")
    set(ref(db, 'seats/' + seatId), newState);
};

window.resetAll = function() {
    let updates = {};
    for(let i = 1; i <= 35; i++) {
        updates['T' + i] = 0;
    }
    set(ref(db, 'seats'), updates);
};

// Prüfen, ob die URL einen Parameter hat (z.B. ?platz=T5)
const urlParams = new URLSearchParams(window.location.search);
const mySeatParam = urlParams.get('platz');

if (mySeatParam) {
    // ==========================================
    // MODUS: SCHÜLER (Einzelansicht)
    // ==========================================
    document.getElementById('teacher-view').style.display = 'none';
    document.getElementById('student-view').style.display = 'block';
    
    document.getElementById('student-title').innerText = "Tisch " + mySeatParam.replace('T', '');
    
    const myBtn = document.getElementById('my-seat-btn');
    
    myBtn.onclick = function() {
        if (isCooldown) return; 
        
        isCooldown = true;
        document.getElementById('cooldown-msg').style.display = 'block';
        setTimeout(() => {
            isCooldown = false;
            document.getElementById('cooldown-msg').style.display = 'none';
        }, 3000);

        let currentState = parseInt(myBtn.getAttribute('data-state')) || 0;
        let newState = (currentState + 1) % 4; // 0, 1, 2, 3 (neu: 3 = "Fertig")
        
        set(ref(db, 'seats/' + mySeatParam), newState);
    };
} 

// ==========================================
// ECHTZEIT-UPDATE (Gilt für Lehrer UND Schüler)
// ==========================================
onValue(ref(db, 'seats'), (snapshot) => {
    const data = snapshot.val() || {};
    
    // 1. Das Lehrer-Grid aktualisieren
    if (!mySeatParam) {
        for(let i = 1; i <= 35; i++) {
            let seatId = 'T' + i;
            let state = data[seatId] !== undefined ? data[seatId] : 0;
            
            let el = document.getElementById(seatId);
            if (el) el.setAttribute('data-state', state);
        }
    }
    
    // 2. Den großen Schüler-Button aktualisieren
    if (mySeatParam) {
        let myState = data[mySeatParam] !== undefined ? data[mySeatParam] : 0;
        let myBtn = document.getElementById('my-seat-btn');
        
        if (myBtn) {
            myBtn.setAttribute('data-state', myState);
            
            if(myState === 0) myBtn.innerText = "Alles okay / Hilfe rufen";
            if(myState === 1) myBtn.innerText = "Ich brauche Hilfe (nicht dringend)";
            if(myState === 2) myBtn.innerText = "Ich brauche dringend Hilfe!";
            if(myState === 3) myBtn.innerText = "Ich bin fertig!";
        }
    }
});