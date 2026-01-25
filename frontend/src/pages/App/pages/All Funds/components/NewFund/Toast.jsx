import React, { useEffect } from "react";
import "./Toast.css";

export default function Toast({ title, message, onClose, duration = 4000 }) {
  // auto-hide after duration
  useEffect(() => {
    if (!duration) return;
    const id = setTimeout(onClose, duration);
    return () => clearTimeout(id);
  }, [duration, onClose]);

  return (
    <div className="toast-backdrop">
      <div className="toast">
        <div className="toast-main">
          <div className="toast-icon">
            {/* ✅ check-circle SVG from your Figma */}
            <svg
              width="17"
              height="17"
              viewBox="0 0 17 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.25 1.5C4.52208 1.5 1.5 4.52208 1.5 8.25C1.5 11.9779 4.52208 15 8.25 15C11.9779 15 15 11.9779 15 8.25C15 4.52208 11.9779 1.5 8.25 1.5ZM0 8.25C0 3.69365 3.69365 0 8.25 0C12.8063 0 16.5 3.69365 16.5 8.25C16.5 12.8063 12.8063 16.5 8.25 16.5C3.69365 16.5 0 12.8063 0 8.25ZM12.1553 5.46967C12.4482 5.76256 12.4482 6.23744 12.1553 6.53033L7.65533 11.0303C7.36244 11.3232 6.88756 11.3232 6.59467 11.0303L4.34467 8.78033C4.05178 8.48744 4.05178 8.01256 4.34467 7.71967C4.63756 7.42678 5.11244 7.42678 5.40533 7.71967L7.125 9.43934L11.0947 5.46967C11.3876 5.17678 11.8624 5.17678 12.1553 5.46967Z"
                fill="#22C55E"
              />
            </svg>
          </div>

          <div className="toast-text">
            <div className="toast-title">{title}</div>
            <div className="toast-message">{message}</div>
          </div>
        </div>

        <button
          className="toast-close"
          type="button"
          aria-label="Close notification"
          onClick={onClose}
        >
          ×
        </button>
      </div>
    </div>
  );
}
