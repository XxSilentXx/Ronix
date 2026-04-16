import React, { useState } from 'react';
import styled from 'styled-components';

const ResultsContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ResultsHeader = styled.h3`
  color: #4facfe;
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ResultItem = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  border-left: 4px solid ${props => props.$isWinner ? '#2ed573' : '#4facfe'};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ResultHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
`;

const SubmitterInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  .name {
    font-weight: 600;
    color: #fff;
  }
  
  .timestamp {
    font-size: 0.85rem;
    color: #b8c1ec;
  }
`;

const ScoreDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 1.1rem;
  font-weight: 600;
  
  .team-score {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }
  
  .score {
    background: rgba(79, 172, 254, 0.2);
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    min-width: 30px;
    text-align: center;
  }
  
  .vs {
    color: #b8c1ec;
    font-size: 0.9rem;
  }
  
  .winner-indicator {
    background: #2ed573;
    color: #fff;
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 700;
  }
`;

const ScreenshotsSection = styled.div`
  margin-top: 1rem;
`;

const ScreenshotsHeader = styled.div`
  color: #b8c1ec;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
`;

const ScreenshotsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.8rem;
  max-width: 500px;
`;

const ScreenshotThumbnail = styled.div`
  position: relative;
  aspect-ratio: 16/9;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ScreenshotModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  padding: 2rem;
`;

const ScreenshotModalContent = styled.div`
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  
  img {
    max-width: 100%;
    max-height: 100%;
    border-radius: 8px;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: #fff;
  font-size: 2rem;
  cursor: pointer;
  padding: 0.5rem;
  
  &:hover {
    color: #4facfe;
  }
`;

const NoResultsMessage = styled.div`
  text-align: center;
  color: #b8c1ec;
  font-style: italic;
  padding: 2rem;
`;

const ConflictWarning = styled.div`
  background: rgba(255, 193, 7, 0.1);
  border: 2px solid rgba(255, 193, 7, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  color: #ffc107;
  text-align: center;
  font-weight: 600;
  
  .icon {
    margin-right: 0.5rem;
  }
`;

const MatchResultsViewer = ({ match, currentUser }) => {
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  
  if (!match || !match.results || match.results.length === 0) {
    return (
      <ResultsContainer>
        <ResultsHeader>
           Match Results
        </ResultsHeader>
        <NoResultsMessage>
          No results have been submitted yet.
        </NoResultsMessage>
      </ResultsContainer>
    );
  }
  
  const results = match.results;
  const hasConflict = results.length === 2 && (
    results[0].hostScore !== results[1].hostScore ||
    results[0].guestScore !== results[1].guestScore ||
    results[0].winnerId !== results[1].winnerId
  );
  
  const formatTimestamp = (timestamp) => {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    } else if (timestamp instanceof Date) {
      return timestamp.toLocaleString();
    } else if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleString();
    }
    return 'Unknown time';
  };
  
  const openScreenshot = (url) => {
    setSelectedScreenshot(url);
  };
  
  const closeScreenshot = () => {
    setSelectedScreenshot(null);
  };
  
  return (
    <>
      <ResultsContainer>
        <ResultsHeader>
           Submitted Results
        </ResultsHeader>
        
        {hasConflict && (
          <ConflictWarning>
            <span className="icon"></span>
            Results conflict detected! Both players submitted different scores. 
            An admin will review this match.
          </ConflictWarning>
        )}
        
        {results.map((result, index) => (
          <ResultItem key={index} $isWinner={result.winnerId === currentUser?.uid}>
            <ResultHeader>
              <SubmitterInfo>
                <div className="name">{result.submitterName || 'Anonymous'}</div>
                <div className="timestamp">
                  {formatTimestamp(result.timestamp)}
                </div>
              </SubmitterInfo>
              {result.winnerId === currentUser?.uid && (
                <div className="winner-indicator">Winner</div>
              )}
            </ResultHeader>
            
            <ScoreDisplay>
              <div className="team-score">
                <span>{match.hostName || 'Host'}</span>
                <span className="score">{result.hostScore}</span>
              </div>
              <span className="vs">vs</span>
              <div className="team-score">
                <span className="score">{result.guestScore}</span>
                <span>{match.guestName || 'Guest'}</span>
              </div>
              {result.winnerName && (
                <div style={{ 
                  marginLeft: '1rem', 
                  color: '#2ed573', 
                  fontWeight: 600, 
                  fontSize: '0.9rem' 
                }}>
                  Winner: {result.winnerName}
                </div>
              )}
            </ScoreDisplay>
            
            {result.screenshots && result.screenshots.length > 0 && (
              <ScreenshotsSection>
                <ScreenshotsHeader>
                   Screenshots ({result.screenshots.length})
                </ScreenshotsHeader>
                <ScreenshotsGrid>
                  {result.screenshots.map((screenshotUrl, screenshotIndex) => (
                    <ScreenshotThumbnail
                      key={screenshotIndex}
                      onClick={() => openScreenshot(screenshotUrl)}
                    >
                      <img
                        src={screenshotUrl}
                        alt={`Screenshot ${screenshotIndex + 1}`}
                        loading="lazy"
                      />
                    </ScreenshotThumbnail>
                  ))}
                </ScreenshotsGrid>
              </ScreenshotsSection>
            )}
          </ResultItem>
        ))}
      </ResultsContainer>
      
      {/* Screenshot Modal */}
      {selectedScreenshot && (
        <ScreenshotModal onClick={closeScreenshot}>
          <ScreenshotModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={closeScreenshot}>&times;</CloseButton>
            <img src={selectedScreenshot} alt="Full size screenshot" />
          </ScreenshotModalContent>
        </ScreenshotModal>
      )}
    </>
  );
};

export default MatchResultsViewer; 