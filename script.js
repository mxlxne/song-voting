import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot } 
    from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAN8XBT9NazVeIgC_0-e2MIFtV9vMFljsQ",
  authDomain: "song-voting-f0763.firebaseapp.com",
  projectId: "song-voting-f0763",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Unique user
const userId = localStorage.getItem("userId") || (() => {
    const id = crypto.randomUUID();
    localStorage.setItem("userId", id);
    return id;
})();

// DOM
const projectView = document.getElementById("projectView");
const songView = document.getElementById("songView");
const projectList = document.getElementById("projectList");
const votingList  = document.getElementById("votingList");
const rankingList = document.getElementById("rankingList");

document.getElementById("createProjectBtn").onclick = async () => {
    const name = document.getElementById("projectInput").value.trim();
    if (!name) return;
    await addDoc(collection(db, "projects"), { name });
};

onSnapshot(collection(db, "projects"), snap => {
    projectList.innerHTML = "";
    snap.forEach(p => {
        const li = document.createElement("li");
        li.textContent = p.data().name;
        li.onclick = () => openProject(p.id);
        projectList.appendChild(li);
    });
});

function openProject(id) {
    projectView.classList.remove("active");
    songView.classList.add("active");
    listenSongs(id);
}

document.getElementById("backBtn").onclick = () => {
    songView.classList.remove("active");
    projectView.classList.add("active");
};

async function listenSongs(projectId) {
    votingList.innerHTML = "";
    rankingList.innerHTML = "";
    onSnapshot(collection(db, "projects", projectId, "songs"), snap => {
        snap.forEach(s => renderSong(s.id, s.data(), projectId));
        renderRanking(snap);
    });
}

function renderSong(id, data, projectId) {
    const li = document.createElement("li");
    li.className = "song";
    li.textContent = data.name;

    const row = document.createElement("div");
    row.className = "voteRow";

    [1,2,3,4,5].forEach(v => {
        const btn = document.createElement("button");
        btn.textContent = v;
        btn.onclick = async () => {
            const votes = [...(data.votes||[])];
            const found = votes.find(x => x.userId === userId);
            if (found) found.value = v;
            else votes.push({ userId, value: v });
            await updateDoc(doc(db, "projects", projectId, "songs", id), { votes });
        };
        row.appendChild(btn);
    });

    const no = document.createElement("button");
    no.textContent = "🚫";
    no.onclick = async () => {
        await updateDoc(doc(db, "projects", projectId, "songs", id), { noGo: !data.noGo });
    };
    row.appendChild(no);

    const del = document.createElement("button");
    del.textContent = "🗑️";
    del.onclick = async () => {
        if (confirm("Song löschen?")) {
            await deleteDoc(doc(db, "projects", projectId, "songs", id));
        }
    };
    row.appendChild(del);

    li.appendChild(row);
    votingList.appendChild(li);
}

function renderRanking(songs) {
    rankingList.innerHTML = "";
    songs.forEach(s => {
        const avg = s.data().votes?.reduce((a,v)=>a+v.value,0)/s.data().votes?.length;
        const li = document.createElement("li");
        li.textContent = `${s.data().name} – ${avg?.toFixed(2) ?? "-"}`;
        rankingList.appendChild(li);
    });
}
