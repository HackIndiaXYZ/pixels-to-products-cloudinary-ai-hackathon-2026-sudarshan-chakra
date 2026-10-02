const campaignDetailContainer = document.getElementById('campaignDetailContainer');
const campaignId = window.location.pathname.split('/').pop();

// Load a single campaign detail from the backend
async function loadCampaignDetails() {
  try {
    const response = await fetch(`/api/campaigns/${campaignId}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      campaignDetailContainer.innerHTML = '<p>Campaign not found.</p>';
      return;
    }

    renderCampaign(data.campaign);
  } catch (error) {
    console.error('Campaign Detail Error:', error);
    campaignDetailContainer.innerHTML = '<p>Failed to load campaign details.</p>';
  }
}

// Render full campaign details on the page
function renderCampaign(campaign) {
  campaignDetailContainer.innerHTML = `
    <div class="campaign-detail-header">
      <h2>${campaign.preset.toUpperCase()} Campaign</h2>
      <p><strong>Prompt:</strong> ${campaign.promptUsed}</p>
      <p><strong>Moderation:</strong> ${campaign.moderationStatus}</p>
      <p><strong>Created:</strong> ${new Date(campaign.createdAt).toLocaleString()}</p>
    </div>

    <div class="compare-grid">
      <div class="card">
        <h3>Original Upload</h3>
        <img src="${campaign.originalImage}" alt="Original image" />
      </div>
      <div class="card">
        <h3>Background Removed</h3>
        <img src="${campaign.assets.bgRemoved}" alt="Background removed image" />
      </div>
    </div>

    <div class="theme-block top-space">
      <h3 class="theme-title">Luxury Variants</h3>
      <div class="variant-grid">
        ${createVariantCard('Square', campaign.assets.luxury.square)}
        ${createVariantCard('Story', campaign.assets.luxury.story)}
        ${createVariantCard('Banner', campaign.assets.luxury.banner)}
      </div>
    </div>

    <div class="theme-block top-space">
      <h3 class="theme-title">Minimal Variants</h3>
      <div class="variant-grid">
        ${createVariantCard('Square', campaign.assets.minimal.square)}
        ${createVariantCard('Story', campaign.assets.minimal.story)}
        ${createVariantCard('Banner', campaign.assets.minimal.banner)}
      </div>
    </div>

    <div class="theme-block top-space">
      <h3 class="theme-title">Festive Variants</h3>
      <div class="variant-grid">
        ${createVariantCard('Square', campaign.assets.festive.square)}
        ${createVariantCard('Story', campaign.assets.festive.story)}
        ${createVariantCard('Banner', campaign.assets.festive.banner)}
      </div>
    </div>
  `;

  bindCopyButtons();
}

// Build one asset card
function createVariantCard(label, url) {
  return `
    <div class="variant-card">
      <h4>${label}</h4>
      <img src="${url}" alt="${label}" />
      <div class="variant-actions">
        <a href="${url}" target="_blank" class="action-link">Open</a>
        <a href="${url}" download class="action-link">Download</a>
        <button class="copy-btn" data-url="${url}">Copy URL</button>
      </div>
    </div>
  `;
}

// Bind copy buttons
function bindCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.url);
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = 'Copy URL';
        }, 1200);
      } catch (error) {
        alert('Failed to copy URL.');
      }
    });
  });
}

// Load campaign when page opens
loadCampaignDetails();