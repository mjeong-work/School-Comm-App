import { createEventCard } from '../components/eventCard.js';

export function createEventsPage(context) {
  const { authService, eventService, config, viewState } = context;
  let currentMonth = viewState.eventsMonth ? new Date(viewState.eventsMonth) : new Date();
  let selectedDate = viewState.eventsSelectedDate ? new Date(viewState.eventsSelectedDate) : null;

  function render(target) {
    const user = authService.getCurrentUser();
    const status = authService.requireApprovedUser(config);
    const readOnly = status.readOnly || !user?.approved;

    const page = document.createElement('section');
    page.className = 'events-page';

    const container = document.createElement('div');
    container.className = 'container';
    page.appendChild(container);

    const intro = document.createElement('div');
    intro.className = 'page-intro';

    const eyebrow = document.createElement('p');
    eyebrow.className = 'page-intro__eyebrow';
    eyebrow.textContent = 'Campus Calendar';

    const title = document.createElement('h1');
    title.textContent = 'Plan and join upcoming events';

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Browse student-led gatherings, volunteer opportunities, and official campus happenings.';

    intro.append(eyebrow, title, subtitle);
    container.appendChild(intro);

    if (readOnly && user && !user.approved) {
      const info = document.createElement('div');
      info.className = 'alert-banner alert-banner--info';
      info.textContent = 'You can explore events while your access is pending. Moderators will unlock RSVP once approved.';
      container.appendChild(info);
    }

    const content = document.createElement('div');
    content.className = 'events-content';
    container.appendChild(content);

    const calendarPanel = document.createElement('div');
    calendarPanel.className = 'card events-calendar';
    content.appendChild(calendarPanel);

    const listColumn = document.createElement('div');
    listColumn.className = 'events-column';
    content.appendChild(listColumn);

    renderCalendar(calendarPanel, () => refreshEvents(listColumn, user, readOnly));
    refreshEvents(listColumn, user, readOnly);

    target.appendChild(page);
  }

  function renderCalendar(target, onSelect) {
    target.innerHTML = '';

    const controls = document.createElement('div');
    controls.className = 'calendar-controls';

    const monthName = currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const title = document.createElement('h3');
    title.textContent = monthName;
    controls.appendChild(title);

    const buttons = document.createElement('div');
    buttons.className = 'calendar-buttons';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.textContent = 'Previous';
    prevBtn.addEventListener('click', () => {
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      viewState.eventsMonth = currentMonth.toISOString();
      renderCalendar(target, onSelect);
    });

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.textContent = 'Next';
    nextBtn.addEventListener('click', () => {
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
      viewState.eventsMonth = currentMonth.toISOString();
      renderCalendar(target, onSelect);
    });

    buttons.append(prevBtn, nextBtn);
    controls.appendChild(buttons);
    target.appendChild(controls);

    const grid = document.createElement('div');
    grid.className = 'calendar-grid';
    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    daysOfWeek.forEach((day) => {
      const cell = document.createElement('div');
      cell.className = 'calendar-cell';
      cell.textContent = day;
      cell.style.fontWeight = '600';
      grid.appendChild(cell);
    });

    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const offset = firstDay.getDay();
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

    for (let i = 0; i < offset; i += 1) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'calendar-cell';
      emptyCell.setAttribute('aria-hidden', 'true');
      grid.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'calendar-cell';
      cell.textContent = String(day);
      const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      if (selectedDate && cellDate.toDateString() === selectedDate.toDateString()) {
        cell.classList.add('active');
      }
      const today = new Date();
      if (cellDate.toDateString() === today.toDateString()) {
        cell.classList.add('today');
      }
      cell.addEventListener('click', () => {
        if (selectedDate && cellDate.toDateString() === selectedDate.toDateString()) {
          selectedDate = null;
          viewState.eventsSelectedDate = null;
        } else {
          selectedDate = cellDate;
          viewState.eventsSelectedDate = cellDate.toISOString();
        }
        renderCalendar(target, onSelect);
        onSelect();
      });
      grid.appendChild(cell);
    }

    target.appendChild(grid);
  }

  function refreshEvents(wrapper, user, readOnly) {
    wrapper.innerHTML = '';
    if (user?.isAdmin) {
      wrapper.appendChild(createAdminForm(user, () => refreshEvents(wrapper, user, readOnly)));
    }

    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'events-list';

    const dateFilter = selectedDate ? selectedDate.toISOString().slice(0, 10) : null;
    const events = eventService.list({ date: dateFilter });
    if (!events.length) {
      const empty = document.createElement('div');
      empty.className = 'card';
      empty.textContent = selectedDate
        ? 'No events scheduled for this date yet. Add one or try a different day.'
        : 'No upcoming events yet. Check back soon or host the next gathering!';
      eventsContainer.appendChild(empty);
    } else {
      events.forEach((event) => {
        const card = createEventCard({
          event,
          context,
          currentUser: user,
          readOnly: !user || readOnly,
        });
        eventsContainer.appendChild(card);
      });
    }

    wrapper.appendChild(eventsContainer);
  }

  function createAdminForm(user, onCreate) {
    const form = document.createElement('form');
    form.className = 'card events-admin-form';

    const heading = document.createElement('h3');
    heading.textContent = 'Add event';
    form.appendChild(heading);

    const titleLabel = document.createElement('label');
    titleLabel.setAttribute('for', 'event-title');
    titleLabel.textContent = 'Title';
    const titleInput = document.createElement('input');
    titleInput.id = 'event-title';
    titleInput.required = true;
    form.append(titleLabel, titleInput);

    const dateLabel = document.createElement('label');
    dateLabel.setAttribute('for', 'event-date');
    dateLabel.textContent = 'Date';
    const dateInput = document.createElement('input');
    dateInput.id = 'event-date';
    dateInput.type = 'date';
    dateInput.required = true;
    form.append(dateLabel, dateInput);

    const timeLabel = document.createElement('label');
    timeLabel.setAttribute('for', 'event-time');
    timeLabel.textContent = 'Time';
    const timeInput = document.createElement('input');
    timeInput.id = 'event-time';
    timeInput.type = 'time';
    timeInput.required = true;
    form.append(timeLabel, timeInput);

    const expectedLabel = document.createElement('label');
    expectedLabel.setAttribute('for', 'event-expected');
    expectedLabel.textContent = 'Expected attendance';
    const expectedInput = document.createElement('input');
    expectedInput.id = 'event-expected';
    expectedInput.type = 'number';
    expectedInput.min = '1';
    expectedInput.required = true;
    expectedInput.placeholder = 'How many people can attend?';
    form.append(expectedLabel, expectedInput);

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'button--primary';
    submitBtn.textContent = 'Publish event';
    form.appendChild(submitBtn);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!user?.isAdmin) return;
      const payload = {
        title: titleInput.value.trim(),
        date: dateInput.value,
        time: timeInput.value,
        expectedAttendance: Number(expectedInput.value) || 0,
      };
      if (!payload.title || !payload.date || !payload.time || !payload.expectedAttendance) {
        alert('Please fill all fields before publishing.');
        return;
      }
      eventService.createEvent({
        title: payload.title,
        date: payload.date,
        time: payload.time,
        expectedAttendance: payload.expectedAttendance,
        createdBy: user.id,
      });
      titleInput.value = '';
      dateInput.value = '';
      timeInput.value = '';
      expectedInput.value = '';
      onCreate();
    });

    return form;
  }

  return {
    render,
  };
}
