import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useParty } from '../contexts/PartyContext';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import RankBadge from './RankBadge';
import { Filter } from 'bad-words';

const ChatContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  height: 400px;
`;

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  h3 {
    font-size: 1.1rem;
    color: #4facfe;
    margin: 0;
  }
`;

const ChatToggle = styled.button`
  background: none;
  border: none;
  color: #b8c1ec;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s ease;
  
  &:hover {
    color: #fff;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
  padding-right: 0.5rem;
  
  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 5px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    
    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
`;

const MessageGroup = styled.div`
  display: flex;
  margin-bottom: 1rem;
  align-items: flex-start;
  
  &.own-message {
    flex-direction: row-reverse;
    
    .messages-wrapper {
      align-items: flex-end;
    }
  }
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #4facfe;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  flex-shrink: 0;
  overflow: hidden;
  margin-top: 4px;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const MessagesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  max-width: calc(100% - 40px);
  margin-left: ${props => props.$isOwnMessage ? '0' : '0.5rem'};
  margin-right: ${props => props.$isOwnMessage ? '0.5rem' : '0'};
`;

const MessageBubble = styled.div`
  background: ${props => props.$isOwnMessage 
    ? 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)' 
    : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$isOwnMessage ? '#fff' : 'inherit'};
  padding: 0.8rem 1rem;
  border-radius: ${props => props.$isOwnMessage 
    ? props.$isFirstInGroup 
      ? '15px 15px 0 15px' 
      : props.$isLastInGroup 
        ? '15px 0 15px 15px' 
        : '15px 0 0 15px'
    : props.$isFirstInGroup 
      ? '15px 15px 15px 0' 
      : props.$isLastInGroup 
        ? '0 15px 15px 15px' 
        : '0 15px 15px 0'
  };
  margin-bottom: 0.2rem;
  max-width: 100%;
  word-break: break-word;
  position: relative;
  
  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    ${props => props.$isOwnMessage ? 'right: -8px;' : 'left: -8px;'}
    width: 0;
    height: 0;
    border: 8px solid transparent;
    border-top-color: ${props => props.$isOwnMessage 
      ? '#00f2fe' 
      : 'rgba(255, 255, 255, 0.1)'};
    border-bottom: 0;
    margin-bottom: -8px;
    display: ${props => props.$isLastInGroup ? 'block' : 'none'};
  }
`;

const MessageMeta = styled.div`
  font-size: 0.7rem;
  color: #b8c1ec;
  margin-top: 0.2rem;
  text-align: ${props => props.$isOwnMessage ? 'right' : 'left'};
  display: flex;
  align-items: center;
  justify-content: ${props => props.$isOwnMessage ? 'flex-end' : 'flex-start'};
  gap: 0.25rem;
  
  .sender-name {
    font-weight: 600;
    color: #4facfe;
    margin-right: 0.25rem;
  }
`;

const ChatInputForm = styled.form`
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
`;

const ChatInput = styled.input`
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 0.8rem 1rem;
  color: #fff;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #4facfe;
  }
`;

const SendButton = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  border: none;
  padding: 0 1rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 242, 254, 0.3);
  }
  
  &:disabled {
    background: rgba(255, 255, 255, 0.1);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const EmptyChatMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #b8c1ec;
`;

const PartyChat = () => {
  const { currentUser } = useAuth();
  const { currentParty, partyMembers } = useParty();
  
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Listen for party chat messages
  useEffect(() => {
    if (!currentParty) {
      setMessages([]);
      return;
    }
    
    const chatRef = collection(db, 'party_chats');
    const chatQuery = query(
      chatRef,
      where('partyId', '==', currentParty.id),
      orderBy('timestamp', 'asc'),
      limit(100)
    );
    
    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const newMessages = [];
      snapshot.forEach(doc => {
        newMessages.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setMessages(newMessages);
    });
    
    return () => unsubscribe();
  }, [currentParty]);
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !currentParty || !currentUser) {
      return;
    }
    
    try {
      setIsSending(true);
      const filter = new Filter();
      const filteredMessage = filter.clean(messageInput.trim());
      await addDoc(collection(db, 'party_chats'), {
        partyId: currentParty.id,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Anonymous',
        senderPhotoURL: currentUser.photoURL || null,
        message: filteredMessage,
        timestamp: serverTimestamp()
      });
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };
  
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Group messages by sender
  const groupMessages = (messages) => {
    const groups = [];
    let currentGroup = null;
    
    messages.forEach((message, index) => {
      // Start a new group if:
      // 1. This is the first message
      // 2. The sender changed from the previous message
      // 3. More than 5 minutes have passed since the previous message
      const prevMessage = index > 0 ? messages[index - 1] : null;
      const timeDiff = prevMessage && message.timestamp && prevMessage.timestamp ? 
        (message.timestamp.seconds - prevMessage.timestamp.seconds) : 0;
      
      if (!currentGroup || 
          message.senderId !== currentGroup.senderId || 
          timeDiff > 300) { // 5 minutes = 300 seconds
        
        if (currentGroup) {
          groups.push(currentGroup);
        }
        
        currentGroup = {
          senderId: message.senderId,
          senderName: message.senderName,
          senderPhotoURL: message.senderPhotoURL,
          messages: [message],
          timestamp: message.timestamp
        };
      } else {
        currentGroup.messages.push(message);
        // Update the timestamp to the latest message in the group
        currentGroup.timestamp = message.timestamp;
      }
    });
    
    // Add the last group
    if (currentGroup) {
      groups.push(currentGroup);
    }
    
    return groups;
  };
  
  // If no party, don't render the chat
  if (!currentParty) {
    return null;
  }
  
  const messageGroups = groupMessages(messages);
  
  return (
    <ChatContainer>
      <ChatHeader>
        <h3>Party Chat</h3>
        <ChatToggle onClick={() => setIsMinimized(!isMinimized)}>
          {isMinimized ? '▼' : '▲'}
        </ChatToggle>
      </ChatHeader>
      
      {!isMinimized && (
        <>
          <MessagesContainer>
            {messages.length === 0 ? (
              <EmptyChatMessage>
                No messages yet. Be the first to say something!
              </EmptyChatMessage>
            ) : (
              messageGroups.map((group, groupIndex) => {
                const isOwnMessage = group.senderId === currentUser?.uid;
                
                return (
                  <MessageGroup 
                    key={`group-${groupIndex}`} 
                    className={isOwnMessage ? 'own-message' : ''}
                  >
                    <Avatar>
                      {group.senderPhotoURL ? (
                        <img src={group.senderPhotoURL} alt={group.senderName} />
                      ) : (
                        group.senderName.charAt(0)
                      )}
                    </Avatar>
                    <MessagesWrapper className="messages-wrapper" $isOwnMessage={isOwnMessage}>
                      {group.messages.map((message, messageIndex) => (
                        <MessageBubble 
                          key={message.id}
                          $isOwnMessage={isOwnMessage}
                          $isFirstInGroup={messageIndex === 0}
                          $isLastInGroup={messageIndex === group.messages.length - 1}
                        >
                          {message.message}
                        </MessageBubble>
                      ))}
                      <MessageMeta $isOwnMessage={isOwnMessage}>
                        {!isOwnMessage && (
                          <>
                            <span className="sender-name">{group.senderName}</span>
                            <RankBadge userId={group.senderId} size={16} marginLeft="0" showTooltip={false} />
                          </>
                        )}
                        <span className="timestamp">{formatTimestamp(group.timestamp)}</span>
                      </MessageMeta>
                    </MessagesWrapper>
                  </MessageGroup>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </MessagesContainer>
          
          <ChatInputForm onSubmit={handleSendMessage}>
            <ChatInput
              type="text"
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              disabled={isSending}
            />
            <SendButton type="submit" disabled={!messageInput.trim() || isSending}>
              Send
            </SendButton>
          </ChatInputForm>
        </>
      )}
    </ChatContainer>
  );
};

export default PartyChat; 