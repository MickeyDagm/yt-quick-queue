# YT Quick Queue 🎵
A modern Manifest V3 Chrome Side Panel extension that instantly converts raw, unstructured song lists into an on-the-fly YouTube queue—with zero API keys, no Google Cloud setup, and no quota limits.

## ✨ What Makes It Different?
Unlike basic converters that force you to save playlists to your Google account or blind-guess video versions, YT Quick Queue gives you full control right from your browser's sidebar:

*   **🎙️ Studio Audio Mode (Toggle):** Avoid 2-minute cinematic music video skits, sound effects, and dialogue. Toggle "Prefer Clean / Studio Audio" to prioritize high-fidelity official audio tracks and auto-generated artist Topic uploads.
*   **🛡️ Ad-Proof Search Matching:** Targets YouTube's internal organic videoRenderer schema rather than naive links, skipping sponsored ads in regions with dense ad auctions (like the US).
*   **🎮 Sidebar Mini-Player:** Control playback without leaving your current tab. Play, pause, skip, or return to previous songs directly from the extension's side panel using native script injection.
*   **🔗 1-Click Shareable Link:** Generates an ephemeral YouTube queue URL that you can copy to your clipboard with one click and share with friends on WhatsApp, Discord, or Slack.
*   **🖐️ Drag-and-Drop Reordering:** Rearrange the track queue before launching without touching or breaking the formatting of your original pasted text.
*   **🧹 Smart Unicode Normalization:** Handles bullets (•, ·, ∙, ‣), numbered lists (1., [2], 3)), and single-line comma/semicolon-separated entries seamlessly.

## 🛠️ Installation & Setup (Developer Mode)

### Option 1: Git Clone
```bash
git clone https://github.com/MickeyDagm/yt-quick-queue.git
```

### Option 2: Download ZIP
1.  Click the green **Code** button on the GitHub repository page.
2.  Select **Download ZIP**.
3.  Extract (unzip) the downloaded folder to a location on your computer.

### Loading the Extension into Chrome:
1.  Open Google Chrome and navigate to:
    ```text
    chrome://extensions/
    ```
2.  Enable **Developer mode** using the toggle switch in the top-right corner.
3.  Click **Load unpacked** in the top-left corner.
4.  Select the `yt-quick-queue` folder.
5.  Click the puzzle icon in Chrome's toolbar and pin **YT Quick Queue**.

## 🎧 Usage Guide
1.  Click the YT Quick Queue icon in your toolbar to open the docked side panel.
2.  (Optional) Toggle "Prefer Clean / Studio Audio" on or off depending on whether you want studio tracks or music videos.
3.  Paste any song list into the input box:
    ```text
    1. Daft Punk - Get Lucky
    · Beyoncé - Drunk in Love
    • Coldplay - Yellow
    The Weeknd - Blinding Lights, Michael Jackson - Billie Jean
    ```
4.  Review and arrange your queue in the live preview:
    *   **Reorder:** Drag and drop songs using the `⠿` handle to arrange your custom sequence.
    *   **Remove:** Click `×` next to any unwanted song.
    *   **Reset:** Click `Clear All` to start fresh.
5.  Click **Play All (N)**:
    *   A new tab opens with all tracks queued sequentially in YouTube's built-in player.
    *   Use the mini-player controls (`⏮` `⏯` `⏭`) at the bottom of your side panel to manage playback from any tab.
6.  Click **🔗 Copy Link** to send the instant playlist to friends.
