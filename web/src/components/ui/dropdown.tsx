"use client";
import React, { useState, useEffect, useRef } from "react";
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

// Icon helpers removed — keep dropdown minimal to avoid unused-symbol TS errors

export interface DropdownMenuProps {
  children: ReactNode;
  trigger: ReactNode;
}

export const DropdownMenu = ({ children, trigger }: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideTrigger = dropdownRef.current && dropdownRef.current.contains(target);
      const clickedInsideMenu = menuRef.current && menuRef.current.contains(target);
      if (!clickedInsideTrigger && !clickedInsideMenu) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    const handleCloseEvent = () => setIsOpen(false);
    document.addEventListener('dropdown-close', handleCloseEvent as EventListener);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener('dropdown-close', handleCloseEvent as EventListener);
    };
  }, []);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const top = rect.bottom + window.scrollY + 8;
      const preferredLeft = rect.left + window.scrollX;
      const menuWidth = 280;
      // clamp left so the menu stays within viewport with an 8px margin
      const left = Math.max(8, Math.min(preferredLeft, window.innerWidth - menuWidth - 8));
      setMenuStyle({ position: 'absolute', top: top, left: left, width: menuWidth, maxHeight: '70vh', overflowY: 'auto' });
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block', textAlign: 'left' }} ref={dropdownRef}>
      <div ref={triggerRef} onClick={handleTriggerClick} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={(el) => { menuRef.current = el }}
          role="menu"
          aria-orientation="vertical"
          style={{
            position: 'absolute',
            ...menuStyle,
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
            padding: 8,
            zIndex: 9999,
            color: 'var(--text-2)',
            boxSizing: 'border-box'
          }}
        >
          {children}
        </div>,
        document.body
      )}
    </div>
  );
};

interface DropdownMenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
}

export const DropdownMenuItem = ({ children, onClick, active = false }: DropdownMenuItemProps) => (
  <button
    onClick={(e) => {
      e.preventDefault();
      if (onClick) onClick();
      try {
        if (typeof document !== 'undefined') {
          document.dispatchEvent(new CustomEvent('dropdown-close'));
        }
      } catch (err) {
        // ignore
      }
    }}
    role="menuitem"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      padding: '8px 10px',
      borderRadius: 'var(--radius)',
      background: active ? 'var(--surface-2)' : 'transparent',
      color: 'var(--text-2)',
      fontWeight: 600,
      textAlign: 'left',
      border: 'none',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => { if (!active) (e.currentTarget.style.background = 'var(--surface-3)'); }}
    onMouseLeave={(e) => { if (!active) (e.currentTarget.style.background = 'transparent'); }}
  >
    {children}
  </button>
);

export const DropdownMenuSeparator = () => <div className="my-2 h-px bg-zinc-200 dark:bg-zinc-700" />;

export default DropdownMenu;
