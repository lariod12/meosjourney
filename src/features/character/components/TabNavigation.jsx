import { useState, useEffect, useMemo, useCallback, cloneElement, isValidElement } from 'react';

const TabNavigation = ({ tabs, navClassName = 'tab-nav', btnClassName = 'tab-btn', keepAlive = false }) => {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [isMobile, setIsMobile] = useState(false);
  const [mountedTabs, setMountedTabs] = useState(() => new Set([tabs[0]?.id].filter(Boolean)));

  useEffect(() => {
    // If tabs array changes (rare), ensure active tab is still valid
    if (!tabs || tabs.length === 0) return;
    const exists = tabs.some((t) => t.id === activeTab);
    if (!exists) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

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

  useEffect(() => {
    if (!keepAlive) return;
    if (!activeTab) return;
    setMountedTabs((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [keepAlive, activeTab]);

  // Handle touch start
  const currentTab = tabs.find(tab => tab.id === activeTab);

  const renderTabContent = useCallback((content, active) => {
    if (isValidElement(content)) {
      return cloneElement(content, { isActive: active });
    }
    return content;
  }, []);

  const mountedTabList = useMemo(() => {
    if (!keepAlive) return [];
    return tabs.filter((t) => mountedTabs.has(t.id));
  }, [keepAlive, tabs, mountedTabs]);

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
        {keepAlive ? (
          mountedTabList.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <div
                key={tab.id}
                className={`${tab.contentClassName || 'tab-content'} ${active ? 'active' : ''}`}
                style={{ display: active ? 'block' : 'none' }}
                aria-hidden={!active}
              >
                {renderTabContent(tab.content, active)}
              </div>
            );
          })
        ) : (
          <div
            className={`${currentTab?.contentClassName || 'tab-content'} active`}
          >
            {currentTab?.content}
          </div>
        )}
      </div>
    </>
  );
};

export default TabNavigation;
