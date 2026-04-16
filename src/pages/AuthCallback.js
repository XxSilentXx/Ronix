import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth, getRedirectResult, signInWithCredential, OAuthProvider } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../contexts/AuthContext';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const AuthCallback = () => {
  const { currentUser, checkRedirectResult } = useAuth();
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();
  const [message, setMessage] = useState("Processing authentication...");
  const [debugInfo, setDebugInfo] = useState(null);

  // Discord application credentials
  const clientId = process.env.REACT_APP_DISCORD_CLIENT_ID;
  const redirectUri = window.location.origin + '/auth-callback';

  // Twitch application credentials
  const twitchClientId = '0b2ky6cvke29pzotf5cq6ocfwzhlil';
  const twitchRedirectUri = window.location.origin + '/auth-callback';
  const callableFunctions = getFunctions();
  const exchangeDiscordCode = httpsCallable(callableFunctions, 'exchangeDiscordCode');
  const exchangeTwitchCode = httpsCallable(callableFunctions, 'exchangeTwitchCode');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Log the URL and params for debugging
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('code');
        const authError = urlParams.get('error');
        const authState = urlParams.get('state');

        // Debug information that's helpful to diagnose the issue
        setDebugInfo({
          url: window.location.href,
          codeParam: authCode ? "Present" : "Not present",
          errorParam: authError,
          stateParam: authState ? "Present" : "Not present",
          isFirebaseState: authState?.startsWith('firebase'),
          currentUser: currentUser ? { uid: currentUser.uid } : null,
          timestamp: new Date().toISOString()
        });

        // begin with check if this is a Firebase Auth redirect result


        try {
          const firebaseRedirectResult = await checkRedirectResult();

          if (firebaseRedirectResult) {


            // see ifthis is a Twitch linking flow
            const isTwitchLinking = localStorage.getItem('twitch_link_started');

            if (isTwitchLinking && currentUser) {

              setMessage("Processing Twitch account linking...");

              try {
                // Get the provider data from the redirect result
                const twitchProvider = firebaseRedirectResult.providerData.find(
                  (provider) => provider.providerId === 'oidc.twitch'
                );

                if (twitchProvider) {
                  // Get access token from the credential
                  const credential = OAuthProvider.credentialFromResult(firebaseRedirectResult);
                  const accessToken = credential?.accessToken;

                  // Store Twitch data in Firestore
                  const userRef = doc(db, 'users', currentUser.uid);

                  // Prepare Twitch user data
                  const twitchData = {
                    twitchId: twitchProvider.uid,
                    twitchUsername: twitchProvider.displayName || 'Twitch User',
                    twitchEmail: twitchProvider.email || null,
                    twitchLinked: true,
                    twitchPhotoURL: twitchProvider.photoURL || null,
                    twitchAccessToken: accessToken || null,
                    twitchUpdatedAt: new Date().toISOString()
                  };

                  // Update user document
                  await setDoc(userRef, {
                    ...twitchData,
                    updatedAt: new Date().toISOString()
                  }, { merge: true });


                  setMessage("Twitch account successfully linked! Redirecting...");

                  // Clear the linking flag
                  localStorage.removeItem('twitch_link_started');
                  localStorage.removeItem('twitch_link_user');

                  // Set a flag to refresh the profile page
                  localStorage.setItem('twitch_needs_refresh', 'true');

                  // Redirect to profile page
                  setTimeout(() => {
                    navigate('/profile');
                  }, 1500);

                  // Update public_streamers collection
                  const publicStreamerRef = doc(db, 'public_streamers', currentUser.uid);
                  await setDoc(publicStreamerRef, {
                    twitchUsername: twitchProvider.displayName || 'Twitch User',
                    displayName: twitchProvider.displayName || 'Twitch User',
                    avatarUrl: twitchProvider.photoURL || null,
                    updatedAt: new Date().toISOString()
                  }, { merge: true });

                  return;
                }
              } catch (twitchError) {

                setMessage("Error linking Twitch account. Please try again.");

                // Clear the linking flag
                localStorage.removeItem('twitch_link_started');
                localStorage.removeItem('twitch_link_user');

                // Redirect to profile page after a delay
                setTimeout(() => {
                  navigate('/profile');
                }, 2000);

                return;
              }
            }

            setMessage("Authentication successful! Redirecting...");

            // Successful Firebase Auth redirect, go to wagers page
            setTimeout(() => {
              navigate('/wagers');
            }, 1000);

            return;
          }
        } catch (firebaseError) {

          setMessage(`Firebase redirect error: ${firebaseError.message}`);
          setDebugInfo((prev) => ({
            ...prev,
            firebaseRedirectError: {
              code: firebaseError.code,
              message: firebaseError.message
            }
          }));
        }

        // If we get here, Firebase didn't process the redirect. Try to handle it manually.

        // see ifthis is a Discord authentication flow
        const isDiscordAuth = localStorage.getItem('discord_auth_started');
        // check:this is a manual Discord linking flow from the profile page
        const isDiscordLinking = localStorage.getItem('discord_link_started');
        // check:this is a modal-initiated Discord linking flow
        const isDiscordLinkingFromModal = localStorage.getItem('discord_linking_from_modal');
        // check:this is a Twitch linking flow
        const isTwitchLinking = localStorage.getItem('twitch_link_started');
        // see ifthis is a Twitch authentication flow
        const isTwitchAuth = localStorage.getItem('twitch_auth_started');

        if (authCode && isDiscordAuth) {
          // This is our new direct Discord authentication flow

          setMessage("Processing Discord authentication...");

          try {
            // Log query parameters for debugging






            const exchangeResponse = await exchangeDiscordCode({
              code: authCode,
              redirectUri
            });
            const { userData, accessToken } = exchangeResponse.data;
            const access_token = accessToken;
            const userResponse = { data: userData };



            // Instead of trying to use Firebase Auth, create a session in localStorage
            // and add the user directly to Firestore

            // Create a temporary user ID based on Discord ID
            const tempUserId = `discord_${userResponse.data.id}`;

            // Store the user info in Firestore
            const userRef = doc(db, 'users', tempUserId);

            // Prepare Discord user data
            const discordData = {
              discordId: userResponse.data.id,
              discordUsername: userResponse.data.username,
              discordDiscriminator: userResponse.data.discriminator || '0000',
              discordEmail: userResponse.data.email || null,
              discordLinked: true,
              discordAvatar: userResponse.data.avatar,
              discordUpdatedAt: new Date().toISOString(),
              loginMethod: 'discord',
              lastLogin: new Date().toISOString()
            };

            // check:user already exists
            const userDoc = await getDoc(userRef);

            // Update or create user document
            if (userDoc.exists()) {

              await setDoc(userRef, {
                ...discordData,
                updatedAt: new Date().toISOString()
              }, { merge: true });
            } else {

              await setDoc(userRef, {
                ...discordData,
                email: userResponse.data.email || '',
                displayName: userResponse.data.username || 'Discord User',
                tokenBalance: 100, // Give new users some starting tokens
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            }

            // Store session info in localStorage
            localStorage.setItem('discord_session', JSON.stringify({
              userId: tempUserId,
              discordId: userResponse.data.id,
              username: userResponse.data.username,
              avatar: userResponse.data.avatar,
              timestamp: new Date().toISOString()
            }));

            // Clear the auth flag
            localStorage.removeItem('discord_auth_started');

            // Also set the flag to refresh the profile page - this ensures Discord is linked in profile
            localStorage.setItem('discord_needs_refresh', 'true');

            setMessage("Authentication successful! Discord linked to your profile. Redirecting...");

            // Redirect to wagers page
            setTimeout(() => {
              navigate('/wagers');
            }, 1500);
          } catch (error) {


            // Add detailed error information to debug
            setDebugInfo((prev) => ({
              ...prev,
              discordAuthError: {
                message: error.message,
                response: error.response?.data,
                stack: error.stack
              }
            }));

            setMessage("Discord authentication error. Please try again.");

            // Clear the auth flag
            localStorage.removeItem('discord_auth_started');

            // Redirect to login page
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          }
        } else if (authCode && (isDiscordLinking || isDiscordLinkingFromModal)) {


          // see ifuser is authenticated
          if (!currentUser) {

            setMessage("You must be logged in to link your Discord account. Redirecting...");

            // Clear all linking flags
            localStorage.removeItem('discord_link_started');
            localStorage.removeItem('discord_link_user');
            localStorage.removeItem('discord_linking_from_modal');

            // Redirect based on source
            const redirectPath = isDiscordLinkingFromModal ? '/' : '/profile';
            setTimeout(() => {
              navigate(redirectPath);
            }, 1500);

            return;
          }

          setMessage("Processing Discord account linking...");

          try {
            // Log query parameters for debugging






            const exchangeResponse = await exchangeDiscordCode({
              code: authCode,
              redirectUri
            });
            const { userData, accessToken } = exchangeResponse.data;
            const access_token = accessToken;
            const userResponse = { data: userData };



            // Store Discord data in Firestore
            const userRef = doc(db, 'users', currentUser.uid);

            // Get current user data
            const userDoc = await getDoc(userRef);

            // Prepare Discord user data
            const discordData = {
              discordId: userResponse.data.id,
              discordUsername: userResponse.data.username,
              discordDiscriminator: userResponse.data.discriminator || '0000',
              discordEmail: userResponse.data.email || null,
              discordLinked: true,
              discordAvatar: userResponse.data.avatar,
              discordUpdatedAt: new Date().toISOString()
            };



            // Update or create user document
            if (userDoc.exists()) {
              await setDoc(userRef, {
                ...discordData,
                updatedAt: new Date().toISOString()
              }, { merge: true });
            } else {
              await setDoc(userRef, {
                ...discordData,
                email: currentUser.email,
                displayName: currentUser.displayName || 'User',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            }


            setMessage("Discord account successfully linked! Redirecting...");

            // Clear all linking flags
            localStorage.removeItem('discord_link_started');
            localStorage.removeItem('discord_link_user');
            localStorage.removeItem('discord_linking_from_modal');

            // Set a flag to refresh the profile page
            localStorage.setItem('discord_needs_refresh', 'true');

            // Redirect based on source - modal users go to home page, profile users go to profile
            const redirectPath = isDiscordLinkingFromModal ? '/' : '/profile';
            setTimeout(() => {
              navigate(redirectPath);
            }, 1500);
          } catch (error) {

            setMessage("Error linking Discord account. Please try again.");
            setDebugInfo((prev) => ({
              ...prev,
              discordLinkingError: {
                message: error.message,
                response: error.response?.data
              }
            }));

            // Clear all linking flags
            localStorage.removeItem('discord_link_started');
            localStorage.removeItem('discord_link_user');
            localStorage.removeItem('discord_linking_from_modal');

            // Redirect based on source
            const redirectPath = isDiscordLinkingFromModal ? '/' : '/profile';
            setTimeout(() => {
              navigate(redirectPath);
            }, 2000);
          }
        } else if (authCode && !isDiscordLinking && !isDiscordLinkingFromModal && !isDiscordAuth && !isTwitchLinking && !isTwitchAuth && !authState) {
          // coverthe case where Discord redirected with a code but it's not a linking flow
          // and not a Firebase state - possibly a direct Discord redirect

          setMessage("Processing Discord login attempt...");

          try {
            const exchangeResponse = await exchangeDiscordCode({
              code: authCode,
              redirectUri
            });
            const { userData, accessToken } = exchangeResponse.data;
            const access_token = accessToken;
            const userResponse = { data: userData };



            // Create a user ID based on Discord ID
            const userId = `discord_${userResponse.data.id}`;


            // Update Firestore directly without Firebase Auth
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
              await setDoc(userRef, {
                email: userResponse.data.email || '',
                displayName: userResponse.data.username || '',
                photoURL: userResponse.data.avatar ?
                `https://cdn.discordapp.com/avatars/${userResponse.data.id}/${userResponse.data.avatar}.png` : '',
                tokenBalance: 100,
                discordId: userResponse.data.id,
                discordUsername: userResponse.data.username,
                discordLinked: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            } else {
              await setDoc(userRef, {
                discordUsername: userResponse.data.username,
                discordLinked: true,
                lastLogin: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }, { merge: true });
            }

            // Store session in localStorage
            localStorage.setItem('discord_session', JSON.stringify({
              userId: userId,
              discordId: userResponse.data.id,
              username: userResponse.data.username,
              timestamp: new Date().toISOString()
            }));

            // Set the flag to refresh the profile page - this ensures Discord is linked in profile
            localStorage.setItem('discord_needs_refresh', 'true');

            setMessage("Authentication successful! Discord linked to your profile. Redirecting...");

            // Redirect to wagers page
            setTimeout(() => {
              navigate('/wagers');
            }, 1500);
          } catch (tokenError) {

            setMessage("Discord authentication error. Please try again.");
            setDebugInfo((prev) => ({
              ...prev,
              discordTokenError: {
                message: tokenError.message,
                response: tokenError.response?.data
              }
            }));

            // Redirect to login page after a delay
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          }
        } else if (authCode && isTwitchLinking) {


          // double-checkuser is authenticated
          if (!currentUser) {

            setMessage("You must be logged in to link your Twitch account. Redirecting...");

            // Clear the linking flag
            localStorage.removeItem('twitch_link_started');
            localStorage.removeItem('twitch_link_user');
            localStorage.removeItem('twitch_link_nonce');

            // Redirect back to profile
            setTimeout(() => {
              navigate('/profile');
            }, 1500);

            return;
          }

          setMessage("Processing Twitch account linking...");

          try {
            // Log query parameters for debugging






            const exchangeResponse = await exchangeTwitchCode({
              code: authCode,
              redirectUri: twitchRedirectUri
            });
            const { userData, accessToken } = exchangeResponse.data;
            const access_token = accessToken;
            const userResponse = { data: userData };



            if (userResponse.data.data && userResponse.data.data.length > 0) {
              const twitchUser = userResponse.data.data[0];

              // Store Twitch data in Firestore
              const userRef = doc(db, 'users', currentUser.uid);

              // Prepare Twitch user data
              const twitchData = {
                twitchId: twitchUser.id,
                twitchUsername: twitchUser.login,
                twitchDisplayName: twitchUser.display_name,
                twitchEmail: twitchUser.email || null,
                twitchLinked: true,
                twitchPhotoURL: twitchUser.profile_image_url || null,
                twitchAccessToken: access_token, // Store for checking stream status later
                twitchUpdatedAt: new Date().toISOString()
              };

              // Update user document
              await setDoc(userRef, {
                ...twitchData,
                updatedAt: new Date().toISOString()
              }, { merge: true });


              setMessage("Twitch account successfully linked! Redirecting...");

              // Clear the linking flag
              localStorage.removeItem('twitch_link_started');
              localStorage.removeItem('twitch_link_user');
              localStorage.removeItem('twitch_link_nonce');

              // Set a flag to refresh the profile page
              localStorage.setItem('twitch_needs_refresh', 'true');

              // Redirect to profile page
              setTimeout(() => {
                navigate('/profile');
              }, 1500);

              // Update public_streamers collection
              const publicStreamerRef = doc(db, 'public_streamers', currentUser.uid);
              await setDoc(publicStreamerRef, {
                twitchUsername: twitchUser.login,
                displayName: twitchUser.display_name,
                avatarUrl: twitchUser.profile_image_url || null,
                updatedAt: new Date().toISOString()
              }, { merge: true });
            } else {
              throw new Error('No Twitch user data found in response');
            }
          } catch (error) {

            setMessage("Error linking Twitch account. Please try again.");
            setDebugInfo((prev) => ({
              ...prev,
              twitchLinkingError: {
                message: error.message,
                response: error.response?.data
              }
            }));

            // Clear the linking flag
            localStorage.removeItem('twitch_link_started');
            localStorage.removeItem('twitch_link_user');
            localStorage.removeItem('twitch_link_nonce');

            // Redirect to profile page after a delay
            setTimeout(() => {
              navigate('/profile');
            }, 2000);
          }
        } else if (authCode && isTwitchAuth) {
          // Twitch auth flow (not just account linking)

          setMessage("Processing Twitch authentication...");

          try {
            const exchangeResponse = await exchangeTwitchCode({
              code: authCode,
              redirectUri: twitchRedirectUri
            });
            const { userData, accessToken } = exchangeResponse.data;
            const access_token = accessToken;
            const userResponse = { data: userData };

            if (userResponse.data.data && userResponse.data.data.length > 0) {
              const twitchUser = userResponse.data.data[0];

              // Create a user ID based on Twitch ID
              const userId = `twitch_${twitchUser.id}`;


              // Update Firestore directly
              const userRef = doc(db, 'users', userId);
              const userDoc = await getDoc(userRef);

              if (!userDoc.exists()) {
                await setDoc(userRef, {
                  email: twitchUser.email || '',
                  displayName: twitchUser.display_name || '',
                  photoURL: twitchUser.profile_image_url || '',
                  tokenBalance: 100,
                  twitchId: twitchUser.id,
                  twitchUsername: twitchUser.login,
                  twitchDisplayName: twitchUser.display_name,
                  twitchLinked: true,
                  twitchAccessToken: access_token,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                });
              } else {
                await setDoc(userRef, {
                  twitchUsername: twitchUser.login,
                  twitchDisplayName: twitchUser.display_name,
                  twitchLinked: true,
                  twitchAccessToken: access_token,
                  lastLogin: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }, { merge: true });
              }

              // Store session in localStorage
              localStorage.setItem('twitch_session', JSON.stringify({
                userId: userId,
                twitchId: twitchUser.id,
                username: twitchUser.login,
                displayName: twitchUser.display_name,
                timestamp: new Date().toISOString()
              }));

              // Set the flag to refresh the profile page
              localStorage.setItem('twitch_needs_refresh', 'true');

              setMessage("Authentication successful! Twitch linked to your profile. Redirecting...");

              // Update public_streamers collection
              const publicStreamerRef = doc(db, 'public_streamers', userId);
              await setDoc(publicStreamerRef, {
                twitchUsername: twitchUser.login,
                displayName: twitchUser.display_name,
                avatarUrl: twitchUser.profile_image_url || null,
                updatedAt: new Date().toISOString()
              }, { merge: true });

              // Redirect to wagers page
              setTimeout(() => {
                navigate('/wagers');
              }, 1500);
            } else {
              throw new Error('No Twitch user data found in response');
            }
          } catch (error) {

            setMessage("Twitch authentication error. Please try again.");

            // Clear the auth flag
            localStorage.removeItem('twitch_auth_started');

            // Redirect to login page after a delay
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          }
        } else if (authError) {

          setMessage("Authentication error: " + authError);

          // Clear any auth or linking flags
          localStorage.removeItem('discord_auth_started');
          localStorage.removeItem('discord_link_started');
          localStorage.removeItem('discord_link_user');
          localStorage.removeItem('twitch_link_started');
          localStorage.removeItem('twitch_link_user');
          localStorage.removeItem('twitch_auth_started');
          localStorage.removeItem('twitch_link_nonce');

          // Redirect to profile or login page after a delay
          const redirectTarget = isDiscordLinking || isTwitchLinking ? '/profile' : '/login';
          setTimeout(() => {
            navigate(redirectTarget);
          }, 2000);
        } else {
          // No recognized auth flow

          setMessage("No valid authentication flow detected. Redirecting...");

          // Clear any possible flags
          localStorage.removeItem('discord_auth_started');
          localStorage.removeItem('discord_link_started');
          localStorage.removeItem('twitch_link_started');
          localStorage.removeItem('twitch_auth_started');
          localStorage.removeItem('twitch_link_nonce');

          // Redirect to home page
          setTimeout(() => {
            navigate('/');
          }, 1500);
        }
      } catch (error) {

        setMessage("Authentication error. Please try again.");
        setDebugInfo((prev) => ({
          ...prev,
          generalError: {
            message: error.message,
            stack: error.stack
          }
        }));

        // Clear any potential flags
        localStorage.removeItem('discord_auth_started');
        localStorage.removeItem('discord_link_started');
        localStorage.removeItem('twitch_link_started');
        localStorage.removeItem('twitch_auth_started');
        localStorage.removeItem('twitch_link_nonce');

        // Redirect to home page after a delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    };

    // Execute the authentication flow
    processCallback();
  }, [currentUser, navigate, db, checkRedirectResult]);

  // Return a simple loading screen with debug info in development
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: 'white'
    }}>
      <h2>Authentication Processing</h2>
      <p>{message}</p>
      <div style={{
        width: '50px',
        height: '50px',
        border: '5px solid rgba(255, 255, 255, 0.1)',
        borderTopColor: '#4facfe',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginTop: '20px'
      }} />
      
      {process.env.NODE_ENV === 'development' && debugInfo &&
      <div style={{
        marginTop: '20px',
        background: 'rgba(0, 0, 0, 0.3)',
        padding: '10px',
        borderRadius: '5px',
        maxWidth: '80%',
        maxHeight: '200px',
        overflow: 'auto'
      }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Debug Info</h3>
          <pre style={{
          margin: 0,
          whiteSpace: 'pre-wrap',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      }
      
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>);

};

export default AuthCallback;