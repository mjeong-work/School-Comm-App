const NAV_LINKS = [
  { path: '#/feed', label: 'Feed' },
  { path: '#/events', label: 'Events' },
];

export function renderHeader(target, { currentPath, user, router, authService, config }) {
  if (!target) return;
  target.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'container';

  const title = document.createElement('h1');
  title.className = 'site-title';
  title.textContent = 'School Community App';
  container.appendChild(title);

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Primary navigation');

  const list = document.createElement('ul');
  list.className = 'nav-list';

  const links = [...NAV_LINKS];
  if (user?.isAdmin) {
    links.push({ path: '#/admin', label: 'Admin' });
  }

  links.forEach((link) => {
    const listItem = document.createElement('li');
    const anchor = document.createElement('a');
    anchor.className = 'nav-link';
    if (currentPath === link.path) {
      anchor.classList.add('active');
      anchor.setAttribute('aria-current', 'page');
    }
    anchor.href = link.path;
    anchor.textContent = link.label;
    anchor.addEventListener('click', (event) => {
      event.preventDefault();
      router.navigate(link.path);
    });
    listItem.appendChild(anchor);
    list.appendChild(listItem);
  });

  const profileItem = document.createElement('li');
  profileItem.className = 'profile-menu';

  if (user) {
    const email = document.createElement('span');
    email.className = 'profile-email';
    email.textContent = user.email;
    profileItem.appendChild(email);

    if (!user.approved) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = 'Pending approval';
      profileItem.appendChild(badge);
    }

    const signOutBtn = document.createElement('button');
    signOutBtn.type = 'button';
    signOutBtn.textContent = 'Sign out';
    signOutBtn.addEventListener('click', () => {
      authService.signOut();
      router.navigate('#/login');
    });
    profileItem.appendChild(signOutBtn);
  } else {
    const signInLink = document.createElement('a');
    signInLink.className = 'nav-link';
    signInLink.href = '#/login';
    signInLink.textContent = 'Sign in';
    signInLink.addEventListener('click', (event) => {
      event.preventDefault();
      router.navigate('#/login');
    });
    profileItem.appendChild(signInLink);
  }

  list.appendChild(profileItem);
  nav.appendChild(list);
  container.appendChild(nav);

  target.appendChild(container);
}
