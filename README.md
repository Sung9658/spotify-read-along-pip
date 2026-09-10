# Spotify Read-Along PiP Window

Open a Spotify podcast's Read along transcript in a browser Picture-in-Picture window — auto-highlighting the current sentence, seek bar, and transport controls. Pure bookmarklet: no extension, no Tampermonkey.

> 🌏 Read this in: [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

## Why a bookmarklet instead of Tampermonkey?

Bookmarks sync natively through your browser account — sign into Edge/Chrome and your bookmarks bar follows you to every device with zero configuration. Tampermonkey scripts need manual Chrome Sync or WebDAV setup. Bookmarklets also don't depend on an extension being installed or enabled, and backing up is just exporting your bookmarks HTML.

If you prefer Tampermonkey or similar extensions, porting this logic into a userscript is straightforward — the selectors and sync logic are all here. Feel free to reference or reuse.

## Install

1. Open [`bookmarklet.txt`](bookmarklet.txt) and copy the entire contents (it starts with `javascript:`).
2. In your browser, add a new bookmark (Ctrl+D on any page, then edit it) and paste the copied text as the **URL**.
3. **Note (Edge/Chrome quirk):** pasting may silently strip the `javascript:` prefix. If the bookmark doesn't work, edit it and manually type `javascript:` at the very front (English colon).
4. Name it something like `PiP`.

## Usage

1. Play a podcast episode that has the Read along transcript (Spotify's beta "Read along" feature), and open the "Now Playing" view so the transcript panel is visible.
2. Click the bookmark. A Picture-in-Picture window opens with:
   - the Read along transcript, auto-following the current sentence (green highlight)
   - transport controls: «15 / play-pause / 15» / prev / next
   - a seek bar (click or drag to jump)
   - a follow toggle (⇅) — auto-scroll pauses for 6s after you scroll manually

Close the PiP window when done — the main page is unaffected.

## Compatibility

- Desktop Edge / Chrome / other Chromium browsers with `documentPictureInPicture` support (Chrome 116+)
- Requires you to be logged in to Spotify (the Read along transcript is a logged-in beta feature)

## How it works

The bookmarklet clones Spotify's own Read along container (`[data-testid="read-along-scroll-container"]`) into a `documentPictureInPicture` window, then syncs per-line "read" classes (lines Spotify itself marks as read) instead of re-rendering — so highlighting always matches the main page. Seeking drives the hidden `input[type=range]` inside Spotify's progress bar with a full pointer gesture so React state stays consistent. Only stable `data-testid`s are used — never Spotify's hashed CSS classes — so it tends to survive Spotify UI updates.

## Files

- [`bookmarklet.txt`](bookmarklet.txt) — the one-line bookmarklet (paste into a bookmark URL)
- [`spotify-read-along-pip.js`](spotify-read-along-pip.js) — readable source with comments

---

License: MIT. Spotify's DOM changes over time; if this breaks, check for an updated version or open an issue.
