import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  limit,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { Link, useNavigate } from "react-router-dom";
import TipUserModalRedesigned from "./TipUserModalRedesigned";
import UserAvatar from './UserAvatar';
import RankBadge from './RankBadge';
import { getAvatarUrl } from '../utils/avatarUtils';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: ${(props) => (props.isOpen ? "flex" : "none")};
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 15px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  color: #fff;
  overflow-y: auto;
  margin: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(79, 172, 254, 0.5);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(79, 172, 254, 0.8);
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 10;

  &:hover {
    color: #4facfe;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.8rem 1rem;
  margin-bottom: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: #fff;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #4facfe;
    box-shadow: 0 0 0 2px rgba(79, 172, 254, 0.3);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const SearchResults = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const UserCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    border-color: rgba(79, 172, 254, 0.5);
  }
`;

const UserHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const Avatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 1rem;
  background-image: ${(props) => (props.src ? `url(${props.src})` : "none")};
  background-color: ${(props) => (props.src ? "transparent" : "#4facfe")};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.2rem;
  font-weight: 600;
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.h3`
  margin: 0;
  color: #fff;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const VerifiedBadge = styled.span`
  color: #00f2fe;
  font-size: 0.85rem;
  margin-left: 0.5rem;
`;

const UserNameContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const UserBio = styled.p`
  margin: 0.5rem 0 0;
  color: #b8c1ec;
  font-size: 0.9rem;
`;

const UserProfileModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 15px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  z-index: 1100;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  &::-webkit-scrollbar {
    width: 8px;
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

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const ProfileAvatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-image: ${(props) => (props.src ? `url(${props.src})` : "none")};
  background-color: ${(props) => (props.src ? "transparent" : "#4facfe")};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 2rem;
  font-weight: 600;
  border: 3px solid #4facfe;
`;

const ProfileInfo = styled.div`
  flex: 1;

  h2 {
    font-size: 2rem;
    margin: 0 0 0.5rem 0;
    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  p {
    margin: 0.5rem 0 1rem;
    color: #b8c1ec;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 1rem;
  text-align: center;

  h3 {
    font-size: 1.8rem;
    margin: 0;
    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  p {
    margin: 0.5rem 0 0;
    color: #b8c1ec;
    font-size: 0.9rem;
  }
`;

const SectionTitle = styled.h3`
  margin: 1.5rem 0 1rem;
  color: #fff;
  font-size: 1.2rem;
`;

const LinkedAccounts = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const AccountBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50px;
  padding: 0.5rem 1rem;

  svg {
    width: 20px;
    height: 20px;
  }

  span {
    font-size: 0.9rem;
    color: #b8c1ec;
  }
`;

const MatchHistory = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 1.5rem;
`;

const MatchRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  padding: 0.8rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    border-bottom: none;
  }
`;

const MatchHeader = styled(MatchRow)`
  background: rgba(255, 255, 255, 0.1);
  font-weight: 600;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
`;

const Button = styled.button`
  background: ${(props) =>
    props.$secondary
      ? "rgba(255, 255, 255, 0.1)"
      : "linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)"};
  color: #fff;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid rgba(79, 172, 254, 0.3);
  border-top-color: #4facfe;
  animation: spin 1s linear infinite;
  margin: 2rem auto;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const NoResults = styled.div`
  text-align: center;
  padding: 2rem;
  color: #b8c1ec;
`;

const UserSearchModal = ({ isOpen, onClose, preSelectedUserId }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userMatches, setUserMatches] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Load preselected user when modal opens with preSelectedUserId
  useEffect(() => {
    if (isOpen && preSelectedUserId) {
      loadUserById(preSelectedUserId);
    }
  }, [isOpen, preSelectedUserId]);

  // Load a user by ID
  const loadUserById = async (userId) => {
    if (!userId) return;

    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "users", userId));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const user = {
          id: userDoc.id,
          displayName: userData.displayName || "Anonymous User",
          photoURL: userData.photoURL || userData.discordAvatar || null,
          discordLinked: userData.discordLinked || false,
          discordUsername: userData.discordUsername || null,
          discordId: userData.discordId || null,
          discordAvatar: userData.discordAvatar || null,
          epicLinked: userData.epicLinked || false,
          epicUsername: userData.epicUsername || null,
          twitchLinked: userData.twitchLinked || false,
          twitchUsername: userData.twitchUsername || null,
          bio: userData.bio || "No bio available",
          createdAt: userData.createdAt ? userData.createdAt : null,
        };

        setSelectedUser(user);
        await getUserDetails(userId);
        console.log("Loaded user data:", user);
      }
    } catch (error) {
      console.error("Error loading user by ID:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle selecting a user from the results
  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    await getUserDetails(user.id);
  };

  // Get user profile details when selected
  const getUserDetails = async (userId) => {
    try {
      // Get user stats
      const statsDoc = await getDoc(doc(db, "userStats", userId));
      if (statsDoc.exists()) {
        setUserStats(statsDoc.data());
      } else {
        setUserStats({
          matchesPlayed: 0,
          matchesWon: 0,
          winRate: 0,
          totalEarnings: 0,
        });
      }

      // Get user's recent matches
      const matchesRef = collection(db, "wagers");

      // First try to get matches where user is explicitly listed as a participant
      let matchesQuery = query(
        matchesRef,
        where("participants", "array-contains", userId),
        where("status", "==", "completed"),
        orderBy("updatedAt", "desc"),
        limit(5),
      );

      let matchesSnapshot = await getDocs(matchesQuery);
      let matches = [];

      // If no matches found, try alternative queries
      if (matchesSnapshot.empty) {
        // Try as host
        const hostQuery = query(
          matchesRef,
          where("hostId", "==", userId),
          where("status", "==", "completed"),
          orderBy("updatedAt", "desc"),
          limit(5),
        );

        matchesSnapshot = await getDocs(hostQuery);

        // If still no matches, try as guest
        if (matchesSnapshot.empty) {
          const guestQuery = query(
            matchesRef,
            where("guestId", "==", userId),
            where("status", "==", "completed"),
            orderBy("updatedAt", "desc"),
            limit(5),
          );

          matchesSnapshot = await getDocs(guestQuery);
        }
      }

      // Process match results
      matchesSnapshot.forEach((doc) => {
        const match = doc.data();
        const isWinner =
          (match.winner === "host" && match.hostId === userId) ||
          (match.winner === "guest" && match.guestId === userId);

        matches.push({
          id: doc.id,
          date: match.updatedAt ? match.updatedAt.toDate() : new Date(),
          gameMode: match.gameMode || "Unknown",
          amount: match.amount || 0,
          result: isWinner ? "Win" : "Loss",
        });
      });

      setUserMatches(matches);

      // Refresh user data to ensure we have the most current linked accounts info
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Update selectedUser with latest account data
        setSelectedUser((prevUser) => ({
          ...prevUser,
          discordLinked: userData.discordLinked || false,
          discordUsername: userData.discordUsername || null,
          discordId: userData.discordId || null,
          discordAvatar: userData.discordAvatar || null,
          epicLinked: userData.epicLinked || false,
          epicUsername: userData.epicUsername || null,
          twitchLinked: userData.twitchLinked || false,
          twitchUsername: userData.twitchUsername || null,
        }));
      }
    } catch (error) {
      console.error("Error getting user details:", error);
      setUserStats(null);
      setUserMatches([]);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Only reset search and results if not using preSelectedUserId
      if (!preSelectedUserId) {
        setSearchQuery("");
        setSearchResults([]);
        setSelectedUser(null);
        setUserMatches([]);
        setUserStats(null);
      }
    }
  }, [isOpen, preSelectedUserId]);

  // Format date with error handling
  const formatDate = (date) => {
    try {
      if (!date) return "Unknown";

      // If it's a Firestore Timestamp, convert to JS Date
      if (date.toDate && typeof date.toDate === "function") {
        return date.toDate().toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
      }

      // Handle regular Date objects
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) {
        return "Unknown";
      }

      return dateObj.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } catch (err) {
      console.error("Error formatting date:", err);
      return "Unknown";
    }
  };

  // Helper function to close the modal and return to the navbar search
  const handleBackToSearch = () => {
    // Close the modal entirely to go back to the search bar in the navbar
    onClose();
  };

  return (
    <>
      <ModalOverlay isOpen={isOpen} onClick={onClose}>
        <ModalContainer onClick={(e) => e.stopPropagation()}>
          <CloseButton onClick={onClose}>&times;</CloseButton>

          {loading && <LoadingSpinner />}

          {!loading && searchResults.length > 0 && !selectedUser && (
            <SearchResults>
              {searchResults.map((user) => (
                <UserCard key={user.id} onClick={() => handleSelectUser(user)}>
                  <UserHeader>
                    <Avatar src={user.photoURL}>
                      {!user.photoURL &&
                        user.displayName.charAt(0).toUpperCase()}
                    </Avatar>
                    <UserInfo>
                      <UserNameContainer>
                        <UserName>
                          {user.displayName}
                          <RankBadge userId={user.id} size={20} marginLeft="0.25rem" />
                          {(user.discordLinked || user.twitchLinked || user.epicLinked) && (
                            <VerifiedBadge></VerifiedBadge>
                          )}
                        </UserName>
                      </UserNameContainer>
                      <UserBio>
                        Member since {formatDate(user.createdAt)}
                      </UserBio>
                    </UserInfo>
                  </UserHeader>

                  <LinkedAccounts>
                    {user.discordLinked && (
                      <AccountBadge>
                        <svg
                          width="20"
                          height="15"
                          viewBox="0 0 71 55"
                          fill="#5865F2"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" />
                        </svg>
                        <span>Discord</span>
                      </AccountBadge>
                    )}

                    {user.epicLinked && (
                      <AccountBadge>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="#00BFFF"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M12 0C5.383 0 0 5.383 0 12C0 18.617 5.383 24 12 24C18.617 24 24 18.617 24 12C24 5.383 18.617 0 12 0ZM13.121 17.896H10.879V12.76H8.637V10.76H15.363V12.76H13.121V17.896ZM12 9.12C11.275 9.12 10.69 8.534 10.69 7.81C10.69 7.086 11.275 6.5 12 6.5C12.725 6.5 13.31 7.086 13.31 7.81C13.31 8.534 12.725 9.12 12 9.12Z" />
                        </svg>
                        <span>Epic Games</span>
                      </AccountBadge>
                    )}

                    {user.twitchLinked && (
                      <AccountBadge>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="#9146FF"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                        </svg>
                        <span>Twitch</span>
                      </AccountBadge>
                    )}
                  </LinkedAccounts>
                </UserCard>
              ))}
            </SearchResults>
          )}

          {!loading && searchResults.length === 0 && !selectedUser && (
            <NoResults>No user results available</NoResults>
          )}

          {selectedUser && (
            <div style={{ width: "100%", paddingTop: "0.5rem" }}>
              <ProfileHeader>
                <ProfileAvatar src={getAvatarUrl(selectedUser)}>
                  {!getAvatarUrl(selectedUser) &&
                    selectedUser.displayName.charAt(0).toUpperCase()}
                </ProfileAvatar>
                <ProfileInfo>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {selectedUser.displayName}
                    <RankBadge userId={selectedUser.id} size={24} marginLeft="0.5rem" />
                  </h2>
                  <p>Member since {formatDate(selectedUser.createdAt)}</p>
                  <ButtonGroup>
                    <Button onClick={() => setIsTipModalOpen(true)}>
                      Send Tip
                    </Button>
                    <Button $secondary onClick={handleBackToSearch}>
                      Back to Search
                    </Button>
                  </ButtonGroup>
                </ProfileInfo>
              </ProfileHeader>

              <SectionTitle>Stats</SectionTitle>
              <StatsGrid>
                <StatCard>
                  <h3>{userStats?.matchesPlayed || 0}</h3>
                  <p>Matches Played</p>
                </StatCard>
                <StatCard>
                  <h3>{userStats?.matchesWon || 0}</h3>
                  <p>Matches Won</p>
                </StatCard>
                <StatCard>
                  <h3>
                    {userStats?.winRate
                      ? (userStats.winRate * 100).toFixed(1)
                      : "0.0"}
                    %
                  </h3>
                  <p>Win Rate</p>
                </StatCard>
                <StatCard>
                  <h3>{userStats?.totalEarnings || 0}</h3>
                  <p>Total Earnings</p>
                </StatCard>
              </StatsGrid>

              <SectionTitle>Linked Accounts</SectionTitle>
              <LinkedAccounts>
                {selectedUser.discordLinked && (
                  <AccountBadge>
                    <svg
                      width="20"
                      height="15"
                      viewBox="0 0 71 55"
                      fill="#5865F2"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" />
                    </svg>
                    <span>
                      {selectedUser.discordUsername || "Discord User"}
                    </span>
                  </AccountBadge>
                )}

                {selectedUser.epicLinked && (
                  <AccountBadge>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="#00BFFF"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12 0C5.383 0 0 5.383 0 12C0 18.617 5.383 24 12 24C18.617 24 24 18.617 24 12C24 5.383 18.617 0 12 0ZM13.121 17.896H10.879V12.76H8.637V10.76H15.363V12.76H13.121V17.896ZM12 9.12C11.275 9.12 10.69 8.534 10.69 7.81C10.69 7.086 11.275 6.5 12 6.5C12.725 6.5 13.31 7.086 13.31 7.81C13.31 8.534 12.725 9.12 12 9.12Z" />
                    </svg>
                    <span>
                      {selectedUser.epicUsername || "Epic Games User"}
                    </span>
                  </AccountBadge>
                )}

                {selectedUser.twitchLinked && (
                  <AccountBadge>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="#9146FF"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                    </svg>
                    <span>{selectedUser.twitchUsername || "Twitch User"}</span>
                  </AccountBadge>
                )}

                {!selectedUser.discordLinked &&
                  !selectedUser.epicLinked &&
                  !selectedUser.twitchLinked && (
                    <div style={{ color: "#b8c1ec", padding: "0.5rem 0" }}>
                      No linked accounts
                    </div>
                  )}
              </LinkedAccounts>

              <SectionTitle>Recent Matches</SectionTitle>
              {userMatches.length > 0 ? (
                <MatchHistory>
                  <MatchHeader>
                    <div>Date</div>
                    <div>Game Mode</div>
                    <div>Amount</div>
                    <div>Result</div>
                  </MatchHeader>

                  {userMatches.map((match) => (
                    <MatchRow key={match.id}>
                      <div>{formatDate(match.date)}</div>
                      <div>{match.gameMode}</div>
                      <div>{match.amount} tokens</div>
                      <div
                        style={{
                          color: match.result === "Win" ? "#2ed573" : "#ff4757",
                        }}
                      >
                        {match.result}
                      </div>
                    </MatchRow>
                  ))}
                </MatchHistory>
              ) : (
                <div style={{ color: "#b8c1ec", padding: "0.5rem 0" }}>
                  No recent matches found
                </div>
              )}

              <ButtonGroup>
                <Button
                  onClick={() => {
                    if (onClose) onClose();
                    navigate(`/user/${selectedUser.id}`);
                  }}
                >
                  View Full Profile
                </Button>
              </ButtonGroup>
            </div>
          )}
        </ModalContainer>
      </ModalOverlay>

      {/* Tip Modal */}
      {selectedUser && (
        <TipUserModalRedesigned
          isOpen={isTipModalOpen}
          onClose={() => setIsTipModalOpen(false)}
          preSelectedUserId={selectedUser.id}
        />
      )}
    </>
  );
};

export default UserSearchModal;
 