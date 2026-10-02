let selectedFile = null;
let currentAssets = null;
let currentTheme = 'luxury';
let currentBgRemovedApplied = false;

const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const presetSelect = document.getElementById('presetSelect');
const promptInput = document.getElementById('promptInput');
const clearPromptBtn = document.getElementById('clearPromptBtn');
const generateBtn = document.getElementById('generateBtn');

const pipelineStatus = document.getElementById('pipelineStatus');
const moderationBadge = document.getElementById('moderationBadge');
const loader = document.getElementById('loader');
const emptyState = document.getElementById('emptyState');
const resultsSection = document.getElementById('resultsSection');

const summaryCard = document.getElementById('summaryCard');
const warningsBox = document.getElementById('warningsBox');
const warningsList = document.getElementById('warningsList');
const metadataContent = document.getElementById('metadataContent');
const tagsContainer = document.getElementById('tagsContainer');
const suggestedPrompts = document.getElementById('suggestedPrompts');

const originalImg = document.getElementById('originalImg');
const bgRemovedImg = document.getElementById('bgRemovedImg');
const themeContainer = document.getElementById('themeContainer');
const viewCampaignBtn = document.getElementById('viewCampaignBtn');

const presetPromptMap = {
  beauty: 'premium skincare product photography with soft natural lighting',
  fashion: 'high-end fashion product photography with dramatic studio shadows',
  electronics: 'modern technology product ad with sleek reflective lighting',
  food: 'fresh commercial food photography with vibrant appetizing styling',
  jewelry: 'luxury jewelry commercial setup with elegant premium reflections',
  custom: ''
};

// Preview uploaded image before sending it to the backend
imageInput.addEventListener('change', (event) => {
  selectedFile = event.target.files[0];
  if (!selectedFile) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    uploadPlaceholder.classList.add('hidden');
    imagePreview.classList.remove('hidden');
    imagePreview.src = e.target.result;
  };
  reader.readAsDataURL(selectedFile);
});

// Auto-fill the prompt when a preset is selected and prompt is empty
presetSelect.addEventListener('change', () => {
  if (!promptInput.value.trim()) {
    promptInput.value = presetPromptMap[presetSelect.value] || '';
  }
});

// Clear the prompt input field
clearPromptBtn.addEventListener('click', () => {
  promptInput.value = '';
});

// Generate a new campaign
generateBtn.addEventListener('click', async () => {
  if (!selectedFile) {
    alert('Please upload an image first.');
    return;
  }

  resetUI();
  setLoading(true);

  const formData = new FormData();
  formData.append('image', selectedFile);
  formData.append('preset', presetSelect.value);
  formData.append('prompt', promptInput.value.trim());

  try {
    const response = await fetch('/api/campaigns/generate', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      updateModerationBadge(data.moderationStatus || 'error');
      alert(data.message || data.error || 'Failed to generate campaign.');
      return;
    }

    currentAssets = data.assets;
    currentTheme = 'luxury';
    currentBgRemovedApplied = !!data.bgRemovedApplied;

    renderSummaryCard(data.metadata);
    renderPipeline(data.pipeline);
    renderWarnings(data.warnings || []);
    renderMetadata(data.metadata);
    renderTags(data.metadata.autoTags || []);
    renderSuggestedPrompts(data.suggestedPrompts || []);

    updateModerationBadge(data.metadata.moderationStatus);
    originalImg.src = data.metadata.originalImage;
    bgRemovedImg.src = data.assets.bgRemoved;

    updateBgRemovedCardTitle(currentBgRemovedApplied);
    renderTheme(currentTheme);

    if (data.campaignId) {
      viewCampaignBtn.href = `/campaign/${data.campaignId}`;
    }

    resultsSection.classList.remove('hidden');
  } catch (error) {
    console.error('Generate Frontend Error:', error);
    updateModerationBadge('error');
    alert('Could not connect to the backend server.');
  } finally {
    setLoading(false);
  }
});

// Handle theme tab switching
document.querySelectorAll('.tab-btn').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    currentTheme = button.dataset.theme;
    renderTheme(currentTheme);
  });
});

// Reset UI state before generating a new campaign
function resetUI() {
  clearPipeline();
  warningsList.innerHTML = '';
  metadataContent.innerHTML = '';
  tagsContainer.innerHTML = '';
  suggestedPrompts.innerHTML = '';
  themeContainer.innerHTML = '';
  summaryCard.innerHTML = '';
  summaryCard.classList.add('hidden');
  warningsBox.classList.add('hidden');
  emptyState.classList.add('hidden');
  resultsSection.classList.add('hidden');
}

// Set loading state for the generate button and spinner
function setLoading(isLoading) {
  loader.classList.toggle('hidden', !isLoading);
  generateBtn.disabled = isLoading;
}

// Clear all pipeline step styles
function clearPipeline() {
  pipelineStatus.querySelectorAll('li').forEach((li) => li.classList.remove('done'));
}

// Render pipeline completion status
function renderPipeline(pipeline = {}) {
  Object.keys(pipeline).forEach((key) => {
    const item = pipelineStatus.querySelector(`[data-step="${key}"]`);
    if (item && pipeline[key]) {
      item.classList.add('done');
    }
  });
}

// Render campaign summary card
function renderSummaryCard(metadata) {
  summaryCard.innerHTML = `
    <h3>Campaign Summary</h3>
    <p><strong>Public ID:</strong> ${metadata.publicId}</p>
    <p><strong>Preset:</strong> ${metadata.preset}</p>
    <p><strong>Moderation:</strong> ${formatModerationLabel(metadata.moderationStatus)}</p>
    <p><strong>Processing Mode:</strong> ${metadata.processingMode || 'Unknown'}</p>
    <p><strong>Variants:</strong> ${metadata.totalVariants}</p>
    <p><strong>Created:</strong> ${new Date(metadata.createdAt).toLocaleString()}</p>
  `;
  summaryCard.classList.remove('hidden');
}

// Render warnings shown by the backend
function renderWarnings(warnings) {
  if (!warnings.length) {
    warningsBox.classList.add('hidden');
    return;
  }

  warnings.forEach((warning) => {
    const li = document.createElement('li');
    li.textContent = warning;
    warningsList.appendChild(li);
  });

  warningsBox.classList.remove('hidden');
}

// Render metadata details
function renderMetadata(metadata) {
  metadataContent.innerHTML = `
    <p><strong>Public ID:</strong> ${metadata.publicId}</p>
    <p><strong>Preset:</strong> ${metadata.preset}</p>
    <p><strong>Prompt:</strong> ${metadata.promptUsed}</p>
    <p><strong>Format:</strong> ${metadata.format}</p>
    <p><strong>Dimensions:</strong> ${metadata.width || '-'} x ${metadata.height || '-'}</p>
    <p><strong>Created:</strong> ${new Date(metadata.createdAt).toLocaleString()}</p>
    <p><strong>Total Variants:</strong> ${metadata.totalVariants}</p>
    <p><strong>Processing Mode:</strong> ${metadata.processingMode || 'Unknown'}</p>
  `;
}

// Render auto-generated tags
function renderTags(tags) {
  tagsContainer.innerHTML = '';

  if (!tags.length) {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = 'No auto tags returned';
    tagsContainer.appendChild(span);
    return;
  }

  tags.forEach((tag) => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = tag;
    tagsContainer.appendChild(span);
  });
}

// Render suggested prompt chips
function renderSuggestedPrompts(prompts) {
  suggestedPrompts.innerHTML = '';

  prompts.forEach((prompt) => {
    const button = document.createElement('button');
    button.className = 'suggestion-chip';
    button.textContent = prompt;
    button.addEventListener('click', () => {
      promptInput.value = prompt;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    suggestedPrompts.appendChild(button);
  });
}

// Update moderation badge style and text
function updateModerationBadge(status) {
  moderationBadge.textContent = formatModerationLabel(status);
  moderationBadge.className = 'status-badge';

  if (status === 'approved') moderationBadge.classList.add('approved');
  else if (status === 'pending') moderationBadge.classList.add('pending');
  else if (status === 'rejected') moderationBadge.classList.add('rejected');
  else if (status === 'error') moderationBadge.classList.add('error');
  else moderationBadge.classList.add('neutral');
}

// Convert raw moderation codes into human-friendly labels
function formatModerationLabel(status) {
  if (status === 'approved') return 'Approved';
  if (status === 'pending') return 'Pending Review';
  if (status === 'rejected') return 'Rejected';
  if (status === 'unavailable') return 'AI Add-on Unavailable';
  if (status === 'error') return 'Error';
  return status || 'Unknown';
}

// Update the background removal card title based on actual processing state
function updateBgRemovedCardTitle(applied) {
  const titles = document.querySelectorAll('.card h3');

  titles.forEach((title) => {
    if (
      title.textContent === 'Background Removed' ||
      title.textContent === 'Original Image Fallback'
    ) {
      title.textContent = applied ? 'Background Removed' : 'Original Image Fallback';
    }
  });
}

// Render one theme pack at a time
function renderTheme(themeName) {
  if (!currentAssets || !currentAssets[themeName]) return;

  const themeAssets = currentAssets[themeName];

  themeContainer.innerHTML = `
    <div class="theme-block">
      <h3 class="theme-title">${capitalize(themeName)} Campaign Pack</h3>
      <div class="variant-grid">
        ${createVariantCard('Square (1:1)', themeAssets.square)}
        ${createVariantCard('Story (9:16)', themeAssets.story)}
        ${createVariantCard('Banner (16:9)', themeAssets.banner)}
      </div>
    </div>
  `;

  bindCopyButtons();
}

// Create one asset preview card
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

// Bind copy-to-clipboard buttons after render
function bindCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.url);
        btn.textContent = 'Copied!';
        setTimeout(() => {
          btn.textContent = 'Copy URL';
        }, 1200);
      } catch (error) {
        alert('Failed to copy URL.');
      }
    });
  });
}

// Capitalize utility
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
