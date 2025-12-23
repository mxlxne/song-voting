// Firebase config 
const firebaseConfig = {
    apiKey: "AIzaSyAN8XBT9NazVeIgC_0-e2MIFtV9vMFljsQ",
    authDomain: "song-voting-f0763.firebaseapp.com",
    projectId: "song-voting-f0763",
    storageBucket: "song-voting-f0763.firebasestorage.app",
    messagingSenderId: "270124010704",
    appId: "1:270124010704:web:c31060bf57563de96e22d5",
    measurementId: "G-FHHKR740EY"
  };



const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ---------------- Dark Mode ----------------
document.getElementById("darkModeToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark");
});

// ---------------- Song hinzufügen ----------------
document.getElementById("addSongBtn").addEventListener("click", () => {
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
});

// ---------------- Voting & Ranking ----------------
db.collection("songs").onSnapshot(snapshot => {
    const votingList = document.getElementById("votingList");
    const rankingList = document.getElementById("rankingList");

    votingList.innerHTML = "";
    rankingList.innerHTML = "";

    let songs = [];

    snapshot.forEach(doc => {
        const s = doc.data();
        s.id = doc.id;
        s.rating = s.noGo > 0 ? -100 : (s.votes ? s.total / s.votes : 0);
        songs.push(s);
    });

    // Voting-Liste
    songs.forEach(song => {
        const li = document.createElement("li");
        li.className = "song";
        if (song.noGo > 0) li.classList.add("noGo");

        const title = document.createElement("strong");
        title.textContent = song.title;
        li.appendChild(title);

        // Sterne-Buttons
        [1,2,3,4,5].forEach(n => {
            const btn = document.createElement("button");
            btn.textContent = n;
            btn.addEventListener("click", () => vote(song.id, n));
            li.appendChild(btn);
        });

        // No-Go Button
        const noBtn = document.createElement("button");
        noBtn.textContent = "🚫";
        noBtn.className = "no";
        noBtn.addEventListener("click", () => vote(song.id, "no"));
        li.appendChild(noBtn);

        // Delete Button
        const delBtn = document.createElement("button");
        delBtn.textContent = "🗑️";
        delBtn.className = "delete";
        delBtn.addEventListener("click", () => vote(song.id, "delete"));
        li.appendChild(delBtn);

        votingList.appendChild(li);
    });

    // Ranking-Liste sortiert
    songs.sort((a,b) => b.rating - a.rating).forEach((song,index) => {
        const li = document.createElement("li");
        li.className = "song";
        li.innerHTML = `<strong>#${index+1} ${song.title}</strong> <div class="rating">⭐ ${song.rating.toFixed(2)}</div>`;
        rankingList.appendChild(li);
    });
});

// ---------------- Voting Funktion ----------------
function vote(id, value) {
    const voted = JSON.parse(localStorage.getItem("votedSongs") || "[]");

    if (value !== "delete" && voted.includes(id)) {
        alert("Du hast bereits für diesen Song abgestimmt!");
        return;
    }

    const ref = db.collection("songs").doc(id);

    if (value === "no") {
        ref.update({ noGo: firebase.firestore.FieldValue.increment(1) });
    } else if (value === "delete") {
        if (confirm("Willst du diesen Song wirklich löschen?")) {
            ref.delete();
        }
        return;
    } else {
        ref.update({
            total: firebase.firestore.FieldValue.increment(value),
            votes: firebase.firestore.FieldValue.increment(1)
        });
        voted.push(id);
        localStorage.setItem("votedSongs", JSON.stringify(voted));
    }
}
