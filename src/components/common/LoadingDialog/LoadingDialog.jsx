import './LoadingDialog.css';

const LoadingDialog = () => {
  return (
    <div className="loading-dialog-overlay">
      <div className="loading-dialog-content">
        <div className="loading-dialog-text">Loading Meo's Journey...</div>
        <div className="loading-dialog-dots">
          <span className="loading-dot"></span>
          <span className="loading-dot"></span>
          <span className="loading-dot"></span>
        </div>
      </div>
    </div>
  );
};

export default LoadingDialog;
