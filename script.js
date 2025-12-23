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

const projectInput = document.getElementById("projectInput");
const createProjectBtn = document.getElementById("createProjectBtn");
const projectList = document.getElementById("projectList");

const songInput = document.getElementById("songInput");
const addSongBtn = document.getElementById("addSongBtn");
const votingList = document.getElementById("votingList");
const rankingList = document.getElementById("rankingList");

let currentProject = null;

/* Projekte */
createProjectBtn.onclick = async () => {
    if (!projectInput.value) return;
    await addDoc(collection(db, "projects"), { name: projectInput.value });
    projectInput.value = "";
};

onSnapshot(collection(db, "projects"), snap => {
    projectList.innerHTML = "";
    snap.forEach(docu => {
        const li = document.createElement("li");
        li.textContent = docu.data().name;
        li.onclick = () => currentProject = docu.id;

        const del = document.createElement("button");
        del.textContent = "🗑️";
        del.className = "deleteProject";
        del.onclick = async e => {
            e.stopPropagation();
            if (confirm("Projekt löschen?")) {
                await deleteDoc(doc(db, "projects", docu.id));
            }
        };

        li.appendChild(del);
        projectList.appendChild(li);
    });
});

/* Songs */
addSongBtn.onclick = async () => {
    if (!songInput.value || !currentProject) return;
    await addDoc(collection(db, "songs"), {
        name: songInput.value,
        project: currentProject,
        votes: [],
        noGo: false
    });
    songInput.value = "";
};

onSnapshot(collection(db, "songs"), snap => {
    votingList.innerHTML = "";
    rankingList.innerHTML = "";

    const songs = [];
    snap.forEach(docu => {
        if (docu.data().project === currentProject) {
            songs.push({ id: docu.id, ...docu.data() });
        }
    });

    songs.forEach(song => {
        const li = document.createElement("li");
        li.className = "song" + (song.noGo ? " noGo" : "");
        li.innerHTML = `<strong>${song.name}</strong>`;

        for (let i = 1; i <= 5; i++) {
            const b = document.createElement("button");
            b.textContent = i;
            b.className = `vote-${i}`;
            b.onclick = async () => {
                song.votes.push(i);
                await updateDoc(doc(db, "songs", song.id), { votes: song.votes });
            };
            li.appendChild(b);
        }

        const no = document.createElement("button");
        no.textContent = "🚫";
        no.className = "no";
        no.onclick = async () => {
            await updateDoc(doc(db, "songs", song.id), { noGo: !song.noGo });
        };

        const del = document.createElement("button");
        del.textContent = "🗑️";
        del.className = "delete";
        del.onclick = async () => {
            await deleteDoc(doc(db, "songs", song.id));
        };

        li.append(no, del);
        votingList.appendChild(li);

        const avg = song.votes.length
            ? (song.votes.reduce((a,b)=>a+b)/song.votes.length).toFixed(2)
            : "—";

        const rank = document.createElement("li");
        rank.innerHTML = `<span>${song.name}</span><span>${avg}</span>`;
        rankingList.appendChild(rank);
    });
});