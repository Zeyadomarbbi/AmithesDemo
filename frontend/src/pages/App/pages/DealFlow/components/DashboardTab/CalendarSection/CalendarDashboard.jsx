import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import {
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  parse,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { enUS } from 'date-fns/locale';
import useApi from '/src/hooks/api/useApi';
import Toast from '../../../../../components/Toast/Toast';
import { useToast } from '../../../../../components/Toast/useToast';
import { EditIcon, PlusIcon, TrashIcon } from '../../../../../../../components/Icons/InteractiveIcons';
import { ChevronLeft, ChevronRight } from '../../../../../../../components/Icons/DirectionIcons';
import AddEventModal from './AddEventModal/AddEventModal';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarDashboard.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const CALENDAR_EVENTS_ENDPOINT = '/api/calendar/events/';
const CALENDAR_OPTIONS_ENDPOINT = '/api/calendar/options/';

function toDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeCalendarEvent(row) {
  const start = toDate(row?.start_datetime);
  const end = toDate(row?.end_datetime);
  return {
    id: row?.id ?? null,
    provider: String(row?.provider || 'MANUAL').toUpperCase(),
    externalEventId: row?.external_event_id ?? '',
    subject: row?.subject ?? '',
    bodyPreview: row?.body_preview ?? '',
    startDatetime: row?.start_datetime ?? '',
    endDatetime: row?.end_datetime ?? '',
    start,
    end,
    timezone: row?.timezone ?? 'UTC',
    location: row?.location ?? '',
    meetingLink: row?.meeting_link ?? '',
    organizerName: row?.organizer_name ?? '',
    organizerEmail: row?.organizer_email ?? '',
    attendees: Array.isArray(row?.attendees) ? row.attendees.filter(Boolean) : [],
    status: row?.status ?? '',
    isCancelled: Boolean(row?.is_cancelled),
    dealId: row?.deal_id ?? row?.deal?.id ?? null,
    dealName: row?.deal?.name ?? '',
    createdAt: row?.created_at ?? '',
    updatedAt: row?.updated_at ?? '',
  };
}

function formatLocalDateTimeValue(value) {
  const parsed = toDate(value);
  if (!parsed) return '';
  const local = new Date(parsed.getTime() - (parsed.getTimezoneOffset() * 60000));
  return local.toISOString().slice(0, 16);
}

function buildEventPayload(form) {
  return {
    subject: String(form?.subject || '').trim(),
    body_preview: String(form?.bodyPreview || '').trim(),
    start_datetime: form?.startDatetime ? new Date(form.startDatetime).toISOString() : null,
    end_datetime: form?.endDatetime ? new Date(form.endDatetime).toISOString() : null,
    timezone: String(form?.timezone || 'UTC').trim() || 'UTC',
    location: String(form?.location || '').trim(),
    meeting_link: String(form?.meetingLink || '').trim(),
    organizer_name: String(form?.organizerName || 'Internal').trim() || 'Internal',
    organizer_email: String(form?.organizerEmail || '').trim(),
    attendees: Array.isArray(form?.attendees)
      ? form.attendees
      : String(form?.attendees || '')
        .split(/[,\n;]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    deal_id: form?.dealId || null,
  };
}

function getMonthRange(date) {
  const rangeStart = startOfWeek(startOfMonth(date), { weekStartsOn: 0 });
  const rangeEnd = endOfWeek(endOfMonth(date), { weekStartsOn: 0 });
  return {
    start: rangeStart.toISOString(),
    end: rangeEnd.toISOString(),
  };
}

function formatEventRange(event) {
  if (!event?.start || !event?.end) return 'Date not available';
  const sameDay = format(event.start, 'yyyy-MM-dd') === format(event.end, 'yyyy-MM-dd');
  if (sameDay) {
    return `${format(event.start, 'MMM d, yyyy')} | ${format(event.start, 'h:mm a')} - ${format(event.end, 'h:mm a')}`;
  }
  return `${format(event.start, 'MMM d, yyyy h:mm a')} - ${format(event.end, 'MMM d, yyyy h:mm a')}`;
}

function EventComponent({ event }) {
  return (
    <div className="cal-event-inner">
      <span className={`cal-provider-badge ${event.provider === 'MICROSOFT' ? 'is-microsoft' : 'is-manual'}`}>
        {event.provider}
      </span>
      <span className="cal-event-text">{event.title}</span>
    </div>
  );
}

function CalendarDashboard({ height = 680 }) {
  const api = useApi();
  const { toast, showToast, closeToast } = useToast();

  const [events, setEvents] = useState([]);
  const [dealOptions, setDealOptions] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false, event: null, initialDate: null });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadOptions = useCallback(async () => {
    try {
      const payload = await api.get(CALENDAR_OPTIONS_ENDPOINT);
      setDealOptions(Array.isArray(payload?.deals) ? payload.deals : []);
    } catch (err) {
      showToast({ type: 'error', title: 'Calendar failed', message: err.message || 'Could not load calendar deals.' });
    }
  }, [api, showToast]);

  const loadEvents = useCallback(async (date) => {
    setIsLoading(true);
    try {
      const range = getMonthRange(date);
      const payload = await api.get(`${CALENDAR_EVENTS_ENDPOINT}?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`);
      const normalized = Array.isArray(payload?.events)
        ? payload.events.map(normalizeCalendarEvent).filter((event) => event.id)
        : [];
      setEvents(normalized);
      setSelectedEvent((current) => normalized.find((event) => event.id === current?.id) || null);
    } catch (err) {
      showToast({ type: 'error', title: 'Calendar failed', message: err.message || 'Could not load calendar events.' });
    } finally {
      setIsLoading(false);
    }
  }, [api, showToast]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    loadEvents(currentDate);
  }, [currentDate, loadEvents]);

  const calendarEvents = useMemo(
    () => events.map((event) => ({
      id: event.id,
      title: event.subject,
      start: event.start || new Date(),
      end: event.end || event.start || new Date(),
      provider: event.provider,
      resource: event,
    })),
    [events]
  );

  const upcomingEvents = useMemo(
    () => [...events]
      .filter((event) => event.start)
      .sort((a, b) => a.start - b.start),
    [events]
  );

  const openCreateModal = useCallback((initialDate = null) => {
    setModalState({ isOpen: true, event: null, initialDate });
  }, []);

  const openEditModal = useCallback((event) => {
    if (!event || event.provider !== 'MANUAL') return;
    setModalState({ isOpen: true, event, initialDate: event.start || null });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({ isOpen: false, event: null, initialDate: null });
  }, []);

  const handleSaveEvent = useCallback(async (form) => {
    const payload = buildEventPayload(form);
    setIsSaving(true);
    try {
      if (modalState.event?.id) {
        await api.patch(`${CALENDAR_EVENTS_ENDPOINT}${modalState.event.id}/`, payload);
        showToast({ type: 'success', title: 'Event updated', message: `"${payload.subject}" has been updated.` });
      } else {
        await api.post(CALENDAR_EVENTS_ENDPOINT, payload);
        showToast({ type: 'success', title: 'Event created', message: `"${payload.subject}" has been added to the calendar.` });
      }
      closeModal();
      await loadEvents(currentDate);
    } catch (err) {
      showToast({ type: 'error', title: 'Save failed', message: err.message || 'Could not save the calendar event.' });
    } finally {
      setIsSaving(false);
    }
  }, [api, closeModal, currentDate, loadEvents, modalState.event, showToast]);

  const handleDeleteEvent = useCallback(async (event) => {
    if (!event?.id || event.provider !== 'MANUAL') return;
    setIsSaving(true);
    try {
      await api.delete(`${CALENDAR_EVENTS_ENDPOINT}${event.id}/`);
      showToast({ type: 'success', title: 'Event cancelled', message: `"${event.subject}" has been removed from the calendar.` });
      if (selectedEvent?.id === event.id) {
        setSelectedEvent(null);
      }
      closeModal();
      await loadEvents(currentDate);
    } catch (err) {
      showToast({ type: 'error', title: 'Delete failed', message: err.message || 'Could not cancel the calendar event.' });
    } finally {
      setIsSaving(false);
    }
  }, [api, closeModal, currentDate, loadEvents, selectedEvent, showToast]);

  const handleSelectSlot = useCallback(({ start }) => {
    setSelectedEvent(null);
    openCreateModal(start);
  }, [openCreateModal]);

  const handleSelectEvent = useCallback((calendarEvent) => {
    if (!calendarEvent) {
      setSelectedEvent(null);
      return;
    }
    setSelectedEvent(calendarEvent?.resource || normalizeCalendarEvent(calendarEvent));
  }, []);

  const CustomToolbar = ({ date, onNavigate }) => (
    <div className="cal-toolbar">
      <div className="cal-toolbar-left">
        <button className="cal-nav-btn" onClick={() => onNavigate('PREV')} aria-label="Previous">
          <ChevronLeft />
        </button>
        <button className="cal-nav-btn" onClick={() => onNavigate('NEXT')} aria-label="Next">
          <ChevronRight />
        </button>
        <span className="cal-toolbar-label">{format(date, 'MMMM yyyy')}</span>
      </div>

      <div className="cal-toolbar-actions">
        <button className="cal-add-btn" onClick={() => openCreateModal()}>
          <PlusIcon />
          <span>New Event</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="calendar-dashboard">
      <Calendar
        localizer={localizer}
        events={calendarEvents}
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
        eventPropGetter={(event) => ({
          className: `cal-event ${event.provider === 'MICROSOFT' ? 'is-microsoft' : 'is-manual'}`,
        })}
      />

      <div className="cal-upcoming-section">
        <div className="cal-upcoming-header">
          <span>Upcoming events</span>
          {isLoading && <span className="cal-inline-note">Refreshing...</span>}
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="cal-empty-state">No calendar events in this period yet.</div>
        ) : (
          <div className="cal-upcoming-list">
            {upcomingEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                className={`cal-upcoming-card ${selectedEvent?.id === event.id ? 'is-selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                }}
              >
                <div className="cal-upcoming-top">
                  <span className="cal-upcoming-title">{event.subject || 'Untitled event'}</span>
                  <span className={`cal-provider-badge ${event.provider === 'MICROSOFT' ? 'is-microsoft' : 'is-manual'}`}>
                    {event.provider}
                  </span>
                </div>
                <div className="cal-upcoming-meta">{formatEventRange(event)}</div>
                {event.location && <div className="cal-upcoming-meta">{event.location}</div>}
                {event.dealName && <div className="cal-upcoming-meta">Deal: {event.dealName}</div>}
                {event.meetingLink && (
                  <a
                    className="cal-upcoming-link"
                    href={event.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open meeting link
                  </a>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedEvent && (
        <div className="cal-event-popup" onClick={(e) => e.stopPropagation()}>
          <div className="cal-popup-header">
            <div className="cal-popup-title-block">
              <span className="cal-popup-title">{selectedEvent.subject}</span>
              <span className={`cal-provider-badge ${selectedEvent.provider === 'MICROSOFT' ? 'is-microsoft' : 'is-manual'}`}>
                {selectedEvent.provider}
              </span>
            </div>
            <button className="cal-popup-close" onClick={() => setSelectedEvent(null)} aria-label="Close">
              x
            </button>
          </div>

          <div className="cal-popup-time">{formatEventRange(selectedEvent)}</div>
          {selectedEvent.location && <div className="cal-popup-line">{selectedEvent.location}</div>}
          {selectedEvent.dealName && <div className="cal-popup-line">Linked deal: {selectedEvent.dealName}</div>}
          {selectedEvent.organizerName && <div className="cal-popup-line">Organizer: {selectedEvent.organizerName}</div>}
          {selectedEvent.bodyPreview && <div className="cal-popup-notes">{selectedEvent.bodyPreview}</div>}
          {selectedEvent.meetingLink && (
            <a className="cal-popup-link" href={selectedEvent.meetingLink} target="_blank" rel="noreferrer">
              Open meeting link
            </a>
          )}

          <div className="cal-popup-actions">
            {selectedEvent.provider === 'MANUAL' && (
              <button className="cal-popup-action-btn" onClick={() => openEditModal(selectedEvent)}>
                <EditIcon />
                <span>Edit</span>
              </button>
            )}
            {selectedEvent.provider === 'MANUAL' && (
              <button className="cal-popup-action-btn danger" onClick={() => handleDeleteEvent(selectedEvent)}>
                <TrashIcon />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      )}

      {modalState.isOpen && (
        <AddEventModal
          dealOptions={dealOptions}
          event={modalState.event}
          initialDate={modalState.initialDate}
          isSaving={isSaving}
          onClose={closeModal}
          onDelete={modalState.event ? () => handleDeleteEvent(modalState.event) : null}
          onSave={handleSaveEvent}
        />
      )}

      {toast && (
        <Toast
          key={toast.key}
          title={toast.title}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={closeToast}
        />
      )}
    </div>
  );
}

export default CalendarDashboard;
