export function createLoginPage(context) {
  const { authService, router, config } = context;

  function render(target) {
    const currentUser = authService.getCurrentUser();
    const page = document.createElement('section');
    page.className = 'login-page';

    const container = document.createElement('div');
    container.className = 'container login-grid';

    const hero = document.createElement('div');
    hero.className = 'login-hero';

    const eyebrow = document.createElement('p');
    eyebrow.className = 'page-intro__eyebrow';
    eyebrow.textContent = 'Campus Connect';

    const title = document.createElement('h1');
    title.className = 'login-hero__title';
    title.textContent = 'Log in with your school email';

    const description = document.createElement('p');
    description.className = 'login-hero__description';
    description.textContent = 'Access verified community boards, RSVP to events, and stay aligned with the latest campus updates.';

    hero.append(eyebrow, title, description);

    const panel = document.createElement('div');
    panel.className = 'login-panel';

    const header = document.createElement('div');
    header.className = 'login-panel__header';

    const heading = document.createElement('h2');
    heading.textContent = 'Sign in to continue';
    const subheading = document.createElement('p');
    subheading.textContent = 'Use a Google account that matches the approved school domains below.';
    header.append(heading, subheading);
    panel.appendChild(header);

    if (!config.ALLOWED_DOMAINS?.length) {
      const warning = document.createElement('div');
      warning.className = 'alert';
      warning.textContent = 'No allowed email domains configured. Update the configuration before launching.';
      panel.appendChild(warning);
    } else {
      const domains = document.createElement('p');
      domains.className = 'form-hint';
      domains.textContent = `Accepted domains: ${config.ALLOWED_DOMAINS.join(', ')}`;
      panel.appendChild(domains);
    }

    const signInBtn = document.createElement('button');
    signInBtn.type = 'button';
    signInBtn.className = 'button--primary';
    signInBtn.textContent = 'Sign in with Google';
    signInBtn.addEventListener('click', () => openModal());
    panel.appendChild(signInBtn);

    if (currentUser) {
      const statusBox = document.createElement('div');
      statusBox.className = 'alert-banner alert-banner--info';
      statusBox.textContent = currentUser.approved
        ? 'You are signed in and approved. Use the navigation to explore the community.'
        : 'Your signup is pending approval. You can explore in read-only mode until a moderator confirms your account.';
      panel.appendChild(statusBox);
    }

    const mockDisclaimer = document.createElement('div');
    mockDisclaimer.className = 'alert';
    mockDisclaimer.textContent = 'Authentication is mock only. Replace with production-ready Google Sign-In and secure APIs before deployment.';
    panel.appendChild(mockDisclaimer);

    container.append(hero, panel);
    page.appendChild(container);
    target.appendChild(page);
  }

  function openModal() {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.role = 'dialog';
    backdrop.setAttribute('aria-modal', 'true');

    const modal = document.createElement('div');
    modal.className = 'modal';

    const header = document.createElement('header');
    const heading = document.createElement('h3');
    heading.textContent = 'Mock Google Sign-In';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close dialog');
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => backdrop.remove());
    header.append(heading, closeBtn);

    const form = document.createElement('form');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = emailInput.value.trim();
      try {
        const result = authService.signInWithGoogleMock(email, config);
        if (result.user.approved) {
          router.navigate('#/feed');
        } else if (config.ACCESS_POLICY.readOnlyForUnapproved) {
          router.navigate('#/feed');
        }
        backdrop.remove();
      } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.hidden = false;
      }
    });

    const emailLabel = document.createElement('label');
    emailLabel.setAttribute('for', 'mock-google-email');
    emailLabel.textContent = 'Email address';

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'mock-google-email';
    emailInput.name = 'email';
    emailInput.required = true;
    emailInput.placeholder = config.ALLOWED_DOMAINS?.[0] ? `example${config.ALLOWED_DOMAINS[0]}` : 'user@example.com';

    const errorMessage = document.createElement('p');
    errorMessage.className = 'alert';
    errorMessage.hidden = true;

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'button--primary';
    submitBtn.textContent = 'Continue';

    form.append(emailLabel, emailInput, submitBtn);

    modal.append(header, form, errorMessage);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    emailInput.focus();

    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) {
        backdrop.remove();
      }
    });

    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape') {
          backdrop.remove();
        }
      },
      { once: true }
    );
  }

  return {
    render,
  };
}
