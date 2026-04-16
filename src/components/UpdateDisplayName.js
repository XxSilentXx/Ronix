import React, { useState } from 'react';
import styled from 'styled-components';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getAuth, updateProfile } from 'firebase/auth';
import { isDisplayNameAvailable, syncUserDisplayName } from '../firebase/userUtils';
import { useAuth } from '../contexts/AuthContext';

const Container = styled.div`
  margin-top: 1rem;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h3`
  color: #4facfe;
  margin-top: 0;
  margin-bottom: 1rem;
`;

const Form = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Label = styled.label`
  color: #b8c1ec;
  font-weight: 500;
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 0.8rem 1rem;
  color: #fff;
  font-size: 1rem;
  flex: 1;
  min-width: 200px;
  
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
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0, 242, 254, 0.3);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const SuccessMessage = styled.div`
  background: rgba(46, 213, 115, 0.2);
  color: #2ed573;
  padding: 0.8rem;
  border-radius: 10px;
  text-align: center;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const ErrorMessage = styled.div`
  background: rgba(255, 71, 87, 0.2);
  color: #ff4757;
  padding: 0.8rem;
  border-radius: 10px;
  text-align: center;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

/**
 * A reusable component for updating display names with uniqueness validation
 * @param {Object} props Component props
 * @param {string} [props.title="Update Display Name"] - Title for the form
 * @param {function} [props.onSuccess] - Callback function called after successful update
 * @param {function} [props.onCancel] - Callback function called when cancel is clicked
 * @param {string} [props.currentName] - Current display name (defaults to user's current name)
 * @param {boolean} [props.showCancelButton=false] - Whether to show a cancel button
 */
const UpdateDisplayName = ({
  title = "Update Display Name",
  onSuccess,
  onCancel,
  currentName,
  showCancelButton = false
}) => {
  const { currentUser } = useAuth();
  const [displayName, setDisplayName] = useState(currentName || currentUser?.displayName || '');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const handleUpdateDisplayName = async () => {
    if (!displayName.trim()) {
      setError("Display name cannot be empty");
      return;
    }
    
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // Check if the display name is available
      const nameCheck = await isDisplayNameAvailable(displayName, currentUser.uid);
      
      if (!nameCheck.available) {
        setError(nameCheck.error);
        setIsSaving(false);
        return;
      }
      
      // Update profile in Firebase Auth
      const auth = getAuth();
      await updateProfile(auth.currentUser, {
        displayName: displayName
      });
      
      // Update user document in Firestore
      const db = getFirestore();
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        displayName: displayName
      });
      
      // Sync display name across other collections if needed
      await syncUserDisplayName(currentUser.uid, displayName);
      
      setSuccess('Display name updated successfully!');
      
      if (onSuccess) {
        onSuccess(displayName);
      }
    } catch (error) {
      console.error('Error updating display name:', error);
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Container>
      <Title>{title}</Title>
      {success && <SuccessMessage>{success}</SuccessMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <Form>
        <Label htmlFor="displayName">Display Name:</Label>
        <Input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter display name"
        />
        <Button 
          onClick={handleUpdateDisplayName}
          disabled={isSaving || !displayName.trim()}
        >
          {isSaving ? 'Updating...' : 'Update'}
        </Button>
        
        {showCancelButton && onCancel && (
          <Button 
            onClick={onCancel}
            style={{ 
              background: 'rgba(255, 255, 255, 0.1)',
              marginLeft: '10px'
            }}
          >
            Cancel
          </Button>
        )}
      </Form>
    </Container>
  );
};

export default UpdateDisplayName; 