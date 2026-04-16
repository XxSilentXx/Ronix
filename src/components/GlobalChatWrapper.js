import React, { useState, useEffect } from 'react';
import GlobalChat from './GlobalChat';

const GlobalChatWrapper = ({ 
  defaultCollapsed = true,
  showOnPages = ['home', 'wagers', 'profile'], // Pages where chat should appear
  currentPage = 'home'
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('globalChatCollapsed');
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Save collapsed state to localStorage
  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('globalChatCollapsed', JSON.stringify(newState));
  };

  // Don't render chat on certain pages if specified
  if (showOnPages && !showOnPages.includes(currentPage)) {
    return null;
  }

  return (
    <GlobalChat 
      isCollapsed={isCollapsed}
      onToggle={handleToggle}
    />
  );
};

export default GlobalChatWrapper; 