export function createEventCard({ event, context, currentUser, readOnly = false }) {
  const { utils, eventService } = context;
  const card = document.createElement('article');
  card.className = 'event-card';

  const header = document.createElement('header');
  const title = document.createElement('h3');
  title.textContent = event.title;
  const dateBadge = document.createElement('span');
  dateBadge.className = 'badge';
  dateBadge.textContent = `${utils.formatDateDisplay(event.date)} • ${event.time}`;
  header.append(title, dateBadge);

  card.appendChild(header);

  const stats = document.createElement('p');
  const attendeeCount = event.attendees.length;
  stats.textContent = `Expected ${event.expectedAttendance} • RSVP ${attendeeCount}`;
  card.appendChild(stats);

  const actions = document.createElement('div');
  actions.className = 'event-actions';

  const rsvpButton = document.createElement('button');
  rsvpButton.type = 'button';
  rsvpButton.className = 'icon-button tooltip';
  const hasRsvped = currentUser ? event.attendees.includes(currentUser.id) : false;
  rsvpButton.setAttribute('aria-pressed', String(hasRsvped));
  rsvpButton.textContent = hasRsvped ? 'Cancel RSVP' : 'RSVP';

  if (!currentUser) {
    rsvpButton.disabled = true;
    rsvpButton.dataset.tooltip = 'Sign in to RSVP.';
  } else if (readOnly) {
    rsvpButton.disabled = true;
    rsvpButton.dataset.tooltip = 'Pending users cannot RSVP yet.';
  }

  rsvpButton.addEventListener('click', () => {
    if (!currentUser || readOnly) return;
    eventService.toggleRsvp(event.id, currentUser.id);
  });

  actions.appendChild(rsvpButton);
  card.appendChild(actions);

  return card;
}
