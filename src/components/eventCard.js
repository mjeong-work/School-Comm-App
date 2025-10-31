function createIcon(name) {
  const icons = {
    calendar: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    clock: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    users: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
  };
  return icons[name] || '';
}

export function createEventCard({ event, context, currentUser, readOnly = false }) {
  const { utils, eventService } = context;
  const card = document.createElement('article');
  card.className = 'event-card';

  const header = document.createElement('div');
  header.className = 'event-card__header';
  const title = document.createElement('h3');
  title.textContent = event.title;
  header.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'event-card__meta';
  const date = document.createElement('span');
  date.innerHTML = `${createIcon('calendar')}<span>${utils.formatDateDisplay(event.date)}</span>`;
  const time = document.createElement('span');
  time.innerHTML = `${createIcon('clock')}<span>${event.time}</span>`;
  meta.append(date, time);
  header.appendChild(meta);

  card.appendChild(header);

  const stats = document.createElement('div');
  stats.className = 'event-card__stats';
  const expected = document.createElement('span');
  expected.textContent = `Capacity ${event.expectedAttendance}`;
  const rsvpCount = document.createElement('span');
  rsvpCount.innerHTML = `${createIcon('users')}<span>${event.attendees.length} attending</span>`;
  stats.append(expected, rsvpCount);
  card.appendChild(stats);

  const progress = document.createElement('div');
  progress.className = 'event-card__progress';
  const percent = event.expectedAttendance
    ? Math.min(100, Math.round((event.attendees.length / event.expectedAttendance) * 100))
    : 0;
  const progressFill = document.createElement('span');
  progressFill.style.width = `${percent}%`;
  progress.appendChild(progressFill);
  card.appendChild(progress);

  const actions = document.createElement('div');
  actions.className = 'event-card__actions';

  const rsvpButton = document.createElement('button');
  rsvpButton.type = 'button';
  const hasRsvped = currentUser ? event.attendees.includes(currentUser.id) : false;
  rsvpButton.textContent = hasRsvped ? 'Cancel RSVP' : 'RSVP';
  rsvpButton.className = hasRsvped ? 'button--ghost' : 'button--primary';

  if (!currentUser) {
    rsvpButton.disabled = true;
    rsvpButton.title = 'Sign in to RSVP to events';
  } else if (readOnly) {
    rsvpButton.disabled = true;
    rsvpButton.title = 'Pending users cannot RSVP yet.';
  }

  rsvpButton.addEventListener('click', () => {
    if (!currentUser || readOnly) return;
    eventService.toggleRsvp(event.id, currentUser.id);
  });

  actions.appendChild(rsvpButton);
  card.appendChild(actions);

  return card;
}
