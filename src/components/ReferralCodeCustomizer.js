import React, { useState, useEffect } from 'react';
import { useReferral } from '../contexts/ReferralContext';
import { FaTimes, FaCheck, FaExclamationTriangle, FaInfo } from 'react-icons/fa';
import './ReferralCodeCustomizer.css';

const ReferralCodeCustomizer = ({ onClose, currentCode }) => {
  const { setCustomReferralCode, validateReferralCode, generateReferralLink } = useReferral();
  
  const [newCode, setNewCode] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewLink, setPreviewLink] = useState('');
  const [error, setError] = useState('');

  // Validation effect
  useEffect(() => {
    if (!newCode) {
      setIsValid(false);
      setValidationMessage('');
      setPreviewLink('');
      return;
    }

    validateCode(newCode);
  }, [newCode]);

  const validateCode = async (code) => {
    const cleanCode = code.toUpperCase().trim();
    
    // Basic format validation
    if (!/^[A-Z0-9]+$/.test(cleanCode)) {
      setIsValid(false);
      setValidationMessage('Code must contain only letters and numbers');
      setPreviewLink('');
      return;
    }

    if (cleanCode.length < 4) {
      setIsValid(false);
      setValidationMessage('Code must be at least 4 characters long');
      setPreviewLink('');
      return;
    }

    if (cleanCode.length > 12) {
      setIsValid(false);
      setValidationMessage('Code cannot be longer than 12 characters');
      setPreviewLink('');
      return;
    }

    if (cleanCode === currentCode) {
      setIsValid(false);
      setValidationMessage('This is already your current code');
      setPreviewLink('');
      return;
    }

    // Check if code is available
    try {
      const validation = await validateReferralCode(cleanCode);
      if (validation.valid) {
        setIsValid(false);
        setValidationMessage('This code is already taken');
        setPreviewLink('');
      } else {
        setIsValid(true);
        setValidationMessage('Code is available!');
        // Generate preview link
        const baseUrl = window.location.origin;
        setPreviewLink(`${baseUrl}?ref=${cleanCode}`);
      }
    } catch (error) {
      // If validation fails, the code might be available
      setIsValid(true);
      setValidationMessage('Code appears to be available');
      const baseUrl = window.location.origin;
      setPreviewLink(`${baseUrl}?ref=${cleanCode}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isValid || !newCode) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await setCustomReferralCode(newCode.toUpperCase().trim());
      onClose(); // Close modal on success
    } catch (error) {
      console.error('Error setting custom code:', error);
      setError(error.message || 'Failed to set custom referral code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setNewCode(value);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="customizer-overlay" onClick={handleOverlayClick}>
      <div className="customizer-modal">
        <div className="modal-header">
          <h2>Customize Your Referral Code</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-content">
          <div className="current-code-section">
            <label>Current Code:</label>
            <div className="current-code">{currentCode}</div>
          </div>

          <div className="warning-section">
            <span className="warning-icon"></span>
            <div className="warning-text">
              <strong>One-time customization:</strong> You can change your referral code to something memorable, but this can only be done once. Choose wisely!
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-section">
              <label htmlFor="newCode">New Referral Code</label>
              <input
                type="text"
                id="newCode"
                value={newCode}
                onChange={handleInputChange}
                placeholder="ronix"
                maxLength={12}
                className={`code-input ${newCode ? (isValid ? 'valid' : 'invalid') : ''}`}
                disabled={isSubmitting}
                autoFocus
              />
              <div className="input-helper">
                <span className="char-count">{newCode.length}/12 characters</span>
                <span className="format-note"> Letters and numbers only</span>
              </div>
            </div>

            {validationMessage && (
              <div className={`validation-message ${isValid ? 'success' : 'error'}`}>
                {isValid ? <FaCheck /> : <FaExclamationTriangle />}
                <span>{validationMessage}</span>
              </div>
            )}

            <div className="preview-section">
              <label>Preview:</label>
              <div className="preview-code">{newCode || 'YOUR-CODE'}</div>
              <div className="preview-link">
                https://ronix.gg/?ref={newCode || 'YOUR-CODE'}
              </div>
            </div>

            {error && (
              <div className="error-message">
                <FaExclamationTriangle />
                <span>{error}</span>
              </div>
            )}

            <div className="important-notice">
              <span className="warning-icon"></span>
              <div className="notice-text">
                <strong>Important:</strong> This is a one-time change. Once you customize your code, you won't be able to change it again. Make sure you're happy with your choice!
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={!isValid || isSubmitting || !newCode}
              >
                {isSubmitting ? 'Setting Code...' : 'Update Code'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReferralCodeCustomizer; 