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

// Listener: Hört in Echtzeit auf alle Änderungen in der Datenbank
onValue(ref(db, 'seats'), (snapshot) => {
    const data = snapshot.val() || {};
    
    // Alle 24 Plätze durchgehen und Status updaten
    for(let i = 1; i <= 24; i++) {
        let seatId = 'T' + i;
        let state = data[seatId] !== undefined ? data[seatId] : 0;
        
        let el = document.getElementById(seatId);
        if (el) {
            el.setAttribute('data-state', state);
        }
    }
});