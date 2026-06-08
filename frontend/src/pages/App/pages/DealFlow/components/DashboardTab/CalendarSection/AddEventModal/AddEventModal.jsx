import React, { useState } from 'react';
import { CloseIcon } from '../../../../../../../../components/Icons/InteractiveIcons';
import { ChevronDownIcon } from '../../../../../../../../components/Icons/DirectionIcons';
import DateInputWithPicker from '../../../../../../../../components/DateComponents/DateInput';
import './AddEventModal.css';

export default function AddEventModal({ onClose, onAdd, initialDate }) {
  const base = initialDate instanceof Date && !isNaN(initialDate) ? initialDate : new Date();

  const [title, setTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState(base);
  const [reminderMinutes, setReminderMinutes] = useState('15');

  const isValid = title.trim().length > 0 && selectedDate instanceof Date && !isNaN(selectedDate);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;

    const start = new Date(selectedDate);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    onAdd({
      title: title.trim(),
      start,
      end,
      reminderMinutes: Number(reminderMinutes),
    });
  };

  return (
    <div className="ae-backdrop" onClick={onClose}>
      <div className="ae-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ae-header">
          <button className="ae-close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
          <h2 className="ae-title">New Event</h2>
        </div>

        <form className="ae-body" onSubmit={handleSubmit}>
          <div className="ae-field">
            <label className="ae-label">
              Event Description <span className="ae-required">*</span>
            </label>
            <input
              className="ae-input"
              placeholder="e.g. Team Meeting"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="ae-field">
            <label className="ae-label">
              Date <span className="ae-required">*</span>
            </label>
            <DateInputWithPicker
              initialDate={selectedDate}
              onDateChange={setSelectedDate}
              isSingle={true}
              dateFormat="DD/MM/YYYY"
            />
          </div>

          <div className="ae-field">
            <label className="ae-label">Reminder</label>
            <div className="ae-select-wrapper">
              <select
                className="ae-input ae-select"
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(e.target.value)}
              >
                <option value="0">No reminder</option>
                <option value="15">15 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
                <option value="1440">1 day before</option>
              </select>
              <span className="ae-select-chevron"><ChevronDownIcon /></span>
            </div>
          </div>

          <div className="ae-footer">
            <button type="button" className="ae-btn ae-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ae-btn ae-btn-primary" disabled={!isValid}>
              Add Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
