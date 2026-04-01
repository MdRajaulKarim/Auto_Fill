# Quick Start Guide - Lightning Autofill

## Installation (5 minutes)

1. **Open Chrome Extensions**
   - Type `chrome://extensions/` in address bar
   - Enable "Developer mode" (top-right toggle)

2. **Load Extension**
   - Click "Load unpacked"
   - Select the `lightning-autofill` folder
   - Extension icon appears in toolbar

3. **Pin Extension**
   - Click puzzle icon (🧩) in toolbar
   - Find "Lightning Autofill" 
   - Click pin icon to keep it visible

## Create Your First Profile (2 minutes)

1. **Click Extension Icon** → **"+ Add Profile"**

2. **Fill Profile Info:**
   - Profile Name: `My Personal Info`
   - Target Site: `example.com` (optional)

3. **Add Fields** (click + Add Field for each):

   | Field Name | Type | Value |
   |------------|------|-------|
   | email | Text | your@email.com |
   | first_name | Text | John |
   | last_name | Text | Doe |
   | phone | Text | +1234567890 |

4. **Click "Save Profile"**

## Use Your Profile (30 seconds)

1. Go to the target website with a form
2. Click Lightning Autofill icon
3. Select your profile from dropdown
4. Click "Fill Form"
5. ✨ Form fills automatically!

## Finding Field Names

**Method 1: Inspect Element**
- Right-click on form field → "Inspect"
- Look for `name="..."` or `id="..."` attribute
- Example: `<input name="email">` → Field Name: `email`

**Method 2: Browser Console**
- Press F12 → Console tab
- Type: `document.querySelectorAll('input[name]')`
- See all field names listed

## Tips for Success

✅ **Use exact field names** - Copy from HTML, case-sensitive  
✅ **Test on simple forms first** - Build confidence  
✅ **Create multiple profiles** - One per website/form type  
✅ **Export regularly** - Backup your profiles  

❌ **Don't guess field names** - Always inspect the HTML  
❌ **Don't use label text** - Use the actual `name` or `id` attribute

## Import Example Profile

1. Click "Import Profiles"
2. Select `example-profiles.json` from extension folder
3. Choose "Merge" to add to existing profiles
4. See the example "Runa" profile loaded

## Common Issues

**Problem**: Fields not filling  
**Solution**: Check field names match exactly (case-sensitive)

**Problem**: Radio button not selecting  
**Solution**: Use exact `value` attribute from HTML

**Problem**: Extension not visible  
**Solution**: Check chrome://extensions/, ensure it's enabled

## Next Steps

- Create profiles for your frequently-used forms
- Export profiles as backup
- Share profiles with team (edit values first!)

---

**Need Help?** Check README.md for detailed documentation.
