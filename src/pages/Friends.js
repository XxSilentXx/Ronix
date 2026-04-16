import React from 'react';
import FriendsList from '../components/FriendsList';
import styled from 'styled-components';

const FriendsContainer = styled.div`
  min-height: 100vh;
  background: #131124;
  color: #fff;
  padding: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
  margin-bottom: 2rem;
`;

const Friends = () => {
  return (
    <FriendsContainer>
      <PageTitle>Friends</PageTitle>
      <FriendsList />
    </FriendsContainer>
  );
};

export default Friends; 