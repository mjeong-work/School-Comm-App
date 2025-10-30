import { store, generateId } from './store.js';

function sanitizeText(input) {
  const div = document.createElement('div');
  div.textContent = input ?? '';
  return div.innerHTML;
}

export const postService = {
  list({ search = '', limit = 20, offset = 0 } = {}) {
    const { posts } = store.getState();
    const normalized = search.trim().toLowerCase();
    let filtered = posts;
    if (normalized) {
      filtered = posts.filter((post) => {
        const text = (post.text || '').toLowerCase();
        const tags = (post.tags || []).join(' ').toLowerCase();
        return text.includes(normalized) || tags.includes(normalized);
      });
    }
    const sorted = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (!limit) return sorted.slice(offset);
    return sorted.slice(offset, offset + limit);
  },

  createPost({ text, imageDataUrl = null, authorId }) {
    if (!authorId) {
      throw new Error('Author is required.');
    }
    const trimmed = (text || '').trim();
    if (!trimmed) {
      throw new Error('Post text is required.');
    }

    const newPost = {
      id: generateId('post'),
      text: sanitizeText(trimmed),
      image: imageDataUrl,
      authorId,
      createdAt: new Date().toISOString(),
      likes: [],
      comments: [],
      tags: [],
    };

    store.updateState((draft) => {
      draft.posts.push(newPost);
      return draft;
    });
    return newPost;
  },

  deletePost(postId) {
    store.updateState((draft) => {
      draft.posts = draft.posts.filter((post) => post.id !== postId);
      return draft;
    });
  },

  toggleLike(postId, userId) {
    if (!userId) return;
    store.updateState((draft) => {
      const post = draft.posts.find((p) => p.id === postId);
      if (!post) return draft;
      const hasLiked = post.likes.includes(userId);
      if (hasLiked) {
        post.likes = post.likes.filter((id) => id !== userId);
      } else {
        post.likes.push(userId);
      }
      return draft;
    });
  },

  addComment(postId, userId, text) {
    if (!userId) {
      throw new Error('User is required to comment.');
    }
    const trimmed = (text || '').trim();
    if (!trimmed) {
      throw new Error('Comment text is required.');
    }

    const newComment = {
      id: generateId('comment'),
      userId,
      text: sanitizeText(trimmed),
      createdAt: new Date().toISOString(),
    };

    store.updateState((draft) => {
      const post = draft.posts.find((p) => p.id === postId);
      if (!post) {
        throw new Error('Post not found.');
      }
      post.comments.push(newComment);
      return draft;
    });

    return newComment;
  },
};
