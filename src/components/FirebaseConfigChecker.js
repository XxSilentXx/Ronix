import React, { useState } from 'react';
import { auth } from '../firebase/config';

const FirebaseConfigChecker = () => {
  const [showConfig, setShowConfig] = useState(false);
  
  const checkConfig = () => {
    try {
      // Get Firebase auth settings and providers
      const providers = auth.config?.settings?.authDomain ? 'Available' : 'Not available';
      
      return {
        apiKey: auth.app.options.apiKey ? 'Valid' : 'Missing',
        authDomain: auth.app.options.authDomain,
        projectId: auth.app.options.projectId,
        providersLoaded: providers,
        currentUser: auth.currentUser ? auth.currentUser.email : 'Not signed in'
      };
    } catch (error) {
      console.error('Error checking config:', error);
      return { error: error.message };
    }
  };
  
  return (
    <div style={{ margin: '20px 0', border: '1px solid #4facfe', padding: '10px', borderRadius: '8px' }}>
      <button
        onClick={() => setShowConfig(!showConfig)}
        style={{
          background: '#1a1a2e',
          color: '#4facfe',
          border: '1px solid #4facfe',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        {showConfig ? 'Hide' : 'Show'} Firebase Config
      </button>
      
      {showConfig && (
        <div style={{ marginTop: '10px', backgroundColor: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#4facfe' }}>Firebase Configuration</h4>
          <pre style={{ color: 'white', overflow: 'auto', fontSize: '12px' }}>
            {JSON.stringify(checkConfig(), null, 2)}
          </pre>
          <p style={{ fontSize: '12px', marginTop: '10px', color: '#b8c1ec' }}>
            <strong>Verify that:</strong><br />
            1. Your authDomain matches your project<br />
            2. Your apiKey is valid<br />
            3. Make sure the Provider ID in Firebase exactly matches 'oidc.discord-provider'
          </p>
        </div>
      )}
    </div>
  );
};

export default FirebaseConfigChecker; 