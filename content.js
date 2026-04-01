// Content script for form filling
console.log('Lightning Autofill content script loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fillForm') {
    fillForm(request.profile);
    sendResponse({ success: true });
  }
  return true;
});

// Main form filling function
function fillForm(profile) {
  console.log('Filling form with profile:', profile.profileName);
  
  let filledCount = 0;
  
  profile.fields.forEach(field => {
    const filled = fillField(field);
    if (filled) filledCount++;
  });
  
  console.log(`Filled ${filledCount} out of ${profile.fields.length} fields`);
  
  // Show notification
  showNotification(`Filled ${filledCount} fields from profile "${profile.profileName}"`);
}

// Fill a single field
function fillField(field) {
  const { name, type, value } = field;
  
  try {
    switch (type) {
      case 'text':
        return fillTextInput(name, value);
      case 'radio':
        return fillRadioButton(name, value);
      case 'checkbox':
        return fillCheckbox(name, value);
      case 'select':
        return fillSelectDropdown(name, value);
      default:
        return false;
    }
  } catch (error) {
    console.error(`Error filling field ${name}:`, error);
    return false;
  }
}

// Fill text input field
function fillTextInput(name, value) {
  // Try to find by name attribute first
  let element = document.querySelector(`input[name="${name}"]`);
  
  // Fallback to id
  if (!element) {
    element = document.querySelector(`input[id="${name}"]`);
  }
  
  // Fallback to name containing pattern
  if (!element) {
    element = document.querySelector(`input[name*="${name}"]`);
  }
  
  // Try textarea as well
  if (!element) {
    element = document.querySelector(`textarea[name="${name}"]`);
  }
  
  if (!element) {
    element = document.querySelector(`textarea[id="${name}"]`);
  }
  
  if (element) {
    // Set value
    element.value = value;
    
    // Trigger events to ensure the page recognizes the change
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
    
    // For React/Vue apps
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set;
    nativeInputValueSetter.call(element, value);
    
    element.dispatchEvent(new Event('input', { bubbles: true }));
    
    console.log(`Filled text field: ${name} = ${value}`);
    return true;
  }
  
  console.warn(`Text field not found: ${name}`);
  return false;
}

// Fill radio button
function fillRadioButton(name, value) {
  // Find all radio buttons with this name
  const radios = document.querySelectorAll(`input[type="radio"][name="${name}"]`);
  
  if (radios.length === 0) {
    // Try by id
    const radio = document.querySelector(`input[type="radio"][id="${name}"]`);
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`Filled radio: ${name} = ${value}`);
      return true;
    }
  }
  
  // Find the radio with matching value
  for (const radio of radios) {
    if (radio.value === value) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
      radio.dispatchEvent(new Event('click', { bubbles: true }));
      console.log(`Filled radio: ${name} = ${value}`);
      return true;
    }
  }
  
  console.warn(`Radio button not found: ${name} with value ${value}`);
  return false;
}

// Fill checkbox
function fillCheckbox(name, value) {
  let checkbox = document.querySelector(`input[type="checkbox"][name="${name}"]`);
  
  if (!checkbox) {
    checkbox = document.querySelector(`input[type="checkbox"][id="${name}"]`);
  }
  
  if (checkbox) {
    // Value can be 'true', '1', 'yes', 'on' for checked
    const shouldCheck = ['true', '1', 'yes', 'on', 'checked'].includes(value.toLowerCase());
    checkbox.checked = shouldCheck;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    checkbox.dispatchEvent(new Event('click', { bubbles: true }));
    console.log(`Filled checkbox: ${name} = ${shouldCheck}`);
    return true;
  }
  
  console.warn(`Checkbox not found: ${name}`);
  return false;
}

// Fill select dropdown
function fillSelectDropdown(name, value) {
  let select = document.querySelector(`select[name="${name}"]`);
  
  if (!select) {
    select = document.querySelector(`select[id="${name}"]`);
  }
  
  if (select) {
    // Try to match by value first
    let option = select.querySelector(`option[value="${value}"]`);
    
    // Try to match by text content
    if (!option) {
      const options = select.querySelectorAll('option');
      for (const opt of options) {
        if (opt.textContent.trim() === value) {
          option = opt;
          break;
        }
      }
    }
    
    if (option) {
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`Filled select: ${name} = ${value}`);
      return true;
    }
  }
  
  console.warn(`Select dropdown not found: ${name}`);
  return false;
}

// Show notification on page
function showNotification(message) {
  // Remove existing notification if any
  const existing = document.getElementById('lightning-autofill-notification');
  if (existing) {
    existing.remove();
  }
  
  const notification = document.createElement('div');
  notification.id = 'lightning-autofill-notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.transition = 'opacity 0.3s';
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
