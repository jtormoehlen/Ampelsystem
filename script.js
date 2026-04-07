import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// TODO: Diese Konfiguration ersetzt du mit den Daten aus deinem Firebase-Projekt
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


// Firebase initialisieren
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let isCooldown = false; // Spam-Schutz

// 1. URL auslesen
const urlParams = new URLSearchParams(window.location.search);
const mySeatParam = urlParams.get('platz'); // Sucht nach "?platz=T5"

// 2. Ansichten steuern
if (mySeatParam) {
    // SCHÜLER-MODUS
    document.getElementById('teacher-view').style.display = 'none'; // Grid verstecken
    document.getElementById('student-view').style.display = 'block'; // Einzelbutton zeigen
    
    // Titel anpassen (z.B. "T5" -> "5")
    document.getElementById('student-title').innerText = "Tisch " + mySeatParam.replace('T', '');
    
    // Den großen Button mit dem Firebase-Wert verknüpfen
    const myBtn = document.getElementById('my-seat-btn');
    
    myBtn.onclick = function() {
        if (isCooldown) return; // Klick ignorieren, wenn Cooldown aktiv
        
        // Cooldown aktivieren (3 Sekunden)
        isCooldown = true;
        document.getElementById('cooldown-msg').style.display = 'block';
        setTimeout(() => {
            isCooldown = false;
            document.getElementById('cooldown-msg').style.display = 'none';
        }, 3000);

        // Firebase Update (wie bisher)
        let currentState = parseInt(myBtn.getAttribute('data-state')) || 0;
        let newState = (currentState + 1) % 3;
        
        // Optisches Feedback für den großen Button
        myBtn.setAttribute('data-state', newState);
        if(newState === 0) myBtn.innerText = "Hilfe rufen";
        if(newState === 1) myBtn.innerText = "Hilfe (nicht dringend)";
        if(newState === 2) myBtn.innerText = "Hilfe (dringend!)";
        
        // An Firebase senden
        set(ref(db, 'seats/' + mySeatParam), newState);
    };

} else {
    // LEHRER-MODUS (Die URL hat keinen "?platz="-Parameter)
    // Alles bleibt sichtbar. Du brauchst hier keinen Cooldown, 
    // da du als Lehrer die volle Kontrolle haben willst.
}

// Funktion, die beim Klick auf einen Sitzplatz aufgerufen wird
window.toggleSeat = function(seatId) {
    const el = document.getElementById(seatId);
    
    // Aktuellen Status auslesen (0, 1 oder 2)
    let currentState = parseInt(el.getAttribute('data-state')) || 0;
    
    // Status hochzählen: 0 -> 1 -> 2 -> 0
    let newState = (currentState + 1) % 3;
    
    // Optisch sofort für den Klickenden ändern (fühlt sich schneller an)
    el.setAttribute('data-state', newState);
    
    // Neuen Status an Firebase senden
    set(ref(db, 'seats/' + seatId), newState);
};

// Button: Alle Plätze wieder auf Grau (0) setzen
window.resetAll = function() {
    let updates = {};
    for(let i = 1; i <= 24; i++) {
        updates['T' + i] = 0;
    }
    // Alle Werte auf einmal in der Datenbank überschreiben
    set(ref(db, 'seats'), updates);
};

// Listener: Hört in Echtzeit auf alle Änderungen
onValue(ref(db, 'seats'), (snapshot) => {
    const data = snapshot.val() || {};
    
    // Update für die Lehrer-Ansicht (das Grid)
    for(let i = 1; i <= 24; i++) {
        let seatId = 'T' + i;
        let state = data[seatId] !== undefined ? data[seatId] : 0;
        
        let el = document.getElementById(seatId);
        if (el) el.setAttribute('data-state', state);
    }
    
    // Update für die Schüler-Ansicht (den großen Button),
    // falls der Lehrer am Pult auf "Reset" gedrückt hat!
    if (mySeatParam) {
        let myState = data[mySeatParam] !== undefined ? data[mySeatParam] : 0;
        let myBtn = document.getElementById('my-seat-btn');
        if (myBtn) {
            myBtn.setAttribute('data-state', myState);
            if(myState === 0) myBtn.innerText = "Hilfe rufen";
            if(myState === 1) myBtn.innerText = "Hilfe (nicht dringend)";
            if(myState === 2) myBtn.innerText = "Hilfe (dringend!)";
        }
    }
});