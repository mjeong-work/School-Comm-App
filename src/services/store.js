const STORAGE_KEY = 'school-community-app';
let cachedState = null;
const listeners = new Set();

const defaultState = {
  users: {},
  pendingUsers: [],
  posts: [],
  events: [],
  session: {
    userId: null,
  },
  meta: {
    migratedAt: null,
  },
};

function loadState() {
  if (cachedState) return cachedState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedState = structuredClone(defaultState);
      return cachedState;
    }
    const parsed = JSON.parse(raw);
    cachedState = {
      ...structuredClone(defaultState),
      ...parsed,
      users: parsed.users || {},
      pendingUsers: parsed.pendingUsers || [],
      posts: parsed.posts || [],
      events: parsed.events || [],
      session: parsed.session || structuredClone(defaultState.session),
      meta: parsed.meta || {},
    };
    return cachedState;
  } catch (error) {
    console.error('Failed to parse storage. Resetting state.', error);
    cachedState = structuredClone(defaultState);
    saveState(cachedState);
    return cachedState;
  }
}

function notify(state) {
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch (error) {
      console.error('Store listener error', error);
    }
  });
}

function saveState(state) {
  cachedState = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  notify(state);
}

function structuredClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export const store = {
  getState() {
    return loadState();
  },
  setState(nextState) {
    saveState(structuredClone(nextState));
  },
  updateState(updater) {
    const prev = loadState();
    const next = updater(structuredClone(prev));
    saveState(next);
  },
  get(key, fallback = null) {
    const state = loadState();
    return key in state ? state[key] : fallback;
  },
  set(key, value) {
    this.updateState((state) => {
      state[key] = value;
      return state;
    });
  },
  update(key, updater) {
    this.updateState((state) => {
      state[key] = updater(state[key]);
      return state;
    });
  },
  remove(key) {
    this.updateState((state) => {
      delete state[key];
      return state;
    });
  },
  clear() {
    resetStorage();
    const fresh = structuredClone(defaultState);
    cachedState = fresh;
    notify(fresh);
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  migrate(seedFactory) {
    const state = loadState();
    let mutated = false;

    if (!state.meta || !state.meta.migratedAt) {
      mutated = true;
      const now = new Date().toISOString();
      state.meta = { migratedAt: now };
    }

    if (!state.users) {
      state.users = {};
      mutated = true;
    }
    if (!Array.isArray(state.pendingUsers)) {
      state.pendingUsers = [];
      mutated = true;
    }
    if (!Array.isArray(state.posts)) {
      state.posts = [];
      mutated = true;
    }
    if (!Array.isArray(state.events)) {
      state.events = [];
      mutated = true;
    }
    if (!state.session) {
      state.session = structuredClone(defaultState.session);
      mutated = true;
    }

    if (typeof seedFactory === 'function') {
      const seedMutations = seedFactory(state) || {};
      if (seedMutations.mutated) {
        mutated = true;
      }
    }

    if (mutated) {
      saveState(state);
    } else {
      cachedState = state;
    }

    return state;
  },
};

export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function resetStorage() {
  localStorage.removeItem(STORAGE_KEY);
  cachedState = null;
}
