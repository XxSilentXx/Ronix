import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toggleSounds, areSoundsEnabled } from '../utils/audioUtils';

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const IconWrapper = styled.div`
  font-size: 1.2rem;
  margin-right: 0.5rem;
  color: ${props => props.enabled ? '#4facfe' : '#9e9e9e'};
`;

const Label = styled.span`
  font-size: 0.9rem;
  color: ${props => props.enabled ? '#fff' : '#9e9e9e'};
`;

/**
 * Component for toggling sound effects on/off
 */
const SoundToggle = ({ showLabel = true }) => {
  const [enabled, setEnabled] = useState(true);
  
  // Initialize the sound setting from localStorage
  useEffect(() => {
    setEnabled(areSoundsEnabled());
  }, []);
  
  const handleToggle = () => {
    const newState = toggleSounds();
    setEnabled(newState);
  };
  
  return (
    <ToggleContainer onClick={handleToggle} title={enabled ? "Sound effects are on" : "Sound effects are off"}>
      <IconWrapper enabled={enabled}>
        {enabled ? (
          <i className="fas fa-volume-up"></i>
        ) : (
          <i className="fas fa-volume-mute"></i>
        )}
      </IconWrapper>
      {showLabel && <Label enabled={enabled}>{enabled ? 'Sound On' : 'Sound Off'}</Label>}
    </ToggleContainer>
  );
};

export default SoundToggle;
