/**
 * Popup script – shows the active profile and lets the user trigger a fill.
 */

const profileSelect = document.getElementById("profileSelect");
const siteInfo = document.getElementById("siteInfo");
const fieldCount = document.getElementById("fieldCount");
const fillBtn = document.getElementById("fillBtn");
const optionsBtn = document.getElementById("optionsBtn");
const statusMsg = document.getElementById("statusMsg");

let profiles = [];

/** Load profiles from storage and populate the dropdown. */
function loadProfiles() {
  chrome.storage.local.get(["profiles", "activeProfileId"], (data) => {
    profiles = data.profiles || [];
    const activeId = data.activeProfileId;

    profileSelect.innerHTML = "";

    if (!profiles.length) {
      const opt = document.createElement("option");
      opt.textContent = "No profiles – click Manage Profiles";
      opt.disabled = true;
      profileSelect.appendChild(opt);
      fillBtn.disabled = true;
      siteInfo.textContent = "";
      fieldCount.textContent = "";
      return;
    }

    profiles.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name;
      if (p.id === activeId) opt.selected = true;
      profileSelect.appendChild(opt);
    });

    // If nothing was pre-selected, select the first profile
    if (!profileSelect.value && profiles.length) {
      profileSelect.value = profiles[0].id;
    }

    updateInfo();
    fillBtn.disabled = false;
  });
}

/** Update the site / field count display for the currently selected profile. */
function updateInfo() {
  const selectedId = profileSelect.value;
  const profile = profiles.find((p) => p.id === selectedId);
  if (!profile) return;

  siteInfo.textContent = profile.targetSite
    ? `Site: ${profile.targetSite}`
    : "Site: all sites";
  fieldCount.textContent = `Fields: ${(profile.fields || []).length}`;
}

/** Persist the newly selected profile as the active one. */
profileSelect.addEventListener("change", () => {
  chrome.storage.local.set({ activeProfileId: profileSelect.value });
  updateInfo();
});

/** Tell the background to trigger a fill on the current tab. */
fillBtn.addEventListener("click", () => {
  // Save the active profile selection before triggering
  chrome.storage.local.set({ activeProfileId: profileSelect.value }, () => {
    chrome.runtime.sendMessage({ action: "triggerFill" }, () => {
      showStatus("Fill triggered!", "success");
    });
  });
});

optionsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

function showStatus(msg, type) {
  statusMsg.textContent = msg;
  statusMsg.className = `status-msg status-${type}`;
  setTimeout(() => {
    statusMsg.textContent = "";
    statusMsg.className = "status-msg";
  }, 2000);
}

loadProfiles();
