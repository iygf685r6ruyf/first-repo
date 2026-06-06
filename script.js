const state = {
  clips: 0
};

const earners = [
  { id: "tapper", name: "Auto Tapper", baseCost: 15, cost: 15, baseCps: 1, count: 0, unlocked: true },
  { id: "helper", name: "Click Helper", baseCost: 100, cost: 100, baseCps: 5, count: 0, unlocked: false },
  { id: "factory", name: "Clip Factory", baseCost: 550, cost: 550, baseCps: 20, count: 0, unlocked: false },
  { id: "lab", name: "Clip Lab", baseCost: 3200, cost: 3200, baseCps: 75, count: 0, unlocked: false },
  { id: "portal", name: "Clip Portal", baseCost: 16000, cost: 16000, baseCps: 250, count: 0, unlocked: false }
];

const upgrades = earners.map((earner, index) => ({
  id: `${earner.id}-boost`,
  earnerId: earner.id,
  name: `${earner.name} Boost`,
  description: `Double ${earner.name} output`,
  cost: Math.round(earner.baseCost * (index + 6)),
  purchased: false,
  unlocked: false
}));

const clipsCountEl = document.getElementById("clips-count");
const cpsCountEl = document.getElementById("cps-count");
const clipButtonEl = document.getElementById("clip-button");
const earnersListEl = document.getElementById("earners-list");
const upgradesListEl = document.getElementById("upgrades-list");

function findUpgrade(earnerId) {
  return upgrades.find((upgrade) => upgrade.earnerId === earnerId);
}

function perUnitCps(earner) {
  const upgrade = findUpgrade(earner.id);
  const multiplier = upgrade && upgrade.purchased ? 2 : 1;
  return earner.baseCps * multiplier;
}

function totalCps() {
  return earners.reduce((sum, earner) => sum + earner.count * perUnitCps(earner), 0);
}

function formatValue(value) {
  if (value >= 1000) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function updateUnlocks() {
  for (let i = 1; i < earners.length; i += 1) {
    if (!earners[i].unlocked && earners[i - 1].count > 0) {
      earners[i].unlocked = true;
    }
  }

  upgrades.forEach((upgrade) => {
    const earner = earners.find((item) => item.id === upgrade.earnerId);
    upgrade.unlocked = Boolean(earner && earner.count > 0);
  });
}

function renderStats() {
  clipsCountEl.textContent = formatValue(state.clips);
  cpsCountEl.textContent = formatValue(totalCps());
}

function renderEarners() {
  earnersListEl.innerHTML = "";

  earners.forEach((earner, index) => {
    const card = document.createElement("button");
    card.className = "card";
    card.dataset.earnerId = earner.id;

    if (!earner.unlocked) {
      const requiredPrev = earners[index - 1].name;
      card.disabled = true;
      card.classList.add("locked");
      card.innerHTML = `
        <h3>${earner.name} (Locked)</h3>
        <p>Buy 1 ${requiredPrev} to unlock.</p>
      `;
      earnersListEl.appendChild(card);
      return;
    }

    const affordable = state.clips >= earner.cost;
    card.disabled = !affordable;
    card.innerHTML = `
      <h3>${earner.name}</h3>
      <p>Owned: ${earner.count}</p>
      <p>Each: +${formatValue(perUnitCps(earner))} clips/sec</p>
      <p>Cost: ${formatValue(earner.cost)} clips</p>
    `;
    earnersListEl.appendChild(card);
  });
}

function renderUpgrades() {
  upgradesListEl.innerHTML = "";

  upgrades.forEach((upgrade) => {
    const earner = earners.find((item) => item.id === upgrade.earnerId);
    const card = document.createElement("button");
    card.className = "card";
    card.dataset.upgradeId = upgrade.id;

    if (!upgrade.unlocked) {
      card.disabled = true;
      card.classList.add("locked");
      card.innerHTML = `
        <h3>${upgrade.name} (Locked)</h3>
        <p>Buy 1 ${earner.name} to unlock this upgrade.</p>
      `;
      upgradesListEl.appendChild(card);
      return;
    }

    if (upgrade.purchased) {
      card.disabled = true;
      card.innerHTML = `
        <h3>${upgrade.name} (Purchased)</h3>
        <p>${upgrade.description}</p>
      `;
      upgradesListEl.appendChild(card);
      return;
    }

    const affordable = state.clips >= upgrade.cost;
    card.disabled = !affordable;
    card.innerHTML = `
      <h3>${upgrade.name}</h3>
      <p>${upgrade.description}</p>
      <p>Cost: ${formatValue(upgrade.cost)} clips</p>
    `;
    upgradesListEl.appendChild(card);
  });
}

function render() {
  renderStats();
  renderEarners();
  renderUpgrades();
}

function buyEarner(earnerId) {
  const earner = earners.find((item) => item.id === earnerId);
  if (!earner || !earner.unlocked || state.clips < earner.cost) {
    return;
  }

  state.clips -= earner.cost;
  earner.count += 1;
  earner.cost = Math.round(earner.cost * 1.15);

  updateUnlocks();
  render();
}

function buyUpgrade(upgradeId) {
  const upgrade = upgrades.find((item) => item.id === upgradeId);
  if (!upgrade || !upgrade.unlocked || upgrade.purchased || state.clips < upgrade.cost) {
    return;
  }

  state.clips -= upgrade.cost;
  upgrade.purchased = true;
  render();
}

clipButtonEl.addEventListener("click", () => {
  state.clips += 1;
  render();
});

earnersListEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-earner-id]");
  if (!button) {
    return;
  }
  buyEarner(button.dataset.earnerId);
});

upgradesListEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-upgrade-id]");
  if (!button) {
    return;
  }
  buyUpgrade(button.dataset.upgradeId);
});

const TICKS_PER_SECOND = 5;
setInterval(() => {
  state.clips += totalCps() / TICKS_PER_SECOND;
  render();
}, 1000 / TICKS_PER_SECOND);

updateUnlocks();
render();
