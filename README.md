# ⚡ Lightning Autofill

A Chrome extension for managing multiple autofill profiles and automatically filling web forms.

## Features

- **Multiple Profiles**: Create and manage unlimited autofill profiles
- **Auto-Detection**: Automatically detects and fills form fields by name/id
- **Field Types Support**: Text, radio buttons, checkboxes, and select dropdowns
- **Profile Switching**: Easy profile selection from popup
- **Visual Feedback**: On-page notification when forms are filled

## Installation

1. **Download the Extension**
   - Download all files to a folder (e.g., `lightning-autofill`)

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `lightning-autofill` folder

3. **Pin the Extension**
   - Click the puzzle icon in Chrome toolbar
   - Find "Lightning Autofill" and pin it

## Usage

### Creating a Profile

1. Click the Lightning Autofill icon in your toolbar
2. Click "+ Add Profile"
3. Enter profile details:
   - **Profile Name**: e.g., "Personal Info", "Work Application"
   - **Target Site**: (optional) e.g., "example.com"
4. Add fields:
   - **Field Name**: The HTML `name` or `id` attribute (e.g., "email", "first_name")
   - **Type**: Select field type (Text, Radio, Checkbox, Select)
   - **Value**: The value to fill
5. Click "Save Profile"

### Using a Profile

1. Navigate to the target website
2. Click the Lightning Autofill icon
3. Select your profile from dropdown
4. Click "Fill Form"
5. Watch as the form fills automatically!

### Managing Profiles

- **Edit**: Select profile → Click "Edit" → Make changes → Save
- **Delete**: Select profile → Click "Delete" → Confirm
- **Switch**: Use dropdown to change active profile

## Field Detection

The extension finds fields in this order:
1. Exact match on `name` attribute
2. Exact match on `id` attribute  
3. Partial match on `name` attribute (contains)
4. Check textarea and select elements

## Field Types

### Text
- Regular text inputs
- Email, password, tel inputs
- Textareas
- Date inputs

**Example:**
```
Name: email
Type: Text
Value: user@example.com
```

### Radio
- Radio button groups
- Matches by value attribute

**Example:**
```
Name: gender
Type: Radio
Value: male
```

### Checkbox
- Single checkboxes
- Use values: true/1/yes/on/checked for checked state

**Example:**
```
Name: terms
Type: Checkbox
Value: true
```

### Select
- Dropdown menus
- Matches by option value or text

**Example:**
```
Name: country
Type: Select
Value: United States
```

## Example Profile Configuration

**Profile Name**: Personal Application Form  
**Target Site**: forms.example.com

**Fields**:
| Field Name | Type | Value |
|------------|------|-------|
| first_name | Text | John |
| last_name | Text | Doe |
| email | Text | john@example.com |
| phone | Text | +1234567890 |
| gender | Radio | male |
| country | Select | United States |
| agree_terms | Checkbox | true |

## Tips

- **Field Names**: Inspect the webpage HTML to find exact field names
- **Multiple Profiles**: Create different profiles for different forms
- **Testing**: Test on a form to ensure all fields fill correctly
- **Updates**: If a site changes, simply edit the profile

## Troubleshooting

**Fields not filling?**
- Check that field names match exactly (case-sensitive)
- Try both `name` and `id` attributes
- Some dynamic sites may need a page refresh

**Radio/Checkbox not working?**
- Verify the exact value attribute
- For checkboxes, use: true, false, 1, 0

**Extension not appearing?**
- Check chrome://extensions/ to ensure it's enabled
- Reload the extension if you made changes

## Development

Files structure:
```
lightning-autofill/
├── manifest.json       # Extension configuration
├── popup.html          # UI interface
├── popup.js            # Profile management
├── content.js          # Form filling logic
├── styles.css          # UI styling
├── icon16.png          # Extension icons
├── icon48.png
└── icon128.png
```

## Support

For issues or feature requests, modify the code or create new profiles to suit your needs.

## License

Free to use and modify for personal use.

---

**Version**: 1.0.0  
**Created**: 2026
