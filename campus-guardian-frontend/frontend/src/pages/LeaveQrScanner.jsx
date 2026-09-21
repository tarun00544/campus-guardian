import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, ScanLine, XCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { scanLeaveQr } from '../services/leaveService';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';

const LeaveQrScanner = () => {
  const { user } = useAuth();
  const scannerRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const stop = async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try { await scanner.stop(); } catch {}
    try { scanner.clear(); } catch {}
    scannerRef.current = null;
    setRunning(false);
  };

  const handleScan = async (decodedText) => {
    if (working) return;
    setWorking(true);
    setError('');
    try {
      const data = await scanLeaveQr(decodedText);
      setResult(data);
      await stop();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally { setWorking(false); }
  };

  const start = async () => {
    setError(''); setResult(null);
    await stop();
    const scanner = new Html5Qrcode('leave-qr-reader');
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScan,
        () => {}
      );
      setRunning(true);
    } catch (err) {
      setError('Camera could not start. Allow camera permission and try again.');
      scannerRef.current = null;
    }
  };

  useEffect(() => () => { stop(); }, []);

  if (!['security', 'admin'].includes(user?.role)) {
    return <div className="container cg-page"><div className="alert alert-danger">Only security or admin can scan leave QR codes.</div></div>;
  }

  return (
    <div className="container cg-page" style={{ maxWidth: 720 }}>
      <h1 className="cg-page-title">Leave QR scanner</h1>
      <p className="cg-page-sub">Scan an approved student's QR. First successful scan is OUT/departure; second is IN/return. After the second scan the QR expires.</p>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}
      {result && (
        <div className="alert alert-success">
          <div className="d-flex gap-2 align-items-start">
            <CheckCircle2 size={20} />
            <div>
              <strong>{result.scanType} scan successful</strong>
              <div className="small mt-1">Student: {result.student?.name || '—'}</div>
              <div className="small">Destination: {result.destination || '—'}</div>
              <div className="small">Scans used: {result.scanCount}/2 {result.qrExpired ? '— QR expired' : ''}</div>
            </div>
          </div>
        </div>
      )}

      <div className="cg-card">
        <div className="cg-card-body text-center">
          <div id="leave-qr-reader" style={{ width: '100%', maxWidth: 420, margin: '0 auto' }} />
          {!running && (
            <div className="py-4">
              <ScanLine size={44} className="text-muted mb-3" />
              <p className="small text-muted-cg">Use the phone camera to scan the student's approved leave QR.</p>
            </div>
          )}
          <div className="d-flex justify-content-center gap-2 mt-3">
            {!running ? (
              <button className="btn btn-guard" type="button" onClick={start} disabled={working}><Camera size={16} className="me-2" />Start scanner</button>
            ) : (
              <button className="btn btn-guard-outline" type="button" onClick={stop}><XCircle size={16} className="me-2" />Stop scanner</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveQrScanner;
