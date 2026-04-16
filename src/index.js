import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './contexts/AuthContext';
import { TokenProvider } from './contexts/TokenContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { FriendsProvider } from './contexts/FriendsContext';
import { migrateDisplayNameLower } from './firebase/migrations';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <TokenProvider>
        <NotificationProvider>
          <FriendsProvider>
            <App />
          </FriendsProvider>
        </NotificationProvider>
      </TokenProvider>
    </AuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Run displayNameLower migration once in development mode
if (process.env.NODE_ENV === 'development') {
  // Use a flag in localStorage to ensure we only run this once per browser session
  const migrationRun = localStorage.getItem('migrationRun');
  if (!migrationRun) {
    migrateDisplayNameLower()
      .then((result) => {
        localStorage.setItem('migrationRun', Date.now().toString());
      })
      .catch(err => {
        console.error('Migration failed:', err);
      });
  }
}
