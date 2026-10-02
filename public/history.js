const historyGrid = document.getElementById('historyGrid');
const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');

// Refresh campaign history manually
refreshHistoryBtn.addEventListener('click', loadHistory);

// Load all saved campaigns from the backend
async function loadHistory() {
  historyGrid.innerHTML = '<p>Loading campaigns...</p>';

  try {
    const response = await fetch('/api/campaigns');
    const data = await response.json();

    if (!response.ok || !data.success) {
      historyGrid.innerHTML = '<p>Could not load campaign history.</p>';
      return;
    }

    renderHistory(data.campaigns || []);
  } catch (error) {
    console.error('History Error:', error);
    historyGrid.innerHTML = '<p>Failed to load campaign history.</p>';
  }
}

// Render saved campaign cards
function renderHistory(campaigns) {
  historyGrid.innerHTML = '';

  if (!campaigns.length) {
    historyGrid.innerHTML = '<p>No campaigns yet. Generate your first AI ad campaign.</p>';
    return;
  }

  campaigns.forEach((campaign) => {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.innerHTML = `
      <img src="${campaign.originalImage}" alt="${campaign.publicId}" />
      <div class="history-card-body">
        <p><strong>Preset:</strong> ${campaign.preset}</p>
        <p><strong>Prompt:</strong> ${campaign.promptUsed}</p>
        <p><strong>Moderation:</strong> ${campaign.moderationStatus}</p>
        <p><strong>Created:</strong> ${new Date(campaign.createdAt).toLocaleString()}</p>
        <div class="history-actions">
          <a href="/campaign/${campaign._id}" class="action-link">View</a>
          <button class="delete-btn" data-id="${campaign._id}">Delete</button>
        </div>
      </div>
    `;
    historyGrid.appendChild(card);
  });

  bindDeleteButtons();
}

// Bind delete button actions
function bindDeleteButtons() {
  document.querySelectorAll('.delete-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const campaignId = button.dataset.id;
      const shouldDelete = confirm('Delete this saved campaign?');

      if (!shouldDelete) return;

      try {
        const response = await fetch(`/api/campaigns/${campaignId}`, {
          method: 'DELETE'
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          alert(data.error || 'Failed to delete campaign.');
          return;
        }

        loadHistory();
      } catch (error) {
        console.error('Delete Error:', error);
        alert('Failed to delete campaign.');
      }
    });
  });
}

// Initial load
loadHistory();