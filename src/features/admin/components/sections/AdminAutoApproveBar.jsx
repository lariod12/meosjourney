const AdminAutoApproveBar = ({ autoApprove, onToggle, disabled }) => {
  return (
    <div className="auto-approve-bar">
      <div className="auto-approve-toggle">
        <label className="switch">
          <input
            type="checkbox"
            checked={autoApprove}
            onChange={onToggle}
            disabled={disabled}
          />
          <span className="slider" />
        </label>
        <span className="toggle-text">Auto approve tasks</span>
      </div>
    </div>
  );
};

export default AdminAutoApproveBar;
