import React from 'react';
import { useAuth } from './AuthContext';

/**
 * Wraps elements that should only be visible/interactive for Admins.
 * @param {boolean} showMode - If 'hide', the element is removed. If 'disable', it's grayed out.
 */
export const PermissionGate = ({ children, showMode = 'hide', fallback = null }) => {
  const { canEdit, loading } = useAuth();

  if (loading) return null;

  if (!canEdit) {
    if (showMode === 'hide') return fallback;
    
    // Disable mode: clones children and adds disabled prop + style
    return React.Children.map(children, child => {
      return React.cloneElement(child, {
        disabled: true,
        style: { ...child.props.style, opacity: 0.5, pointerEvents: 'none' }
      });
    });
  }

  return <>{children}</>;
};