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

function updateIconHref(svg, name) {
  const use = svg.querySelector('use');
  if (use) {
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#icon-${name}`);
    use.setAttribute('href', `#icon-${name}`);
  }
}

function formatShortDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
}

function toPlainText(value) {
  const temp = document.createElement('div');
  temp.innerHTML = value ?? '';
  return temp.textContent || '';
}

function deriveTitle(post) {
  if (post.title && post.title.trim()) {
    return toPlainText(post.title).trim();
  }
  const text = toPlainText(post.text || '').trim();
  if (!text) {
    return 'Community Update';
  }
  const firstLine = text.split('
')[0] || text;
  if (firstLine.length > 80) {
    return `${firstLine.slice(0, 77).trim()}…`;
  }
  return firstLine;
}

function formatBodyContent(text) {
  return (text || '').replace(/
/g, '<br />');
}

export function createPostCard({ post, context, readOnly = false, currentUser }) {
  const { utils, postService } = context;
  const card = document.createElement('article');
  card.className = 'post-card';

  const title = document.createElement('h2');
  title.className = 'post-card__title';
  title.textContent = deriveTitle(post);
  card.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'post-card__meta';

  const metaPrimary = document.createElement('div');
  metaPrimary.className = 'post-card__meta-group';
  const calendarIcon = createIcon('calendar', 'post-card__meta-icon');
  const date = document.createElement('span');
  date.className = 'post-card__date';
  date.textContent = formatShortDate(post.createdAt);
  metaPrimary.append(calendarIcon, date);
  meta.appendChild(metaPrimary);

  const metaSeparator = document.createElement('span');
  metaSeparator.className = 'post-card__meta-separator';
  metaSeparator.textContent = '•';
  meta.appendChild(metaSeparator);

  const metaStatus = document.createElement('div');
  metaStatus.className = 'post-card__meta-status';
  const verifiedIcon = createIcon('shield-check', 'post-card__meta-icon');
  const verifiedLabel = document.createElement('span');
  verifiedLabel.textContent = 'Verified';
  metaStatus.append(verifiedIcon, verifiedLabel);
  meta.appendChild(metaStatus);

  card.appendChild(meta);

  if (post.text) {
    const body = document.createElement('p');
    body.className = 'post-card__body';
    body.innerHTML = formatBodyContent(post.text);
    card.appendChild(body);
  }

  if (post.image) {
    const figure = document.createElement('figure');
    figure.className = 'post-card__image';
    const image = document.createElement('img');
    image.src = post.image;
    image.alt = 'Post attachment';
    figure.appendChild(image);
    card.appendChild(figure);
  }

  const actions = document.createElement('div');
  actions.className = 'post-card__actions';

  const primaryActions = document.createElement('div');
  primaryActions.className = 'post-card__actions-main';

  let liked = Boolean(currentUser && post.likes?.includes(currentUser.id));
  let likeCount = post.likes?.length || 0;

  const likeButton = document.createElement('button');
  likeButton.type = 'button';
  likeButton.className = 'post-card__action-btn';
  if (!currentUser || readOnly) {
    likeButton.disabled = true;
    likeButton.title = readOnly
      ? 'Pending users cannot like posts yet.'
      : 'Sign in to like posts.';
  }
  const likeIcon = createIcon(liked ? 'heart-filled' : 'heart', 'post-card__action-icon');
  const likeCountEl = document.createElement('span');
  likeCountEl.className = 'post-card__action-count';
  likeCountEl.textContent = String(likeCount);
  likeButton.append(likeIcon, likeCountEl);

  function updateLikeState(isLiked) {
    liked = isLiked;
    likeButton.setAttribute('aria-pressed', String(isLiked));
    likeButton.setAttribute('aria-label', isLiked ? 'Unlike post' : 'Like post');
    likeButton.classList.toggle('is-active', isLiked);
    updateIconHref(likeIcon, isLiked ? 'heart-filled' : 'heart');
  }

  updateLikeState(liked);

  likeButton.addEventListener('click', () => {
    if (!currentUser || readOnly) return;
    const nextState = !liked;
    likeCount = nextState ? likeCount + 1 : Math.max(0, likeCount - 1);
    likeCountEl.textContent = String(likeCount);
    updateLikeState(nextState);
    postService.toggleLike(post.id, currentUser.id);
  });

  primaryActions.appendChild(likeButton);

  const commentButton = document.createElement('button');
  commentButton.type = 'button';
  commentButton.className = 'post-card__action-btn';
  commentButton.setAttribute('aria-expanded', 'false');
  commentButton.title = 'View comments';
  commentButton.setAttribute('aria-label', 'View comments');
  const commentsId = `comments-${post.id}`;
  commentButton.setAttribute('aria-controls', commentsId);
  const commentIcon = createIcon('chat-bubble', 'post-card__action-icon');
  const commentCountEl = document.createElement('span');
  commentCountEl.className = 'post-card__action-count';
  const comments = Array.isArray(post.comments) ? [...post.comments] : [];
  commentCountEl.textContent = String(comments.length);
  commentButton.append(commentIcon, commentCountEl);
  primaryActions.appendChild(commentButton);

  actions.appendChild(primaryActions);

  const menuButton = document.createElement('button');
  menuButton.type = 'button';
  menuButton.className = 'post-card__menu';
  menuButton.setAttribute('aria-label', 'More post actions');
  menuButton.disabled = true;
  menuButton.title = 'More actions coming soon';
  menuButton.appendChild(createIcon('dots-horizontal', 'post-card__menu-icon'));
  actions.appendChild(menuButton);

  card.appendChild(actions);

  const commentsPanel = document.createElement('div');
  commentsPanel.className = 'post-comments';
  commentsPanel.id = commentsId;
  commentsPanel.setAttribute('aria-hidden', 'true');
  commentsPanel.style.maxHeight = '0px';

  const commentsInner = document.createElement('div');
  commentsInner.className = 'post-comments__inner';
  commentsPanel.appendChild(commentsInner);

  const commentsList = document.createElement('div');
  commentsList.className = 'post-comments__list';
  commentsInner.appendChild(commentsList);

  const commentForm = document.createElement('form');
  commentForm.className = 'post-comments__form';
  const commentInput = document.createElement('textarea');
  commentInput.className = 'post-comments__input';
  commentInput.placeholder = 'Share your thoughts anonymously...';
  if (!currentUser || readOnly) {
    commentInput.disabled = true;
    commentInput.placeholder = readOnly
      ? 'Pending users cannot comment yet.'
      : 'Sign in to add a comment.';
  }
  commentForm.appendChild(commentInput);

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.className = 'post-comments__submit';
  submitButton.setAttribute('aria-label', 'Send comment');
  submitButton.appendChild(createIcon('send', 'post-comments__submit-icon'));
  const submitLabel = document.createElement('span');
  submitLabel.className = 'sr-only';
  submitLabel.textContent = 'Submit comment';
  submitButton.appendChild(submitLabel);
  if (!currentUser || readOnly) {
    submitButton.disabled = true;
  }
  commentForm.appendChild(submitButton);
  commentsInner.appendChild(commentForm);

  card.appendChild(commentsPanel);

  function renderComments() {
    commentsList.innerHTML = '';
    if (!comments.length) {
      const empty = document.createElement('p');
      empty.className = 'post-comments__empty';
      empty.textContent = 'No comments yet.';
      commentsList.appendChild(empty);
    } else {
      comments
        .slice()
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .forEach((comment) => {
          const item = document.createElement('div');
          item.className = 'post-comment';
          const metaLine = document.createElement('div');
          metaLine.className = 'post-comment__meta';
          metaLine.textContent = `Student • ${utils.formatRelativeTime(comment.createdAt)}`;
          const body = document.createElement('p');
          body.className = 'post-comment__body';
          body.innerHTML = formatBodyContent(comment.text);
          item.append(metaLine, body);
          commentsList.appendChild(item);
        });
    }
  }

  renderComments();

  function updateCommentCount() {
    commentCountEl.textContent = String(comments.length);
  }

  let commentsOpen = false;

  // Animate the collapsible comment panel height for smooth transitions.
  function setCommentsOpen(nextState) {
    commentsOpen = nextState;
    commentsPanel.classList.toggle('is-open', nextState);
    commentsPanel.setAttribute('aria-hidden', String(!nextState));
    commentButton.setAttribute('aria-expanded', String(nextState));
    if (nextState) {
      const targetHeight = commentsInner.scrollHeight;
      commentsPanel.style.maxHeight = `${targetHeight}px`;
    } else {
      commentsPanel.style.maxHeight = '0px';
    }
  }

  commentButton.addEventListener('click', () => {
    const nextState = !commentsOpen;
    setCommentsOpen(nextState);
    if (nextState && currentUser && !readOnly) {
      window.requestAnimationFrame(() => {
        commentInput.focus();
      });
    }
  });

  commentForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!currentUser || readOnly) return;
    const value = commentInput.value.trim();
    if (!value) return;
    try {
      const created = postService.addComment(post.id, currentUser.id, value);
      commentInput.value = '';
      comments.push(created);
      renderComments();
      updateCommentCount();
      if (!commentsOpen) {
        setCommentsOpen(true);
      } else {
        const targetHeight = commentsInner.scrollHeight;
        commentsPanel.style.maxHeight = `${targetHeight}px`;
      }
    } catch (error) {
      window.alert(error.message);
    }
  });

  return card;
}
