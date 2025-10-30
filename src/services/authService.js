import { store, generateId } from './store.js';

const SESSION_NAMESPACE = 'session';

export const authService = {
  signInWithGoogleMock(email, config) {
    // TODO: Replace mock auth with secure OAuth (e.g., Firebase Auth) in production.
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Email is required.');
    }

    const allowed = (config.ALLOWED_DOMAINS || []).some((domain) => normalizedEmail.endsWith(domain));
    if (!allowed) {
      throw new Error(`Email must end with: ${config.ALLOWED_DOMAINS.join(', ')}`);
    }

    let matchedUser = null;
    const state = store.getState();
    for (const user of Object.values(state.users)) {
      if (user.email === normalizedEmail) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      const newUser = {
        id: generateId('user'),
        email: normalizedEmail,
        approved: false,
        isAdmin: false,
        createdAt: new Date().toISOString(),
        profile: {},
      };
      store.updateState((draft) => {
        draft.users[newUser.id] = newUser;
        if (!draft.pendingUsers.includes(newUser.id)) {
          draft.pendingUsers.push(newUser.id);
        }
        draft.session.userId = newUser.id;
        return draft;
      });
      return { user: newUser, status: 'pending' };
    }

    store.updateState((draft) => {
      draft.session.userId = matchedUser.id;
      return draft;
    });

    return { user: matchedUser, status: matchedUser.approved ? 'approved' : 'pending' };
  },

  signOut() {
    store.updateState((draft) => {
      draft.session.userId = null;
      return draft;
    });
  },

  getCurrentUser() {
    const state = store.getState();
    const userId = state.session?.userId;
    if (!userId) return null;
    return state.users[userId] || null;
  },

  requireApprovedUser(config) {
    const user = this.getCurrentUser();
    if (!user) {
      return { allowed: false, reason: 'unauthenticated' };
    }
    if (!user.approved) {
      if (config.ACCESS_POLICY?.readOnlyForUnapproved) {
        return { allowed: true, readOnly: true };
      }
      return { allowed: false, reason: 'unapproved' };
    }
    return { allowed: true, readOnly: false };
  },
};
