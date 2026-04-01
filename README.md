# Auto Fill – Chrome Extension

A Chrome extension that automatically fills web form fields using customisable, reusable **profiles**.

---

## Features

| Feature | Details |
|---|---|
| **Multiple profiles** | Create any number of named profiles, each with its own field set |
| **Right-click trigger** | Right-click anywhere on the page → *Auto Fill: Fill form fields* |
| **Popup trigger** | Click the extension icon → select a profile → click **▶ Fill Form** |
| **Field mapping** | Match fields by `name`, `id`, label text, placeholder, `aria-label`, or a custom CSS selector |
| **Field types** | `text`, `email`, `tel`, `number`, `textarea`, `radio`, `checkbox`, `select/dropdown`, `date`, `url`, `password` |
| **Add / Edit / Delete** | Full CRUD for profiles and individual fields via the options page |
| **Target site filter** | Restrict a profile to a specific domain (supports `*` wildcard, e.g. `*.example.com`) |
| **Fill mode** | *Overwrite* (default) replaces any existing value; *No-overwrite* skips fields that already have a value |

---

## Installation (developer mode)

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the repository folder.
5. The *Auto Fill* extension icon should appear in the toolbar.

---

## Quick start

### 1 – Open the Profile Manager
Click the extension icon → **⚙ Manage Profiles** (or go to `chrome://extensions` → *Auto Fill* → *Details* → *Extension options*).

### 2 – Create a profile
Click **+ New Profile**, then fill in:

| Field | Description |
|---|---|
| **Profile Name** | A descriptive label (e.g. *Work Registration Form*) |
| **Target Site** | Hostname or pattern, e.g. `example.com` or `*.example.com`. Leave blank for all sites. |
| **Fill Mode** | *Overwrite* (default) or *No-overwrite* |

### 3 – Add fields
Click **+ Add Field** for each form field you want to fill:

| Column | Description |
|---|---|
| **Field Key** | The `name` attribute, `id`, or label text of the target `<input>` / `<select>` |
| **CSS Selector** | Optional – takes precedence over Key when both are provided |
| **Type** | One of: `text`, `email`, `tel`, `number`, `textarea`, `radio`, `checkbox`, `select`, `date`, `url`, `password` |
| **Fill Value** | The value to inject. For checkboxes use `true` / `false`. For radio/select, provide the option `value` or display text. For dates use `YYYY-MM-DD`. |

### 4 – Save and fill
Click **Save Profile**, then visit the target page and either:
- Right-click → *Auto Fill: Fill form fields*, **or**
- Click the extension icon → select the profile → **▶ Fill Form**.

---

## Example profile (Lightning Autofill-style)

```
PROFILE NAME : Work Registration
TARGET SITE  : signup.example.com
FILL MODE    : overwrite

FIELDS:
  key=first_name   type=text       value=Jane
  key=last_name    type=text       value=Doe
  key=email        type=email      value=jane.doe@example.com
  key=phone        type=tel        value=+1-555-0100
  key=country      type=select     value=United States
  key=newsletter   type=checkbox   value=true
  key=dob          type=date       value=1990-06-15
  key=gender       type=radio      value=female
```

---

## File structure

```
Auto_Fill/
├── manifest.json      Chrome extension manifest (MV3)
├── background.js      Service worker – context menu, message routing
├── content.js         Content script – DOM field detection and filling
├── popup.html/.js     Toolbar popup – profile selector and fill trigger
├── options.html/.js   Options page – full profile and field management
├── styles.css         Shared stylesheet
└── icons/             Extension icons (16 × 16, 48 × 48, 128 × 128)
```

---

## Permissions used

| Permission | Reason |
|---|---|
| `storage` | Save profiles to `chrome.storage.local` |
| `contextMenus` | Add right-click *Fill form fields* entry |
| `activeTab` | Send fill command to the current tab |
| `scripting` | Inject the content script when needed |
| `<all_urls>` | Allow autofill on any website |
