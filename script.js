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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// ---------------- Dark Mode ----------------
document.getElementById("darkModeToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark");
});

// ---------------- Projekte ----------------
const projectInput = document.getElementById("projectInput");
const addProjectBtn = document.getElementById("addProjectBtn");
const projectList = document.getElementById("projectList");
let currentProject = null;

addProjectBtn.addEventListener("click", async () => {
    const name = projectInput.value.trim();
    if (!name) return;
    await addDoc(collection(db, "projects"), { name });
    projectInput.value = "";
});

// Projekte anzeigen
onSnapshot(collection(db, "projects"), snapshot => {
    projectList.innerHTML = "";
    snapshot.forEach(docSnap => {
        const li = document.createElement("li");
        li.textContent = docSnap.data().name;
        li.style.cursor = "pointer";
        li.addEventListener("click", () => openProject(docSnap.id, docSnap.data().name));
        if(currentProject === docSnap.id) li.classList.add("active");
        projectList.appendChild(li);
    });
});

// ---------------- Songs ----------------
const currentProjectSection = document.getElementById("currentProjectSection");
const currentProjectNameSpan = document.getElementById("currentProjectName");
const songInput = document.getElementById("songInput");
const addSongBtn = document.getElementById("addSongBtn");
const votingList = document.getElementById("votingList");
const rankingList = document.getElementById("rankingList");

addSongBtn.addEventListener("click", async () => {
    const title = songInput.value.trim();
    if (!title || !currentProject) return;
    await addDoc(collection(db, "projects", currentProject, "songs"), {
        title, total: 0, votes: 0, noGo: 0
    });
    songInput.value = "";
});

function openProject(projectId, name) {
    currentProject = projectId;
    currentProjectNameSpan.textContent = name;
    currentProjectSection.style.display = "block";
    loadSongs(projectId);
    highlightActiveProject();
}

function highlightActiveProject(){
    document.querySelectorAll("#projectList li").forEach(li => li.classList.remove("active"));
    const activeLi = Array.from(document.querySelectorAll("#projectList li")).find(li => li.textContent === currentProjectNameSpan.textContent);
    if(activeLi) activeLi.classList.add("active");
}

function loadSongs(projectId){
    const songCol = collection(db, "projects", projectId, "songs");
    onSnapshot(songCol, snapshot => {
        votingList.innerHTML = "";
        rankingList.innerHTML = "";
        const songs = [];
        snapshot.forEach(docSnap => {
            const s = docSnap.data();
            s.id = docSnap.id;
            s.rating = s.noGo > 0 ? -100 : (s.votes ? s.total / s.votes : 0);
            songs.push(s);
        });

        // Voting List
        songs.forEach(song => {
            const li = document.createElement("li");
            li.className = "song";
            if(song.noGo > 0) li.classList.add("noGo");
            const titleEl = document.createElement("strong");
            titleEl.textContent = song.title;
            li.appendChild(titleEl);

            [1,2,3,4,5].forEach(n => {
                const btn = document.createElement("button");
                btn.textContent = n;
                btn.addEventListener("click", () => vote(song.id, n));
                li.appendChild(btn);
            });

            const noBtn = document.createElement("button");
            noBtn.textContent = "🚫";
            noBtn.className = "no";
            noBtn.addEventListener("click", () => vote(song.id, "no"));
            li.appendChild(noBtn);

            const delBtn = document.createElement("button");
            delBtn.textContent = "🗑️";
            delBtn.className = "delete";
            delBtn.addEventListener("click", () => vote(song.id, "delete"));
            li.appendChild(delBtn);

            votingList.appendChild(li);
        });

        // Ranking
        songs.sort((a,b) => b.rating - a.rating).forEach((song,index) => {
            const li = document.createElement("li");
            li.className = "song";
            li.innerHTML = `<strong>#${index+1} ${song.title}</strong> <div class="rating">⭐ ${song.rating.toFixed(2)}</div>`;
            rankingList.appendChild(li);
        });
    });
}

// ---------------- Voting ----------------
function vote(songId, value){
    if(!currentProject) return;
    const votedKey = "votedSongs_" + currentProject;
    const voted = JSON.parse(localStorage.getItem(votedKey) || "[]");

    if(value !== "delete" && voted.includes(songId)){
        alert("Du hast bereits für diesen Song abgestimmt!");
        return;
    }

    const ref = doc(db, "projects", currentProject, "songs", songId);

    if(value === "no"){
        updateDoc(ref, { noGo: increment(1) });
    }else if(value === "delete"){
        if(confirm("Willst du diesen Song wirklich löschen?")){
            deleteDoc(ref);
        }
        return;
    }else{
        updateDoc(ref, { total: increment(value), votes: increment(1) });
        voted.push(songId);
        localStorage.setItem(votedKey, JSON.stringify(voted));
    }
}
document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("darkModeToggle");
    toggle.addEventListener("click", () => {
        document.body.classList.toggle("dark");
    });
});
