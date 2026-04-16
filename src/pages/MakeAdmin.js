import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import axios from 'axios';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 2rem;
`;

const Form = styled.form`
  width: 100%;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #b8c1ec;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  
  &:focus {
    outline: none;
    border-color: #4facfe;
  }
`;

const Button = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  width: 100%;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 242, 254, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const Message = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 5px;
  text-align: center;
  background: ${props => props.$success ? 'rgba(81, 207, 102, 0.2)' : 'rgba(255, 87, 87, 0.2)'};
  color: ${props => props.$success ? '#51cf66' : '#ff5757'};
`;

const Divider = styled.div`
  width: 100%;
  max-width: 500px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin: 2rem 0;
  text-align: center;
  position: relative;
  
  &:after {
    content: 'OR';
    position: absolute;
    top: -10px;
    background: #16213e;
    padding: 0 1rem;
    color: rgba(255, 255, 255, 0.5);
  }
`;

const MakeAdmin = () => {
  const [userId, setUserId] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [setupMessage, setSetupMessage] = useState(null);
  const [success, setSuccess] = useState(false);
  const [setupSuccess, setSetupSuccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { currentUser } = useAuth();
  
  // Check if the current user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) return;
      
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists() && userDoc.data().isAdmin) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    
    checkAdminStatus();
  }, [currentUser]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId.trim()) {
      setMessage('Please enter a user ID');
      setSuccess(false);
      return;
    }
    
    try {
      setLoading(true);
      setMessage(null);
      
      // Check if the current user is an admin
      if (!isAdmin) {
        setMessage('You do not have permission to make users admin');
        setSuccess(false);
        setLoading(false);
        return;
      }
      
      // Check if the target user exists
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        setMessage('User not found');
        setSuccess(false);
        setLoading(false);
        return;
      }
      
      // Update the user to be an admin
      await updateDoc(userRef, {
        isAdmin: true
      });
      
      setMessage(`User ${userId} is now an admin`);
      setSuccess(true);
      setUserId('');
    } catch (error) {
      console.error('Error making user admin:', error);
      setMessage(`Error: ${error.message}`);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSetupAdmin = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setSetupMessage('You must be logged in to become an admin');
      setSetupSuccess(false);
      return;
    }
    
    if (!secretKey.trim()) {
      setSetupMessage('Please enter the secret key');
      setSetupSuccess(false);
      return;
    }
    
    try {
      setSetupLoading(true);
      setSetupMessage(null);
      
      // Call the setupAdmin function
      const functions = getFunctions();
      
      // Use the deployed function URL
      const functionUrl = `https://setupadmin-whf4c4y7pa-uc.a.run.app`;
      
      const response = await axios.post(functionUrl, {
        userId: currentUser.uid,
        secretKey: secretKey
      });
      
      if (response.data.success) {
        setSetupMessage('You are now an admin');
        setSetupSuccess(true);
        setSecretKey('');
        setIsAdmin(true);
      } else {
        setSetupMessage(`Error: ${response.data.error || 'Unknown error'}`);
        setSetupSuccess(false);
      }
    } catch (error) {
      console.error('Error setting up admin:', error);
      setSetupMessage(`Error: ${error.response?.data?.error || error.message}`);
      setSetupSuccess(false);
    } finally {
      setSetupLoading(false);
    }
  };
  
  return (
    <Container>
      <Title>Admin Management</Title>
      
      {isAdmin ? (
        <>
          <Form onSubmit={handleSubmit}>
            <Title style={{ fontSize: '1.5rem' }}>Make Another User Admin</Title>
            <FormGroup>
              <Label htmlFor="userId">User ID</Label>
              <Input
                type="text"
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID"
                disabled={loading}
              />
            </FormGroup>
            
            <Button type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Make Admin'}
            </Button>
            
            {message && (
              <Message $success={success}>
                {message}
              </Message>
            )}
          </Form>
        </>
      ) : (
        <>
          <Form onSubmit={handleSetupAdmin}>
            <Title style={{ fontSize: '1.5rem' }}>Setup First Admin</Title>
            <p style={{ marginBottom: '1rem', color: '#b8c1ec' }}>
              Use this form to set up the first admin user with the secret key.
            </p>
            <FormGroup>
              <Label htmlFor="secretKey">Secret Key</Label>
              <Input
                type="password"
                id="secretKey"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Enter secret key"
                disabled={setupLoading}
              />
            </FormGroup>
            
            <Button type="submit" disabled={setupLoading}>
              {setupLoading ? 'Processing...' : 'Become Admin'}
            </Button>
            
            {setupMessage && (
              <Message $success={setupSuccess}>
                {setupMessage}
              </Message>
            )}
          </Form>
        </>
      )}
    </Container>
  );
};

export default MakeAdmin; 