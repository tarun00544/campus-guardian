import { QrCode, X } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

const LeaveQrCode = ({ open, onClose, token, nextScan, destination, scanCount }) => {
  if (!open || !token) return null;

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{ background: 'rgba(0,0,0,.55)' }}
      onClick={onClose}
    >
      <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title"><QrCode size={18} className="me-2" />Leave QR — {nextScan}</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
          </div>
          <div className="modal-body text-center">
            <p className="small text-muted-cg">
              Show this QR to authorized campus security/admin. It can be used only twice: OUT first, then IN.
            </p>
            <div className="d-flex justify-content-center py-2 overflow-auto">
              <QRCodeCanvas value={token} size={250} includeMargin level="H" />
            </div>
            <div className="small mt-2"><strong>{destination || 'Campus leave'}</strong></div>
            <div className="small text-muted-cg">Scans used: {scanCount}/2</div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-guard-outline" onClick={onClose}>
              <X size={15} className="me-1" /> Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveQrCode;
