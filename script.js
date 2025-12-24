import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, getDocs } 
from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig={apiKey:"AIzaSyAN8XBT9NazVeIgC_0-e2MIFtV9vMFljsQ",authDomain:"song-voting-f0763.firebaseapp.com",projectId:"song-voting-f0763"};
const app=initializeApp(firebaseConfig); const db=getFirestore(app);
const userId=localStorage.getItem("userId")||(()=>{const id=crypto.randomUUID(); localStorage.setItem("userId",id); return id;})();

const projectView=document.getElementById("projectView"), songView=document.getElementById("songView");
const projectList=document.getElementById("projectList"), votingList=document.getElementById("votingList"), rankingList=document.getElementById("rankingList");

let currentProject=null;

document.getElementById("createProjectBtn").onclick=async()=>{
  const name=document.getElementById("projectInput").value.trim();
  if(!name) return;
  const q=query(collection(db,"projects"),where("name","==",name));
  const snap=await getDocs(q); if(!snap.empty){alert("Projekt existiert bereits!"); return;}
  await addDoc(collection(db,"projects"),{name}); document.getElementById("projectInput").value="";
};

onSnapshot(collection(db,"projects"),snap=>{
  projectList.innerHTML="";
  snap.forEach(p=>{
    const li=document.createElement("li"); li.className="project"; li.textContent=p.data().name;
    li.onclick=()=>openProject(p.id); projectList.appendChild(li);
  });
});

function openProject(id){currentProject=id; projectView.classList.remove("active"); songView.classList.add("active"); listenSongs(id);}
document.getElementById("backBtn").onclick=()=>{songView.classList.remove("active"); projectView.classList.add("active");}

function listenSongs(projectId){
  onSnapshot(collection(db,"projects",projectId,"songs"),snap=>{
    votingList.innerHTML=""; rankingList.innerHTML="";
    snap.forEach(s=>renderSong(s.id,s.data(),projectId));
    renderRanking(snap);
  });
}

function renderSong(id,data,projectId){
  const li=document.createElement("li"); li.className="song"; if(data.noGo) li.classList.add("noGo"); li.textContent=data.name;
  const row=document.createElement("div"); row.className="voteRow";

  for(let i=1;i<=5;i++){
    const btn=document.createElement("button"); btn.textContent=i; btn.className="vote-"+i;
    btn.onclick=async()=>{
      const votes=[...(data.votes||[])]; const found=votes.find(x=>x.userId===userId);
      if(found) found.value=i; else votes.push({userId,value:i});
      await updateDoc(doc(db,"projects",projectId,"songs",id),{votes});
    }
    row.appendChild(btn);
  }

  const no=document.createElement("button"); no.textContent="🚫"; no.className="noGoBtn"; 
  no.onclick=async()=>{await updateDoc(doc(db,"projects",projectId,"songs",id),{noGo:!data.noGo});}

  const del=document.createElement("button"); del.textContent="🗑️"; del.className="delBtn";
  del.onclick=async()=>{if(confirm("Song wirklich löschen?")) await deleteDoc(doc(db,"projects",projectId,"songs",id));}

  row.appendChild(no); row.appendChild(del); li.appendChild(row); votingList.appendChild(li);
}

function renderRanking(songs){rankingList.innerHTML=""; songs.forEach(s=>{const avg=s.data().votes?.reduce((a,v)=>a+v.value,0)/s.data().votes?.length; const li=document.createElement("li"); li.textContent=`${s.data().name} – ${avg?.toFixed(2)??"-"}`; rankingList.appendChild(li);})}

document.getElementById("addSongBtn").onclick=async()=>{
  const name=document.getElementById("songInput").value.trim(); if(!name) return;
  if(!currentProject){alert("Kein Projekt ausgewählt!"); return;}
  const q=query(collection(db,"projects",currentProject,"songs"),where("name","==",name));
  const snap=await getDocs(q); if(!snap.empty){alert("Song existiert bereits!"); return;}
  await addDoc(collection(db,"projects",currentProject,"songs"),{name,votes:[],noGo:false}); document.getElementById("songInput").value="";
}
