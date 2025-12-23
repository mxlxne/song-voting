const firebaseConfig = {
    apiKey: "AIzaSyAN8XBT9NazVeIgC_0-e2MIFtV9vMFljsQ",
    authDomain: "song-voting-f0763.firebaseapp.com",
    projectId: "song-voting-f0763",
    storageBucket: "song-voting-f0763.firebasestorage.app",
    messagingSenderId: "270124010704",
    appId: "1:270124010704:web:c31060bf57563de96e22d5",
    measurementId: "G-FHHKR740EY"
  };


firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

//➕ Song hinzufügen
function addSong() {
    const input = document.getElementById("songInput");
    const title = input.value.trim();
    if (!title) return;

    db.collection("songs").add({
        title: title,
        total: 0,
        votes: 0,
        noGo: 0
    });

    input.value = "";
}

// ⭐ Abstimmen
function vote(id, value) {
    const ref = db.collection("songs").doc(id);

    if (value === "no") {
        ref.update({
            noGo: firebase.firestore.FieldValue.increment(1)
        });
    } else {
        ref.update({
            total: firebase.firestore.FieldValue.increment(value),
            votes: firebase.firestore.FieldValue.increment(1)
        });
    }
}

// 🔄 Live-Updates + Sortierung
db.collection("songs").onSnapshot(snapshot => {
    const list = document.getElementById("songList");
    list.innerHTML = "";

    let songs = [];

    snapshot.forEach(doc => {
        const s = doc.data();
        s.id = doc.id;
        s.rating = s.noGo > 0 ? -100 : (s.votes ? s.total / s.votes : 0);
        songs.push(s);
    });

    songs.sort((a, b) => b.rating - a.rating);

    songs.forEach(song => {
        const li = document.createElement("li");
        li.innerHTML = `
            <strong>${song.title}</strong><br>
            ⭐ ${song.rating.toFixed(2)}
            <br>
            ${[1,2,3,4,5].map(n =>
                `<button onclick="vote('${song.id}', ${n})">${n}</button>`
            ).join("")}
            <button onclick="vote('${song.id}', 'no')">🚫 Auf keinen Fall</button>
        `;
        list.appendChild(li);
    });
});
