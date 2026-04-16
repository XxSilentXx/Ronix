import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import UserSearchModal from './UserSearchModal';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import RankBadge from './RankBadge';

const SearchContainer = styled.div`
  position: relative;
  margin-right: 1rem;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const SearchInput = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50px;
  padding: 0.5rem 1rem 0.5rem 2.5rem;
  color: #fff;
  width: 180px;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    width: 220px;
    border-color: #4facfe;
    box-shadow: 0 0 0 2px rgba(79, 172, 254, 0.2);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.5);
  pointer-events: none;
`;

const SearchResults = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 280px;
  max-height: 400px;
  overflow-y: auto;
  background: #1a2233;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  z-index: 100;
  margin-top: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(79, 172, 254, 0.5);
    border-radius: 10px;
  }
`;

const SearchResultItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.8rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
`;

const UserAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 0.8rem;
  background-image: ${props => props.src ? `url(${props.src})` : 'none'};
  background-color: ${props => props.src ? 'transparent' : '#4facfe'};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
`;

const UserName = styled.div`
  font-weight: 600;
  color: #fff;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: #b8c1ec;
  padding: 0.8rem 1rem;
  cursor: pointer;
  
  svg {
    margin-right: 0.5rem;
  }
  
  &:hover {
    color: #fff;
  }
`;

const SearchText = styled.div`
  color: #b8c1ec;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
`;

const VerifiedBadge = styled.span`
  color: #00f2fe;
  font-size: 0.85rem;
  margin-left: 0.5rem;
`;

const UserSearchBar = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const searchContainerRef = useRef(null);
  const { currentUser } = useAuth();
  
  // Handle clicks outside the search container to close results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Debounce search to prevent excessive Firestore queries
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Search for users in Firestore
  const searchUsers = async (searchTerm) => {
    if (!searchTerm.trim() || searchTerm.length < 2) return;
    
    setLoading(true);
    try {
      // Search by displayName
      const displayNameQuery = searchTerm.toLowerCase();
      const usersRef = collection(db, 'users');
      console.log(`Searching for users matching: "${displayNameQuery}"`);
      
      // Get all users and filter client-side for more flexible matching
      const querySnapshot = await getDocs(query(usersRef, limit(50)));
      console.log(`Found ${querySnapshot.size} total users to filter`);
      
      // Process results
      const users = [];
      querySnapshot.forEach((doc) => {
        // Don't include current user in search results
        if (currentUser && doc.id === currentUser.uid) return;
        
        const userData = doc.data();
        const displayNameLower = userData.displayNameLower || (userData.displayName ? userData.displayName.toLowerCase() : '');
        
        console.log(`Checking user ${userData.displayName} (${displayNameLower}) against "${displayNameQuery}"`);
        
        // Check if displayName contains the search query
        if (displayNameLower.includes(displayNameQuery)) {
          console.log(`Match found: ${userData.displayName}`);
          users.push({
            id: doc.id,
            displayName: userData.displayName || 'Anonymous User',
            photoURL: userData.photoURL || userData.discordAvatar || null,
            discordLinked: userData.discordLinked || false,
            twitchLinked: userData.twitchLinked || false,
            epicLinked: userData.epicLinked || false
          });
        }
      });
      
      console.log(`Search complete. Found ${users.length} matches.`);
      setSearchResults(users);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching for users:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearchFocus = () => {
    if (searchQuery.trim() && searchQuery.length >= 2) {
      setShowResults(true);
    }
  };
  
  const handleUserSelect = (user) => {
    setIsModalOpen(true);
    setSelectedUser(user);
    setShowResults(false);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };
  
  return (
    <>
      <SearchContainer ref={searchContainerRef}>
        <SearchInput
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleSearchFocus}
        />
        <SearchIcon>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </SearchIcon>
        
        {/* Dropdown search results */}
        {showResults && (
          <SearchResults>
            {selectedUser ? (
              <BackButton onClick={() => setSelectedUser(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to results
              </BackButton>
            ) : (
              <>
                {loading ? (
                  <SearchText>Searching...</SearchText>
                ) : (
                  <>
                    {searchQuery.length < 2 ? (
                      <SearchText>Type at least 2 characters to search</SearchText>
                    ) : (
                      <>
                        {searchResults.length === 0 ? (
                          <SearchText>No users found for "{searchQuery}"</SearchText>
                        ) : (
                          <>
                            <SearchText>Search for "{searchQuery}"</SearchText>
                            {searchResults.map(user => (
                              <SearchResultItem key={user.id} onClick={() => handleUserSelect(user)}>
                                <UserAvatar src={user.photoURL}>
                                  {!user.photoURL && user.displayName.charAt(0).toUpperCase()}
                                </UserAvatar>
                                <UserName>
                                  {user.displayName}
                                  <RankBadge userId={user.id} size={18} marginLeft="0.25rem" />
                                  {(user.discordLinked || user.twitchLinked || user.epicLinked) && (
                                    <VerifiedBadge>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    </VerifiedBadge>
                                  )}
                                </UserName>
                              </SearchResultItem>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </SearchResults>
        )}
      </SearchContainer>
      
      {/* Detailed user modal */}
      {selectedUser && (
        <UserSearchModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal}
          preSelectedUserId={selectedUser.id}
        />
      )}
    </>
  );
};

export default UserSearchBar; 