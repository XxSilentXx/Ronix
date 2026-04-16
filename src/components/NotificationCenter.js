import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const NotificationIconContainer = styled.div`
  position: relative;
  cursor: pointer;
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: -5px;
  right: -5px;
  width: 18px;
  height: 18px;
  background: #ff4757;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
`;

const NotificationIcon = styled.div`
  color: #fff;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 24px;
    height: 24px;
    fill: currentColor;
  }
`;

const NotificationDropdown = styled.div`
  position: absolute;
  top: 50px;
  right: 0;
  width: 350px;
  max-height: 500px;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const NotificationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  h3 {
    margin: 0;
    color: #fff;
    font-size: 1rem;
  }
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: #4facfe;
  font-size: 0.8rem;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const NotificationList = styled.div`
  overflow-y: auto;
  max-height: 400px;
  
  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    
    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
`;

const EmptyNotifications = styled.div`
  padding: 2rem;
  text-align: center;
  color: #b8c1ec;
`;

const NotificationItem = styled.div`
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: ${props => props.$read ? 'transparent' : 'rgba(79, 172, 254, 0.1)'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .notification-title {
    font-weight: 600;
    color: #fff;
    margin-bottom: 0.3rem;
  }
  
  .notification-message {
    color: #b8c1ec;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }
  
  .notification-time {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.8rem;
  }
`;

const NotificationActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const ActionButton = styled.button`
  background: ${props => props.$primary ? 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)' : 'rgba(255, 255, 255, 0.1)'};
  color: #fff;
  border: none;
  padding: 0.3rem 0.8rem;
  border-radius: 5px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
`;

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
  const now = new Date();
  const diff = (now - date) / 1000; // difference in seconds
  
  if (diff < 60) {
    return 'Just now';
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

const NotificationCenter = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAllNotifications } = useNotification();
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };
  
  // Handle action button click
  const handleActionClick = (e, action) => {
    e.stopPropagation();
    action();
  };
  
  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      markAllAsRead();
    }
  };
  
  if (!currentUser) return null;
  
  return (
    <NotificationIconContainer ref={dropdownRef}>
      <NotificationIcon onClick={toggleDropdown}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
        </svg>
        {unreadCount > 0 && <NotificationBadge>{unreadCount}</NotificationBadge>}
      </NotificationIcon>
      
      {isOpen && (
        <NotificationDropdown>
          <NotificationHeader>
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <ClearButton onClick={clearAllNotifications}>Clear All</ClearButton>
            )}
          </NotificationHeader>
          
          <NotificationList>
            {notifications.length === 0 ? (
              <EmptyNotifications>
                No notifications
              </EmptyNotifications>
            ) : (
              notifications
                .sort((a, b) => b.timestamp - a.timestamp)
                .map(notification => (
                  <NotificationItem 
                    key={notification.id} 
                    $read={notification.read}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{formatTime(notification.timestamp)}</div>
                    
                    {notification.actions && notification.actions.length > 0 && (
                      <NotificationActions>
                        {notification.actions.map((action, index) => (
                          <ActionButton 
                            key={index}
                            $primary={index === 0}
                            onClick={(e) => handleActionClick(e, action.action)}
                          >
                            {action.label}
                          </ActionButton>
                        ))}
                      </NotificationActions>
                    )}
                  </NotificationItem>
                ))
            )}
          </NotificationList>
        </NotificationDropdown>
      )}
    </NotificationIconContainer>
  );
};

export default NotificationCenter; 