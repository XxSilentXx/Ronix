import React from 'react';
import styled from 'styled-components';

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #4facfe;
`;

const Spinner = styled.div`
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top: 4px solid #4facfe;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  margin-right: 10px;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorContainer = styled.div`
  padding: 1rem;
  border-radius: 8px;
  background-color: rgba(255, 71, 87, 0.2);
  color: #ff4757;
  text-align: center;
  margin: 1rem 0;
`;

export const LoadingIndicator = ({ children }) => {
  return (
    <LoadingContainer>
      <Spinner />
      {children || 'Loading...'}
    </LoadingContainer>
  );
};

export const ErrorMessage = ({ children }) => {
  return (
    <ErrorContainer>
      {children || 'An error occurred. Please try again.'}
    </ErrorContainer>
  );
};

export default LoadingIndicator; 