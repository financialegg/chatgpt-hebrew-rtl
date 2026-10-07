const DEFAULTS = {
  mode: "smart",
  tables: true,
  composer: true,
  observe: true,
  smartWriting: true,
  consented: false
};

const mode = document.getElementById("mode");
const tables = document.getElementById("tables");
const composer = document.getElementById("composer");
const smartWriting = document.getElementById("smartWriting");
const consent = document.getElementById("consent");

async function currentSettings() {
  return {
    mode: mode.value,
    tables: tables.checked,
    composer: composer.checked,
    smartWriting: smartWriting.checked,
    consented: consent.checked,
    observe: true
  };
}

async function broadcast(settings) {
  const tabs = await chrome.tabs.query({
    url: ["https://chatgpt.com/*"]
  });

  for (const tab of tabs) {
    if (!tab.id) continue;
    chrome.tabs.sendMessage(tab.id, {
      type: "HEBREW_RTL_SETTINGS",
      settings
    }).catch(() => {});
  }
}

async function save() {
  const settings = await currentSettings();
  await chrome.storage.local.set(settings);
  await broadcast(settings);
}

async function init() {
  const settings = await chrome.storage.local.get(DEFAULTS);
  mode.value = settings.mode || "smart";
  tables.checked = settings.tables !== false;
  composer.checked = settings.composer !== false;
  smartWriting.checked = settings.smartWriting !== false;
  consent.checked = settings.consented === true;
  for (const control of [mode, tables, composer, smartWriting]) {
    control.disabled = !consent.checked;
  }
}

mode.addEventListener("change", save);
tables.addEventListener("change", save);
composer.addEventListener("change", save);
smartWriting.addEventListener("change", save);
consent.addEventListener("change", async () => {
  for (const control of [mode, tables, composer, smartWriting]) {
    control.disabled = !consent.checked;
  }
  if (consent.checked) {
    smartWriting.checked = true;
    mode.value = "smart";
    tables.checked = true;
    composer.checked = true;
  }
  await save();
});
init();
