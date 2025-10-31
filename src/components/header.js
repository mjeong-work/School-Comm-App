const NAV_LINKS = [
  { path: '#/feed', label: 'Community' },
  { path: '#/events', label: 'Events' },
];

function createMenuIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />';
  return svg;
}

export function renderHeader(target, { currentPath, user, router, authService }) {
  if (!target) return;
  target.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'container site-header__inner';

  const primary = document.createElement('div');
  primary.className = 'site-header__primary';

  const brand = document.createElement('a');
  brand.className = 'site-brand';
  brand.href = '#/feed';
  brand.textContent = 'Campus Connect';
  brand.addEventListener('click', (event) => {
    event.preventDefault();
    router.navigate('#/feed');
  });

  const nav = document.createElement('nav');
  nav.className = 'site-nav';
  nav.setAttribute('aria-label', 'Primary');

  const navList = document.createElement('ul');
  navList.className = 'site-nav__list';

  const links = [...NAV_LINKS];
  if (user?.isAdmin) {
    links.push({ path: '#/admin', label: 'Admin' });
  }

  links.forEach((link) => {
    const listItem = document.createElement('li');
    const anchor = document.createElement('a');
    anchor.className = 'site-nav__link';
    if (currentPath === link.path) {
      anchor.classList.add('active');
      anchor.setAttribute('aria-current', 'page');
    }
    anchor.href = link.path;
    anchor.textContent = link.label;
    anchor.addEventListener('click', (event) => {
      event.preventDefault();
      navList.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
      router.navigate(link.path);
    });
    listItem.appendChild(anchor);
    navList.appendChild(listItem);
  });

  const menuButton = document.createElement('button');
  menuButton.type = 'button';
  menuButton.className = 'site-header__menu-button';
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-controls', 'primary-navigation');
  menuButton.setAttribute('aria-label', 'Toggle navigation');
  menuButton.appendChild(createMenuIcon());
  menuButton.addEventListener('click', () => {
    const isOpen = navList.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });

  navList.id = 'primary-navigation';
  nav.appendChild(navList);

  primary.append(brand, menuButton, nav);

  const profile = document.createElement('div');
  profile.className = 'site-header__profile';

  if (user) {
    const email = document.createElement('span');
    email.className = 'site-header__email';
    email.textContent = user.email;
    profile.appendChild(email);

    if (!user.approved) {
      const pendingBadge = document.createElement('span');
      pendingBadge.className = 'badge badge--pending';
      pendingBadge.textContent = 'Pending approval';
      profile.appendChild(pendingBadge);
    }

    const signOutBtn = document.createElement('button');
    signOutBtn.type = 'button';
    signOutBtn.className = 'button--ghost';
    signOutBtn.textContent = 'Sign out';
    signOutBtn.addEventListener('click', () => {
      authService.signOut();
      router.navigate('#/login');
    });
    profile.appendChild(signOutBtn);
  } else {
    const signInBtn = document.createElement('button');
    signInBtn.type = 'button';
    signInBtn.className = 'button--primary';
    signInBtn.textContent = 'Sign in';
    signInBtn.addEventListener('click', () => {
      router.navigate('#/login');
    });
    profile.appendChild(signInBtn);
  }

  wrapper.append(primary, profile);
  target.appendChild(wrapper);
}
