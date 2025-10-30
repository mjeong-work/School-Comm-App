import { createPostCard } from '../components/postCard.js';

export function createFeedPage(context) {
  const { authService, postService, utils, config, viewState } = context;
  let searchTerm = viewState.feedSearch || '';

  function render(target) {
    const user = authService.getCurrentUser();
    const status = authService.requireApprovedUser(config);
    const readOnly = status.readOnly || !user?.approved;

    const container = document.createElement('section');
    container.className = 'container feed-page';

    const header = document.createElement('div');
    header.className = 'feed-header';

    const title = document.createElement('h2');
    title.textContent = 'Community Feed';
    header.appendChild(title);

    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Search posts and tags';
    searchInput.value = searchTerm;
    searchInput.addEventListener('input', (event) => {
      searchTerm = event.target.value;
      viewState.feedSearch = searchTerm;
      refreshPosts();
    });
    header.appendChild(searchInput);

    container.appendChild(header);

    if (readOnly && user && !user.approved) {
      const info = document.createElement('div');
      info.className = 'alert';
      info.textContent = 'Your account is pending approval. You can view posts but cannot create, like, or comment yet.';
      container.appendChild(info);
    }

    const composer = document.createElement('form');
    composer.className = 'panel feed-composer';
    composer.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!user || readOnly) return;
      const text = messageInput.value.trim();
      if (!text) {
        composerError.textContent = 'Please enter a message before posting.';
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
        composerError.hidden = true;
      } catch (error) {
        composerError.textContent = error.message;
        composerError.hidden = false;
      }
    });

    const messageLabel = document.createElement('label');
    messageLabel.setAttribute('for', 'new-post-message');
    messageLabel.textContent = 'Share an update';
    composer.appendChild(messageLabel);

    const messageInput = document.createElement('textarea');
    messageInput.id = 'new-post-message';
    messageInput.placeholder = 'Celebrate wins, ask questions, or share reminders...';
    if (!user || readOnly) {
      messageInput.disabled = true;
      messageInput.placeholder = readOnly ? 'Pending users cannot create posts yet.' : 'Sign in to share an update.';
    }
    composer.appendChild(messageInput);

    const imageLabel = document.createElement('label');
    imageLabel.setAttribute('for', 'new-post-image');
    imageLabel.textContent = 'Optional image';
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
      } catch (error) {
        composerError.textContent = error.message;
        composerError.hidden = false;
        imageInput.value = '';
        imagePreview.innerHTML = '';
      }
    });
    composer.appendChild(imageInput);

    const imagePreview = document.createElement('div');
    imagePreview.className = 'image-preview';
    composer.appendChild(imagePreview);

    const composerError = document.createElement('p');
    composerError.className = 'alert';
    composerError.hidden = true;
    composer.appendChild(composerError);

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Post update';
    if (!user || readOnly) {
      submitBtn.disabled = true;
    }
    composer.appendChild(submitBtn);

    container.appendChild(composer);

    const postsWrapper = document.createElement('div');
    postsWrapper.className = 'feed-posts';
    container.appendChild(postsWrapper);

    function refreshPosts() {
      postsWrapper.innerHTML = '';
      const posts = postService.list({ search: searchTerm });
      if (!posts.length) {
        const empty = document.createElement('p');
        empty.textContent = searchTerm ? 'No posts match your search yet.' : 'No posts yet. Start the conversation!';
        postsWrapper.appendChild(empty);
        return;
      }
      posts.forEach((post) => {
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

    target.appendChild(container);
  }

  return {
    render,
  };
}
