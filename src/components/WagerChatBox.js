import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import styled from 'styled-components';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import RankBadge from './RankBadge';
import { Filter } from 'bad-words';
import { getAvatarUrl } from '../utils/avatarUtils';

const ChatContainer = styled.div`
  background: ${props => props.$sidebar ? 'transparent' : 'rgba(26, 26, 46, 0.8)'};
  border-radius: ${props => props.$sidebar ? '0' : '12px'};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: ${props => props.$sidebar ? '100%' : '300px'};
  border: ${props => props.$sidebar ? 'none' : '1px solid rgba(79, 172, 254, 0.3)'};
`;

const ChatHeader = styled.div`
  background: ${props => props.$sidebar ? 'transparent' : 'rgba(22, 33, 62, 0.9)'};
  padding: ${props => props.$sidebar ? '0' : '12px 16px'};
  display: ${props => props.$sidebar ? 'none' : 'flex'};
  align-items: center;
  justify-content: space-between;
  border-bottom: ${props => props.$sidebar ? 'none' : '1px solid rgba(79, 172, 254, 0.3)'};
  
  h3 {
    margin: 0;
    font-size: 1rem;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 8px;
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(79, 172, 254, 0.5);
    border-radius: 3px;
  }
`;

const Message = styled.div`
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  border-radius: 8px;
  background: ${props => props.$isSystem 
    ? 'rgba(145, 70, 255, 0.15)' 
    : props.$isSelf 
      ? 'rgba(79, 172, 254, 0.15)' 
      : 'rgba(255, 255, 255, 0.05)'};
  max-width: 100%;
  word-break: break-word;
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`;

const MessageAvatar = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-image: ${props => props.$photoURL ? `url(${props.$photoURL})` : 'none'};
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.$photoURL ? 'transparent' : (props.$isSystem ? '#9146FF' : props.$color || '#4facfe')};
  color: #fff;
  font-size: 0.7rem;
  flex-shrink: 0;
  font-weight: 600;
`;

const MessageAuthor = styled.div`
  font-weight: bold;
  font-size: 0.85rem;
  color: ${props => props.$isSystem ? '#9146FF' : props.$isSelf ? '#4facfe' : '#fff'};
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const MessageTime = styled.div`
  font-size: 0.7rem;
  color: #b8c1ec;
  margin-left: auto;
`;

const MessageContent = styled.div`
  font-size: 0.9rem;
  color: #e6e6e6;
  line-height: 1.4;
`;

const ChatInputArea = styled.div`
  padding: 12px;
  border-top: 1px solid rgba(79, 172, 254, 0.3);
  background: ${props => props.$sidebar ? 'rgba(22, 33, 62, 0.7)' : 'rgba(22, 33, 62, 0.9)'};
  ${props => props.$sidebar && `
    position: sticky;
    bottom: 0;
  `}
`;

const ChatForm = styled.form`
  display: flex;
  gap: 8px;
`;

const ChatInput = styled.input`
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 8px 12px;
  color: #fff;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #4facfe;
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const SendButton = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 242, 254, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

// Memoized message component to prevent re-renders
const ChatMessage = memo(({ msg, userData, avatarUrl, currentUser, formatTime }) => (
  <Message $isSystem={msg.isSystem} $isSelf={msg.senderId === currentUser?.uid}>
    <MessageHeader>
      {!msg.isSystem && (
        <MessageAvatar 
          $photoURL={avatarUrl}
          $color={msg.senderId === currentUser?.uid ? '#4facfe' : '#9146FF'}
          $isSystem={msg.isSystem}
        >
          {!avatarUrl && (userData && userData.displayName ? userData.displayName.charAt(0).toUpperCase() : (msg.senderName ? msg.senderName.charAt(0).toUpperCase() : '?'))}
        </MessageAvatar>
      )}
      <MessageAuthor $isSystem={msg.isSystem} $isSelf={msg.senderId === currentUser?.uid}>
        {msg.isSystem ? 'System' : (msg.senderName || 'Unknown User')}
        {!msg.isSystem && msg.rank && (
          <RankBadge rank={msg.rank} size="small" />
        )}
      </MessageAuthor>
      <MessageTime>{formatTime(msg.timestamp)}</MessageTime>
    </MessageHeader>
    <MessageContent>{msg.content}</MessageContent>
  </Message>
), (prevProps, nextProps) => {
  // Custom comparison function - only re-render if these specific props change
  return (
    prevProps.msg.id === nextProps.msg.id &&
    prevProps.msg.content === nextProps.msg.content &&
    prevProps.msg.senderId === nextProps.msg.senderId &&
    prevProps.msg.senderName === nextProps.msg.senderName &&
    prevProps.msg.isSystem === nextProps.msg.isSystem &&
    prevProps.avatarUrl === nextProps.avatarUrl &&
    prevProps.userData === nextProps.userData &&
    prevProps.currentUser?.uid === nextProps.currentUser?.uid
  );
});

const WagerChatBox = ({ matchId, readOnly = false, sidebar = false }) => {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userMap, setUserMap] = useState({});
  const fetchedUsersRef = useRef(new Set());
  const messagesEndRef = useRef(null);
  
  // Scroll message container to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      // Use parentElement to get the MessageList container and scroll only that element
      const messageContainer = messagesEndRef.current.parentElement;
      if (messageContainer) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
      }
    }
  }, [messages]);
  
  // Add system message when component mounts
  useEffect(() => {
    if (!matchId || !currentUser) return;
    
    const addInitialMessage = async () => {
      try {
        const chatRef = collection(db, 'wager_chats');
        
        // Check if there are already messages for this wager
        const existingMessagesQuery = query(
          chatRef,
          where('wagerId', '==', matchId),
          limit(1)
        );
        
        const existingSnapshot = await getDocs(existingMessagesQuery);
        
        if (existingSnapshot.empty) {
          console.log("No existing messages found, adding initial system message");
          await addDoc(chatRef, {
            wagerId: matchId,
            senderId: 'system',
            senderName: 'System',
            content: 'Match created. Waiting for all players to get ready.',
            isSystem: true,
            timestamp: serverTimestamp()
          });
        } else {
          console.log("Existing messages found:", existingSnapshot.docs.length);
        }
      } catch (error) {
        console.error('Error adding initial message:', error);
      }
    };
    
    addInitialMessage();
  }, [matchId, currentUser]);
  
  // Listen for messages in real-time
  useEffect(() => {
    if (!matchId) {
      console.log("No matchId provided, skipping chat listener setup");
      return;
    }
    
    console.log("Setting up chat listener for matchId:", matchId);
    
    const chatRef = collection(db, 'wager_chats');
    const messagesQuery = query(
      chatRef,
      where('wagerId', '==', matchId),
      orderBy('timestamp', 'asc'),
      limit(100)
    );
    
    console.log("Query created:", { 
      collection: 'wager_chats',
      filter: `wagerId == ${matchId}`,
      orderBy: 'timestamp asc',
      limit: 100
    });
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      console.log("Chat snapshot received:", { 
        empty: snapshot.empty,
        size: snapshot.size,
        docs: snapshot.docs.map(doc => doc.id)
      });
      
      const messageData = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date()
          };
        });
      
      console.log("Processed messages:", messageData);
      
      setMessages(messageData);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to chat messages:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [matchId]);
  
  // Fetch user data for all unique senderIds in the chat
  useEffect(() => {
    const fetchUsers = async () => {
      const uniqueIds = Array.from(new Set(messages.filter(m => !m.isSystem && m.senderId).map(m => m.senderId)));
      const missingIds = uniqueIds.filter(id => !fetchedUsersRef.current.has(id));
      if (missingIds.length === 0) return;
      
      const updates = {};
      await Promise.all(missingIds.map(async (id) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', id));
          if (userDoc.exists()) {
            updates[id] = userDoc.data();
            fetchedUsersRef.current.add(id);
          } else {
            // Mark as fetched even if no data to avoid re-fetching
            fetchedUsersRef.current.add(id);
          }
        } catch (e) {
          console.error('Error fetching user data for chat:', e);
          // Mark as fetched to avoid re-fetching
          fetchedUsersRef.current.add(id);
        }
      }));
      
      if (Object.keys(updates).length > 0) {
        setUserMap(prev => ({ ...prev, ...updates }));
      }
    };
    
    if (messages.length > 0) {
      fetchUsers();
    }
  }, [messages]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || !currentUser || !matchId) {
      console.log("Message submission blocked:", { 
        hasMessage: !!message.trim(), 
        hasUser: !!currentUser, 
        hasMatchId: !!matchId 
      });
      return;
    }
    
    try {
      console.log("Attempting to send message:", { 
        matchId,
        userId: currentUser.uid,
        content: message.trim()
      });
      
      const filter = new Filter();
      const trimmedMessage = message.trim();
      const filteredMessage = filter.clean(trimmedMessage);
      setMessage(''); // Clear the input field immediately for better UX
      
      const chatRef = collection(db, 'wager_chats');
      const docRef = await addDoc(chatRef, {
        wagerId: matchId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Anonymous',
        senderPhoto: currentUser.photoURL || null,
        content: filteredMessage,
        isSystem: false,
        timestamp: serverTimestamp()
      });
      
      console.log("Message sent successfully, document ID:", docRef.id);
      
    } catch (error) {
      console.error("Error sending message:", error);
      // Re-enable the input if there was an error
      setMessage(message);
    }
  };
  
  const formatTime = useCallback((date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);
  
  const messagesList = useMemo(() => {
    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <p>Loading messages...</p>
        </div>
      );
    }
    
    if (messages.length === 0) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <p>{readOnly ? 'No messages yet in this match.' : 'No messages yet. Be the first to say hello!'}</p>
        </div>
      );
    }
    
    return messages.map((msg, idx) => {
      const userData = !msg.isSystem && msg.senderId ? userMap[msg.senderId] : null;
      const avatarUrl = userData ? getAvatarUrl(userData) : null;
      // Use stable message ID or create one from content + timestamp
      const stableKey = msg.id || `${msg.senderId}-${msg.timestamp?.getTime()}-${idx}`;
      
      return (
        <ChatMessage
          key={stableKey}
          msg={msg}
          userData={userData}
          avatarUrl={avatarUrl}
          currentUser={currentUser}
          formatTime={formatTime}
        />
      );
    });
  }, [messages, userMap, currentUser, loading, readOnly, formatTime]);
  
  return (
    <ChatContainer $sidebar={sidebar}>
      <ChatHeader $sidebar={sidebar}>
        <h3>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z"/>
          </svg>
          Match Chat
          {readOnly && (
            <span style={{
              fontSize: '0.75rem',
              marginLeft: '8px',
              background: 'rgba(79, 172, 254, 0.15)',
              padding: '2px 6px',
              borderRadius: '4px',
              color: '#4facfe',
              border: '1px solid rgba(79, 172, 254, 0.3)'
            }}>
              Read Only
            </span>
          )}
        </h3>
      </ChatHeader>
      
      <MessageList>
        {messagesList}
        <div ref={messagesEndRef} />
      </MessageList>
      
      {!readOnly && (
        <ChatInputArea $sidebar={sidebar}>
          <ChatForm onSubmit={handleSubmit}>
            <ChatInput
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              maxLength={500}
              disabled={loading}
            />
            <SendButton type="submit" disabled={!message.trim() || loading}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </SendButton>
          </ChatForm>
        </ChatInputArea>
      )}
      {readOnly && (
        <ChatInputArea style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
          <div style={{ 
            color: '#4facfe', 
            fontSize: '0.85rem',
            background: 'rgba(79, 172, 254, 0.1)',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(79, 172, 254, 0.2)'
          }}>
            You are in spectator mode and cannot send messages
          </div>
        </ChatInputArea>
      )}
    </ChatContainer>
  );
};

export default WagerChatBox;