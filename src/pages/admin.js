export function createAdminPage(context) {
  const { authService, adminService, config } = context;

  function render(target) {
    const user = authService.getCurrentUser();
    const container = document.createElement('section');
    container.className = 'container admin-page';

    const header = document.createElement('div');
    header.className = 'admin-header';

    const title = document.createElement('h2');
    title.textContent = 'Admin Console';
    header.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Manage community access, roles, and moderate content.';
    header.appendChild(subtitle);

    container.appendChild(header);

    if (!user?.isAdmin) {
      const warning = document.createElement('div');
      warning.className = 'alert';
      warning.textContent = 'You do not have permission to view this page.';
      container.appendChild(warning);
      target.appendChild(container);
      return;
    }

    container.appendChild(renderPending());
    container.appendChild(renderUsers());
    container.appendChild(renderModeration());

    target.appendChild(container);
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
    pending.forEach((user) => {
      const row = document.createElement('tr');
      const emailCell = document.createElement('td');
      emailCell.textContent = user.email;
      const dateCell = document.createElement('td');
      dateCell.textContent = new Date(user.createdAt).toLocaleString();
      const actionCell = document.createElement('td');
      const approveBtn = document.createElement('button');
      approveBtn.type = 'button';
      approveBtn.textContent = 'Approve';
      approveBtn.addEventListener('click', () => adminService.approve(user.id));
      const denyBtn = document.createElement('button');
      denyBtn.type = 'button';
      denyBtn.textContent = 'Deny';
      denyBtn.addEventListener('click', () => {
        if (confirm('Remove this pending request?')) {
          adminService.deny(user.id);
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
    heading.textContent = 'Users';
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
      adminToggle.textContent = user.isAdmin ? 'Remove admin' : 'Make admin';
      adminToggle.addEventListener('click', () => adminService.toggleAdmin(user.id));
      adminCell.appendChild(adminToggle);
      const actionCell = document.createElement('td');
      if (user.email !== config.ADMIN_EMAIL_SEED) {
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
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
    heading.textContent = 'Moderation';
    section.appendChild(heading);

    const description = document.createElement('p');
    description.textContent = 'Use moderation controls within feed and events to remove inappropriate content.';
    section.appendChild(description);

    return section;
  }

  return {
    render,
  };
}
