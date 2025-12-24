const projectInput = document.getElementById("projectInput");
const addProjectBtn = document.getElementById("addProjectBtn");
const projectList = document.getElementById("projectList");

const songSection = document.getElementById("song-section");
const rankingSection = document.getElementById("ranking-section");
const currentProjectTitle = document.getElementById("currentProject");

const songInput = document.getElementById("songInput");
const addSongBtn = document.getElementById("addSongBtn");
const songList = document.getElementById("songList");
const rankingList = document.getElementById("rankingList");

const backBtn = document.getElementById("backBtn");
const lockVotingBtn = document.getElementById("lockVotingBtn");

let projects = {};
let currentProject = null;

function renderProjects() {
  projectList.innerHTML = "";
  Object.keys(projects).forEach(name => {
    const div = document.createElement("div");
    div.className = "project-item";
    div.textContent = name;
    div.onclick = () => openProject(name);
    projectList.appendChild(div);
  });
}

addProjectBtn.onclick = () => {
  const name = projectInput.value.trim();
  if (!name || projects[name]) return;
  projects[name] = { songs: {}, locked: false };
  projectInput.value = "";
  renderProjects();
};

function openProject(name) {
  currentProject = name;
  currentProjectTitle.textContent = name;
  songSection.classList.remove("hidden");
  rankingSection.classList.remove("hidden");
  renderSongs();
  renderRanking();
}

addSongBtn.onclick = () => {
  const name = songInput.value.trim();
  if (!name || projects[currentProject].songs[name]) return;
  projects[currentProject].songs[name] = { votes: [], nogo: false };
  songInput.value = "";
  renderSongs();
  renderRanking();
};

function renderSongs() {
  songList.innerHTML = "";
  const project = projects[currentProject];

  Object.entries(project.songs).forEach(([name, data]) => {
    const li = document.createElement("li");

    const title = document.createElement("span");
    title.textContent = name;
    if (data.nogo) title.classList.add("nogo");

    const votes = document.createElement("div");
    votes.className = "vote-row";

    for (let i = 1; i <= 5; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      if (data.votes.includes(i)) btn.classList.add("active");
      btn.disabled = project.locked;
      btn.onclick = () => {
        data.votes = [i];
        data.nogo = false;
        renderSongs();
        renderRanking();
      };
      votes.appendChild(btn);
    }

    const nogoBtn = document.createElement("button");
    nogoBtn.textContent = "🚫";
    nogoBtn.className = "nogo-btn";
    nogoBtn.disabled = project.locked;
    nogoBtn.onclick = () => {
      data.nogo = true;
      data.votes = [];
      renderSongs();
      renderRanking();
    };

    votes.appendChild(nogoBtn);
    li.append(title, votes);
    songList.appendChild(li);
  });

  lockVotingBtn.disabled = project.locked;
}

lockVotingBtn.onclick = () => {
  projects[currentProject].locked = true;
  renderSongs();
};

function renderRanking() {
  rankingList.innerHTML = "";

  const sorted = Object.entries(projects[currentProject].songs)
    .filter(([_, s]) => !s.nogo)
    .map(([name, s]) => ({
      name,
      score: s.votes.reduce((a, b) => a + b, 0)
    }))
    .sort((a, b) => b.score - a.score);

  sorted.forEach((s, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${s.name} – ${s.score}`;
    if (i === 0) li.classList.add("gold");
    if (i === 1) li.classList.add("silver");
    if (i === 2) li.classList.add("bronze");
