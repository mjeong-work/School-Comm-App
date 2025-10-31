export function createAdminPage(context) {
  const { authService, adminService, config } = context;

  function render(target) {
    const user = authService.getCurrentUser();
    const page = document.createElement('section');
    page.className = 'admin-page';

    const container = document.createElement('div');
    container.className = 'container';
    page.appendChild(container);

    const intro = document.createElement('div');
    intro.className = 'page-intro';

    const eyebrow = document.createElement('p');
    eyebrow.className = 'page-intro__eyebrow';
    eyebrow.textContent = 'Admin Console';

    const heading = document.createElement('h1');
    heading.textContent = 'Guide your community safely';

    const description = document.createElement('p');
    description.textContent = 'Approve new members, elevate moderators, and keep conversations aligned with school values.';

    intro.append(eyebrow, heading, description);
    container.appendChild(intro);

    if (!user?.isAdmin) {
      const warning = document.createElement('div');
      warning.className = 'card';
      warning.textContent = 'You do not have permission to view this page. Contact a moderator if you believe this is an error.';
      container.appendChild(warning);
      target.appendChild(page);
      return;
    }

    container.appendChild(renderPending());
    container.appendChild(renderUsers());
    container.appendChild(renderModeration());

    target.appendChild(page);
  }

  function renderPending() {
    const section = document.createElement('section');
    section.className = 'admin-section';

    const heading = document.createElement('h3');
    heading.textContent = 'Pending signups';
    section.appendChild(heading);

    const pending = adminService.listPendingUsers();
    if (!pending.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No pending requests right now.';
      section.appendChild(empty);
      return section;
    }

    const table = document.createElement('table');
    table.className = 'table';
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Email</th><th>Requested</th><th>Actions</th></tr>';
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    pending.forEach((pendingUser) => {
      const row = document.createElement('tr');
      const emailCell = document.createElement('td');
      emailCell.textContent = pendingUser.email;
      const dateCell = document.createElement('td');
      dateCell.textContent = new Date(pendingUser.createdAt).toLocaleString();
      const actionCell = document.createElement('td');
      const approveBtn = document.createElement('button');
      approveBtn.type = 'button';
      approveBtn.className = 'button--primary';
      approveBtn.textContent = 'Approve';
      approveBtn.addEventListener('click', () => adminService.approve(pendingUser.id));
      const denyBtn = document.createElement('button');
      denyBtn.type = 'button';
      denyBtn.className = 'button--ghost';
      denyBtn.textContent = 'Decline';
      denyBtn.addEventListener('click', () => {
        if (confirm('Remove this pending request?')) {
          adminService.deny(pendingUser.id);
        }
      });
      actionCell.append(approveBtn, denyBtn);
      row.append(emailCell, dateCell, actionCell);
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    section.appendChild(table);
    return section;
  }

  function renderUsers() {
    const section = document.createElement('section');
    section.className = 'admin-section';

    const heading = document.createElement('h3');
    heading.textContent = 'Members';
    section.appendChild(heading);

    const users = adminService.listUsers();
    if (!users.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No users found.';
      section.appendChild(empty);
      return section;
    }

    const table = document.createElement('table');
    table.className = 'table';
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Email</th><th>Status</th><th>Admin</th><th>Actions</th></tr>';
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    users.forEach((user) => {
      const row = document.createElement('tr');
      const emailCell = document.createElement('td');
      emailCell.textContent = user.email;
      const statusCell = document.createElement('td');
      statusCell.textContent = user.approved ? 'Approved' : 'Pending';
      const adminCell = document.createElement('td');
      const adminToggle = document.createElement('button');
      adminToggle.type = 'button';
      adminToggle.className = user.isAdmin ? 'button--ghost' : 'button--primary';
      adminToggle.textContent = user.isAdmin ? 'Remove admin' : 'Make admin';
      adminToggle.addEventListener('click', () => adminService.toggleAdmin(user.id));
      adminCell.appendChild(adminToggle);
      const actionCell = document.createElement('td');
      if (user.email !== config.ADMIN_EMAIL_SEED) {
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'button--danger';
        removeBtn.textContent = 'Delete user';
        removeBtn.addEventListener('click', () => {
          if (confirm('Delete this user and their content?')) {
            adminService.deny(user.id);
          }
        });
        actionCell.appendChild(removeBtn);
      } else {
        actionCell.textContent = 'Seed admin';
      }
      row.append(emailCell, statusCell, adminCell, actionCell);
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    section.appendChild(table);
    return section;
  }

  function renderModeration() {
    const section = document.createElement('section');
    section.className = 'admin-section';

    const heading = document.createElement('h3');
    heading.textContent = 'Moderation guidance';
    section.appendChild(heading);

    const description = document.createElement('p');
    description.textContent = 'Use moderation controls within feed and events to remove inappropriate content. Encourage positive, inclusive communication across the community.';
    section.appendChild(description);

    return section;
  }

  return {
    render,
  };
}
