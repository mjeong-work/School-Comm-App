function getPostSegments(text = '') {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  const lines = normalized.split('\n').map((line) => line.trim()).filter(Boolean);
  if (!lines.length) {
    return { title: 'Community update', body: '' };
  }
  const [firstLine, ...rest] = lines;
  return {
    title: firstLine.length > 110 ? `${firstLine.slice(0, 107)}…` : firstLine,
    body: rest.join('\n'),
  };
}

function createIcon(name) {
  const icons = {
    calendar: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    heart: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c-1.5 3-7 7-7 7s-5.5-4-7-7a4 4 0 0 1 6-5 4 4 0 0 1 6 5"></path></svg>',
    heartFilled: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-5.5-4-7-7a4 4 0 0 1 6-5 4 4 0 0 1 6 5c-1.5 3-7 7-7 7"></path></svg>',
    comment: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>',
    send: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
  };
  return icons[name] || '';
}

export function createPostCard({ post, context, readOnly = false, currentUser }) {
  const { utils, postService } = context;
  const card = document.createElement('article');
  card.className = 'post-card';

  const segments = getPostSegments(post.text);

  const header = document.createElement('div');
  header.className = 'post-card__header';

  const headerContent = document.createElement('div');
  const title = document.createElement('h3');
  title.className = 'post-card__title';
  title.textContent = segments.title || 'Community update';
  headerContent.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'post-card__meta';
  const timeStamp = document.createElement('span');
  timeStamp.innerHTML = `${createIcon('calendar')}<span>${utils.formatRelativeTime(post.createdAt)}</span>`;
  meta.appendChild(timeStamp);

  const author = document.createElement('span');
  author.textContent = 'Anonymous Student';
  meta.appendChild(author);

  headerContent.appendChild(meta);
  header.appendChild(headerContent);

  card.appendChild(header);

  if (segments.body) {
    const body = document.createElement('p');
    body.className = 'post-card__body';
    body.textContent = segments.body;
    card.appendChild(body);
  } else {
    const body = document.createElement('p');
    body.className = 'post-card__body';
    body.textContent = segments.title;
    card.appendChild(body);
  }

  if (post.image) {
    const media = document.createElement('div');
    media.className = 'post-card__media';
    const image = document.createElement('img');
    image.src = post.image;
    image.alt = 'Post attachment';
    media.appendChild(image);
    card.appendChild(media);
  }

  const footer = document.createElement('div');
  footer.className = 'post-card__footer';

  const likeButton = document.createElement('button');
  likeButton.type = 'button';
  likeButton.className = 'icon-action';
  likeButton.setAttribute('aria-label', 'Like post');

  const commentToggle = document.createElement('button');
  commentToggle.type = 'button';
  commentToggle.className = 'icon-action';
  commentToggle.setAttribute('aria-expanded', 'false');
  const updateCommentToggle = () => {
    commentToggle.innerHTML = `${createIcon('comment')}<span>${post.comments.length}</span>`;
  };
  updateCommentToggle();

  if (!currentUser || readOnly) {
    likeButton.disabled = true;
    if (!currentUser) {
      likeButton.title = 'Sign in to like posts';
      commentToggle.title = 'Sign in to view and add comments';
    } else {
      likeButton.title = 'Pending users cannot like posts yet.';
      commentToggle.title = 'Pending users cannot comment yet.';
    }
  }

  const commentSection = document.createElement('div');
  commentSection.className = 'post-card__comments';
  commentSection.hidden = true;

  const commentList = document.createElement('div');
  commentList.className = 'post-card__comment-list';

  function renderComments() {
    commentList.innerHTML = '';
    const comments = (post.comments || [])
      .slice()
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (!comments.length) {
      const empty = document.createElement('p');
      empty.className = 'post-card__comment';
      empty.textContent = 'No comments yet. Be the first to respond!';
      commentList.appendChild(empty);
      updateCommentToggle();
      return;
    }
    comments.forEach((comment) => {
      const item = document.createElement('div');
      item.className = 'post-card__comment';
      const commentHeader = document.createElement('header');
      commentHeader.innerHTML = `<span>Student</span><span>${utils.formatRelativeTime(comment.createdAt)}</span>`;
      const commentBody = document.createElement('p');
      commentBody.textContent = comment.text;
      item.append(commentHeader, commentBody);
      commentList.appendChild(item);
    });
    updateCommentToggle();
  }

  renderComments();

  const commentForm = document.createElement('form');
  commentForm.className = 'post-card__comment-form';
  commentForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!currentUser || readOnly) return;
    const value = commentInput.value.trim();
    if (!value) return;
    try {
      postService.addComment(post.id, currentUser.id, value);
      commentInput.value = '';
      renderComments();
    } catch (error) {
      alert(error.message);
    }
  });

  const commentInput = document.createElement('textarea');
  commentInput.name = 'comment';
  commentInput.placeholder = 'Add a comment for the community';
  if (!currentUser || readOnly) {
    commentInput.disabled = true;
    commentInput.placeholder = readOnly ? 'Pending users cannot comment yet.' : 'Sign in to join the conversation.';
  }

  const submitComment = document.createElement('button');
  submitComment.type = 'submit';
  submitComment.className = 'button--primary';
  submitComment.innerHTML = `${createIcon('send')}<span>Share</span>`;
  if (!currentUser || readOnly) {
    submitComment.disabled = true;
  }

  commentForm.append(commentInput, submitComment);

  commentSection.append(commentList, commentForm);

  function updateLikeState() {
    const likeCount = post.likes?.length || 0;
    likeButton.innerHTML = `${likeCount ? createIcon('heartFilled') : createIcon('heart')}<span>${likeCount}</span>`;
    const hasLiked = currentUser ? post.likes.includes(currentUser.id) : false;
    likeButton.classList.toggle('is-active', hasLiked);
    likeButton.setAttribute('aria-pressed', String(hasLiked));
  }

  updateLikeState();

  likeButton.addEventListener('click', () => {
    if (!currentUser || readOnly) return;
    postService.toggleLike(post.id, currentUser.id);
    updateLikeState();
  });

  commentToggle.addEventListener('click', () => {
    const isHidden = commentSection.hidden;
    commentSection.hidden = !isHidden;
    commentToggle.setAttribute('aria-expanded', String(isHidden));
  });

  footer.append(likeButton, commentToggle);
  card.append(footer, commentSection);

  return card;
}
