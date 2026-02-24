import React, { useEffect } from "react";
import { 
  ErrorIcon, 
  InfoIcon, 
  CloseToastIcon, 
} from "./Icons";
import "./Toast.css";

export default function Toast({ title, message, onClose, duration = 4000, type = "success" }) {
  
  useEffect(() => {
    if (!duration) return;
    const id = setTimeout(onClose, duration);
    return () => clearTimeout(id);
  }, [duration, onClose]);

  const renderIcon = () => {
    switch (type) {
      case "error":
        return <ErrorIcon />;
      case "success":
        return <InfoIcon />;
      default:
        return <InfoIcon />;
    }
  };

  return (
    <div className={`pop-up-toast-backdrop pop-up-toast-${type}`}>
      <div className="pop-up-toast">
        <div className="pop-up-toast-main">
          <div className={`pop-up-toast-icon pop-up-toast-icon-${type}`}>
            {renderIcon()}
          </div>

          <div className="pop-up-toast-text">
            <div className="pop-up-toast-title">{title}</div>
            <div className="pop-up-toast-message">{message}</div>
          </div>
        </div>

        <button
          className="pop-up-toast-close"
          type="button"
          aria-label="Close notification"
          onClick={onClose}
        >
          <CloseToastIcon/>
        </button>
      </div>
    </div>
  );
}