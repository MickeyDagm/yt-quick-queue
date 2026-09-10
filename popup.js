const textarea = document.getElementById('songList');
const inputSection = document.getElementById('inputSection');
const toggleInputBtn = document.getElementById('toggleInputBtn');
const status = document.getElementById('status');
const button = document.getElementById('startBtn');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const previewWrapper = document.getElementById('previewWrapper');
const previewList = document.getElementById('previewList');
const trackCount = document.getElementById('trackCount');
const clearAllBtn = document.getElementById('clearAllBtn');
const closePanelBtn = document.getElementById('closePanelBtn');
const studioAudioToggle = document.getElementById('studioAudioToggle');

// Now Playing Card & Player Elements
const nowPlayingCard = document.getElementById('nowPlayingCard');
const currentThumb = document.getElementById('currentThumb');
const currentTrackTitle = document.getElementById('currentTrackTitle');
const miniPlayer = document.getElementById('miniPlayer');
const playerExpanded = document.getElementById('playerExpanded');
const playerPill = document.getElementById('playerPill');
const minimizePlayerBtn = document.getElementById('minimizePlayerBtn');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let currentTracks = [];
let draggedIndex = null;
let currentPlaylistUrl = null;
let activePlayerTabId = null;
let isPlaying = true;
let searchCache = {};

closePanelBtn.addEventListener('click', () => window.close());

// Toggle input view when playing
if (toggleInputBtn) {
  toggleInputBtn.addEventListener('click', () => {
    inputSection.classList.toggle('collapsed');
  });
}

// Minimize player to floating pill
if (minimizePlayerBtn) {
  minimizePlayerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    miniPlayer.classList.add('is-minimized');
    if (playerExpanded) playerExpanded.classList.add('hidden');
    if (playerPill) playerPill.classList.remove('hidden');
  });
}

// Expand player back to full size
if (playerPill) {
  playerPill.addEventListener('click', () => {
    miniPlayer.classList.remove('is-minimized');
    playerPill.classList.add('hidden');
    if (playerExpanded) playerExpanded.classList.remove('hidden');
  });
}

clearAllBtn.addEventListener('click', () => {
  currentTracks = [];
  textarea.value = '';
  status.textContent = '';
  copyLinkBtn.disabled = true;
  currentPlaylistUrl = null;
  activePlayerTabId = null;
  isPlaying = false;
  nowPlayingCard.classList.add('hidden');
  miniPlayer.classList.add('hidden');
  miniPlayer.classList.remove('is-minimized');
  if (playerPill) playerPill.classList.add('hidden');
  if (playerExpanded) playerExpanded.classList.remove('hidden');
  inputSection.classList.remove('collapsed');
  if (toggleInputBtn) toggleInputBtn.classList.add('hidden');
  renderPreview();
  if (typeof saveState === 'function') saveState();
});

textarea.addEventListener('input', () => {
  currentTracks = parseTrackInput(textarea.value);
  renderPreview();
  if (typeof saveState === 'function') saveState();
});

function renderPreview() {
  if (activePlayerTabId) {
    button.classList.add('hidden');
  } else {
    button.classList.remove('hidden');
  }

  if (currentTracks.length === 0) {
    previewWrapper.classList.add('hidden');
    button.textContent = 'Play All Songs';
    return;
  }

  previewWrapper.classList.remove('hidden');
  trackCount.textContent = currentTracks.length;
  button.textContent = `Play All Songs (${currentTracks.length})`;

  previewList.innerHTML = '';

  currentTracks.forEach((song, idx) => {
    const li = document.createElement('li');
    li.setAttribute('draggable', 'true');
    li.dataset.index = idx;

    const infoContainer = document.createElement('div');
    infoContainer.className = 'track-info';

    const handle = document.createElement('span');
    handle.className = 'drag-handle';
    handle.textContent = '⠿';

    const num = document.createElement('span');
    num.className = 'track-num';
    num.textContent = `${idx + 1}.`;

    const title = document.createElement('span');
    title.textContent = song;

    infoContainer.appendChild(handle);
    infoContainer.appendChild(num);
    infoContainer.appendChild(title);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.title = 'Remove';

    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeTrack(idx);
    });

    li.appendChild(infoContainer);
    li.appendChild(deleteBtn);

    // Drag-and-drop
    li.addEventListener('dragstart', (e) => {
      draggedIndex = idx;
      li.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      document.querySelectorAll('#previewList li').forEach(el => el.classList.remove('drag-over'));
      draggedIndex = null;
    });

    li.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      li.classList.add('drag-over');
    });

    li.addEventListener('dragleave', () => {
      li.classList.remove('drag-over');
    });

    li.addEventListener('drop', (e) => {
      e.preventDefault();
      li.classList.remove('drag-over');

      const targetIndex = Number(li.dataset.index);
      if (draggedIndex !== null && draggedIndex !== targetIndex) {
        const [movedItem] = currentTracks.splice(draggedIndex, 1);
        currentTracks.splice(targetIndex, 0, movedItem);
        textarea.value = currentTracks.join('\n');
        renderPreview();
        if (typeof saveState === 'function') saveState();
      }
    });

    previewList.appendChild(li);
  });
}

function removeTrack(index) {
  currentTracks.splice(index, 1);
  textarea.value = currentTracks.join('\n');
  renderPreview();
  if (typeof saveState === 'function') saveState();
}

// "Play All" Action
button.addEventListener('click', async () => {
  if (currentTracks.length === 0) {
    status.textContent = 'Please paste at least one track.';
    return;
  }

  button.disabled = true;
  copyLinkBtn.disabled = true;
  const videoIds = [];
  const preferStudio = studioAudioToggle.checked;

  for (let i = 0; i < currentTracks.length; i++) {
    const song = currentTracks[i];
    
    if (searchCache[song]) {
      videoIds.push(searchCache[song]);
      continue;
    }

    status.textContent = `Finding (${i + 1}/${currentTracks.length}): ${song}`;
    const query = preferStudio ? `${song} "Official Audio" OR "Topic"` : song;

    try {
      const id = await fetchVideoId(query);
      if (id) {
        videoIds.push(id);
        searchCache[song] = id;
      }
    } catch (err) {
      console.error(`Error searching for ${song}:`, err);
    }
  }

  if (videoIds.length === 0) {
    status.textContent = 'Could not match videos.';
    button.disabled = false;
    return;
  }

  status.textContent = 'Launching playback...';

  // Set Hero Card with 1st song cover art
  const firstVideoId = videoIds[0];
  currentThumb.src = `https://i.ytimg.com/vi/${firstVideoId}/hqdefault.jpg`;
  currentTrackTitle.textContent = currentTracks[0];
  nowPlayingCard.classList.remove('hidden');

  // Collapse textarea to give space for queue & player
  inputSection.classList.add('collapsed');
  if (toggleInputBtn) toggleInputBtn.classList.remove('hidden');

  currentPlaylistUrl = `https://www.youtube.com/watch_videos?video_ids=${videoIds.join(',')}`;
  
  const newTab = await chrome.tabs.create({ url: currentPlaylistUrl });
  activePlayerTabId = newTab.id;

  button.disabled = false;
  copyLinkBtn.disabled = false;
  miniPlayer.classList.remove('hidden');
  miniPlayer.classList.remove('is-minimized');
  if (playerPill) playerPill.classList.add('hidden');
  if (playerExpanded) playerExpanded.classList.remove('hidden');
  isPlaying = true;
  playPauseBtn.textContent = '⏸';
  status.textContent = `Playing ${videoIds.length} tracks`;
  renderPreview();
  
  if (typeof saveState === 'function') saveState();
});

// Copy link
copyLinkBtn.addEventListener('click', async () => {
  if (!currentPlaylistUrl) return;
  await navigator.clipboard.writeText(currentPlaylistUrl);
  copyLinkBtn.textContent = '✓';
  setTimeout(() => { copyLinkBtn.textContent = '🔗'; }, 1800);
});

// Safe helper to run scripts inside the YouTube tab
async function executeOnPlayerTab(scriptFunc) {
  if (!activePlayerTabId) return null;

  try {
    const tab = await chrome.tabs.get(activePlayerTabId);
    if (!tab || !tab.id) return null;

    const results = await chrome.scripting.executeScript({
      target: { tabId: activePlayerTabId },
      func: scriptFunc
    });
    return results && results[0] ? results[0].result : null;
  } catch (err) {
    console.warn('Playback script execution ignored:', err.message);
    return null;
  }
}

// Play / Pause
playPauseBtn.addEventListener('click', async () => {
  const isPaused = await executeOnPlayerTab(() => {
    const video = document.querySelector('video');
    if (!video) return null;
    if (video.paused) {
      video.play();
      return false;
    } else {
      video.pause();
      return true;
    }
  });

  if (isPaused !== null) {
    isPlaying = !isPaused;
    playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
  }
});

// Next Track
nextBtn.addEventListener('click', () => {
  executeOnPlayerTab(() => {
    const btn = document.querySelector('.ytp-next-button');
    if (btn) btn.click();
  });
});

// Previous Track
prevBtn.addEventListener('click', () => {
  executeOnPlayerTab(() => {
    const btn = document.querySelector('.ytp-prev-button');
    if (btn) btn.click();
  });
});

function parseTrackInput(rawText) {
  if (!rawText) return [];
  const tokens = rawText.split(/[\r\n;,]+/);
  const cleanTracks = [];

  for (let token of tokens) {
    let line = token.trim();
    if (!line) continue;
    line = line.replace(/^[\u00B7\u2022\u2219\u2023\u2043\u25E6\*\-\+–—]\s*/u, '');
    line = line.replace(/^(\[\d+\]|\d+[\.\)\-]?)\s*/, '');
    line = line.replace(/^["']|["']$/g, '').trim();
    if (line.length > 1) cleanTracks.push(line);
  }
  return cleanTracks;
}

async function fetchVideoId(query) {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const response = await fetch(searchUrl);
  const html = await response.text();

  const organicMatch = html.match(/"videoRenderer":\s*\{\s*"videoId":\s*"([a-zA-Z0-9_-]{11})"/);
  if (organicMatch && organicMatch[1]) return organicMatch[1];

  const jsonIdMatch = html.match(/"videoId":\s*"([a-zA-Z0-9_-]{11})"/);
  if (jsonIdMatch && jsonIdMatch[1]) return jsonIdMatch[1];

  const fallbackMatch = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
  return fallbackMatch ? fallbackMatch[1] : null;
}

// Keep Now Playing UI in sync when the YouTube tab navigates to a new song
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activePlayerTabId) {
    // Update thumbnail when the video URL changes
    if ((changeInfo.url || changeInfo.status === 'complete') && tab.url && tab.url.includes('watch?v=')) {
      try {
        const urlObj = new URL(tab.url);
        const videoId = urlObj.searchParams.get('v');
        if (videoId) {
          currentThumb.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        }
      } catch (e) {
        console.error('Error parsing video ID:', e);
      }
    }
    
    // Update title if it changes
    if (changeInfo.title && changeInfo.title !== 'YouTube') {
      let cleanTitle = changeInfo.title.replace(/ - YouTube$/, '');
      cleanTitle = cleanTitle.replace(/^\(\d+\)\s/, ''); // Remove notification badges like "(1) "
      currentTrackTitle.textContent = cleanTitle;
    }
    
    if (typeof saveState === 'function') saveState();
  }
});

// Handle the user closing the YouTube player tab
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activePlayerTabId) {
    activePlayerTabId = null;
    status.textContent = 'Player tab was closed.';
    isPlaying = false;
    playPauseBtn.textContent = '▶';
    renderPreview();
    if (typeof saveState === 'function') saveState();
  }
});

// state management functions to inject
function saveState() {
  chrome.storage.local.set({
    textareaValue: textarea.value,
    currentPlaylistUrl: currentPlaylistUrl,
    activePlayerTabId: activePlayerTabId,
    isPlaying: isPlaying,
    currentThumbSrc: currentThumb.src,
    currentTrackTitleText: currentTrackTitle.textContent,
    searchCache: searchCache
  });
}

async function loadState() {
  const data = await chrome.storage.local.get(null);
  if (data.searchCache) {
    searchCache = data.searchCache;
  }
  if (data.textareaValue) {
    textarea.value = data.textareaValue;
    currentTracks = parseTrackInput(textarea.value);
    renderPreview();
  }
  if (data.activePlayerTabId) {
    try {
      const tab = await chrome.tabs.get(data.activePlayerTabId);
      if (tab) {
        activePlayerTabId = data.activePlayerTabId;
        currentPlaylistUrl = data.currentPlaylistUrl;
        isPlaying = data.isPlaying;
        
        currentThumb.src = data.currentThumbSrc || '';
        currentTrackTitle.textContent = data.currentTrackTitleText || '';
        
        if (currentTracks.length > 0) {
          nowPlayingCard.classList.remove('hidden');
          inputSection.classList.add('collapsed');
          if (toggleInputBtn) toggleInputBtn.classList.remove('hidden');
          button.disabled = false;
          copyLinkBtn.disabled = false;
          miniPlayer.classList.remove('hidden');
          miniPlayer.classList.remove('is-minimized');
          if (playerPill) playerPill.classList.add('hidden');
          if (playerExpanded) playerExpanded.classList.remove('hidden');
          playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
          status.textContent = 'Restored active player';
          renderPreview();
        }
      }
    } catch (e) {
      chrome.storage.local.remove(['activePlayerTabId', 'currentPlaylistUrl']);
    }
  }
}

document.addEventListener('DOMContentLoaded', loadState);

