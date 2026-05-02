import IconRenderer from '../../../../components/IconRenderer/IconRenderer';

const UserPageHeader = ({ onHome, onRefresh, isRefreshing, isSubmitting, formattedDate }) => {
  return (
    <header className="notes-header">
      <button
        onClick={onHome}
        className="userpage-home-button"
        aria-label="Go to home"
      >
        <IconRenderer iconName="FaHome" size={24} />
      </button>
      <h1>✎ Daily Update</h1>
      <button
        onClick={onRefresh}
        className="refresh-button"
        disabled={isRefreshing || isSubmitting}
        title="Refresh data from database"
      >
        {isRefreshing ? '⟳' : '↻'}
      </button>
      <div className="subtitle">
        {formattedDate}
      </div>
    </header>
  );
};

export default UserPageHeader;
