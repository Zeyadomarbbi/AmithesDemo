import React, { useMemo, useState } from 'react';
import { CloseIcon, TrashIcon } from '../../../../../../../../components/Icons/InteractiveIcons';
import './AddEventModal.css';

function toLocalDateTimeValue(value, fallbackDate) {
  const parsed = value ? new Date(value) : (fallbackDate instanceof Date ? fallbackDate : null);
  if (!parsed || Number.isNaN(parsed.getTime())) return '';
  const adjusted = new Date(parsed.getTime() - (parsed.getTimezoneOffset() * 60000));
  return adjusted.toISOString().slice(0, 16);
}

function buildInitialState(event, initialDate) {
  const baseDate = initialDate instanceof Date && !Number.isNaN(initialDate.getTime())
    ? initialDate
    : new Date();

  const defaultStart = new Date(baseDate);
  defaultStart.setHours(9, 0, 0, 0);

  const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000);

  return {
    subject: event?.subject || '',
    startDatetime: toLocalDateTimeValue(event?.startDatetime, defaultStart),
    endDatetime: toLocalDateTimeValue(event?.endDatetime, defaultEnd),
    timezone: event?.timezone || 'UTC',
    location: event?.location || '',
    meetingLink: event?.meetingLink || '',
    bodyPreview: event?.bodyPreview || '',
    dealId: event?.dealId || '',
    attendees: Array.isArray(event?.attendees) ? event.attendees.join(', ') : '',
    organizerName: event?.organizerName || 'Internal',
    organizerEmail: event?.organizerEmail || '',
  };
}

export default function AddEventModal({
  event,
  initialDate,
  dealOptions,
  isSaving,
  onClose,
  onDelete,
  onSave,
}) {
  const [form, setForm] = useState(() => buildInitialState(event, initialDate));

  const isEditing = Boolean(event?.id);
  const startDate = form.startDatetime ? new Date(form.startDatetime) : null;
  const endDate = form.endDatetime ? new Date(form.endDatetime) : null;
  const hasValidRange = startDate && endDate && !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate > startDate;

  const isValid = useMemo(
    () => form.subject.trim().length > 0 && hasValidRange,
    [form.subject, hasValidRange]
  );

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid || isSaving) return;
    onSave(form);
  };

  return (
    <div className="ae-backdrop" onClick={onClose}>
      <div className="ae-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ae-header">
          <div>
            <h2 className="ae-title">{isEditing ? 'Edit Event' : 'New Event'}</h2>
            <p className="ae-subtitle">Add a manual calendar event and optionally link it to a deal.</p>
          </div>
          <button className="ae-close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <form className="ae-body" onSubmit={handleSubmit}>
          <div className="ae-field">
            <label className="ae-label">
              Subject <span className="ae-required">*</span>
            </label>
            <input
              className="ae-input"
              value={form.subject}
              onChange={(e) => updateField('subject', e.target.value)}
              placeholder="e.g. PayNova IC Meeting"
              autoFocus
            />
          </div>

          <div className="ae-row">
            <div className="ae-field">
              <label className="ae-label">
                Start <span className="ae-required">*</span>
              </label>
              <input
                className="ae-input"
                type="datetime-local"
                value={form.startDatetime}
                onChange={(e) => updateField('startDatetime', e.target.value)}
              />
            </div>

            <div className="ae-field">
              <label className="ae-label">
                End <span className="ae-required">*</span>
              </label>
              <input
                className="ae-input"
                type="datetime-local"
                value={form.endDatetime}
                onChange={(e) => updateField('endDatetime', e.target.value)}
              />
            </div>
          </div>

          <div className="ae-row">
            <div className="ae-field">
              <label className="ae-label">Timezone</label>
              <input
                className="ae-input"
                value={form.timezone}
                onChange={(e) => updateField('timezone', e.target.value)}
                placeholder="UTC"
              />
            </div>

            <div className="ae-field">
              <label className="ae-label">Linked Deal</label>
              <select
                className="ae-input ae-select"
                value={form.dealId}
                onChange={(e) => updateField('dealId', e.target.value)}
              >
                <option value="">No linked deal</option>
                {(dealOptions || []).map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.name}{deal.code ? ` (${deal.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ae-row">
            <div className="ae-field">
              <label className="ae-label">Location</label>
              <input
                className="ae-input"
                value={form.location}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="Microsoft Teams"
              />
            </div>

            <div className="ae-field">
              <label className="ae-label">Meeting link</label>
              <input
                className="ae-input"
                value={form.meetingLink}
                onChange={(e) => updateField('meetingLink', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="ae-row">
            <div className="ae-field">
              <label className="ae-label">Organizer</label>
              <input
                className="ae-input"
                value={form.organizerName}
                onChange={(e) => updateField('organizerName', e.target.value)}
                placeholder="Internal"
              />
            </div>

            <div className="ae-field">
              <label className="ae-label">Organizer email</label>
              <input
                className="ae-input"
                type="email"
                value={form.organizerEmail}
                onChange={(e) => updateField('organizerEmail', e.target.value)}
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="ae-field">
            <label className="ae-label">Attendees</label>
            <input
              className="ae-input"
              value={form.attendees}
              onChange={(e) => updateField('attendees', e.target.value)}
              placeholder="Comma-separated names or emails"
            />
          </div>

          <div className="ae-field">
            <label className="ae-label">Description / Notes</label>
            <textarea
              className="ae-textarea"
              value={form.bodyPreview}
              onChange={(e) => updateField('bodyPreview', e.target.value)}
              placeholder="Discuss IC memo and next steps."
            />
          </div>

          {!hasValidRange && form.startDatetime && form.endDatetime && (
            <div className="ae-info-note">End datetime must be after start datetime.</div>
          )}

          <div className="ae-footer">
            {isEditing && onDelete ? (
              <button type="button" className="ae-delete-btn" onClick={onDelete} disabled={isSaving}>
                <TrashIcon />
                <span>Delete</span>
              </button>
            ) : (
              <button type="button" className="ae-btn ae-btn-secondary" onClick={onClose} disabled={isSaving}>
                Cancel
              </button>
            )}

            {isEditing && (
              <button type="button" className="ae-btn ae-btn-secondary" onClick={onClose} disabled={isSaving}>
                Close
              </button>
            )}

            <button type="submit" className="ae-btn ae-btn-primary" disabled={!isValid || isSaving}>
              {isSaving ? 'Saving...' : (isEditing ? 'Save changes' : 'Create event')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
