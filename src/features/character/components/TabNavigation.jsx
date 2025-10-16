import { useState } from 'react';

const TabNavigation = ({ tabs, navClassName = 'tab-nav', btnClassName = 'tab-btn' }) => {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <>
      <div className={navClassName}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${btnClassName} ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            data-tab={tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-content-wrapper">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`${tab.contentClassName || 'tab-content'} ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </>
  );
};

export default TabNavigation;
