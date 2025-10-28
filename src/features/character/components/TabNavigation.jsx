import { useState, useEffect, useRef } from 'react';

const TabNavigation = ({ tabs, navClassName = 'tab-nav', btnClassName = 'tab-btn' }) => {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [isMobile, setIsMobile] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

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
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  // Handle touch move
  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNextTab();
    }
    if (isRightSwipe) {
      goToPrevTab();
    }
  };

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
            ◀
          </button>
          <div className="tab-current">
            <span className="tab-current-label">{currentTab?.label}</span>
          </div>
          <button 
            className="tab-arrow-btn tab-arrow-right"
            onClick={goToNextTab}
            aria-label="Next tab"
          >
            ▶
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
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
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
