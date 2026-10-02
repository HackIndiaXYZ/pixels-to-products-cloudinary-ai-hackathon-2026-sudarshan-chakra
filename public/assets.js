const assetGrid = document.getElementById('assetGrid');
const assetSearchInput = document.getElementById('assetSearchInput');
const assetSearchBtn = document.getElementById('assetSearchBtn');

// Search assets when button is clicked
assetSearchBtn.addEventListener('click', () => {
  loadAssets(assetSearchInput.value.trim());
});

// Load assets from backend search API
async function loadAssets(query = '') {
  assetGrid.innerHTML = '<p>Loading assets...</p>';

  try {
    const url = query
      ? `/api/assets/search?q=${encodeURIComponent(query)}`
      : '/api/assets/search';

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || !data.success) {
      assetGrid.innerHTML = '<p>Failed to load assets.</p>';
      return;
    }

    renderAssets(data.resources || []);
  } catch (error) {
    console.error('Asset Load Error:', error);
    assetGrid.innerHTML = '<p>Could not load assets.</p>';
  }
}

// Render asset cards
function renderAssets(resources) {
  assetGrid.innerHTML = '';

  if (!resources.length) {
    assetGrid.innerHTML = '<p>No assets found.</p>';
    return;
  }

  resources.forEach((resource) => {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.innerHTML = `
      <img src="${resource.secure_url}" alt="${resource.public_id}" />
      <div class="history-card-body">
        <p><strong>ID:</strong> ${resource.public_id}</p>
        <p><strong>Format:</strong> ${resource.format || 'unknown'}</p>
        <p><strong>Created:</strong> ${new Date(resource.created_at).toLocaleString()}</p>
        <div class="history-actions">
          <a href="${resource.secure_url}" target="_blank" class="action-link">Open</a>
        </div>
      </div>
    `;
    assetGrid.appendChild(card);
  });
}

// Initial asset load
loadAssets();