import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import AddEventModal from './AddEventModal/AddEventModal';
import { PlusIcon, DeleteIcon } from '../../../../../../../components/Icons/InteractiveIcons';
import { ChevronLeft, ChevronRight } from '../../../../../../../components/Icons/DirectionIcons';
import './CalendarDashboard.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
const STORAGE_KEY = 'amethis_calendar_events';

function CalendarDashboard({ height = 680 }) {
  const [events, setEvents] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored
        ? JSON.parse(stored).map(e => ({ ...e, start: new Date(e.start), end: new Date(e.end) }))
        : [];
    } catch {
      return [];
    }
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    if (!('Notification' in window) || events.length === 0) return;
    const timers = events.flatMap(event => {
      if (!event.reminderMinutes) return [];
      const reminderAt = new Date(event.start).getTime() - event.reminderMinutes * 60 * 1000;
      const delay = reminderAt - Date.now();
      if (delay <= 0) return [];
      const t = setTimeout(() => {
        if (Notification.permission === 'granted') {
          const mins = event.reminderMinutes;
          const label = mins >= 60 ? `${mins / 60}h` : `${mins}min`;
          new Notification(`Reminder: ${event.title}`, {
            body: `Starting in ${label}`,
            icon: '/favicon.ico',
          });
        }
      }, delay);
      return [t];
    });
    return () => timers.forEach(clearTimeout);
  }, [events]);

  const handleAddEvent = useCallback((eventData) => {
    setEvents(prev => [...prev, { id: Date.now(), ...eventData }]);
    setShowAddModal(false);
    setSelectedSlot(null);
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleDeleteEvent = useCallback((id, e) => {
    e.stopPropagation();
    setEvents(prev => prev.filter(ev => ev.id !== id));
    setSelectedEvent(null);
  }, []);

  const handleSelectSlot = useCallback(({ start }) => {
    setSelectedSlot(start);
    setShowAddModal(true);
    setSelectedEvent(null);
  }, []);

  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(prev => (prev?.id === event.id ? null : event));
  }, []);

  const CustomToolbar = ({ date, onNavigate }) => {
    const label = format(date, 'MMMM yyyy');
    return (
      <div className="cal-toolbar">
        <div className="cal-toolbar-left">
          <button className="cal-nav-btn" onClick={() => onNavigate('PREV')} aria-label="Previous">
            <ChevronLeft />
          </button>
          <button className="cal-nav-btn" onClick={() => onNavigate('NEXT')} aria-label="Next">
            <ChevronRight />
          </button>
          <span className="cal-toolbar-label">{label}</span>
        </div>
        <button className="cal-add-btn" onClick={() => { setSelectedSlot(null); setShowAddModal(true); }}>
          <PlusIcon />
          <span>Add Event</span>
        </button>
      </div>
    );
  };

  const EventComponent = ({ event }) => (
    <div className="cal-event-inner">
      <span className="cal-event-text">
        {event.title}
      </span>
      <button
        className="cal-event-del-btn"
        onClick={(e) => handleDeleteEvent(event.id, e)}
        aria-label="Delete event"
      >
        ×
      </button>
    </div>
  );

  return (
    <div className="calendar-dashboard" onClick={() => setSelectedEvent(null)}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height }}
        views={['month']}
        defaultView="month"
        date={currentDate}
        onNavigate={setCurrentDate}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        selectable
        popup
        components={{
          toolbar: CustomToolbar,
          event: EventComponent,
        }}
        eventPropGetter={() => ({
          className: 'cal-event',
        })}
      />

      {selectedEvent && (
        <div className="cal-event-popup" onClick={e => e.stopPropagation()}>
          <div className="cal-popup-header">
            <span className="cal-popup-title">{selectedEvent.title}</span>
            <button className="cal-popup-close" onClick={() => setSelectedEvent(null)} aria-label="Close">
              ×
            </button>
          </div>
          <div className="cal-popup-time">
            {format(new Date(selectedEvent.start), 'EEE, d MMM yyyy')}
            <br />
            {format(new Date(selectedEvent.start), 'h:mm a')} — {format(new Date(selectedEvent.end), 'h:mm a')}
          </div>
          {selectedEvent.notes && (
            <div className="cal-popup-notes">{selectedEvent.notes}</div>
          )}
          {selectedEvent.reminderMinutes > 0 && (
            <div className="cal-popup-reminder">
              Reminder: {selectedEvent.reminderMinutes >= 60
                ? `${selectedEvent.reminderMinutes / 60} hour(s) before`
                : `${selectedEvent.reminderMinutes} minutes before`}
            </div>
          )}
          <button className="cal-popup-delete-btn" onClick={(e) => handleDeleteEvent(selectedEvent.id, e)}>
            Delete event
          </button>
        </div>
      )}

      {showAddModal && (
        <AddEventModal
          onClose={() => { setShowAddModal(false); setSelectedSlot(null); }}
          onAdd={handleAddEvent}
          initialDate={selectedSlot}
        />
      )}
    </div>
  );
}

export default CalendarDashboard;
