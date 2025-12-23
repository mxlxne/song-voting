// Imports müssen ganz oben stehen
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, increment } 
    from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAN8XBT9NazVeIgC_0-e2MIFtV9vMFljsQ",
  authDomain: "song-voting-f0763.firebaseapp.com",
  projectId: "song-voting-f0763",
  storageBucket: "song-voting-f0763.firebasestorage.app",
  messagingSenderId: "270124010704",
  appId: "1:270124010704:web:c31060bf57563de96e22d5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* User */
const userId =
    localStorage.getItem("userId") ||
    (() => {
        const id = crypto.randomUUID();
        localStorage.setItem("userId", id);
        return id;
    })();

/* DOM */
const projectView = document.getElementById("projectView");
const songView = document.getElementById("songView");

const projectInput = document.getElementById("projectInput");
const createProjectBtn = document.getElementById("createProjectBtn");
const projectList = document.getElementById("projectList");

const songInput = document.getElementById("songInput");
const addSongBtn = document.getElementById("addSongBtn");
const votingList = document.getElementById("votingList");
const rankingList = document.getElementById("rankingList");
const backBtn = document.getElementById("backBtn");

let currentProject = null;
let unsubscribe = null;
let selectedProject = null;

/* Projekt erstellen */
createProjectBtn.onclick = async () => {
    if (!projectInput.value) return;
    await addDoc(collection(db, "projects"), { name: projectInput.value });
    projectInput.value = "";
};

/* Projekte */
onSnapshot(collection(db, "projects"), snap => {
    projectList.innerHTML = "";
    snap.forEach(p => {
        const li = document.createElement("li");
        li.className = "project";
        li.textContent = p.data().name;

        li.onclick = () => {
            if (selectedProject === p.id) {
                openProject(p.id);
            } else {
                selectedProject = p.id;
                document.querySelectorAll(".project").forEach(el => el.classList.remove("selected"));
                li.classList.add("selected");
            }
        };

        const del = document.createElement("button");
        del.textContent = "🗑️";
        del.className = "deleteProject";
        del.onclick = async e => {
            e.stopPropagation();
            if (confirm("Projekt löschen?")) {
                await deleteDoc(doc(db, "projects", p.id));
            }
        };

        li.appendChild(del);
        projectList.appendChild(li);
    });
});

/* Öffnen */
function openProject(id) {
    currentProject = id;
    projectView.classList.remove("active");
    songView.classList.add("active");
    listenSongs();
}

/* Zurück */
backBtn.onclick = () => {
    if (unsubscribe) unsubscribe();
    songView.classList.remove("active");
    projectView.classList.add("active");
    selectedProject = null;
};

/* Songs */
addSongBtn.onclick = async () => {
    if (!songInput.value) return;
    await addDoc(
        collection(db, "projects", currentProject, "songs"),
        { name: songInput.value, votes: [], noGo: false }
    );
    songInput.value = "";
};

function listenSongs() {
    unsubscribe = onSnapshot(
        collection(db, "projects", currentProject, "songs"),
        snap => {
            votingList.innerHTML = "";
            rankingList.innerHTML = "";
            const songs = [];
            snap.forEach(s => songs.push({ id: s.id, ...s.data() }));
            songs.forEach(renderSong);
            renderRanking(songs);
        }
    );
}

function renderSong(song) {
    const li = document.createElement("li");
    li.className = "song" + (song.noGo ? " noGo" : "");
    li.innerHTML = `<strong>${song.name}</strong>`;

    const existing = song.votes.find(v => v.userId === userId);

    for (let i = 1; i <= 5; i++) {
        const b = document.createElement("button");
        b.textContent = i;
        b.className = `vote-${i}`;
        if (existing?.value === i) b.classList.add("activeVote");

        b.onclick = async () => {
            let votes = [...song.votes];
            const found = votes.find(v => v.userId === userId);
            if (found) {
                alert("Deine Stimme wird geändert.");
                found.value = i;
            } else {
                votes.push({ userId, value: i });
            }
            await updateDoc(doc(db, "projects", currentProject, "songs", song.id), { votes });
        };
        li.appendChild(b);
    }

    const no = document.createElement("button");
    no.textContent = "🚫";
    no.className = "no";
    no.onclick = async () => {
        await updateDoc(doc(db, "projects", currentProject, "songs", song.id), { noGo: !song.noGo });
    };

    const del = document.createElement("button");
    del.textContent = "🗑️";
    del.className = "delete";
    del.onclick = async () => {
        await deleteDoc(doc(db, "projects", currentProject, "songs", song.id));
    };

    li.append(no, del);
    votingList.appendChild(li);
}

function renderRanking(songs) {
    songs
        .map(s => ({
            ...s,
            avg: (!s.noGo && s.votes.length)
                ? s.votes.reduce((a,v) => a + v.value, 0) / s.votes.length
                : null
        }))
        .sort((a,b) => (b.avg ?? -1) - (a.avg ?? -1))
        .forEach(s => {
            const li = document.createElement("li");
            if (s.noGo) li.classList.add("rankNoGo");
            li.innerHTML = `<span>${s.name}</span><span>${s.avg === null ? "–" : s.avg.toFixed(2)}</span>`;
            rankingList.appendChild(li);
        });
}