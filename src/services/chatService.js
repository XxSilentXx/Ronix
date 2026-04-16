import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  addDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase/config';

class ChatService {
  constructor() {
    this.unsubscribe = null;
    this.messageListeners = new Set();
  }

  // Subscribe to real-time chat messages
  subscribeToMessages(callback, messageLimit = 50) {
    try {
      const chatRef = collection(db, 'global_chat');
      const q = query(
        chatRef,
        orderBy('timestamp', 'desc'),
        limit(messageLimit)
      );

      this.unsubscribe = onSnapshot(q, (snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          messages.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date()
          });
        });
        
        // Reverse to show oldest first
        callback(messages.reverse());
      }, (error) => {
        console.error('Error listening to chat messages:', error);
        callback([]);
      });

      return this.unsubscribe;
    } catch (error) {
      console.error('Error subscribing to messages:', error);
      callback([]);
      return null;
    }
  }

  // Unsubscribe from chat messages
  unsubscribeFromMessages() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  // Send a message using Cloud Function
  async sendMessage(text) {
    try {
      const sendGlobalChatMessage = httpsCallable(functions, 'sendGlobalChatMessage');
      const result = await sendGlobalChatMessage({ text });
      return result.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error(error.message || 'Failed to send message');
    }
  }

  // Delete a message using Cloud Function
  async deleteMessage(messageId) {
    try {
      const deleteGlobalChatMessage = httpsCallable(functions, 'deleteGlobalChatMessage');
      const result = await deleteGlobalChatMessage({ messageId });
      return result.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error(error.message || 'Failed to delete message');
    }
  }

  // Get chat history using Cloud Function
  async getChatHistory(limit = 50, before = null) {
    try {
      const getGlobalChatHistory = httpsCallable(functions, 'getGlobalChatHistory');
      const result = await getGlobalChatHistory({ limit, before });
      return result.data.messages;
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw new Error(error.message || 'Failed to get chat history');
    }
  }

  // Format timestamp for display
  formatTimestamp(timestamp) {
    if (!timestamp) return '';
    
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) { // 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      return messageTime.toLocaleDateString();
    }
  }

  // Check if user can delete a message
  canDeleteMessage(message, currentUserId, isAdmin = false) {
    return isAdmin || message.userId === currentUserId;
  }

  // Validate message text
  validateMessage(text) {
    if (!text || typeof text !== 'string') {
      return { valid: false, error: 'Message cannot be empty' };
    }
    
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return { valid: false, error: 'Message cannot be empty' };
    }
    
    if (trimmed.length > 160) {
      return { valid: false, error: 'Message is too long (max 160 characters)' };
    }
    
    return { valid: true, text: trimmed };
  }

  // Mute a user (admin only)
  async muteUser(targetUserId, durationMinutes = 60, reason = 'Violating chat rules') {
    try {
      const muteUserInChat = httpsCallable(functions, 'muteUserInChat');
      const result = await muteUserInChat({ targetUserId, durationMinutes, reason });
      return result.data;
    } catch (error) {
      console.error('Error muting user:', error);
      throw new Error(error.message || 'Failed to mute user');
    }
  }

  // Unmute a user (admin only)
  async unmuteUser(targetUserId) {
    try {
      const unmuteUserInChat = httpsCallable(functions, 'unmuteUserInChat');
      const result = await unmuteUserInChat({ targetUserId });
      return result.data;
    } catch (error) {
      console.error('Error unmuting user:', error);
      throw new Error(error.message || 'Failed to unmute user');
    }
  }

  // Check if current user is muted
  async checkMuteStatus() {
    try {
      const checkMuteStatus = httpsCallable(functions, 'checkUserMuteStatus');
      const result = await checkMuteStatus();
      return result.data;
    } catch (error) {
      console.error('Error checking mute status:', error);
      return { isMuted: false };
    }
  }

  // Clear all chat messages (admin only)
  async clearChat() {
    try {
      const clearGlobalChat = httpsCallable(functions, 'clearGlobalChat');
      const result = await clearGlobalChat();
      return result.data;
    } catch (error) {
      console.error('Error clearing chat:', error);
      throw new Error(error.message || 'Failed to clear chat');
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService; 