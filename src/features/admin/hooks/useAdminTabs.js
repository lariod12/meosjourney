import { useEffect, useMemo, useState } from 'react';

export const ADMIN_TABS = [
  {
    id: 'create-achievement',
    label: '🏆 Create Achievement',
    log: 'Switched to Create Achievement'
  },
  {
    id: 'create-quest',
    label: '📜 Create Quest',
    log: 'Switched to Create Quest'
  },
  {
    id: 'manage-achievements',
    label: '📋 Manage Achievements'
  },
  {
    id: 'manage-quests',
    label: '📝 Manage Quests'
  }
];

export function useAdminTabs(initialTab = 'create-achievement') {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.admin-dropdown')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const activeTabLabel = useMemo(() => {
    return ADMIN_TABS.find(tab => tab.id === activeTab)?.label || ADMIN_TABS[0].label;
  }, [activeTab]);

  const toggleDropdown = () => {
    setDropdownOpen(prev => !prev);
  };

  const selectTab = (tabId) => {
    const tab = ADMIN_TABS.find(item => item.id === tabId);
    if (tab?.log) {
      console.log(tab.log);
    }

    setActiveTab(tabId);
    setDropdownOpen(false);
  };

  return {
    activeTab,
    activeTabLabel,
    dropdownOpen,
    selectTab,
    toggleDropdown
  };
}
