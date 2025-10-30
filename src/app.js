import { Router } from './router.js';
import { store, generateId, resetStorage } from './services/store.js';
import { authService } from './services/authService.js';
import { postService } from './services/postService.js';
import { eventService } from './services/eventService.js';
import { adminService } from './services/adminService.js';
import { renderHeader } from './components/header.js';
import { createLoginPage } from './pages/login.js';
import { createFeedPage } from './pages/feed.js';
import { createEventsPage } from './pages/events.js';
import { createAdminPage } from './pages/admin.js';

export const CONFIG = {
  ALLOWED_DOMAINS: ['@google.com'],
  ADMIN_EMAIL_SEED: 'mjeong23@outlook.com',
  IMAGE_MAX_MB: 1,
  ACCESS_POLICY: {
    readOnlyForUnapproved: true,
  },
};

function seedData(state) {
  let mutated = false;
  const existingAdmin = Object.values(state.users).find((user) => user.email === CONFIG.ADMIN_EMAIL_SEED);
  if (!existingAdmin) {
    const adminId = generateId('user');
    state.users[adminId] = {
      id: adminId,
      email: CONFIG.ADMIN_EMAIL_SEED,
      approved: true,
      isAdmin: true,
      createdAt: new Date().toISOString(),
      profile: {},
    };
    mutated = true;
  } else {
    if (!existingAdmin.approved || !existingAdmin.isAdmin) {
      existingAdmin.approved = true;
      existingAdmin.isAdmin = true;
      mutated = true;
    }
  }

  const adminUser = Object.values(state.users).find((user) => user.email === CONFIG.ADMIN_EMAIL_SEED);

  if (!state.posts.length && adminUser) {
    state.posts = [
      {
        id: generateId('post'),
        text: 'Welcome to the School Community App! Share updates, wins, and questions with fellow students.',
        image: null,
        authorId: adminUser.id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        likes: [],
        comments: [],
        tags: ['welcome'],
      },
      {
        id: generateId('post'),
        text: 'Reminder: Submit your project feedback forms by Friday. Thank you for keeping our campus thriving!',
        image: null,
        authorId: adminUser.id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        likes: [],
        comments: [],
        tags: ['reminder'],
      },
    ];
    mutated = true;
  }

  if (!state.events.length && adminUser) {
    state.events = [
      {
        id: generateId('event'),
        title: 'Campus Cleanup Day',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString().slice(0, 10),
        time: '10:00',
        expectedAttendance: 30,
        attendees: [],
        createdBy: adminUser.id,
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId('event'),
        title: 'Innovation Showcase',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString().slice(0, 10),
        time: '17:30',
        expectedAttendance: 80,
        attendees: [],
        createdBy: adminUser.id,
        createdAt: new Date().toISOString(),
      },
    ];
    mutated = true;
  }

  state.pendingUsers = state.pendingUsers?.filter((id) => {
    const user = state.users[id];
    return user && !user.approved;
  }) || [];

  return { mutated };
}

function formatRelativeTime(dateInput) {
  const now = Date.now();
  const value = new Date(dateInput).getTime();
  const diff = now - value;
  const minutes = Math.round(diff / (1000 * 60));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 4) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.round(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

function formatDateDisplay(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

async function processImageFile(file, maxMb = CONFIG.IMAGE_MAX_MB) {
  if (!file) return null;
  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`Image must be ${maxMb}MB or smaller.`);
  }

  const dataUrl = await readFileAsDataURL(file);
  return await stripExif(dataUrl);
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

function stripExif(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    image.onerror = () => reject(new Error('Invalid image.'));
    image.src = dataUrl;
  });
}

const headerElement = document.getElementById('site-header');
const appElement = document.getElementById('app');

store.migrate(seedData);

const router = new Router({
  target: appElement,
  defaultRoute: '#/login',
});

const viewState = {
  feedSearch: '',
  feedTab: 'current',
  feedSort: 'latest',
  feedComposerOpen: false,
  eventsMonth: new Date().toISOString(),
  eventsSelectedDate: null,
};

const context = {
  config: CONFIG,
  router,
  store,
  authService,
  postService,
  eventService,
  adminService,
  viewState,
  utils: {
    formatRelativeTime,
    formatDateDisplay,
    processImageFile,
  },
};

router.setRoutes({
  '#/login': () => createLoginPage(context),
  '#/feed': () => createFeedPage(context),
  '#/events': () => createEventsPage(context),
  '#/admin': () => createAdminPage(context),
});

router.setBeforeEach((path) => {
  if (path === '#/login') {
    return null;
  }
  const user = authService.getCurrentUser();
  if (!user) {
    return { redirect: '#/login' };
  }
  if (!user.approved && !CONFIG.ACCESS_POLICY.readOnlyForUnapproved) {
    return { redirect: '#/login' };
  }
  if (path === '#/admin' && !user.isAdmin) {
    return { redirect: '#/feed' };
  }
  return null;
});

function updateHeader(path) {
  const user = authService.getCurrentUser();
  renderHeader(headerElement, {
    currentPath: path,
    user,
    router,
    authService,
    config: CONFIG,
  });
}

router.setAfterRender((path) => {
  updateHeader(path);
  if (appElement) {
    appElement.focus({ preventScroll: false });
  }
});

store.subscribe(() => {
  router.refresh();
});

router.start();

window.__SCHOOL_COMMUNITY_APP__ = {
  store,
  router,
  resetStorage,
};
