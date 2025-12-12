import { useState, useEffect } from 'react';

const TabNavigation = ({ tabs, navClassName = 'tab-nav', btnClassName = 'tab-btn' }) => {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get current tab index
  const getCurrentTabIndex = () => {
    return tabs.findIndex(tab => tab.id === activeTab);
  };

  // Navigate to previous tab
  const goToPrevTab = () => {
    const currentIndex = getCurrentTabIndex();
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
    setActiveTab(tabs[prevIndex].id);
  };

  // Navigate to next tab
  const goToNextTab = () => {
    const currentIndex = getCurrentTabIndex();
    const nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
    setActiveTab(tabs[nextIndex].id);
  };

  // Handle touch start
  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <>
      {isMobile ? (
        // Mobile: Single tab with arrows
        <div className="tab-nav-mobile">
          <button 
            className="tab-arrow-btn tab-arrow-left"
            onClick={goToPrevTab}
            aria-label="Previous tab"
          >
            ←
          </button>
          <div className="tab-current">
            <span className="tab-current-label">{currentTab?.label}</span>
          </div>
          <button 
            className="tab-arrow-btn tab-arrow-right"
            onClick={goToNextTab}
            aria-label="Next tab"
          >
            →
          </button>
        </div>
      ) : (
        // Desktop: All tabs visible
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
      )}
      
      <div 
        className="tab-content-wrapper"
      >
        <div
          className={`${currentTab?.contentClassName || 'tab-content'} active`}
        >
          {currentTab?.content}
        </div>
      </div>
    </>
  );
};

export default TabNavigation;
