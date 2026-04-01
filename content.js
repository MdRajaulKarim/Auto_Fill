/**
 * Content script injected into every page.
 * Listens for a "fill" message and applies autofill rules to the current form fields.
 */

// Cache native value setters once at module level to support React/Vue controlled inputs.
const nativeInputSetter = Object.getOwnPropertyDescriptor(
  window.HTMLInputElement.prototype,
  "value"
);
const nativeTextareaSetter = Object.getOwnPropertyDescriptor(
  window.HTMLTextAreaElement.prototype,
  "value"
);

/** Check whether the current page matches a profile's target site pattern. */
function siteMatches(targetSite) {
  if (!targetSite) return true;
  const pattern = targetSite.trim().toLowerCase();
  const currentHost = window.location.hostname.toLowerCase();
  const currentHref = window.location.href.toLowerCase();
  // Exact hostname, hostname glob (*.example.com), or substring of URL
  if (pattern.startsWith("*")) {
    const suffix = pattern.slice(1).replace(/^\./, "");
    return currentHost.endsWith(suffix);
  }
  return currentHost === pattern || currentHref.includes(pattern);
}

/**
 * Try to find a form element by field name, id, or associated label text.
 * Returns an array of matching elements (radio/checkbox may return many).
 */
function findElements(field) {
  const selector = field.selector ? field.selector.trim() : "";
  const results = [];

  if (selector) {
    const els = document.querySelectorAll(selector);
    if (els.length) {
      results.push(...els);
      return results;
    }
  }

  const key = (field.key || "").trim();
  if (!key) return results;

  // By name attribute
  const byName = document.querySelectorAll(`[name="${CSS.escape(key)}"]`);
  if (byName.length) {
    results.push(...byName);
    return results;
  }

  // By id attribute
  const byId = document.getElementById(key);
  if (byId) {
    results.push(byId);
    return results;
  }

  // By label text (case-insensitive)
  const labels = document.querySelectorAll("label");
  for (const label of labels) {
    if (label.textContent.trim().toLowerCase().includes(key.toLowerCase())) {
      if (label.htmlFor) {
        const el = document.getElementById(label.htmlFor);
        if (el) {
          results.push(el);
          return results;
        }
      }
      // Implicit label: find first input inside
      const inner = label.querySelector("input, select, textarea");
      if (inner) {
        results.push(inner);
        return results;
      }
    }
  }

  // Fallback: match placeholder or aria-label
  const candidates = document.querySelectorAll("input, select, textarea");
  for (const el of candidates) {
    const placeholder = (el.getAttribute("placeholder") || "").toLowerCase();
    const ariaLabel = (el.getAttribute("aria-label") || "").toLowerCase();
    if (placeholder.includes(key.toLowerCase()) || ariaLabel.includes(key.toLowerCase())) {
      results.push(el);
    }
  }

  return results;
}

/** Dispatch synthetic change/input events so frameworks (React, Vue, Angular) detect the update. */
function dispatchChange(el) {
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

/** Fill a single field definition against the DOM. */
function fillField(field, overwrite) {
  const type = (field.type || "text").toLowerCase();
  const value = field.value !== undefined ? field.value : "";
  const elements = findElements(field);

  if (!elements.length) return;

  switch (type) {
    case "text":
    case "email":
    case "tel":
    case "number":
    case "url":
    case "password":
    case "textarea": {
      const el = elements[0];
      if (!overwrite && el.value) return;
      // Use native value setters to work with React/Vue controlled inputs.
      if (el.tagName === "TEXTAREA" && nativeTextareaSetter && nativeTextareaSetter.set) {
        nativeTextareaSetter.set.call(el, value);
      } else if (nativeInputSetter && nativeInputSetter.set) {
        nativeInputSetter.set.call(el, value);
      } else {
        el.value = value;
      }
      dispatchChange(el);
      break;
    }

    case "radio": {
      for (const el of elements) {
        if (el.type === "radio" && el.value === value) {
          if (!overwrite && el.checked) return;
          el.checked = true;
          dispatchChange(el);
          break;
        }
      }
      break;
    }

    case "checkbox": {
      for (const el of elements) {
        if (el.type === "checkbox") {
          if (!overwrite && el.checked) return;
          const desired =
            typeof value === "boolean"
              ? value
              : value === "true" || value === "1" || value === "yes";
          el.checked = desired;
          dispatchChange(el);
        }
      }
      break;
    }

    case "select":
    case "dropdown": {
      const el = elements[0];
      if (!overwrite && el.value) return;
      for (const option of el.options) {
        if (
          option.value === value ||
          option.text.trim().toLowerCase() === value.toLowerCase()
        ) {
          el.value = option.value;
          dispatchChange(el);
          break;
        }
      }
      break;
    }

    case "date": {
      const el = elements[0];
      if (!overwrite && el.value) return;
      el.value = value; // expects YYYY-MM-DD
      dispatchChange(el);
      break;
    }

    default: {
      const el = elements[0];
      if (!overwrite && el.value) return;
      el.value = value;
      dispatchChange(el);
    }
  }
}

/** Main fill routine called when a fill message is received. */
function applyProfile(profile) {
  if (!siteMatches(profile.targetSite)) return;
  const overwrite = profile.mode !== "no-overwrite";
  for (const field of profile.fields || []) {
    try {
      fillField(field, overwrite);
    } catch (e) {
      console.error("[AutoFill] Error filling field:", field.key || field.selector, e);
    }
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "fill") {
    applyProfile(message.profile);
  }
});
