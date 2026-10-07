const DEFAULTS = {
  mode: "smart",
  tables: true,
  composer: true,
  observe: true
};

const mode = document.getElementById("mode");
const tables = document.getElementById("tables");
const composer = document.getElementById("composer");

async function currentSettings() {
  return {
    mode: mode.value,
    tables: tables.checked,
    composer: composer.checked,
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
}

mode.addEventListener("change", save);
tables.addEventListener("change", save);
composer.addEventListener("change", save);
init();
