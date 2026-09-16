import { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ open, title, children, footer, onClose }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="cg-modal-scrim" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="cg-modal">
        <div className="cg-modal-head">
          <h2 className="h6 mb-0">{title}</h2>
          <button type="button" className="btn btn-sm btn-guard-outline" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="cg-modal-body">{children}</div>
        {footer && <div className="cg-modal-foot">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
