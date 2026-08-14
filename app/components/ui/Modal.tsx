"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

interface ModalProps {
  title: string;
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  footer?: ReactNode;
}

export default function Modal({
  title,
  children,
  isOpen,
  onClose,
  footer,
}: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="app-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="app-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="app-modal-header">
          <h2 id="app-modal-title">{title}</h2>
          <button
            type="button"
            className="app-modal-close"
            aria-label="Close modal"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>

        <div className="app-modal-body">{children}</div>

        {footer && <footer className="app-modal-footer">{footer}</footer>}
      </section>
    </div>
  );
}
