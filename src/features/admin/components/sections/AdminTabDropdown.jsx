import { ADMIN_TABS } from '../../hooks/useAdminTabs';

const AdminTabDropdown = ({
  activeTab,
  activeTabLabel,
  dropdownOpen,
  onToggle,
  onSelect
}) => {
  return (
    <nav className="admin-dropdown">
      <button
        className="dropdown-toggle"
        onClick={onToggle}
      >
        <span className="dropdown-current">{activeTabLabel}</span>
        <span className="dropdown-arrow">{dropdownOpen ? '▲' : '▼'}</span>
      </button>

      {dropdownOpen && (
        <div className="dropdown-menu">
          {ADMIN_TABS.map(tab => (
            <button
              key={tab.id}
              className={`dropdown-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onSelect(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};

export default AdminTabDropdown;
