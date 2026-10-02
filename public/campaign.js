const campaignDetailContainer = document.getElementById('campaignDetailContainer');

// Safely extract campaign ID from URL
const pathParts = window.location.pathname.split('/').filter(Boolean);
const campaignId = pathParts[pathParts.length - 1];

/**
 * Load one campaign from backend.
 */
async function loadCampaignDetails() {
  if (!campaignId) {
    campaignDetailContainer.innerHTML = `
      <p>Invalid campaign URL. No campaign ID was found.</p>
    `;
    return;
  }

  try {
    const response = await fetch(`/api/campaigns/${campaignId}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      campaignDetailContainer.innerHTML = `
        <p>${data.error || 'Campaign not found.'}</p>
      `;
      return;
    }

    renderCampaign(data.campaign);
  } catch (error) {
    console.error('Campaign Detail Error:', error);
    campaignDetailContainer.innerHTML = `
      <p>Failed to load campaign details. Please try again.</p>
    `;
  }
}

/**
 * Render campaign details on page.
 */
function renderCampaign(campaign) {
  campaignDetailContainer.innerHTML = `
    <div class="campaign-detail-header">
      <div>
        <h2>${(campaign.preset || 'custom').toUpperCase()} Campaign</h2>
        <p><strong>Prompt:</strong> ${campaign.promptUsed || 'N/A'}</p>
        <p><strong>Moderation:</strong> ${formatModeration(campaign.moderationStatus)}</p>
        <p><strong>Created:</strong> ${formatDate(campaign.createdAt)}</p>
      </div>
    </div>

    <div class="metadata-grid top-space">
      <div class="meta-box">
        <h3>Campaign Metadata</h3>
        <div class="metadata-content">
          <p><strong>Public ID:</strong> ${campaign.publicId || 'N/A'}</p>
          <p><strong>Preset:</strong> ${campaign.preset || 'N/A'}</p>
          <p><strong>Format:</strong> ${campaign.metadata?.format || 'unknown'}</p>
          <p><strong>Dimensions:</strong> ${campaign.metadata?.width || '-'} x ${campaign.metadata?.height || '-'}</p>
          <p><strong>Total Variants:</strong> ${campaign.metadata?.totalVariants || 0}</p>
        </div>
      </div>

      <div class="meta-box">
        <h3>Auto Tags</h3>
        <div class="tags">
          ${(campaign.autoTags || []).length
            ? campaign.autoTags.map(tag => `<span class="tag">${tag}</span>`).join('')
            : '<span class="tag">No tags available</span>'}
        </div>
      </div>
    </div>

    <div class="compare-grid top-space">
      <div class="card">
        <h3>Original Upload</h3>
        <img src="${campaign.originalImage}" alt="Original image" />
      </div>
      <div class="card">
        <h3>Background Removed</h3>
        <img src="${campaign.assets?.bgRemoved || campaign.originalImage}" alt="Background removed image" />
      </div>
    </div>

    <div class="theme-block top-space">
      <h3 class="theme-title">Luxury Variants</h3>
      <div class="variant-grid">
        ${createVariantCard('Square', campaign.assets?.luxury?.square)}
        ${createVariantCard('Story', campaign.assets?.luxury?.story)}
        ${createVariantCard('Banner', campaign.assets?.luxury?.banner)}
      </div>
    </div>

    <div class="theme-block top-space">
      <h3 class="theme-title">Minimal Variants</h3>
      <div class="variant-grid">
        ${createVariantCard('Square', campaign.assets?.minimal?.square)}
        ${createVariantCard('Story', campaign.assets?.minimal?.story)}
        ${createVariantCard('Banner', campaign.assets?.minimal?.banner)}
      </div>
    </div>

    <div class="theme-block top-space">
      <h3 class="theme-title">Festive Variants</h3>
      <div class="variant-grid">
        ${createVariantCard('Square', campaign.assets?.festive?.square)}
        ${createVariantCard('Story', campaign.assets?.festive?.story)}
        ${createVariantCard('Banner', campaign.assets?.festive?.banner)}
      </div>
    </div>
  `;

  bindCopyButtons();
}

/**
 * Create one variant card.
 */
function createVariantCard(label, url) {
  if (!url) {
    return `
      <div class="variant-card">
        <h4>${label}</h4>
        <p>Asset unavailable</p>
      </div>
    `;
  }

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

/**
 * Bind copy URL buttons.
 */
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

/**
 * Format moderation label for display.
 */
function formatModeration(status) {
  if (status === 'approved') return 'Approved';
  if (status === 'pending') return 'Pending Review';
  if (status === 'rejected') return 'Rejected';
  if (status === 'unavailable') return 'AI Add-on Unavailable';
  return status || 'Unknown';
}

/**
 * Format date safely.
 */
function formatDate(value) {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleString();
}

// Initial load
loadCampaignDetails();
