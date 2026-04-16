import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import chatService from '../services/chatService';
import UserAvatar from './UserAvatar';
import RankBadge from './RankBadge';
import './GlobalChat.css';

const GlobalChat = ({ isCollapsed = false, onToggle }) => {
  const { currentUser: user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [muteInfo, setMuteInfo] = useState(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(false);

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      // Reset userScrolled after a short delay to ensure scroll completes
      setTimeout(() => {
        setUserScrolled(false);
      }, 300);
    }
  };

  // Handle scroll detection
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      // More precise detection - user is at bottom if within 10px
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 10;
      
      // Only update if the state actually changes to prevent unnecessary re-renders
      if (userScrolled === isAtBottom) {
        console.log('Scroll state changing:', { 
          wasUserScrolled: userScrolled, 
          nowAtBottom: isAtBottom, 
          newUserScrolled: !isAtBottom,
          scrollTop,
          scrollHeight,
          clientHeight,
          distanceFromBottom: scrollHeight - scrollTop - clientHeight
        });
        setUserScrolled(!isAtBottom);
      }
    }
  };

  // Auto-scroll to bottom when new messages arrive, only if user is at the bottom
  useEffect(() => {
    if (messages.length > 0) {
      // Initial scroll when first messages load
      if (!hasInitiallyScrolled) {
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: 'end' });
            setHasInitiallyScrolled(true);
          }
        }, 100);
      }
      // Auto-scroll for new messages only if user is at bottom
      else if (!userScrolled) {
        setTimeout(() => {
          if (!userScrolled && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }
        }, 100);
      }
    }
  }, [messages, userScrolled, hasInitiallyScrolled]);

  // Check mute status when component mounts
  useEffect(() => {
    if (!user) return;

    const checkMuteStatus = async () => {
      try {
        const muteStatus = await chatService.checkMuteStatus();
        setIsMuted(muteStatus.isMuted);
        setMuteInfo(muteStatus);
      } catch (error) {
        console.error('Error checking mute status:', error);
      }
    };

    checkMuteStatus();
  }, [user]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    const unsubscribe = chatService.subscribeToMessages((newMessages) => {
      // Debug: Log message data to see avatar URLs
      console.log('Chat messages received:', newMessages.map(msg => ({
        id: msg.id,
        username: msg.username,
        avatarUrl: msg.avatarUrl,
        userId: msg.userId
      })));
      
      setMessages(newMessages);
      setIsConnected(true);
      setIsLoading(false);
      // Don't auto-scroll here - let the useEffect handle it based on userScrolled state
    });

    return () => {
      if (unsubscribe) {
        chatService.unsubscribeFromMessages();
      }
    };
  }, [user]);

  // Handle sending messages
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to send messages');
      return;
    }

    // Check if user is muted before attempting to send
    if (isMuted) {
      if (muteInfo?.expiresAt) {
        const expiresAt = new Date(muteInfo.expiresAt);
        const timeRemaining = Math.ceil((expiresAt - new Date()) / (1000 * 60)); // minutes
        setError(`You are muted for ${timeRemaining} more minutes. Reason: ${muteInfo.reason}`);
      } else {
        setError('You are muted and cannot send messages');
      }
      return;
    }

    // Check for /clear command (admin only)
    if (newMessage.trim() === '/clear') {
      if (!isAdmin) {
        setError('Only administrators can use the /clear command');
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const result = await chatService.clearChat();
        setNewMessage('');
        setError(` Chat cleared successfully. Removed ${result.clearedCount} messages.`);
        setTimeout(() => setError(''), 3000);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Debug: Log current user data to see what's available
    console.log('Current user data for chat:', {
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL,
      discordLinked: user.discordLinked,
      discordId: user.discordId,
      discordAvatar: user.discordAvatar
    });

    const validation = chatService.validateMessage(newMessage);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await chatService.sendMessage(validation.text);
      setNewMessage('');
    } catch (error) {
      setError(error.message);
      // If the error indicates the user is muted, update our local state
      if (error.message.includes('muted')) {
        const muteStatus = await chatService.checkMuteStatus();
        setIsMuted(muteStatus.isMuted);
        setMuteInfo(muteStatus);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting messages
  const handleDeleteMessage = async (messageId) => {
    try {
      await chatService.deleteMessage(messageId);
    } catch (error) {
      setError(error.message);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (error) setError('');
  };

  // Get user's admin status
  const isAdmin = user?.isAdmin === true;

  // Handle muting/unmuting users
  const handleMuteUser = async (targetUserId, username) => {
    if (!isAdmin) return;
    
    const durationMinutes = prompt('Mute duration in minutes (default: 60):', '60');
    if (!durationMinutes) return;
    
    const reason = prompt('Reason for mute (optional):', 'Violating chat rules');
    
    try {
      await chatService.muteUser(targetUserId, parseInt(durationMinutes), reason);
      setError(`${username} has been muted for ${durationMinutes} minutes`);
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleUnmuteUser = async (targetUserId, username) => {
    if (!isAdmin) return;
    
    try {
      await chatService.unmuteUser(targetUserId);
      setError(`${username} has been unmuted`);
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      setError(error.message);
    }
  };

  if (isCollapsed) {
    return (
      <div className="global-chat collapsed" onClick={onToggle}>
        <div className="chat-header collapsed">
                  <div className="chat-title">
          <span className="chat-icon"></span>
          <span>Global Chat</span>
        </div>
          <button className="expand-btn">
            <span>▲</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="global-chat expanded">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-title">
          <span className="chat-icon"></span>
          <span>Global Chat</span>
          <div className="connection-status">
            <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
            <span className="status-text">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
        <button className="collapse-btn" onClick={onToggle}>
          <span>▼</span>
        </button>
      </div>

      {/* Messages Container */}
      <div 
        className="messages-container" 
        ref={chatContainerRef}
        onScroll={handleScroll}
      >
        {isLoading && messages.length === 0 ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <span>Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon"></span>
            <p>No messages yet. Be the first to say hello!</p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((message) => {
              return (
              <div key={message.id} className={`message-item ${message.isSystem ? 'system-message' : ''}`}>
                <div className="message-avatar">
                  {message.avatarUrl ? (
                    <img 
                      src={message.avatarUrl} 
                      alt={message.username}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '2px solid #4facfe',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: '2px solid #4facfe',
                      background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                      display: message.avatarUrl ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}
                  >
                    {message.username?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                </div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-username" style={{
                      color: message.isAdmin ? '#FFD700' : undefined,
                      fontWeight: message.isAdmin ? 700 : 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      {message.username}
                      {message.isAdmin && (
                        <span
                          className="admin-badge"
                          title="Admin"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            marginLeft: 4,
                            fontSize: 14,
                            color: '#FFD700',
                            filter: 'drop-shadow(0 0 4px #FFD700AA)'
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: 2}}><path d="M12 2l7 4v6c0 5.25-3.5 10-7 10s-7-4.75-7-10V6l7-4zm0 2.18L6 6.09v5.91c0 4.42 2.72 8.5 6 8.5s6-4.08 6-8.5V6.09l-6-1.91z"/></svg>
                          Admin
                        </span>
                      )}
                    </span>
                    
                    {/* Rank Badge */}
                    <RankBadge 
                      tier={message.rank || 'Bronze'}
                      size={16}
                      marginLeft="0.25rem"
                      showTooltip={true}
                    />
                    
                    {/* VIP Icon */}
                    {message.isVip && (
                      <span 
                        className="vip-icon"
                        title={`VIP ${message.vipTier ? `(${message.vipTier})` : ''}`}
                      >
                        
                      </span>
                    )}
                    
                    <span className="message-time">
                      {chatService.formatTimestamp(message.timestamp)}
                    </span>
                    {isAdmin && message.userId !== user?.uid && !message.isAdmin && (
                      <button 
                        className="mute-btn"
                        onClick={() => handleMuteUser(message.userId, message.username)}
                        title="Mute user"
                        style={{
                          marginLeft: '0.5rem',
                          background: '#ff6b6b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          opacity: 0.7,
                          transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '1'}
                        onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                      >
                        Mute
                      </button>
                    )}
                    {isAdmin && (
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteMessage(message.id)}
                        title="Delete message"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <div className="message-text">{message.text}</div>
                </div>
              </div>
            );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Scroll to bottom button */}
        {userScrolled && (
          <button className="scroll-to-bottom" onClick={scrollToBottom}>
            <span>↓</span>
            <span>New messages</span>
          </button>
        )}
      </div>

      {/* Message Input */}
      <div className="message-input-container">
        {error && (
          <div className="error-message">
            <span className="error-icon"></span>
            <span>{error}</span>
          </div>
        )}
        
        {user ? (
          <form onSubmit={handleSendMessage} className="message-form">
            <div className="input-wrapper">
              <input
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                placeholder={isMuted ? "You are muted and cannot send messages" : "Type a message..."}
                maxLength={500}
                disabled={isLoading || isMuted}
                className={`message-input ${isMuted ? 'muted' : ''}`}
              />
              <div className="char-counter">
                {newMessage.length}/500
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isLoading || !newMessage.trim() || isMuted}
              className="send-btn"
            >
              {isLoading ? (
                <div className="btn-spinner"></div>
              ) : (
                <span>Send</span>
              )}
            </button>
          </form>
        ) : (
          <div className="login-prompt">
            <span>Please log in to join the conversation</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalChat; 