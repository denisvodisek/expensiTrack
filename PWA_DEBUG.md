# PWA Installation Debugging Guide

## Requirements for PWA Install Prompt

1. **HTTPS** ✅ (Vercel provides this automatically)
2. **Valid manifest.json** ✅ (with icons)
3. **Service Worker** ✅ (registered and active)
4. **User engagement** - User must visit site multiple times (browser heuristic)

## Testing Steps

### On Mobile (Chrome/Edge):

1. **Clear browser data** (if testing):
   - Settings → Privacy → Clear browsing data
   - Or use incognito mode

2. **Visit your site**:
   - Open Chrome/Edge
   - Navigate to your Vercel URL
   - Wait a few seconds for service worker to register

3. **Check Service Worker**:
   - Open DevTools (if possible) or use chrome://serviceworker-internals
   - Look for your site's service worker
   - Should show "activated and running"

4. **Check Manifest**:
   - DevTools → Application → Manifest
   - Should show all fields correctly
   - Icons should be loaded

5. **Install Prompt**:
   - **Android Chrome**: Menu (3 dots) → "Install app" or "Add to Home Screen"
   - The automatic banner may take a few visits to appear
   - You can manually trigger via menu

### On Desktop Chrome:

1. Open DevTools → Application → Manifest
2. Check for errors
3. Look for "Add to Home Screen" button in address bar
4. Or use DevTools → Application → Service Workers → "Update" → "Unregister" → Refresh

## Common Issues

### Service Worker Not Registering:
- Check browser console for errors
- Ensure `/sw.js` is accessible (try opening it directly)
- Check network tab for 404 errors

### Manifest Not Loading:
- Check `/manifest.json` is accessible
- Verify JSON is valid (no trailing commas)
- Check icons exist and are accessible

### Install Prompt Not Showing:
- **Normal behavior**: Browsers show prompt after multiple visits (heuristic)
- **Manual install**: Use browser menu → "Install app"
- **iOS Safari**: Always manual via Share → "Add to Home Screen"

## Debug Commands (Browser Console)

```javascript
// Check if service worker is registered
navigator.serviceWorker.getRegistrations().then(regs => console.log(regs));

// Check manifest
fetch('/manifest.json').then(r => r.json()).then(console.log);

// Force install prompt (if available)
// Note: This only works if browser has determined site is installable
```

## iOS Safari Specific

iOS Safari doesn't show automatic install prompts. Users must:
1. Tap Share button
2. Scroll down to "Add to Home Screen"
3. Tap it

The app will then work as a standalone app.

