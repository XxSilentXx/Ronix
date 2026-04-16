import React from 'react';
import styled, { css } from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaTrophy, FaListOl, FaCoins, FaStore, FaUserFriends, FaStar, FaPalette, FaMedal, FaGamepad, FaBars, FaChevronLeft, FaGift } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const allSidebarItems = [
  { label: 'Home', to: '/', icon: <FaHome /> },
  { label: 'Matches', to: '/wagers', icon: <FaGamepad /> },
  { label: 'Tournaments', to: '/tournaments', icon: <FaTrophy /> },
  { label: 'Leaderboard', to: '/leaderboard', icon: <FaListOl /> },
  { label: 'Coins', to: '/coins', icon: <FaCoins /> },
  { label: 'Shop', to: '/shop', icon: <FaStore /> },
  { label: 'Battle Pass', to: '/battlepass', icon: <FaStar /> },
  { label: 'Cosmetics', to: '/cosmetics', icon: <FaPalette /> },
  { label: 'Achievements', to: '/achievements', icon: <FaMedal /> },
  { label: 'Friends', to: '/friends', icon: <FaUserFriends /> },
  { label: 'Referrals', to: '/referrals', icon: <FaGift /> },
];

const loggedOutSidebarItems = [
  { label: 'Home', to: '/', icon: <FaHome /> },
  { label: 'Matches', to: '/wagers', icon: <FaGamepad /> },
  { label: 'Tournaments', to: '/tournaments', icon: <FaTrophy /> },
  { label: 'Leaderboard', to: '/leaderboard', icon: <FaListOl /> },
  { label: 'Coins', to: '/coins', icon: <FaCoins /> },
  { label: 'Battle Pass', to: '/battlepass', icon: <FaStar /> },
];

const SidebarContainer = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: ${props => (props.collapsed ? '70px' : '240px')};
  background: #181825;
  box-shadow: 2px 0 24px #0008;
  border-right: 2px solid #23233a;
  z-index: 200;
  display: flex;
  flex-direction: column;
  transition: width 0.25s cubic-bezier(.25,1.7,.45,.87), border-right 0.25s;
  font-family: 'Poppins', Arial, sans-serif;
  @media (max-width: 700px) {
    width: ${props => (props.collapsed ? '0' : '70vw')};
    min-width: 0;
    max-width: 90vw;
    box-shadow: ${props => (props.collapsed ? 'none' : '2px 0 24px #0008')};
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  height: 70px;
  padding: 0 1.2rem;
  font-size: 2rem;
  font-weight: 900;
  color: #A259F7;
  letter-spacing: 0.08em;
  background: #131124;
  border-bottom: 1px solid #22223b;
  gap: 0.7rem;
`;

const SidebarList = styled.ul`
  list-style: none;
  padding: 2rem 0 0 0;
  margin: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SidebarItem = styled.li``;

const activeStyle = css`
  background: linear-gradient(90deg, #A259F7 0%, #00FFD0 100%);
  color: #18122B !important;
  font-weight: 900;
  box-shadow: 0 0 16px #A259F7, 0 0 8px #00FFD0;
`;

const SidebarLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 1.1rem;
  padding: 0.95rem 1.5rem;
  color: #fff;
  font-size: 1.18rem;
  font-weight: 700;
  border-radius: 1.2rem;
  margin: 0 0.7rem;
  letter-spacing: 0.03em;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s;
  text-decoration: none;
  white-space: nowrap;
  &:hover {
    background: linear-gradient(90deg, #A259F7 0%, #00FFD0 100%);
    color: #18122B;
    box-shadow: 0 0 16px #A259F7, 0 0 8px #00FFD0;
  }
  ${props => props.active && activeStyle}
  svg {
    font-size: 1.3em;
    min-width: 1.3em;
  }
  ${props => props.collapsed && css`
    justify-content: center;
    gap: 0;
    padding: 0.95rem 0.5rem;
    span { display: none; }
  `}
`;

const ToggleButton = styled.button`
  background: rgba(162, 89, 247, 0.08);
  border: none;
  color: #A259F7;
  font-size: 1.7rem;
  cursor: pointer;
  margin-left: ${props => (props.collapsed ? '0' : '0.5rem')};
  border-radius: 8px;
  padding: 0.4rem 0.6rem;
  display: flex;
  align-items: center;
  transition: color 0.2s, background 0.2s, margin 0.2s;
  &:hover {
    color: #00FFD0;
    background: rgba(0, 255, 208, 0.12);
  }
`;

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { pathname } = useLocation();
  const { currentUser } = useAuth();
  const sidebarItems = currentUser ? allSidebarItems : loggedOutSidebarItems;

  return (
    <SidebarContainer collapsed={collapsed}>
      <SidebarHeader>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flex: 1,
              minWidth: 0,
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'justify-content 0.25s',
            }}
          >
            <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
              <img
                src="/assets/ronix-logo.png"
                alt="Ronix Logo"
                style={{ height: '38px', marginRight: collapsed ? 0 : '0.5rem', display: 'block', transition: 'margin 0.25s' }}
              />
              {!collapsed && (
                <span
                  style={{
                    fontFamily: 'Poppins, Arial, sans-serif',
                    fontWeight: 900,
                    fontSize: '2rem',
                    background: 'linear-gradient(90deg, #A259F7 0%, #00FFD0 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '0.08em',
                    lineHeight: 1,
                    userSelect: 'none',
                    transition: 'opacity 0.25s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Ronix
                </span>
              )}
            </Link>
          </div>
          <ToggleButton
            onClick={() => setCollapsed(c => !c)}
            aria-label="Toggle sidebar"
            collapsed={collapsed}
          >
            {collapsed ? <FaBars /> : <FaChevronLeft />}
          </ToggleButton>
        </div>
      </SidebarHeader>
      <SidebarList>
        {sidebarItems.map(item => (
          <SidebarItem key={item.to}>
            <SidebarLink
              to={item.to}
              active={pathname === item.to ? 1 : undefined}
              collapsed={collapsed ? 1 : 0}
            >
              {item.icon}
              <span>{item.label}</span>
            </SidebarLink>
          </SidebarItem>
        ))}
      </SidebarList>
    </SidebarContainer>
  );
};

export default Sidebar; 