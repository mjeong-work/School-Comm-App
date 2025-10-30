export function createPostCard({ post, context, readOnly = false, currentUser }) {
  const { utils, postService } = context;
  const card = document.createElement('article');
  card.className = 'post-card';

  const header = document.createElement('header');
  const author = document.createElement('div');
  author.textContent = 'Posted by Student';
  author.setAttribute('aria-label', 'Anonymous author');

  const timestamp = document.createElement('span');
  timestamp.className = 'badge';
  timestamp.textContent = utils.formatRelativeTime(post.createdAt);

  header.append(author, timestamp);
  card.appendChild(header);

  const body = document.createElement('p');
  body.innerHTML = post.text;
  card.appendChild(body);

  if (post.image) {
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'image-preview';
    const image = document.createElement('img');
    image.src = post.image;
    image.alt = 'Post attachment';
    imageWrapper.appendChild(image);
    card.appendChild(imageWrapper);
  }

  const actions = document.createElement('div');
  actions.className = 'post-actions';

  const likeButton = document.createElement('button');
  likeButton.type = 'button';
  likeButton.className = 'icon-button tooltip';
  likeButton.innerHTML = `❤ ${post.likes.length}`;
  likeButton.setAttribute('aria-pressed', post.likes.includes(currentUser?.id));
  likeButton.setAttribute('aria-label', 'Like post');
  if (!currentUser || readOnly) {
    likeButton.disabled = true;
    likeButton.dataset.tooltip = readOnly ? 'Pending users cannot like posts yet.' : 'Sign in to like posts.';
  }
  likeButton.addEventListener('click', () => {
    if (!currentUser || readOnly) return;
    postService.toggleLike(post.id, currentUser.id);
  });

  const commentToggle = document.createElement('button');
  commentToggle.type = 'button';
  commentToggle.className = 'icon-button';
  commentToggle.textContent = `💬 ${post.comments.length}`;
  commentToggle.setAttribute('aria-expanded', 'false');

  actions.append(likeButton, commentToggle);
  card.appendChild(actions);

  const commentSection = document.createElement('div');
  commentSection.className = 'comment-section';
  commentSection.hidden = true;

  const commentList = document.createElement('div');
  commentList.className = 'comment-list';
  if (!post.comments.length) {
    const empty = document.createElement('p');
    empty.className = 'comment';
    empty.textContent = 'No comments yet.';
    commentList.appendChild(empty);
  } else {
    post.comments
      .slice()
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .forEach((comment) => {
        const commentEl = document.createElement('div');
        commentEl.className = 'comment';
        const commentHeader = document.createElement('header');
        commentHeader.textContent = `Student • ${utils.formatRelativeTime(comment.createdAt)}`;
        const commentBody = document.createElement('p');
        commentBody.innerHTML = comment.text;
        commentEl.append(commentHeader, commentBody);
        commentList.appendChild(commentEl);
      });
  }

  commentSection.appendChild(commentList);

  const commentForm = document.createElement('form');
  commentForm.className = 'comment-form';
  const commentInput = document.createElement('textarea');
  commentInput.name = 'comment';
  commentInput.placeholder = 'Add a comment';
  if (!currentUser || readOnly) {
    commentInput.disabled = true;
    commentInput.placeholder = readOnly ? 'Pending users cannot comment yet.' : 'Sign in to add a comment.';
  }

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Comment';
  if (!currentUser || readOnly) {
    submitBtn.disabled = true;
  }

  commentForm.append(commentInput, submitBtn);
  commentSection.appendChild(commentForm);
  card.appendChild(commentSection);

  commentToggle.addEventListener('click', () => {
    const isHidden = commentSection.hidden;
    commentSection.hidden = !isHidden;
    commentToggle.setAttribute('aria-expanded', String(isHidden));
  });

  commentForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!currentUser || readOnly) return;
    const value = commentInput.value.trim();
    if (!value) return;
    try {
      postService.addComment(post.id, currentUser.id, value);
      commentInput.value = '';
    } catch (error) {
      alert(error.message);
    }
  });

  return card;
}
