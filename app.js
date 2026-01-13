const friendsOnly = [
  {
    rank: 1,
    name: "NiaFlex",
    lbs: 1245,
    pct: 0.62,
    color: "blue",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=60",
  },
  {
    rank: 2,
    name: "CoachMark",
    lbs: 1102,
    pct: 0.54,
    color: "teal",
    avatar: "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=160&q=60",
  },
  {
    rank: 3,
    name: "ElPower",
    lbs: 997,
    pct: 0.48,
    color: "orange",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=60",
  },
  {
    rank: 4,
    name: "JoyPowers",
    lbs: 991,
    pct: 0.47,
    color: "blue",
    avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=160&q=60",
  },
  {
    rank: 5,
    name: "LenaK",
    lbs: 860,
    pct: 0.41,
    color: "teal",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=160&q=60",
  },
];

const global = [
  {
    rank: 1,
    name: "AtlasLifts",
    lbs: 1890,
    pct: 0.78,
    color: "blue",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=60",
  },
  {
    rank: 2,
    name: "NovaStrength",
    lbs: 1765,
    pct: 0.72,
    color: "teal",
    avatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=160&q=60",
  },
  {
    rank: 3,
    name: "IronWarden",
    lbs: 1692,
    pct: 0.7,
    color: "orange",
    avatar: "https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?auto=format&fit=crop&w=160&q=60",
  },
  {
    rank: 4,
    name: "PulsePrime",
    lbs: 1608,
    pct: 0.66,
    color: "blue",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=160&q=60",
  },
  {
    rank: 5,
    name: "Valkyrie",
    lbs: 1544,
    pct: 0.63,
    color: "teal",
    avatar: "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=160&q=60",
  },
];

const board = document.getElementById("board");
const tabFriends = document.getElementById("tabFriends");
const tabGlobal = document.getElementById("tabGlobal");

function rankClass(n) {
  if (n === 1) return "gold";
  if (n === 2) return "silver";
  if (n === 3) return "bronze";
  return "plain";
}

function fillGradient(color) {
  if (color === "teal") return "linear-gradient(90deg, rgba(22,242,190,1), rgba(18,214,255,.9))";
  if (color === "orange") return "linear-gradient(90deg, rgba(255,176,32,1), rgba(255,136,32,.95))";
  return "linear-gradient(90deg, rgba(45,163,255,1), rgba(18,214,255,1))";
}

function render(rows) {
  board.innerHTML = rows
    .map((r) => {
      const cls = rankClass(r.rank);
      return `
          <div class="row">
            <div class="rank ${cls}">${r.rank}</div>
            <div class="avatar">${r.avatar ? `<img alt="${r.name}" src="${r.avatar}">` : ""}</div>
            <div class="who">
              <div class="name">${r.name}</div>
              <div class="bar" aria-hidden="true">
                <div class="fill" style="width:${Math.round(r.pct * 100)}%; background:${fillGradient(r.color)}"></div>
              </div>
            </div>
            <div class="lbs">${r.lbs.toLocaleString()}<span>lb</span></div>
          </div>
        `;
    })
    .join("");
}

function setTabs(which) {
  const isFriends = which === "friends";
  tabFriends.classList.toggle("active", isFriends);
  tabGlobal.classList.toggle("active", !isFriends);
  tabFriends.setAttribute("aria-selected", String(isFriends));
  tabGlobal.setAttribute("aria-selected", String(!isFriends));
  render(isFriends ? friendsOnly : global);
}

function setScreen(target) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.toggle("active", screen.dataset.screen === target);
  });
  document.querySelectorAll(".nav button").forEach((button) => {
    button.classList.toggle("active", button.dataset.nav === target);
  });
}

tabFriends.addEventListener("click", () => setTabs("friends"));
tabGlobal.addEventListener("click", () => setTabs("global"));

document.querySelectorAll(".nav button").forEach((btn) => {
  btn.addEventListener("click", () => {
    setScreen(btn.dataset.nav);
  });
});

setTabs("friends");
setScreen("home");
