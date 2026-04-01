/**
 * Options page script – manages profiles and their fields.
 */

let profiles = [];
let activeProfileId = null;
let currentProfileId = null; // profile being edited

const profileList = document.getElementById("profileList");
const addProfileBtn = document.getElementById("addProfileBtn");
const profileEditor = document.getElementById("profileEditor");
const editorTemplate = document.getElementById("editorTemplate");
const fieldRowTemplate = document.getElementById("fieldRowTemplate");

// ─── Storage helpers ───────────────────────────────────────────────────────────

function saveStorage(callback) {
  chrome.storage.local.set({ profiles, activeProfileId }, callback);
}

function loadStorage(callback) {
  chrome.storage.local.get(["profiles", "activeProfileId"], (data) => {
    profiles = data.profiles || [];
    activeProfileId = data.activeProfileId || null;
    callback();
  });
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function findProfile(id) {
  return profiles.find((p) => p.id === id) || null;
}

// ─── Profile list sidebar ─────────────────────────────────────────────────────

function renderProfileList() {
  profileList.innerHTML = "";
  profiles.forEach((p) => {
    const li = document.createElement("li");
    li.className =
      "profile-list-item" + (p.id === currentProfileId ? " active" : "");
    li.dataset.id = p.id;

    const nameSpan = document.createElement("span");
    nameSpan.className = "profile-list-name";
    nameSpan.textContent = p.name || "(unnamed)";

    li.appendChild(nameSpan);
    li.addEventListener("click", () => openProfile(p.id));
    profileList.appendChild(li);
  });
}

// ─── Profile editor ───────────────────────────────────────────────────────────

function openProfile(id) {
  currentProfileId = id;
  renderProfileList();

  const profile = findProfile(id);
  if (!profile) return;

  // Clone the editor template
  const clone = editorTemplate.content.cloneNode(true);
  profileEditor.innerHTML = "";
  profileEditor.appendChild(clone);

  document.getElementById("profileName").value = profile.name || "";
  document.getElementById("targetSite").value = profile.targetSite || "";
  document.getElementById("fillMode").value = profile.mode || "overwrite";

  // Render existing fields
  (profile.fields || []).forEach((f) => addFieldRow(f));

  // Wire up buttons
  document.getElementById("addFieldBtn").addEventListener("click", () => addFieldRow());
  document.getElementById("saveProfileBtn").addEventListener("click", saveProfile);
  document.getElementById("deleteProfileBtn").addEventListener("click", deleteProfile);
}

function openNewProfile() {
  const profile = {
    id: generateId(),
    name: "New Profile",
    targetSite: "",
    mode: "overwrite",
    fields: []
  };
  profiles.push(profile);
  saveStorage(() => {
    renderProfileList();
    openProfile(profile.id);
  });
}

function saveProfile() {
  const profile = findProfile(currentProfileId);
  if (!profile) return;

  const name = document.getElementById("profileName").value.trim();
  if (!name) {
    showEditorStatus("Profile name is required.", "error");
    return;
  }

  profile.name = name;
  profile.targetSite = document.getElementById("targetSite").value.trim();
  profile.mode = document.getElementById("fillMode").value;

  // Collect fields from DOM
  const rows = document.querySelectorAll(".field-row");
  profile.fields = [];
  rows.forEach((row) => {
    const key = row.querySelector(".field-key").value.trim();
    const selector = row.querySelector(".field-selector").value.trim();
    const type = row.querySelector(".field-type").value;
    const value = row.querySelector(".field-value").value;
    if (key || selector) {
      profile.fields.push({ key, selector, type, value });
    }
  });

  saveStorage(() => {
    renderProfileList();
    showEditorStatus("Profile saved!", "success");
  });
}

function deleteProfile() {
  if (!currentProfileId) return;
  if (!confirm("Delete this profile? This cannot be undone.")) return;
  profiles = profiles.filter((p) => p.id !== currentProfileId);
  if (activeProfileId === currentProfileId) {
    activeProfileId = profiles.length ? profiles[0].id : null;
  }
  currentProfileId = null;
  saveStorage(() => {
    renderProfileList();
    profileEditor.innerHTML =
      '<p class="no-selection-msg">Select a profile on the left, or create a new one.</p>';
  });
}

// ─── Field rows ───────────────────────────────────────────────────────────────

function addFieldRow(field) {
  const clone = fieldRowTemplate.content.cloneNode(true);
  const row = clone.querySelector(".field-row");

  if (field) {
    row.querySelector(".field-key").value = field.key || "";
    row.querySelector(".field-selector").value = field.selector || "";
    row.querySelector(".field-type").value = field.type || "text";
    row.querySelector(".field-value").value = field.value !== undefined ? field.value : "";
  }

  row.querySelector(".remove-field-btn").addEventListener("click", () => {
    row.remove();
  });

  document.getElementById("fieldsContainer").appendChild(row);
}

// ─── Status messages ──────────────────────────────────────────────────────────

function showEditorStatus(msg, type) {
  const el = document.getElementById("editorStatus");
  if (!el) return;
  el.textContent = msg;
  el.className = `status-msg status-${type}`;
  setTimeout(() => {
    el.textContent = "";
    el.className = "status-msg";
  }, 3000);
}

// ─── Event wiring ─────────────────────────────────────────────────────────────

addProfileBtn.addEventListener("click", openNewProfile);

// ─── Init ─────────────────────────────────────────────────────────────────────

loadStorage(() => {
  renderProfileList();
  // Auto-open the active (or first) profile if there is one
  const openId = activeProfileId || (profiles.length ? profiles[0].id : null);
  if (openId) openProfile(openId);
});
