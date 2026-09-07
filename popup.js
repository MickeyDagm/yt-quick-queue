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

  const tokens = rawText.split(/[\r\n;,]+/);
  const cleanTracks = [];

  for (let token of tokens) {
    let line = token.trim();
    if (!line) continue;

    line = line.replace(/^[•\*\-\+–—]\s*/, '');
    line = line.replace(/^(\[\d+\]|\d+[\.\)\-]?)\s*/, '');
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

  const match = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}