import { store } from './store.js';

export const adminService = {
  listPendingUsers() {
    const state = store.getState();
    return state.pendingUsers
      .map((id) => state.users[id])
      .filter(Boolean)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  approve(userId) {
    store.updateState((draft) => {
      const user = draft.users[userId];
      if (!user) return draft;
      user.approved = true;
      draft.pendingUsers = draft.pendingUsers.filter((id) => id !== userId);
      return draft;
    });
  },

  deny(userId) {
    store.updateState((draft) => {
      delete draft.users[userId];
      draft.pendingUsers = draft.pendingUsers.filter((id) => id !== userId);
      if (draft.session.userId === userId) {
        draft.session.userId = null;
      }
      draft.posts = draft.posts.filter((post) => post.authorId !== userId);
      draft.events = draft.events.filter((event) => event.createdBy !== userId);
      return draft;
    });
  },

  listUsers() {
    const state = store.getState();
    return Object.values(state.users).sort((a, b) => a.email.localeCompare(b.email));
  },

  toggleAdmin(userId) {
    store.updateState((draft) => {
      const user = draft.users[userId];
      if (!user) return draft;
      user.isAdmin = !user.isAdmin;
      return draft;
    });
  },

  deletePost(postId) {
    store.updateState((draft) => {
      draft.posts = draft.posts.filter((post) => post.id !== postId);
      return draft;
    });
  },

  deleteEvent(eventId) {
    store.updateState((draft) => {
      draft.events = draft.events.filter((event) => event.id !== eventId);
      return draft;
    });
  },
};
