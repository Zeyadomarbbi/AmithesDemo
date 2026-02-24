import React from "react";
import { ErrorIcon, InfoIcon, CloseToastIcon } from "./Icons";
import "./Toast.css"; // Reuse existing styles

export default function Prompt({ 
    title, 
    message, 
    onCancel, 
    onConfirm, 
    type = "error", 
    confirmLabel = "Delete", 
    cancelLabel = "Cancel" 
}) {
    const renderIcon = () => {
        switch (type) {
            case "error": return <ErrorIcon />;
            case "success": return <InfoIcon />;
            default: return <InfoIcon />;
        }
    };

    return (
        <div className="pop-up-toast-backdrop">
            <div className="pop-up-toast prompt-variant">
                <div className="pop-up-toast-content">
                    <div className="pop-up-toast-main">
                        <div className={`pop-up-toast-icon pop-up-toast-icon-${type}`}>
                            {renderIcon()}
                        </div>

                        <div className="pop-up-toast-text">
                            <div className="pop-up-toast-title">{title}</div>
                            <div className="pop-up-toast-message">{message}</div>
                        </div>
                    </div>

                    <div className="prompt-actions">
                        <button 
                            className="prompt-btn-cancel" 
                            onClick={onCancel}
                        >
                            {cancelLabel}
                        </button>
                        <button 
                            className={`prompt-btn-confirm prompt-btn-${type}`} 
                            onClick={onConfirm}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>

                <button className="pop-up-toast-close" onClick={onCancel}>
                    <CloseToastIcon />
                </button>
            </div>
        </div>
    );
}