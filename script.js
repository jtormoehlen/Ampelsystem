import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// TODO: Trage hier DEINE Firebase-Daten ein!
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

// Prüfen, ob die URL einen Parameter hat (z.B. ?platz=T5)
const urlParams = new URLSearchParams(window.location.search);
const mySeatParam = urlParams.get('platz');

if (mySeatParam) {
    // ==========================================
    // MODUS: SCHÜLER (Einzelansicht)
    // ==========================================
    
    // Lehrer-Ansicht verstecken, Schüler-Ansicht zeigen
    document.getElementById('teacher-view').style.display = 'none';
    document.getElementById('student-view').style.display = 'block';
    
    // Titel anpassen ("T5" wird zu "Tisch 5")
    document.getElementById('student-title').innerText = "Tisch " + mySeatParam.replace('T', '');
    
    const myBtn = document.getElementById('my-seat-btn');
    
    // Klick-Verhalten für den großen Button
    myBtn.onclick = function() {
        if (isCooldown) return; // Wenn Cooldown aktiv ist, Klick ignorieren
        
        // Cooldown für 3 Sekunden aktivieren
        isCooldown = true;
        document.getElementById('cooldown-msg').style.display = 'block';
        setTimeout(() => {
            isCooldown = false;
            document.getElementById('cooldown-msg').style.display = 'none';
        }, 3000);

        // Nächsten Status berechnen (0 -> 1 -> 2 -> 0)
        let currentState = parseInt(myBtn.getAttribute('data-state')) || 0;
        let newState = (currentState + 1) % 3;
        
        // In die Datenbank schreiben
        set(ref(db, 'seats/' + mySeatParam), newState);
    };

} else {
    // ==========================================
    // MODUS: LEHRER (Grid-Ansicht)
    // ==========================================
    
    // Funktion für Klicks im Grid durch den Lehrer (z.B. um einem Schüler den Status wegzunehmen)
    window.toggleSeat = function(seatId) {
        const el = document.getElementById(seatId);
        let currentState = parseInt(el.getAttribute('data-state')) || 0;
        let newState = (currentState + 1) % 3;
        set(ref(db, 'seats/' + seatId), newState);
    };

    // Funktion für den "Alle zurücksetzen" Button
    window.resetAll = function() {
        let updates = {};
        for(let i = 1; i <= 24; i++) {
            updates['T' + i] = 0;
        }
        set(ref(db, 'seats'), updates);
    };
}

// ==========================================
// ECHTZEIT-UPDATE (Gilt für Lehrer UND Schüler)
// ==========================================
onValue(ref(db, 'seats'), (snapshot) => {
    const data = snapshot.val() || {};
    
    // 1. Das Lehrer-Grid aktualisieren (falls der Lehrer zuschaut)
    if (!mySeatParam) {
        for(let i = 1; i <= 24; i++) {
            let seatId = 'T' + i;
            let state = data[seatId] !== undefined ? data[seatId] : 0;
            
            let el = document.getElementById(seatId);
            if (el) el.setAttribute('data-state', state);
        }
    }
    
    // 2. Den großen Schüler-Button aktualisieren (falls ein Schüler zuschaut)
    // Wichtig: Wenn der Lehrer auf "Reset" klickt, muss der Button des Schülers wieder auf Grau springen!
    if (mySeatParam) {
        let myState = data[mySeatParam] !== undefined ? data[mySeatParam] : 0;
        let myBtn = document.getElementById('my-seat-btn');
        
        if (myBtn) {
            myBtn.setAttribute('data-state', myState);
            
            // Text im Button passend zur Farbe anpassen
            if(myState === 0) myBtn.innerText = "Alles okay / Hilfe rufen";
            if(myState === 1) myBtn.innerText = "Ich brauche Hilfe (nicht dringend)";
            if(myState === 2) myBtn.innerText = "Ich brauche dringend Hilfe!";
        }
    }
});