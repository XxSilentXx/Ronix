import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { auth } from '../firebase/config';
import { getRedirectResult } from 'firebase/auth';
import DummyDiscordTest from '../components/DummyDiscordTest';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
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

const CodeBlock = styled.pre`
  background: rgba(0, 0, 0, 0.3);
  padding: 1rem;
  border-radius: 10px;
  overflow-x: auto;
  font-family: monospace;
  margin: 1rem 0;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
`;

const Button = styled.button`
  background: #4facfe;
  color: #fff;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  margin-right: 1rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(79, 172, 254, 0.3);
  }
`;

const ConfigChecker = () => {
  const [firebaseConfig, setFirebaseConfig] = useState(null);
  const [redirectResult, setRedirectResult] = useState(null);
  const [authConfig, setAuthConfig] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);
  
  useEffect(() => {
    // Get Firebase config
    try {
      if (auth && auth._app && auth._app.options) {
        setFirebaseConfig({
          apiKey: "***REDACTED***",
          authDomain: auth._app.options.authDomain,
          projectId: auth._app.options.projectId,
          storageBucket: auth._app.options.storageBucket,
          messagingSenderId: auth._app.options.messagingSenderId,
          appId: auth._app.options.appId,
          measurementId: auth._app.options.measurementId
        });
      }
      
      // Get auth info
      if (auth) {
        setAuthConfig({
          currentUser: auth.currentUser ? {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            displayName: auth.currentUser.displayName,
            providerData: auth.currentUser.providerData.map(p => ({
              providerId: p.providerId,
              displayName: p.displayName,
              email: p.email
            }))
          } : null,
          config: {
            apiKey: auth.config.apiKey ? "***REDACTED***" : null,
            authDomain: auth.config.authDomain,
            apiHost: auth.config.apiHost,
            tokenApiHost: auth.config.tokenApiHost,
            sdkClientVersion: auth.config.sdkClientVersion
          }
        });
      }
    } catch (error) {
      console.error('Error fetching config info:', error);
      setErrorInfo({
        message: error.message,
        stack: error.stack
      });
    }
    
    // Check for redirect result
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          setRedirectResult({
            user: {
              uid: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName,
              providerData: result.user.providerData.map(p => ({
                providerId: p.providerId,
                displayName: p.displayName,
                email: p.email
              }))
            },
            operationType: result.operationType,
            providerId: result._tokenResponse?.providerId || null
          });
        } else {
          setRedirectResult("No redirect result found");
        }
      } catch (error) {
        console.error('Error checking redirect result:', error);
        setRedirectResult({
          error: {
            code: error.code,
            message: error.message,
            customData: error.customData || {}
          }
        });
      }
    };
    
    checkRedirectResult();
  }, []);
  
  const checkLocalDomains = () => {
    // Check if localhost is in authorizedDomains
    const authorizedDomains = [
      auth.config.authDomain,
      'localhost'
    ];
    
    return {
      currentOrigin: window.location.origin,
      currentHostname: window.location.hostname,
      authorizedDomains,
      isCurrentDomainAuthorized: authorizedDomains.includes(window.location.hostname)
    };
  };
  
  const testDiscordRedirectUrl = () => {
    // Generate Discord OAuth URL for testing
    const discordClientId = process.env.REACT_APP_DISCORD_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth-callback`);
    const scopes = encodeURIComponent('identify email');
    
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}`;
    
    window.open(discordAuthUrl, '_blank');
  };

  return (
    <Container>
      <Title>Firebase Configuration Checker</Title>
      
      {/* Direct Discord OAuth Test Component */}
      <DummyDiscordTest />
      
      <Card>
        <h2>Environment Info</h2>
        <CodeBlock>
          {JSON.stringify({
            nodeEnv: process.env.NODE_ENV,
            currentUrl: window.location.href,
            hostname: window.location.hostname,
            origin: window.location.origin,
            pathname: window.location.pathname,
            domainCheck: checkLocalDomains()
          }, null, 2)}
        </CodeBlock>
      </Card>
      
      <Card>
        <h2>Firebase Config</h2>
        <CodeBlock>
          {firebaseConfig ? JSON.stringify(firebaseConfig, null, 2) : "Loading..."}
        </CodeBlock>
      </Card>
      
      <Card>
        <h2>Firebase Auth Config</h2>
        <CodeBlock>
          {authConfig ? JSON.stringify(authConfig, null, 2) : "Loading..."}
        </CodeBlock>
      </Card>
      
      <Card>
        <h2>Redirect Result</h2>
        <CodeBlock>
          {redirectResult ? JSON.stringify(redirectResult, null, 2) : "Loading..."}
        </CodeBlock>
      </Card>
      
      {errorInfo && (
        <Card>
          <h2>Errors</h2>
          <CodeBlock>
            {JSON.stringify(errorInfo, null, 2)}
          </CodeBlock>
        </Card>
      )}
      
      <Card>
        <h2>Test Discord Auth Flow</h2>
        <p>
          This will open a new tab with the Discord OAuth URL using the client ID from AuthCallback.js.
          This is to test if the basic Discord OAuth flow works outside of Firebase Authentication.
        </p>
        <Button onClick={testDiscordRedirectUrl}>
          Test Discord Redirect URL
        </Button>
      </Card>
      
      <Card>
        <h2>Discord Authentication Troubleshooting</h2>
        <p>Common issues:</p>
        <ol>
          <li>
            <strong>Domain Authorization:</strong> Make sure 'localhost' is added to authorized domains in 
            Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains
          </li>
          <li>
            <strong>Discord Provider Setup:</strong> In Firebase Console &gt; Authentication &gt; Sign-in methods,
            ensure Discord is enabled with the correct OAuth credentials
          </li>
          <li>
            <strong>Discord Developer Portal:</strong> Make sure your Discord app has the correct redirect URIs:
            <ul>
              <li>{window.location.origin}/auth-callback</li>
              <li>{window.location.origin}/__/auth/handler</li>
              <li>https://tokensite-6eef3.firebaseapp.com/__/auth/handler</li>
            </ul>
          </li>
          <li>
            <strong>Provider ID:</strong> Make sure you're using 'discord.com' as the provider ID, not 'oidc.discord-provider'
          </li>
        </ol>
      </Card>
    </Container>
  );
};

export default ConfigChecker; 