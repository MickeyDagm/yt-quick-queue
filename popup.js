const textarea = document.getElementById('songList');
const status = document.getElementById('status');
const button = document.getElementById('startBtn');
const previewWrapper = document.getElementById('previewWrapper');
const previewList = document.getElementById('previewList');
const trackCount = document.getElementById('trackCount');
const clearAllBtn = document.getElementById('clearAllBtn');
const closePanelBtn = document.getElementById('closePanelBtn');

let currentTracks = [];

// Close button listener (works for both popups and side panels)
closePanelBtn.addEventListener('click', () => {
  window.close();
});

// Clear all tracks
clearAllBtn.addEventListener('click', () => {
  currentTracks = [];
  textarea.value = '';
  status.textContent = '';
  renderPreview();
});

// Live input listener
textarea.addEventListener('input', () => {
  currentTracks = parseTrackInput(textarea.value);
  renderPreview();
});

function renderPreview() {
  if (currentTracks.length === 0) {
    previewWrapper.classList.add('hidden');
    button.textContent = 'Play All';
    return;
  }

  previewWrapper.classList.remove('hidden');
  trackCount.textContent = currentTracks.length;
  button.textContent = `Play All (${currentTracks.length})`;

  previewList.innerHTML = '';

  currentTracks.forEach((song, idx) => {
    const li = document.createElement('li');

    const infoContainer = document.createElement('div');
    infoContainer.className = 'track-info';

    const num = document.createElement('span');
    num.className = 'track-num';
    num.textContent = `${idx + 1}.`;

    const title = document.createElement('span');
    title.textContent = song;

    infoContainer.appendChild(num);
    infoContainer.appendChild(title);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.title = 'Remove track';

    deleteBtn.addEventListener('click', () => {
      removeTrack(idx);
    });

    li.appendChild(infoContainer);
    li.appendChild(deleteBtn);
    previewList.appendChild(li);
  });
}

function removeTrack(index) {
  currentTracks.splice(index, 1);
  textarea.value = currentTracks.join('\n');
  renderPreview();
}

button.addEventListener('click', async () => {
  if (currentTracks.length === 0) {
    status.textContent = 'Please enter at least one valid track.';
    return;
  }

  button.disabled = true;
  const videoIds = [];

  for (let i = 0; i < currentTracks.length; i++) {
    const song = currentTracks[i];
    status.textContent = `Finding (${i + 1}/${currentTracks.length}): ${song}`;

    try {
      const id = await fetchVideoId(song);
      if (id) {
        videoIds.push(id);
      }
    } catch (err) {
      console.error(`Error searching for ${song}:`, err);
    }
  }

  if (videoIds.length === 0) {
    status.textContent = 'Could not find matching videos.';
    button.disabled = false;
    return;
  }

  status.textContent = 'Launching playlist...';

  const playlistUrl = `https://www.youtube.com/watch_videos?video_ids=${videoIds.join(',')}`;
  chrome.tabs.create({ url: playlistUrl });

  button.disabled = false;
  status.textContent = `Queued ${videoIds.length} tracks!`;
});

function parseTrackInput(rawText) {
  if (!rawText) return [];

  // Split by newline, carriage return, commas, or semicolons
  const tokens = rawText.split(/[\r\n;,]+/);
  const cleanTracks = [];

  for (let token of tokens) {
    let line = token.trim();
    if (!line) continue;

    // Remove middle dots, standard bullets, and common list markers:
    // · (middle dot), • (bullet), ∙, ‣, ⁃, ◦, -, *, +, –, —
    line = line.replace(/^[\u00B7\u2022\u2219\u2023\u2043\u25E6\*\-\+–—]\s*/u, '');

    // Strip ordered numbers/indices: e.g., "1.", "1)", "[1]", "1 -"
    line = line.replace(/^(\[\d+\]|\d+[\.\)\-]?)\s*/, '');

    // Strip wrapping quotes
    line = line.replace(/^["']|["']$/g, '').trim();

    if (line.length > 1) {
      cleanTracks.push(line);
    }
  }

  return cleanTracks;
}

async function fetchVideoId(query) {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const response = await fetch(searchUrl);
  const html = await response.text();


  const organicMatch = html.match(/"videoRenderer":\s*\{\s*"videoId":\s*"([a-zA-Z0-9_-]{11})"/);
  if (organicMatch && organicMatch[1]) {
    return organicMatch[1];
  }

  const jsonIdMatch = html.match(/"videoId":\s*"([a-zA-Z0-9_-]{11})"/);
  if (jsonIdMatch && jsonIdMatch[1]) {
    return jsonIdMatch[1];
  }
  const fallbackMatch = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
  return fallbackMatch ? fallbackMatch[1] : null;
}

let draggedIndex = null;

function renderPreview() {
  if (currentTracks.length === 0) {
    previewWrapper.classList.add('hidden');
    button.textContent = 'Play All';
    return;
  }

  previewWrapper.classList.remove('hidden');
  trackCount.textContent = currentTracks.length;
  button.textContent = `Play All (${currentTracks.length})`;

  previewList.innerHTML = '';

  currentTracks.forEach((song, idx) => {
    const li = document.createElement('li');
    li.setAttribute('draggable', 'true');
    li.dataset.index = idx;

    // Track info container
    const infoContainer = document.createElement('div');
    infoContainer.className = 'track-info';

    // Drag handle icon (6 dots: ⋮⋮)
    const handle = document.createElement('span');
    handle.className = 'drag-handle';
    handle.textContent = '⠿';
    handle.title = 'Drag to reorder';

    const num = document.createElement('span');
    num.className = 'track-num';
    num.textContent = `${idx + 1}.`;

    const title = document.createElement('span');
    title.textContent = song;

    infoContainer.appendChild(handle);
    infoContainer.appendChild(num);
    infoContainer.appendChild(title);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.title = 'Remove track';

    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeTrack(idx);
    });

    li.appendChild(infoContainer);
    li.appendChild(deleteBtn);

    // HTML5 Drag & Drop Event Listeners
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
        // Move the dragged item to the new position in our array
        const [movedItem] = currentTracks.splice(draggedIndex, 1);
        currentTracks.splice(targetIndex, 0, movedItem);

        // DO NOT overwrite textarea.value so original formatting is kept
        renderPreview();
      }
    });

    previewList.appendChild(li);
  });
}