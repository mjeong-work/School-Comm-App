import { createPostCard } from '../components/postCard.js';

const TAB_OPTIONS = [
  { key: 'current', label: 'Current Students' },
  { key: 'alumni', label: 'Alumni' },
  { key: 'all', label: 'All School' },
];

const SORT_OPTIONS = [
  { key: 'latest', label: 'Latest' },
  { key: 'likes', label: 'Most liked' },
];

function createIcon(name, className = '') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.className = ['icon', className].filter(Boolean).join(' ');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#icon-${name}`);
  use.setAttribute('href', `#icon-${name}`);
  svg.appendChild(use);
  return svg;
}

const RECOGNIZED_TAGS = new Set(['current', 'alumni', 'all']);

function uniqueId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createFeedPage(context) {
  const { authService, postService, utils, config, viewState } = context;
  let searchTerm = viewState.feedSearch || '';
  let activeTab = viewState.feedTab || 'current';
  let sortOrder = viewState.feedSort || 'latest';
  let composerOpen = viewState.feedComposerOpen || false;
  let searchTimeout;

  function render(target) {
    const user = authService.getCurrentUser();
    const status = authService.requireApprovedUser(config);
    const readOnly = status.readOnly || !user?.approved;
    const effectiveReadOnly = !user || readOnly;

    if (effectiveReadOnly) {
      composerOpen = false;
      viewState.feedComposerOpen = false;
    }

    const page = document.createElement('section');
    page.className = 'feed-page';

    const container = document.createElement('div');
    container.className = 'feed-page__inner container';
    page.appendChild(container);

    const header = document.createElement('header');
    header.className = 'feed-page__header';

    const verifiedMeta = document.createElement('div');
    verifiedMeta.className = 'feed-page__verified';
    const verifiedIcon = createIcon('shield-check', 'feed-page__verified-icon');
    const verifiedLabel = document.createElement('span');
    verifiedLabel.textContent = 'Verified members only';
    verifiedMeta.append(verifiedIcon, verifiedLabel);
    header.appendChild(verifiedMeta);

    const title = document.createElement('h1');
    title.className = 'feed-page__title';
    title.textContent = 'COMMUNITY BOARDS';
    header.appendChild(title);

    const tabsRow = document.createElement('div');
    tabsRow.className = 'feed-tabs-row';

    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'feed-tabs';
    const tabList = document.createElement('div');
    tabList.className = 'feed-tabs__list';
    tabList.setAttribute('role', 'tablist');

    const tabButtons = new Map();

    TAB_OPTIONS.forEach((option) => {
      const tabButton = document.createElement('button');
      tabButton.type = 'button';
      tabButton.className = 'feed-tabs__button';
      tabButton.textContent = option.label;
      tabButton.dataset.tabKey = option.key;
      tabButton.setAttribute('role', 'tab');
      tabButton.addEventListener('click', () => {
        setActiveTab(option.key);
      });
      tabButton.addEventListener('keydown', (event) => {
        handleTabKeydown(event, option.key);
      });
      tabList.appendChild(tabButton);
      tabButtons.set(option.key, tabButton);
    });

    tabsContainer.appendChild(tabList);
    tabsRow.appendChild(tabsContainer);

    const postButton = document.createElement('button');
    postButton.type = 'button';
    postButton.className = 'feed-tabs__action feed-primary-button';
    postButton.setAttribute('aria-label', 'Create Post');
    postButton.setAttribute('aria-expanded', 'false');
    const postIcon = createIcon('plus', 'feed-tabs__action-icon');
    const postText = document.createElement('span');
    postText.className = 'feed-tabs__action-label';
    postText.textContent = '+ Post';
    postButton.append(postIcon, postText);
    if (effectiveReadOnly) {
      postButton.disabled = true;
      postButton.title = user
        ? 'Pending users cannot create posts yet.'
        : 'Sign in to create a post.';
    }
    tabsRow.appendChild(postButton);

    header.appendChild(tabsRow);
    container.appendChild(header);

    if (readOnly && user && !user.approved) {
      const pendingNotice = document.createElement('div');
      pendingNotice.className = 'feed-notice';
      pendingNotice.textContent =
        'Your account is pending approval. You can view posts but cannot create, like, or comment yet.';
      container.appendChild(pendingNotice);
    }

    const filters = document.createElement('div');
    filters.className = 'feed-filters';

    const searchInputId = uniqueId('feed-search');
    const searchGroup = document.createElement('div');
    searchGroup.className = 'feed-search';

    const searchLabel = document.createElement('label');
    searchLabel.className = 'sr-only';
    searchLabel.setAttribute('for', searchInputId);
    searchLabel.textContent = 'Search posts';
    searchGroup.appendChild(searchLabel);

    const searchIcon = createIcon('search', 'feed-search__icon');
    searchGroup.appendChild(searchIcon);

    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.id = searchInputId;
    searchInput.className = 'feed-search__input';
    searchInput.placeholder = 'Search posts';
    searchInput.value = searchTerm;
    searchInput.addEventListener('input', (event) => {
      const value = event.target.value;
      window.clearTimeout(searchTimeout);
      // Debounce search so the list does not re-render on every keystroke.
      searchTimeout = window.setTimeout(() => {
        searchTerm = value;
        viewState.feedSearch = searchTerm;
        refreshPosts();
      }, 200);
    });
    searchGroup.appendChild(searchInput);
    filters.appendChild(searchGroup);

    const sortSelectId = uniqueId('feed-sort');
    const sortGroup = document.createElement('div');
    sortGroup.className = 'feed-sort';

    const sortLabel = document.createElement('label');
    sortLabel.className = 'feed-sort__label';
    sortLabel.setAttribute('for', sortSelectId);
    sortLabel.textContent = 'Sort by';
    sortGroup.appendChild(sortLabel);

    const sortSelect = document.createElement('select');
    sortSelect.id = sortSelectId;
    sortSelect.className = 'feed-sort__select';
    sortSelect.setAttribute('aria-label', 'Sort posts');
    SORT_OPTIONS.forEach((option) => {
      const opt = document.createElement('option');
      opt.value = option.key;
      opt.textContent = option.label;
      sortSelect.appendChild(opt);
    });
    sortSelect.value = sortOrder;
    sortSelect.addEventListener('change', (event) => {
      sortOrder = event.target.value;
      viewState.feedSort = sortOrder;
      refreshPosts();
    });
    sortGroup.appendChild(sortSelect);
    filters.appendChild(sortGroup);

    container.appendChild(filters);

    let composerControls = null;

    function setComposerOpen(nextOpen) {
      composerOpen = nextOpen && !effectiveReadOnly;
      viewState.feedComposerOpen = composerOpen;
      if (!composerControls) return;
      const { element } = composerControls;
      element.hidden = !composerOpen;
      element.classList.toggle('is-visible', composerOpen);
      element.setAttribute('aria-hidden', String(!composerOpen));
      postButton.setAttribute('aria-expanded', String(composerOpen));
      if (composerOpen) {
        window.requestAnimationFrame(() => {
          composerControls.focusField();
        });
      }
    }

    function buildComposer() {
      const form = document.createElement('form');
      form.className = 'feed-composer';
      form.hidden = true;
      form.dataset.imageData = '';
      form.setAttribute('aria-hidden', 'true');

      const messageId = uniqueId('feed-message');
      const messageLabel = document.createElement('label');
      messageLabel.className = 'feed-composer__label';
      messageLabel.setAttribute('for', messageId);
      messageLabel.textContent = 'Share an update';
      form.appendChild(messageLabel);

      const messageInput = document.createElement('textarea');
      messageInput.id = messageId;
      messageInput.className = 'feed-composer__input';
      messageInput.placeholder = 'Celebrate wins, ask questions, or share reminders...';
      if (effectiveReadOnly) {
        messageInput.disabled = true;
        messageInput.placeholder = user
          ? 'Pending users cannot create posts yet.'
          : 'Sign in to share an update.';
      }
      form.appendChild(messageInput);

      const attachments = document.createElement('div');
      attachments.className = 'feed-composer__attachments';

      const imageId = uniqueId('feed-image');
      const imageLabel = document.createElement('label');
      imageLabel.className = 'feed-composer__image-label';
      imageLabel.setAttribute('for', imageId);
      imageLabel.textContent = 'Add an image';
      attachments.appendChild(imageLabel);

      const imageInput = document.createElement('input');
      imageInput.type = 'file';
      imageInput.id = imageId;
      imageInput.accept = 'image/*';
      imageInput.className = 'feed-composer__image-input';
      if (effectiveReadOnly) {
        imageInput.disabled = true;
      }

      const imagePreview = document.createElement('div');
      imagePreview.className = 'feed-composer__preview';

      const composerError = document.createElement('p');
      composerError.className = 'feed-composer__error';
      composerError.hidden = true;

      imageInput.addEventListener('change', async () => {
        const file = imageInput.files?.[0];
        if (!file) {
          form.dataset.imageData = '';
          imagePreview.innerHTML = '';
          return;
        }
        try {
          const processed = await utils.processImageFile(file, config.IMAGE_MAX_MB);
          form.dataset.imageData = processed;
          imagePreview.innerHTML = '';
          const previewImage = document.createElement('img');
          previewImage.src = processed;
          previewImage.alt = 'Preview of uploaded image';
          imagePreview.appendChild(previewImage);
          composerError.hidden = true;
        } catch (error) {
          composerError.textContent = error.message;
          composerError.hidden = false;
          imageInput.value = '';
          form.dataset.imageData = '';
          imagePreview.innerHTML = '';
        }
      });

      attachments.appendChild(imageInput);
      form.appendChild(attachments);
      form.appendChild(imagePreview);
      form.appendChild(composerError);

      const actions = document.createElement('div');
      actions.className = 'feed-composer__actions';

      const cancelButton = document.createElement('button');
      cancelButton.type = 'button';
      cancelButton.className = 'feed-composer__cancel';
      cancelButton.textContent = 'Cancel';
      actions.appendChild(cancelButton);

      const submitButton = document.createElement('button');
      submitButton.type = 'submit';
      submitButton.className = 'feed-primary-button';
      submitButton.textContent = 'Post';
      if (effectiveReadOnly) {
        submitButton.disabled = true;
      }
      actions.appendChild(submitButton);
      form.appendChild(actions);

      let controls = null;

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (effectiveReadOnly) {
          return;
        }
        const value = messageInput.value.trim();
        if (!value) {
          composerError.textContent = 'Please enter a message before posting.';
          composerError.hidden = false;
          messageInput.focus();
          return;
        }
        try {
          postService.createPost({
            text: value,
            imageDataUrl: form.dataset.imageData || null,
            authorId: user.id,
          });
          composerError.hidden = true;
          controls.reset();
          setComposerOpen(false);
        } catch (error) {
          composerError.textContent = error.message;
          composerError.hidden = false;
        }
      });

      controls = {
        element: form,
        focusField() {
          if (!effectiveReadOnly) {
            messageInput.focus();
          }
        },
        reset() {
          messageInput.value = '';
          form.dataset.imageData = '';
          imageInput.value = '';
          imagePreview.innerHTML = '';
        },
        cancelButton,
      };

      return controls;
    }

    composerControls = buildComposer();
    container.appendChild(composerControls.element);
    composerControls.cancelButton.addEventListener('click', () => {
      setComposerOpen(false);
    });

    postButton.addEventListener('click', () => {
      if (postButton.disabled) return;
      // Toggle the composer visibility via the primary action.
      setComposerOpen(!composerOpen);
    });

    setComposerOpen(composerOpen);

    const postsWrapper = document.createElement('div');
    postsWrapper.className = 'feed-posts';
    container.appendChild(postsWrapper);

    function setActiveTab(nextTab) {
      if (activeTab === nextTab) return;
      activeTab = nextTab;
      viewState.feedTab = activeTab;
      updateTabStates();
      refreshPosts();
    }

    function updateTabStates() {
      tabButtons.forEach((button, key) => {
        const isActive = key === activeTab;
        button.setAttribute('aria-selected', String(isActive));
        button.tabIndex = isActive ? 0 : -1;
        button.classList.toggle('is-active', isActive);
      });
    }

    function handleTabKeydown(event, key) {
      const keys = TAB_OPTIONS.map((option) => option.key);
      const currentIndex = keys.indexOf(key);
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const delta = event.key === 'ArrowRight' ? 1 : -1;
        const nextIndex = (currentIndex + delta + keys.length) % keys.length;
        const nextKey = keys[nextIndex];
        const nextButton = tabButtons.get(nextKey);
        if (nextButton) {
          nextButton.focus();
          setActiveTab(nextKey);
        }
      }
    }

    function getFilteredPosts() {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const posts = postService.list({ limit: 0 });
      return posts
        .filter((post) => {
          const tags = (post.tags || []).map((tag) => String(tag).toLowerCase());
          const recognized = tags.filter((tag) => RECOGNIZED_TAGS.has(tag));
          if (activeTab === 'all') {
            return true;
          }
          if (!recognized.length) {
            return activeTab === 'current';
          }
          if (recognized.includes('all')) {
            return true;
          }
          return recognized.includes(activeTab);
        })
        .filter((post) => {
          if (!normalizedSearch) return true;
          const title = (post.title || '').toLowerCase();
          const text = (post.text || '').toLowerCase();
          return title.includes(normalizedSearch) || text.includes(normalizedSearch);
        })
        .sort((a, b) => {
          if (sortOrder === 'likes') {
            const likeDiff = (b.likes?.length || 0) - (a.likes?.length || 0);
            if (likeDiff !== 0) return likeDiff;
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }

    function createEmptyState() {
      const empty = document.createElement('div');
      empty.className = 'feed-empty';
      const icon = createIcon('chat-bubble', 'feed-empty__icon');
      empty.appendChild(icon);
      const text = document.createElement('p');
      text.textContent = 'No posts yet. Be the first to share!';
      empty.appendChild(text);
      return empty;
    }

    function refreshPosts() {
      postsWrapper.innerHTML = '';
      const posts = getFilteredPosts();
      if (!posts.length) {
        postsWrapper.appendChild(createEmptyState());
        return;
      }
      posts.forEach((post) => {
        const card = createPostCard({
          post,
          context,
          currentUser: user,
          readOnly: effectiveReadOnly,
        });
        postsWrapper.appendChild(card);
      });
    }

    updateTabStates();
    refreshPosts();

    target.appendChild(page);
  }

  return {
    render,
  };
}
