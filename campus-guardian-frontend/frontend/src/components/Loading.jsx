const Loading = ({ label = 'Loading...', rows = 0, compact = false }) => {
  if (rows > 0) {
    return (
      <div aria-busy="true" aria-live="polite">
        <span className="visually-hidden">{label}</span>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="cg-card mb-3">
            <div className="cg-card-body">
              <div className="cg-skeleton mb-2" style={{ height: 14, width: '45%' }} />
              <div className="cg-skeleton mb-2" style={{ height: 10, width: '80%' }} />
              <div className="cg-skeleton" style={{ height: 10, width: '60%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`d-flex align-items-center gap-2 text-muted-cg ${compact ? '' : 'py-5 justify-content-center'}`} aria-live="polite">
      <span className="spinner-border spinner-border-sm text-secondary" role="status" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
};

export default Loading;
