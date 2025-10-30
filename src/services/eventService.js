import { store, generateId } from './store.js';

export const eventService = {
  list({ date = null } = {}) {
    const { events } = store.getState();
    let result = [...events];
    if (date) {
      result = result.filter((event) => event.date === date);
    }
    return result.sort((a, b) => new Date(a.date) - new Date(b.date));
  },

  createEvent({ title, date, time, expectedAttendance, createdBy }) {
    if (!title || !date || !time) {
      throw new Error('Title, date, and time are required.');
    }

    const newEvent = {
      id: generateId('event'),
      title: title.trim(),
      date,
      time,
      expectedAttendance: Number(expectedAttendance) || 0,
      attendees: [],
      createdBy,
      createdAt: new Date().toISOString(),
    };

    store.updateState((draft) => {
      draft.events.push(newEvent);
      return draft;
    });

    return newEvent;
  },

  deleteEvent(eventId) {
    store.updateState((draft) => {
      draft.events = draft.events.filter((event) => event.id !== eventId);
      return draft;
    });
  },

  toggleRsvp(eventId, userId) {
    if (!userId) return;
    store.updateState((draft) => {
      const event = draft.events.find((evt) => evt.id === eventId);
      if (!event) return draft;
      const hasRsvped = event.attendees.includes(userId);
      if (hasRsvped) {
        event.attendees = event.attendees.filter((id) => id !== userId);
      } else {
        event.attendees.push(userId);
      }
      return draft;
    });
  },
};
