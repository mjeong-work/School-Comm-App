import { createPostCard } from '../components/postCard.js';

const BOARDS = [
  { id: 'current-students', label: 'Current Students' },
  { id: 'alumni', label: 'Alumni' },
  { id: 'all-school', label: 'All School' },
];

const SORT_OPTIONS = [
  { id: 'latest', label: 'Sort by: Latest' },
  { id: 'popular', label: 'Sort by: Most loved' },
];

function createSearchIcon() {
  return '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><line x1="20" y1="20" x2="16.65" y2="16.65"></line></svg>';
}

export function createFeedPage(context) {
  const { authService, postService, utils, config, viewState } = context;
  let searchTerm = viewState.feedSearch || '';
  let boardFilter = viewState.feedBoard || BOARDS[0].id;
  let sortOrder = viewState.feedSort || SORT_OPTIONS[0].id;

  function render(target) {
    const user = authService.getCurrentUser();
    const status = authService.requireApprovedUser(config);
    const readOnly = status.readOnly || !user?.approved;

    const page = document.createElement('section');
    page.className = 'feed-page';

    const container = document.createElement('div');
    container.className = 'container';
    page.appendChild(container);

    const intro = document.createElement('div');
    intro.className = 'page-intro';

    const eyebrow = document.createElement('p');
    eyebrow.className = 'page-intro__eyebrow';
    eyebrow.textContent = 'Community Boards';

    const heading = document.createElement('h1');
    heading.textContent = 'Share updates with your campus';

    const description = document.createElement('p');
    description.textContent = 'Verified members can post, celebrate wins, and coordinate with fellow students.';

    intro.append(eyebrow, heading, description);
    container.appendChild(intro);

    const tabs = document.createElement('div');
    tabs.className = 'feed-tabs';
    BOARDS.forEach((board) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'feed-tab';
      button.textContent = board.label;
      button.setAttribute('aria-pressed', String(boardFilter === board.id));
      button.addEventListener('click', () => {
        boardFilter = board.id;
        viewState.feedBoard = boardFilter;
        tabs.querySelectorAll('button').forEach((el) => el.setAttribute('aria-pressed', 'false'));
        button.setAttribute('aria-pressed', 'true');
        refreshPosts();
      });
      tabs.appendChild(button);
    });
    container.appendChild(tabs);

    const controls = document.createElement('div');
    controls.className = 'feed-controls';

    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'feed-search';
    const icon = document.createElement('span');
    icon.className = 'feed-search__icon';
    icon.innerHTML = createSearchIcon();
    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Search announcements, keywords, or tags';
    searchInput.value = searchTerm;
    searchInput.addEventListener('input', (event) => {
      searchTerm = event.target.value;
      viewState.feedSearch = searchTerm;
      refreshPosts();
    });
    searchWrapper.append(icon, searchInput);
    controls.appendChild(searchWrapper);

    const sortWrapper = document.createElement('div');
    sortWrapper.className = 'feed-select';
    const sortSelect = document.createElement('select');
    SORT_OPTIONS.forEach((option) => {
      const opt = document.createElement('option');
      opt.value = option.id;
      opt.textContent = option.label;
      if (option.id === sortOrder) {
        opt.selected = true;
      }
      sortSelect.appendChild(opt);
    });
    sortSelect.addEventListener('change', (event) => {
      sortOrder = event.target.value;
      viewState.feedSort = sortOrder;
      refreshPosts();
    });
    sortWrapper.appendChild(sortSelect);
    controls.appendChild(sortWrapper);

    container.appendChild(controls);

    if (readOnly && user && !user.approved) {
      const info = document.createElement('div');
      info.className = 'alert-banner alert-banner--info';
      info.textContent = 'Your access is pending approval. You can browse and search posts until a moderator confirms your account.';
      container.appendChild(info);
    }

    const composer = document.createElement('form');
    composer.className = 'card feed-composer';
    composer.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!user || readOnly) return;
      const text = messageInput.value.trim();
      if (!text) {
        composerError.textContent = 'Please add a note before posting to the board.';
        composerError.hidden = false;
        return;
      }
      try {
        const postImage = composer.dataset.imageData || null;
        postService.createPost({ text, imageDataUrl: postImage, authorId: user.id });
        messageInput.value = '';
        imageInput.value = '';
        composer.dataset.imageData = '';
        imagePreview.innerHTML = '';
        imagePreview.classList.remove('is-visible');
        composerError.hidden = true;
      } catch (error) {
        composerError.textContent = error.message;
        composerError.hidden = false;
      }
    });

    const composerHeader = document.createElement('div');
    composerHeader.className = 'feed-composer__header';
    const composerTitle = document.createElement('h2');
    composerTitle.textContent = 'Create a post';
    const composerSubtitle = document.createElement('p');
    composerSubtitle.className = 'form-hint';
    composerSubtitle.textContent = 'Celebrate wins, share reminders, or ask for help. Images are optional but encouraged!';
    composerHeader.append(composerTitle, composerSubtitle);
    composer.appendChild(composerHeader);

    const messageLabel = document.createElement('label');
    messageLabel.setAttribute('for', 'new-post-message');
    messageLabel.textContent = 'Post content';
    composer.appendChild(messageLabel);

    const messageInput = document.createElement('textarea');
    messageInput.id = 'new-post-message';
    messageInput.placeholder = 'What would you like to share with the community?';
    if (!user || readOnly) {
      messageInput.disabled = true;
      messageInput.placeholder = readOnly
        ? 'Moderators will enable posting once your account is approved.'
        : 'Sign in to start contributing.';
    }
    composer.appendChild(messageInput);

    const imageLabel = document.createElement('label');
    imageLabel.setAttribute('for', 'new-post-image');
    imageLabel.textContent = 'Upload image (optional)';
    composer.appendChild(imageLabel);

    const imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.id = 'new-post-image';
    imageInput.accept = 'image/*';
    if (!user || readOnly) {
      imageInput.disabled = true;
    }

    imageInput.addEventListener('change', async () => {
      composerError.hidden = true;
      const file = imageInput.files?.[0];
      if (!file) {
        composer.dataset.imageData = '';
        imagePreview.innerHTML = '';
        imagePreview.classList.remove('is-visible');
        return;
      }
      try {
        const processed = await utils.processImageFile(file, config.IMAGE_MAX_MB);
        composer.dataset.imageData = processed;
        imagePreview.innerHTML = '';
        const img = document.createElement('img');
        img.src = processed;
        img.alt = 'Preview of uploaded image';
        imagePreview.appendChild(img);
        imagePreview.classList.add('is-visible');
      } catch (error) {
        composerError.textContent = error.message;
        composerError.hidden = false;
        imageInput.value = '';
        imagePreview.innerHTML = '';
        imagePreview.classList.remove('is-visible');
      }
    });
    composer.appendChild(imageInput);

    const imagePreview = document.createElement('div');
    imagePreview.className = 'feed-composer__preview';
    composer.appendChild(imagePreview);

    const composerError = document.createElement('p');
    composerError.className = 'form-error';
    composerError.hidden = true;
    composer.appendChild(composerError);

    const composerActions = document.createElement('div');
    composerActions.className = 'feed-composer__actions';

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'button--primary';
    submitBtn.textContent = 'Post to board';
    if (!user || readOnly) {
      submitBtn.disabled = true;
    }
    composerActions.appendChild(submitBtn);
    composer.appendChild(composerActions);

    container.appendChild(composer);

    const postsWrapper = document.createElement('div');
    postsWrapper.className = 'feed-posts';
    container.appendChild(postsWrapper);

    function refreshPosts() {
      postsWrapper.innerHTML = '';
      const posts = postService.list({ search: searchTerm });
      let displayPosts = posts;
      if (sortOrder === 'popular') {
        displayPosts = [...posts].sort((a, b) => {
          const likeDiff = (b.likes?.length || 0) - (a.likes?.length || 0);
          if (likeDiff !== 0) return likeDiff;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      }
      if (!displayPosts.length) {
        const empty = document.createElement('div');
        empty.className = 'card';
        empty.textContent = searchTerm
          ? 'No posts match your filters yet. Try a different keyword or board.'
          : 'No posts yet. Kick things off with your first announcement!';
        postsWrapper.appendChild(empty);
        return;
      }
      displayPosts.forEach((post) => {
        const card = createPostCard({
          post,
          context,
          currentUser: user,
          readOnly: !user || readOnly,
        });
        postsWrapper.appendChild(card);
      });
    }

    refreshPosts();

    target.appendChild(page);
  }

  return {
    render,
  };
}
