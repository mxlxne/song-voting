import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot }
from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

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

const userId = localStorage.getItem("userId") || (() => {
    const id = crypto.randomUUID();
    localStorage.setItem("userId", id);
    return id;
})();

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

/* Projekte */
createProjectBtn.onclick = async () => {
    if (!projectInput.value) return;
    await addDoc(collection(db, "projects"), { name: projectInput.value });
    projectInput.value = "";
};

onSnapshot(collection(db, "projects"), snap => {
    projectList.innerHTML = "";
    snap.forEach(p => {
        const li = document.createElement("li");
        const project = document.createElement("div");
        project.className = "project";

        const name = document.createElement("div");
        name.textContent = p.data().name;

        const del = document.createElement("button");
        del.textContent = "🗑️";
        del.className = "deleteProject";
        del.onclick = async e => {
            e.stopPropagation();
            if (confirm("Projekt löschen?")) {
                await deleteDoc(doc(db, "projects", p.id));
            }
        };

        project.onclick = () => {
            if (selectedProject === p.id) openProject(p.id);
            else {
                selectedProject = p.id;
                document.querySelectorAll(".project").forEach(el => el.classList.remove("selected"));
                project.classList.add("selected");
            }
        };

        project.append(name, del);
        li.appendChild(project);
        projectList.appendChild(li);
    });
});

function openProject(id) {
    currentProject = id;
    projectView.classList.remove("active");
    songView.classList.add("active");
    listenSongs();
}

backBtn.onclick = () => {
    if (unsubscribe) unsubscribe();
    songView.classList.remove("active");
    projectView.classList.add("active");
    selectedProject = null;
};

/* Songs */
addSongBtn.onclick = async () => {
    if (!songInput.value) return;
    await addDoc(collection(db, "projects", currentProject, "songs"), {
        name: songInput.value,
        votes: [],
        noGo: false
    });
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

    const title = document.createElement("strong");
    title.textContent = song.name;

    const controls = document.createElement("div");
    controls.className = "songControls";

    const existing = song.votes.find(v => v.userId === userId);

    for (let i = 1; i <= 5; i++) {
        const b = document.createElement("button");
        b.textContent = i;
        b.className = "vote vote-" + i;
        if (existing?.value === i) b.classList.add("activeVote");
        b.onclick = async () => {
            const votes = [...song.votes];
            const found = votes.find(v => v.userId === userId);
            if (found) found.value = i;
            else votes.push({ userId, value: i });
            await updateDoc(doc(db, "projects", currentProject, "songs", song.id), { votes });
        };
        controls.appendChild(b);
    }

    const no = document.createElement("button");
    no.textContent = "🚫";
    no.className = "vote no";
    no.onclick = async () => {
        await updateDoc(doc(db, "projects", currentProject, "songs", song.id), { noGo: !song.noGo });
    };

    const del = document.createElement("button");
    del.textContent = "🗑️";
    del.className = "vote delete";
    del.onclick = async () => {
        if (confirm("Lied löschen?")) {
            await deleteDoc(doc(db, "projects", currentProject, "songs", song.id));
        }
    };

    controls.append(no, del);
    li.append(title, controls);
    votingList.appendChild(li);
}

function renderRanking(songs) {
    songs
        .map(s => ({
            ...s,
            avg: (!s.noGo && s.votes.length)
                ? s.votes.reduce((a, v) => a + v.value, 0) / s.votes.length
                : null
        }))
        .sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1))
        .forEach((s, i) => {
            const li = document.createElement("li");
            li.className = "rankItem" + (s.noGo ? " rankNoGo" : "");
            li.innerHTML = `
                <span class="rankPos">${i + 1}</span>
                <span class="rankName">${s.name}</span>
                <span class="rankScore">${s.avg === null ? "–" : s.avg.toFixed(2)}</span>
            `;
            rankingList.appendChild(li);
        });
}
