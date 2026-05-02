const AdminHeader = ({ onBack, onRefresh, isRefreshing, isSubmitting }) => {
  return (
    <header className="admin-header">
      <button onClick={onBack} className="back-link">◄ Back</button>
      <h1>⚙️ Admin - Meos05</h1>
      <button
        onClick={onRefresh}
        className="refresh-button"
        disabled={isRefreshing || isSubmitting}
        title="Refresh data from database"
      >
        {isRefreshing ? '⟳' : '↻'}
      </button>
    </header>
  );
};

export default AdminHeader;
