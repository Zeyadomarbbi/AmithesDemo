import React, { useEffect } from "react";
import Toast from "../../../../../../components/Toast/Toast";
import { useToast } from "../../../../../../components/Toast/useToast";
import { useDealEventsBackend } from "../../Deals_backend_work";
import "./EventsTab.css";

function formatDate(value) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB");
}

export default function EventsTab({ dealId }) {
  const { events, isLoading, error } = useDealEventsBackend(dealId);
  const { toast, showToast, closeToast } = useToast();

  useEffect(() => {
    if (!error) return;
    showToast({
      type: "error",
      title: "Events failed",
      message: error,
    });
  }, [error, showToast]);

  return (
    <div className="deal-subtab-shell">
      <div className="deal-subtab-header">
        <div>
          <h3 className="deal-subtab-title">Events</h3>
          <p className="deal-subtab-subtitle">Timeline and documents linked to this deal.</p>
        </div>
        <span className="deal-subtab-badge">{events.length} item{events.length === 1 ? "" : "s"}</span>
      </div>

      {isLoading ? (
        <div className="deal-subtab-empty">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="deal-subtab-empty">No events available for this deal yet.</div>
      ) : (
        <div className="deal-subtab-list">
          {events.map((event) => (
            <article key={event.id} className="deal-subtab-card">
              <div className="deal-subtab-card-top">
                <div>
                  <h4 className="deal-subtab-card-title">{event.title || "Untitled event"}</h4>
                  <p className="deal-subtab-card-meta">
                    {formatDate(event.eventDateObject || event.eventDate)}
                    {event.eventTypeName ? ` • ${event.eventTypeName}` : ""}
                  </p>
                </div>
                <span className="deal-subtab-pill">{event.documentsCount || 0} docs</span>
              </div>
              <p className="deal-subtab-card-body">{event.description || "No description provided."}</p>
            </article>
          ))}
        </div>
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
