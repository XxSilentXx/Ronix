import React from 'react';
import FriendsList from '../components/FriendsList';

const FriendsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-white">Friends</h1>
      <FriendsList />
    </div>
  );
};

export default FriendsPage; 