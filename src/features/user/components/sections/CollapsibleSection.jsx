const CollapsibleSection = ({ title, isExpanded, onToggle, children }) => {
  return (
    <div className="form-section">
      <h2
        className="section-title clickable"
        onClick={onToggle}
      >
        {isExpanded ? '▼' : '▸'} {title}
      </h2>

      {isExpanded && (
        <div className="section-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
