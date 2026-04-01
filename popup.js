// Profile management and UI logic
let profiles = [];
let currentProfile = null;
let editingProfileId = null;

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  await loadProfiles();
  setupEventListeners();
});

// Load profiles from storage
async function loadProfiles() {
  const result = await chrome.storage.local.get(['profiles', 'currentProfile']);
  profiles = result.profiles || [];
  currentProfile = result.currentProfile || null;
  
  populateProfileSelect();
  updateButtons();
}

// Populate profile dropdown
function populateProfileSelect() {
  const select = document.getElementById('profileSelect');
  select.innerHTML = '<option value="">Select Profile...</option>';
  
  profiles.forEach(profile => {
    const option = document.createElement('option');
    option.value = profile.id;
    option.textContent = profile.profileName;
    if (currentProfile === profile.id) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

// Update button states
function updateButtons() {
  const hasProfile = currentProfile !== null;
  document.getElementById('fillBtn').disabled = !hasProfile;
  document.getElementById('editProfileBtn').disabled = !hasProfile;
  document.getElementById('deleteProfileBtn').disabled = !hasProfile;
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('profileSelect').addEventListener('change', handleProfileChange);
  document.getElementById('fillBtn').addEventListener('click', handleFillForm);
  document.getElementById('addProfileBtn').addEventListener('click', handleAddProfile);
  document.getElementById('editProfileBtn').addEventListener('click', handleEditProfile);
  document.getElementById('deleteProfileBtn').addEventListener('click', handleDeleteProfile);
  document.getElementById('addFieldBtn').addEventListener('click', addFieldRow);
  document.getElementById('captureFieldsBtn').addEventListener('click', handleCaptureFields);
  document.getElementById('saveProfileBtn').addEventListener('click', handleSaveProfile);
  document.getElementById('cancelBtn').addEventListener('click', handleCancel);
  document.getElementById('importBtn').addEventListener('click', handleImport);
  document.getElementById('exportBtn').addEventListener('click', handleExport);
  document.getElementById('importFile').addEventListener('change', handleImportFile);
}

// Handle profile selection change
async function handleProfileChange(e) {
  currentProfile = e.target.value || null;
  await chrome.storage.local.set({ currentProfile });
  updateButtons();
}

// Handle fill form button
async function handleFillForm() {
  if (!currentProfile) {
    showStatus('Please select a profile', 'error');
    return;
  }
  
  const profile = profiles.find(p => p.id === currentProfile);
  if (!profile) {
    showStatus('Profile not found', 'error');
    return;
  }
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    await chrome.tabs.sendMessage(tab.id, {
      action: 'fillForm',
      profile: profile
    });
    
    showStatus('Form filled successfully!', 'success');
  } catch (error) {
    showStatus('Error filling form: ' + error.message, 'error');
  }
}

// Handle add profile
function handleAddProfile() {
  editingProfileId = null;
  document.getElementById('formTitle').textContent = 'Add New Profile';
  document.getElementById('profileName').value = '';
  document.getElementById('targetSite').value = '';
  document.getElementById('fieldsContainer').innerHTML = '';
  addFieldRow(); // Add one empty field
  document.getElementById('profileForm').classList.remove('hidden');
}

// Handle capture fields from page
async function handleCaptureFields() {
  try {
    showStatus('Capturing form fields...', '');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Inject content.js if needed
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    // Send message to capture fields
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'captureFields'
    });

    if (response.success && response.fields && response.fields.length > 0) {
      populateCapturedFields(response.fields);
      showStatus(`Captured ${response.fields.length} field(s) from the form!`, 'success');
    } else {
      showStatus('No form fields found on this page', 'error');
    }
  } catch (error) {
    showStatus('Error capturing fields: ' + error.message, 'error');
  }
}

// Populate form with captured fields
function populateCapturedFields(fields) {
  const container = document.getElementById('fieldsContainer');
  container.innerHTML = '';

  fields.forEach(field => {
    addFieldRow(field);
  });
}

// Handle edit profile
function handleEditProfile() {
  if (!currentProfile) return;
  
  const profile = profiles.find(p => p.id === currentProfile);
  if (!profile) return;
  
  editingProfileId = profile.id;
  document.getElementById('formTitle').textContent = 'Edit Profile';
  document.getElementById('profileName').value = profile.profileName;
  document.getElementById('targetSite').value = profile.targetSite || '';
  
  const container = document.getElementById('fieldsContainer');
  container.innerHTML = '';
  
  profile.fields.forEach(field => {
    addFieldRow(field);
  });
  
  document.getElementById('profileForm').classList.remove('hidden');
}

// Handle delete profile
async function handleDeleteProfile() {
  if (!currentProfile) return;
  
  if (!confirm('Are you sure you want to delete this profile?')) return;
  
  profiles = profiles.filter(p => p.id !== currentProfile);
  currentProfile = null;
  
  await chrome.storage.local.set({ profiles, currentProfile });
  await loadProfiles();
  showStatus('Profile deleted successfully', 'success');
}

// Add field row to form
function addFieldRow(field = null) {
  const container = document.getElementById('fieldsContainer');
  const fieldRow = document.createElement('div');
  fieldRow.className = 'field-row';
  
  fieldRow.innerHTML = `
    <input type="text" class="field-name" placeholder="Field name (e.g., email)" 
           value="${field ? field.name : ''}" required>
    <select class="field-type">
      <option value="text" ${field && field.type === 'text' ? 'selected' : ''}>Text</option>
      <option value="radio" ${field && field.type === 'radio' ? 'selected' : ''}>Radio</option>
      <option value="checkbox" ${field && field.type === 'checkbox' ? 'selected' : ''}>Checkbox</option>
      <option value="select" ${field && field.type === 'select' ? 'selected' : ''}>Select</option>
    </select>
    <button type="button" class="remove-field">✕</button>
    <input type="text" class="field-value" placeholder="Value" 
           value="${field ? field.value : ''}" required>
  `;
  
  fieldRow.querySelector('.remove-field').addEventListener('click', () => {
    fieldRow.remove();
  });
  
  container.appendChild(fieldRow);
}

// Handle save profile
async function handleSaveProfile() {
  const profileName = document.getElementById('profileName').value.trim();
  const targetSite = document.getElementById('targetSite').value.trim();
  
  if (!profileName) {
    showStatus('Please enter a profile name', 'error');
    return;
  }
  
  const fieldRows = document.querySelectorAll('.field-row');
  const fields = [];
  
  for (const row of fieldRows) {
    const name = row.querySelector('.field-name').value.trim();
    const type = row.querySelector('.field-type').value;
    const value = row.querySelector('.field-value').value.trim();
    
    if (!name || !value) {
      showStatus('All fields must have a name and value', 'error');
      return;
    }
    
    fields.push({ name, type, value });
  }
  
  if (fields.length === 0) {
    showStatus('Please add at least one field', 'error');
    return;
  }
  
  const profile = {
    id: editingProfileId || Date.now().toString(),
    profileName,
    targetSite,
    autoFillAll: true,
    fields
  };
  
  if (editingProfileId) {
    // Update existing profile
    const index = profiles.findIndex(p => p.id === editingProfileId);
    profiles[index] = profile;
  } else {
    // Add new profile
    profiles.push(profile);
  }
  
  await chrome.storage.local.set({ profiles });
  await loadProfiles();
  handleCancel();
  showStatus('Profile saved successfully!', 'success');
}

// Handle cancel
function handleCancel() {
  document.getElementById('profileForm').classList.add('hidden');
  editingProfileId = null;
}

// Show status message
function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = 'status ' + type;
  
  setTimeout(() => {
    status.className = 'status';
    status.textContent = '';
  }, 3000);
}

// Handle import profiles
function handleImport() {
  document.getElementById('importFile').click();
}

// Handle import file selection
async function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    let data;

    // Auto-detect file format
    if (file.name.endsWith('.csv') || text.includes('### AUTOFILL PROFILES ###')) {
      // Parse CSV format
      data = parseCSVProfiles(text);
    } else {
      // Parse JSON format
      data = JSON.parse(text);

      if (!data.profiles || !Array.isArray(data.profiles)) {
        showStatus('Invalid profile file format', 'error');
        return;
      }
    }

    // Ask user whether to merge or replace
    const merge = confirm(
      `Import ${data.profiles.length} profile(s).\n\n` +
      'Click OK to MERGE with existing profiles.\n' +
      'Click Cancel to REPLACE all existing profiles.'
    );

    if (merge) {
      // Merge profiles (avoid duplicates by ID)
      const existingIds = new Set(profiles.map(p => p.id));
      const newProfiles = data.profiles.filter(p => !existingIds.has(p.id));
      profiles = [...profiles, ...newProfiles];
    } else {
      // Replace all profiles
      profiles = data.profiles;
      currentProfile = data.currentProfile || null;
    }

    await chrome.storage.local.set({ profiles, currentProfile });
    await loadProfiles();
    showStatus('Profiles imported successfully!', 'success');
  } catch (error) {
    showStatus('Error importing profiles: ' + error.message, 'error');
  }

  // Reset file input
  e.target.value = '';
}

// Parse CSV format into profiles
function parseCSVProfiles(csvText) {
  try {
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);

    const profilesMap = {};
    const fieldsMap = {};

    let inProfilesSection = false;
    let inRulesSection = false;
    let profileHeaderSkipped = false;
    let rulesHeaderSkipped = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for section markers
      if (line.startsWith('### AUTOFILL PROFILES ###')) {
        inProfilesSection = true;
        inRulesSection = false;
        profileHeaderSkipped = false;
        continue;
      }

      if (line.startsWith('### AUTOFILL RULES ###')) {
        inProfilesSection = false;
        inRulesSection = true;
        rulesHeaderSkipped = false;
        continue;
      }

      // Skip header lines
      if (inProfilesSection && !profileHeaderSkipped) {
        if (line.startsWith('Profile ID')) {
          profileHeaderSkipped = true;
          continue;
        }
      }

      if (inRulesSection && !rulesHeaderSkipped) {
        if (line.startsWith('Rule ID')) {
          rulesHeaderSkipped = true;
          continue;
        }
      }

      // Parse profiles
      if (inProfilesSection && profileHeaderSkipped && line && !line.startsWith('###')) {
        const parts = parseCSVLine(line);
        if (parts.length >= 3) {
          const profileId = parts[0].trim();
          const profileName = cleanValue(parts[1]);
          const targetSite = cleanValue(parts[2]);

          if (profileId) {
            profilesMap[profileId] = {
              profileName,
              targetSite,
              id: profileId
            };
          }
        }
      }

      // Parse rules (fields)
      if (inRulesSection && rulesHeaderSkipped && line && !line.startsWith('###')) {
        const parts = parseCSVLine(line);
        if (parts.length >= 7) {
          const ruleId = parts[0].trim();
          const fieldType = parseInt(parts[1].trim());
          const fieldName = cleanFieldName(parts[2]);
          const fieldValue = cleanValue(parts[3]);
          const profileId = parts[6].trim();

          if (profileId && fieldName && fieldValue !== null) {
            if (!fieldsMap[profileId]) {
              fieldsMap[profileId] = [];
            }

            // Convert type numbers to strings
            const typeMap = { 0: 'text', 1: 'checkbox', 2: 'select', 3: 'radio' };
            const fieldTypeStr = typeMap[fieldType] || 'text';

            fieldsMap[profileId].push({
              name: fieldName,
              type: fieldTypeStr,
              value: fieldValue
            });
          }
        }
      }
    }

    // Build profiles array
    const profiles = [];
    for (const profileId in profilesMap) {
      const profile = profilesMap[profileId];
      const fields = fieldsMap[profileId] || [];

      profiles.push({
        id: profile.id,
        profileName: profile.profileName,
        targetSite: profile.targetSite,
        autoFillAll: true,
        fields: fields
      });
    }

    if (profiles.length === 0) {
      throw new Error('No profiles found in CSV file');
    }

    return {
      profiles,
      currentProfile: null
    };
  } catch (error) {
    throw new Error(`Error parsing CSV: ${error.message}`);
  }
}

// Parse CSV line respecting quoted values
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

// Clean field name by removing triple quotes
function cleanFieldName(fieldName) {
  // Remove triple quotes: """name""" -> name
  let cleaned = fieldName.replace(/^"""/, '').replace(/"""$/, '');
  // Remove any remaining quotes
  cleaned = cleaned.replace(/^"/, '').replace(/"$/, '');
  return cleaned.trim();
}

// Clean CSV value (remove surrounding quotes)
function cleanValue(value) {
  let cleaned = value.trim();
  // Remove leading and trailing quotes
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned;
}

// Handle export profiles
function handleExport() {
  if (profiles.length === 0) {
    showStatus('No profiles to export', 'error');
    return;
  }
  
  const data = {
    profiles,
    currentProfile,
    exportedAt: new Date().toISOString(),
    version: '1.0.0'
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `autofill-profiles-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  showStatus('Profiles exported successfully!', 'success');
}

