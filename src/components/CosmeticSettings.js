import React, { useState } from 'react';
import styled from 'styled-components';
import { useCosmetics } from '../contexts/CosmeticContext';

const SettingsContainer = styled.div`
  background: rgba(44, 62, 80, 0.95);
  border-radius: 15px;
  padding: 2rem;
  margin: 2rem 0;
  border: 2px solid #4facfe;
  box-shadow: 0 8px 32px 0 #4facfe33;
`;

const SettingsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  h2 {
    color: #4facfe;
    font-size: 1.8rem;
    margin: 0;
    font-family: 'Luckiest Guy', 'Barlow', sans-serif;
  }
`;

const ToggleButton = styled.button`
  background: ${props => props.$active ? 'linear-gradient(90deg, #4facfe 0%, #ff61e6 100%)' : 'rgba(255, 255, 255, 0.1)'};
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(90deg, #ff61e6 0%, #4facfe 100%);
    transform: translateY(-2px);
  }
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const SettingCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: #4facfe;
  }
`;

const SettingTitle = styled.h3`
  color: #fff;
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SettingDescription = styled.p`
  color: #b8c1ec;
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const SettingToggle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${props => props.$checked ? '#4facfe' : '#ccc'};
    transition: 0.4s;
    border-radius: 34px;
    
    &:before {
      position: absolute;
      content: "";
      height: 26px;
      width: 26px;
      left: ${props => props.$checked ? '30px' : '4px'};
      bottom: 4px;
      background-color: white;
      transition: 0.4s;
      border-radius: 50%;
    }
  }
`;

const GlobalControls = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ActionButton = styled.button`
  background: ${props => {
    if (props.$danger) return 'linear-gradient(90deg, #ff4757 0%, #ff6b7a 100%)';
    if (props.$success) return 'linear-gradient(90deg, #2ed573 0%, #7bed9f 100%)';
    return 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)';
  }};
  color: #fff;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: ${props => props.$active ? 'rgba(46, 213, 115, 0.2)' : 'rgba(255, 71, 87, 0.2)'};
  color: ${props => props.$active ? '#2ed573' : '#ff4757'};
  font-weight: 600;
  
  &::before {
    content: '${props => props.$active ? '●' : '●'}';
    font-size: 1.2rem;
  }
`;

const CosmeticSettings = ({ isOpen, onClose }) => {
  const { cosmeticSettings, updateCosmeticSettings } = useCosmetics();
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  const handleToggle = (setting, value) => {
    updateCosmeticSettings({ [setting]: value });
  };

  const enableAll = () => {
    updateCosmeticSettings({
      showNameplates: true,
      showProfiles: true,
      showFlair: true,
      showAnimations: true,
      globalDisable: false
    });
  };

  const disableAll = () => {
    updateCosmeticSettings({
      showNameplates: false,
      showProfiles: false,
      showFlair: false,
      showAnimations: false,
      globalDisable: true
    });
  };

  const resetToDefaults = () => {
    updateCosmeticSettings({
      showNameplates: true,
      showProfiles: true,
      showFlair: true,
      showAnimations: true,
      globalDisable: false
    });
  };

  const isAllEnabled = cosmeticSettings.showNameplates && 
                     cosmeticSettings.showProfiles && 
                     cosmeticSettings.showFlair && 
                     cosmeticSettings.showAnimations && 
                     !cosmeticSettings.globalDisable;

  const isAllDisabled = !cosmeticSettings.showNameplates && 
                       !cosmeticSettings.showProfiles && 
                       !cosmeticSettings.showFlair && 
                       !cosmeticSettings.showAnimations;

  return (
    <SettingsContainer>
      <SettingsHeader>
        <h2> Cosmetic Display Settings</h2>
        <ToggleButton onClick={onClose}>
          Close
        </ToggleButton>
      </SettingsHeader>

      <GlobalControls>
        <StatusIndicator $active={isAllEnabled}>
          {isAllEnabled ? 'All Cosmetics Enabled' : isAllDisabled ? 'All Cosmetics Disabled' : 'Mixed Settings'}
        </StatusIndicator>
        
        <ActionButton $success onClick={enableAll}>
          Enable All
        </ActionButton>
        
        <ActionButton $danger onClick={disableAll}>
          Disable All
        </ActionButton>
        
        <ActionButton onClick={resetToDefaults}>
          Reset to Defaults
        </ActionButton>
        
        <ToggleButton 
          $active={showAdvanced} 
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
        </ToggleButton>
      </GlobalControls>

      <SettingsGrid>
        <SettingCard>
          <SettingTitle>
             Nameplate Effects
          </SettingTitle>
          <SettingDescription>
            Display animated nameplate effects around usernames (flame, neon, gold, ice effects)
          </SettingDescription>
          <SettingToggle>
            <Switch $checked={cosmeticSettings.showNameplates && !cosmeticSettings.globalDisable}>
              <input 
                type="checkbox" 
                checked={cosmeticSettings.showNameplates && !cosmeticSettings.globalDisable}
                onChange={(e) => handleToggle('showNameplates', e.target.checked)}
                disabled={cosmeticSettings.globalDisable}
              />
              <span className="slider"></span>
            </Switch>
          </SettingToggle>
        </SettingCard>

        <SettingCard>
          <SettingTitle>
             Profile Backgrounds
          </SettingTitle>
          <SettingDescription>
            Display animated background themes on profile pages (cosmic, cyber, candy, champion themes)
          </SettingDescription>
          <SettingToggle>
            <Switch $checked={cosmeticSettings.showProfiles && !cosmeticSettings.globalDisable}>
              <input 
                type="checkbox" 
                checked={cosmeticSettings.showProfiles && !cosmeticSettings.globalDisable}
                onChange={(e) => handleToggle('showProfiles', e.target.checked)}
                disabled={cosmeticSettings.globalDisable}
              />
              <span className="slider"></span>
            </Switch>
          </SettingToggle>
        </SettingCard>

        <SettingCard>
          <SettingTitle>
             Leaderboard Flair
          </SettingTitle>
          <SettingDescription>
            Display special badges and flair next to usernames on leaderboards and profiles
          </SettingDescription>
          <SettingToggle>
            <Switch $checked={cosmeticSettings.showFlair && !cosmeticSettings.globalDisable}>
              <input 
                type="checkbox" 
                checked={cosmeticSettings.showFlair && !cosmeticSettings.globalDisable}
                onChange={(e) => handleToggle('showFlair', e.target.checked)}
                disabled={cosmeticSettings.globalDisable}
              />
              <span className="slider"></span>
            </Switch>
          </SettingToggle>
        </SettingCard>

        <SettingCard>
          <SettingTitle>
             Animations
          </SettingTitle>
          <SettingDescription>
            Enable or disable all cosmetic animations (pulse, glow, drift, shimmer effects)
          </SettingDescription>
          <SettingToggle>
            <Switch $checked={cosmeticSettings.showAnimations && !cosmeticSettings.globalDisable}>
              <input 
                type="checkbox" 
                checked={cosmeticSettings.showAnimations && !cosmeticSettings.globalDisable}
                onChange={(e) => handleToggle('showAnimations', e.target.checked)}
                disabled={cosmeticSettings.globalDisable}
              />
              <span className="slider"></span>
            </Switch>
          </SettingToggle>
        </SettingCard>

        {showAdvanced && (
          <SettingCard>
            <SettingTitle>
               Global Disable
            </SettingTitle>
            <SettingDescription>
              Master switch to disable ALL cosmetic effects across the entire application
            </SettingDescription>
            <SettingToggle>
              <Switch $checked={cosmeticSettings.globalDisable}>
                <input 
                  type="checkbox" 
                  checked={cosmeticSettings.globalDisable}
                  onChange={(e) => handleToggle('globalDisable', e.target.checked)}
                />
                <span className="slider"></span>
              </Switch>
            </SettingToggle>
          </SettingCard>
        )}
      </SettingsGrid>

      {showAdvanced && (
        <div style={{ 
          padding: '1rem', 
          background: 'rgba(255, 193, 7, 0.1)', 
          borderRadius: '8px',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          color: '#ffc107'
        }}>
          <strong> Advanced Settings:</strong> These settings are saved locally and will persist across browser sessions. 
          Global disable overrides all other settings and completely removes cosmetic effects from the application.
        </div>
      )}
    </SettingsContainer>
  );
};

export default CosmeticSettings; 