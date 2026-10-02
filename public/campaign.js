const campaignDetailContainer =
  document.getElementById(
    'campaignDetailContainer'
  );

// Get campaign ID from URL
const pathParts =
  window.location.pathname
    .split('/')
    .filter(Boolean);

const campaignId =
  pathParts[pathParts.length - 1];

// Escape HTML before inserting dynamic text
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Load campaign details from backend
async function loadCampaignDetails() {
  if (!campaignId) {
    campaignDetailContainer.innerHTML = `
      <p>Invalid campaign URL. No campaign ID was found.</p>
    `;

    return;
  }

  try {
    const response =
      await fetch(
        `/api/campaigns/${campaignId}`
      );

    const data =
      await response.json();

    if (!response.ok || !data.success) {
      campaignDetailContainer.innerHTML = `
        <p>
          ${escapeHtml(
            data.error ||
            'Campaign not found.'
          )}
        </p>
      `;

      return;
    }

    renderCampaign(data.campaign);

  } catch (error) {
    console.error(
      'Campaign Detail Error:',
      error
    );

    campaignDetailContainer.innerHTML = `
      <p>
        Failed to load campaign details.
        Please try again.
      </p>
    `;
  }
}

// Convert pipeline value into CSS class
function pipelineStatusClass(value) {
  const status =
    String(value || '')
      .toLowerCase();

  if (
    status === 'approved' ||
    status === 'completed' ||
    status === 'success' ||
    status === 'true'
  ) {
    return 'status-success';
  }

  if (status === 'pending') {
    return 'status-pending';
  }

  return 'status-unavailable';
}

// Convert pipeline value into readable text
function pipelineStatusLabel(value) {
  const status =
    String(value || '')
      .toLowerCase();

  if (status === 'approved') {
    return 'Approved';
  }

  if (status === 'rejected') {
    return 'Rejected';
  }

  if (status === 'pending') {
    return 'Pending';
  }

  if (status === 'completed') {
    return 'Completed';
  }

  if (status === 'unavailable') {
    return 'Unavailable';
  }

  if (
    status === 'true' ||
    status === 'success'
  ) {
    return 'Completed';
  }

  return value || 'Unavailable';
}

// Render campaign processing pipeline
function renderPipelineStatus(campaign) {
  const pipeline =
    campaign.pipeline || {};

  const moderationStatus =
    campaign.moderationStatus ||
    'unavailable';

  const aiTags =
    Array.isArray(campaign.autoTags)
      ? campaign.autoTags
      : [];

  const uploadedStatus =
    pipeline.uploaded
      ? 'Completed'
      : 'Unavailable';

  const moderationClass =
    pipelineStatusClass(
      moderationStatus
    );

  const moderationLabel =
    pipelineStatusLabel(
      moderationStatus
    );

  const tagClass =
    aiTags.length > 0
      ? 'status-success'
      : 'status-unavailable';

  const tagLabel =
    aiTags.length > 0
      ? `${aiTags.length} AI tag${aiTags.length > 1 ? 's' : ''}`
      : 'Unavailable';

  const bgClass =
    pipeline.backgroundRemoved
      ? 'status-success'
      : 'status-unavailable';

  const bgLabel =
    pipeline.backgroundRemoved
      ? 'Completed'
      : 'Unavailable';

  const generatedClass =
    pipeline.generated
      ? 'status-success'
      : 'status-unavailable';

  const generatedLabel =
    pipeline.generated
      ? 'Completed'
      : 'Unavailable';

  return `
    <div class="pipeline-status top-space">
      <div class="status-card">
        <div class="status-icon">✓</div>
        <div>
          <strong>Uploaded</strong>
          <span class="status-success">
            ${uploadedStatus}
          </span>
        </div>
      </div>

      <div class="status-card">
        <div class="status-icon">M</div>
        <div>
          <strong>Moderated</strong>
          <span class="${moderationClass}">
            ${escapeHtml(moderationLabel)}
          </span>
        </div>
      </div>

      <div class="status-card">
        <div class="status-icon">#</div>
        <div>
          <strong>AI Tagged</strong>
          <span class="${tagClass}">
            ${escapeHtml(tagLabel)}
          </span>
        </div>
      </div>

      <div class="status-card">
        <div class="status-icon">✂</div>
        <div>
          <strong>Background Removed</strong>
          <span class="${bgClass}">
            ${bgLabel}
          </span>
        </div>
      </div>

      <div class="status-card">
        <div class="status-icon">★</div>
        <div>
          <strong>Ad Variants</strong>
          <span class="${generatedClass}">
            ${generatedLabel}
          </span>
        </div>
      </div>
    </div>
  `;
}

// Render complete campaign
function renderCampaign(campaign) {
  const autoTags =
    Array.isArray(campaign.autoTags)
      ? campaign.autoTags
      : [];

  campaignDetailContainer.innerHTML = `
    <div class="campaign-detail-header">
      <div>
        <h2>
          ${escapeHtml(
            (campaign.preset || 'custom')
              .toUpperCase()
          )}
          Campaign
        </h2>

        <p>
          <strong>Prompt:</strong>
          ${escapeHtml(
            campaign.promptUsed || 'N/A'
          )}
        </p>

        <p>
          <strong>Moderation:</strong>
          ${escapeHtml(
            formatModeration(
              campaign.moderationStatus
            )
          )}
        </p>

        <p>
          <strong>Created:</strong>
          ${escapeHtml(
            formatDate(
              campaign.createdAt
            )
          )}
        </p>
      </div>
    </div>

    ${renderPipelineStatus(campaign)}

    <div class="metadata-grid top-space">

      <div class="meta-box">
        <h3>Campaign Metadata</h3>

        <div class="metadata-content">
          <p>
            <strong>Public ID:</strong>
            ${escapeHtml(
              campaign.publicId || 'N/A'
            )}
          </p>

          <p>
            <strong>Preset:</strong>
            ${escapeHtml(
              campaign.preset || 'N/A'
            )}
          </p>

          <p>
            <strong>Format:</strong>
            ${escapeHtml(
              campaign.metadata?.format ||
              'unknown'
            )}
          </p>

          <p>
            <strong>Dimensions:</strong>
            ${escapeHtml(
              campaign.metadata?.width || '-'
            )}
            x
            ${escapeHtml(
              campaign.metadata?.height || '-'
            )}
          </p>

          <p>
            <strong>Total Variants:</strong>
            ${escapeHtml(
              campaign.metadata
                ?.totalVariants || 0
            )}
          </p>
        </div>
      </div>

      <div class="meta-box">
        <h3>AI Tags</h3>

        <div class="tags">
          ${
            autoTags.length
              ? autoTags
                  .map(
                    tag =>
                      `<span class="tag">${escapeHtml(tag)}</span>`
                  )
                  .join('')
              : '<span class="tag">No AI tags available</span>'
          }
        </div>
      </div>

    </div>

    <div class="compare-grid top-space">

      <div class="card">
        <h3>Original Upload</h3>

        <img
          src="${escapeHtml(
            campaign.originalImage || ''
          )}"
          alt="Original product image"
        />
      </div>

      <div class="card">
        <h3>Background Removed</h3>

        <img
          src="${escapeHtml(
            campaign.assets?.bgRemoved ||
            campaign.originalImage ||
            ''
          )}"
          alt="Background removed product"
        />
      </div>

    </div>

    <div class="theme-block top-space">
      <h3 class="theme-title">
        Luxury Variants
      </h3>

      <div class="variant-grid">
        ${createVariantCard(
          'Square',
          campaign.assets?.luxury?.square
        )}

        ${createVariantCard(
          'Story',
          campaign.assets?.luxury?.story
        )}

        ${createVariantCard(
          'Banner',
          campaign.assets?.luxury?.banner
        )}
      </div>
    </div>

    <div class="theme-block top-space">
      <h3 class="theme-title">
        Minimal Variants
      </h3>

      <div class="variant-grid">
        ${createVariantCard(
          'Square',
          campaign.assets?.minimal?.square
        )}

        ${createVariantCard(
          'Story',
          campaign.assets?.minimal?.story
        )}

        ${createVariantCard(
          'Banner',
          campaign.assets?.minimal?.banner
        )}
      </div>
    </div>

    <div class="theme-block top-space">
      <h3 class="theme-title">
        Festive Variants
      </h3>

      <div class="variant-grid">
        ${createVariantCard(
          'Square',
          campaign.assets?.festive?.square
        )}

        ${createVariantCard(
          'Story',
          campaign.assets?.festive?.story
        )}

        ${createVariantCard(
          'Banner',
          campaign.assets?.festive?.banner
        )}
      </div>
    </div>

    ${
      Array.isArray(campaign.warnings) &&
      campaign.warnings.length
        ? `
          <div class="warnings-box top-space">
            <h3>Processing Notes</h3>

            <ul>
              ${campaign.warnings
                .map(
                  warning =>
                    `<li>${escapeHtml(warning)}</li>`
                )
                .join('')}
            </ul>
          </div>
        `
        : ''
    }
  `;

  bindCopyButtons();
  bindDownloadButtons();
}

// Create one variant card
function createVariantCard(
  label,
  url
) {
  if (!url) {
    return `
      <div class="variant-card">
        <h4>${escapeHtml(label)}</h4>
        <p>Asset unavailable</p>
      </div>
    `;
  }

  return `
    <div class="variant-card">

      <h4>
        ${escapeHtml(label)}
      </h4>

      <img
        src="${escapeHtml(url)}"
        alt="${escapeHtml(label)} variant"
        loading="lazy"
      />

      <div class="variant-actions">

        <a
          href="${escapeHtml(url)}"
          target="_blank"
          rel="noopener noreferrer"
          class="action-link"
        >
          Open
        </a>

        <button
          type="button"
          class="action-link download-btn"
          data-url="${escapeHtml(url)}"
          data-label="${escapeHtml(label)}"
        >
          Download
        </button>

        <button
          type="button"
          class="copy-btn"
          data-url="${escapeHtml(url)}"
        >
          Copy URL
        </button>

      </div>
    </div>
  `;
}

// Bind download buttons
function bindDownloadButtons() {
  document
    .querySelectorAll('.download-btn')
    .forEach(button => {
      button.addEventListener(
        'click',
        async () => {
          const url =
            button.dataset.url;

          const label =
            button.dataset.label ||
            'adcraft-image';

          if (!url) {
            return;
          }

          const originalText =
            button.textContent;

          button.disabled = true;
          button.textContent =
            'Downloading...';

          try {
            // Fetch the Cloudinary image as a blob
            const response =
              await fetch(url);

            if (!response.ok) {
              throw new Error(
                `Download failed: ${response.status}`
              );
            }

            const blob =
              await response.blob();

            // Create a temporary local URL
            const blobUrl =
              URL.createObjectURL(blob);

            // Trigger browser download
            const link =
              document.createElement('a');

            link.href = blobUrl;
            link.download =
              `adcraft-${label
                .toLowerCase()
                .replace(/\s+/g, '-')}.jpg`;

            document.body.appendChild(
              link
            );

            link.click();

            link.remove();

            URL.revokeObjectURL(
              blobUrl
            );

            button.textContent =
              'Downloaded';

            setTimeout(() => {
              button.textContent =
                originalText;
              button.disabled = false;
            }, 1200);

          } catch (error) {
            console.error(
              'Download error:',
              error
            );

            // If browser blocks blob download,
            // open the original Cloudinary URL.
            window.open(
              url,
              '_blank',
              'noopener,noreferrer'
            );

            button.textContent =
              'Open Image';

            setTimeout(() => {
              button.textContent =
                originalText;
              button.disabled = false;
            }, 1500);
          }
        }
      );
    });
}

// Bind copy URL buttons
function bindCopyButtons() {
  document
    .querySelectorAll('.copy-btn')
    .forEach(button => {
      button.addEventListener(
        'click',
        async () => {
          try {
            await navigator.clipboard.writeText(
              button.dataset.url
            );

            button.textContent =
              'Copied!';

            setTimeout(() => {
              button.textContent =
                'Copy URL';
            }, 1200);

          } catch (error) {
            alert(
              'Failed to copy URL.'
            );
          }
        }
      );
    });
}

// Format moderation status
function formatModeration(status) {
  const normalized =
    String(status || '')
      .toLowerCase();

  if (normalized === 'approved') {
    return 'Approved';
  }

  if (normalized === 'pending') {
    return 'Pending Review';
  }

  if (normalized === 'rejected') {
    return 'Rejected';
  }

  if (normalized === 'unavailable') {
    return 'AI Add-on Unavailable';
  }

  return status || 'Unknown';
}

// Format date
function formatDate(value) {
  if (!value) {
    return 'Unknown';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Unknown';
  }

  return date.toLocaleString();
}

// Start loading campaign
loadCampaignDetails();
