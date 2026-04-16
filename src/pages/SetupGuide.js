import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const Container = styled.div`
  min-height: 100vh;
  background: #131124;
  color: #fff;
  padding: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 2rem;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const SubTitle = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 1rem;
  color: #fff;
`;

const CodeBlock = styled.pre`
  background: rgba(0, 0, 0, 0.3);
  padding: 1rem;
  border-radius: 10px;
  overflow-x: auto;
  font-family: monospace;
  margin: 1rem 0;
  white-space: pre-wrap;
`;

const List = styled.ol`
  margin-left: 1.5rem;
  line-height: 1.6;
`;

const SubList = styled.ul`
  margin-left: 1.5rem;
  margin-top: 0.5rem;
  line-height: 1.6;
`;

const InfoBox = styled.div`
  background: rgba(79, 172, 254, 0.1);
  border-left: 4px solid #4facfe;
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 0 10px 10px 0;
`;

const StepBox = styled.div`
  background: rgba(255, 255, 255, 0.05);
  padding: 1.5rem;
  margin-bottom: 1rem;
  border-radius: 10px;
  border-left: 4px solid #4facfe;
`;

const StepNumber = styled.div`
  background: #4facfe;
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 1rem;
  float: left;
`;

const StepHeading = styled.h3`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 1.3rem;
`;

const Image = styled.img`
  max-width: 100%;
  border-radius: 10px;
  margin: 1rem 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const SetupGuide = () => {
  const { currentUser } = useAuth();
  
  return (
    <Container>
      <Title>OAuth Provider Setup Guide</Title>
      
      <Card>
        <SubTitle>Current Authentication Status</SubTitle>
        {currentUser ? (
          <div>
            <p>Signed in as: {currentUser.email || currentUser.displayName || currentUser.uid}</p>
            <p>Auth providers: {currentUser.providerData.map(p => p.providerId).join(', ')}</p>
          </div>
        ) : (
          <p>Not signed in. Some OAuth providers may not work until properly configured.</p>
        )}
        
        <InfoBox>
          This guide will help you set up Discord and Epic Games authentication for Ronix.
        </InfoBox>
      </Card>
      
      <Card>
        <SubTitle>Discord Authentication Setup</SubTitle>
        
        <StepBox>
          <StepHeading>
            <StepNumber>1</StepNumber>
            Create a Discord Application
          </StepHeading>
          <p>First, you need to create an application in the Discord Developer Portal:</p>
          <List>
            <li>Go to <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" style={{color: "#4facfe"}}>Discord Developer Portal</a></li>
            <li>Click "New Application" in the top right corner</li>
            <li>Give your application a name (e.g., "Fortnite Wager Site")</li>
            <li>Accept the Terms of Service and click "Create"</li>
          </List>
        </StepBox>
        
        <StepBox>
          <StepHeading>
            <StepNumber>2</StepNumber>
            Configure OAuth2 Settings
          </StepHeading>
          <p>Set up the OAuth2 configuration for your Discord app:</p>
          <List>
            <li>In the left sidebar, click on "OAuth2"</li>
            <li>Add the following Redirect URLs (one per line):
              <CodeBlock>https://tokensite-6eef3.firebaseapp.com/__/auth/handler</CodeBlock>
              <CodeBlock>http://localhost:3000/__/auth/handler</CodeBlock>
            </li>
            <li>Save your changes by clicking the "Save Changes" button at the bottom</li>
            <li>Note down your "Client ID" and "Client Secret" - you'll need these for Firebase</li>
          </List>
        </StepBox>
        
        <StepBox>
          <StepHeading>
            <StepNumber>3</StepNumber>
            Configure Discord in Firebase
          </StepHeading>
          <p>Now, set up the Discord provider in Firebase Authentication:</p>
          <List>
            <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" style={{color: "#4facfe"}}>Firebase Console</a></li>
            <li>Select your project "tokensite-6eef3"</li>
            <li>Go to Authentication → Sign-in method</li>
            <li>Click "Add new provider" or look for "OpenID Connect"</li>
            <li>Enter the following information:
              <SubList>
                <li>Provider ID: <code>oidc.discord-provider</code> (exactly as shown)</li>
                <li>Name: Discord</li>
                <li>Client ID: (from Discord Developer Portal)</li>
                <li>Client Secret: (from Discord Developer Portal)</li>
                <li>Issuer: <code>https://discord.com/api</code> (this is critical!)</li>
              </SubList>
            </li>
            <li>Make sure the provider is "Enabled" and click "Save"</li>
          </List>
          <InfoBox>
            The most important part is using the correct Issuer URL: <code>https://discord.com/api</code>
          </InfoBox>
        </StepBox>
      </Card>
      
      <Card>
        <SubTitle>Epic Games Authentication Setup</SubTitle>
        
        <StepBox>
          <StepHeading>
            <StepNumber>1</StepNumber>
            Create an Epic Games Developer Account
          </StepHeading>
          <p>First, you need an Epic Games developer account:</p>
          <List>
            <li>Go to <a href="https://dev.epicgames.com/portal/en-US/" target="_blank" rel="noopener noreferrer" style={{color: "#4facfe"}}>Epic Games Developer Portal</a></li>
            <li>Sign in with your Epic Games account or create one if needed</li>
            <li>Complete the developer registration process if prompted</li>
          </List>
        </StepBox>
        
        <StepBox>
          <StepHeading>
            <StepNumber>2</StepNumber>
            Create a New Web Application
          </StepHeading>
          <p>Create and configure a web application:</p>
          <List>
            <li>From the dashboard, navigate to "Product" → "Applications"</li>
            <li>Click "Create New Application"</li>
            <li>Select "Web Application" as the type</li>
            <li>Fill in the required information:
              <SubList>
                <li>Name: Fortnite Wager Site</li>
                <li>Store: No</li>
                <li>Redirect URLs (add both):
                  <CodeBlock>https://tokensite-6eef3.firebaseapp.com/__/auth/handler</CodeBlock>
                  <CodeBlock>http://localhost:3000/__/auth/handler</CodeBlock>
                </li>
                <li>Application Services: Enable "Epic Games Authentication"</li>
                <li>Permissions: Select "basic_profile"</li>
              </SubList>
            </li>
            <li>Submit the application for review (this may take some time)</li>
            <li>Once approved, note down your "Client ID" and "Client Secret"</li>
          </List>
        </StepBox>
        
        <StepBox>
          <StepHeading>
            <StepNumber>3</StepNumber>
            Configure Epic Games in Firebase
          </StepHeading>
          <p>Set up the Epic Games provider in Firebase Authentication:</p>
          <List>
            <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" style={{color: "#4facfe"}}>Firebase Console</a></li>
            <li>Select your project "tokensite-6eef3"</li>
            <li>Go to Authentication → Sign-in method</li>
            <li>Click "Add new provider" or look for "OpenID Connect"</li>
            <li>Enter the following information:
              <SubList>
                <li>Provider ID: <code>oidc.epicgames</code> (exactly as shown)</li>
                <li>Name: Epic Games</li>
                <li>Client ID: (from Epic Games Developer Portal)</li>
                <li>Client Secret: (from Epic Games Developer Portal)</li>
                <li>Issuer: <code>https://api.epicgames.dev/epic/oauth/v1</code> (this is critical!)</li>
              </SubList>
            </li>
            <li>Make sure the provider is "Enabled" and click "Save"</li>
          </List>
          <InfoBox>
            The correct Issuer URL for Epic Games is: <code>https://api.epicgames.dev/epic/oauth/v1</code>
          </InfoBox>
        </StepBox>
      </Card>
      
      <Card>
        <SubTitle>Testing Your Configuration</SubTitle>
        <p>Once you've completed the setup, you can test your authentication:</p>
        
        <List>
          <li>For Discord: Visit <a href="/discord-auth-test" style={{color: "#4facfe"}}>/discord-auth-test</a></li>
          <li>For Epic Games: Visit <a href="/epic-auth-test" style={{color: "#4facfe"}}>/epic-auth-test</a></li>
        </List>
        
        <InfoBox>
          <strong>Troubleshooting Tip:</strong> If you get "auth/internal-error", it usually means your Issuer URL is incorrect or the provider is not properly configured in Firebase. Double-check the exact Issuer URLs shown above.
        </InfoBox>
      </Card>
    </Container>
  );
};

export default SetupGuide; 