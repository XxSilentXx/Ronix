import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function BecomeCreator() {
  const [formData, setFormData] = useState({
    reason: '',
    socialMediaLinks: '',
    audience: '',
    contentType: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      // Save application to Firestore
      const applicationData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        displayName: currentUser.displayName || 'Anonymous',
        reason: formData.reason,
        socialMediaLinks: formData.socialMediaLinks,
        audience: formData.audience,
        contentType: formData.contentType,
        status: 'pending', // pending, approved, rejected
        submittedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
        reviewNotes: ''
      };
      
      await addDoc(collection(db, 'creatorApplications'), applicationData);

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting creator application:', error);
      alert(`Failed to submit application. Please try again.\n\nError: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div style={{ 
        background: '#131124', 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          maxWidth: '500px'
        }}>
          <h3>Please log in to apply as a creator</h3>
          <button 
            onClick={() => navigate('/login')}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ 
        background: '#131124', 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          maxWidth: '600px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}></div>
          <h2>Application Submitted!</h2>
          <p style={{ opacity: 0.9, lineHeight: 1.6, marginBottom: '30px' }}>
            Thank you for your interest in becoming a creator! We'll review your application and get back to you within 3-5 business days.
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button 
              onClick={() => navigate('/')}
              style={{
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '10px',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              Return Home
            </button>
            <button 
              onClick={() => navigate('/profile')}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Go to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: '#131124', 
      minHeight: '100vh',
      padding: '20px 0'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '30px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            color: '#fff', 
            marginBottom: '10px', 
            fontSize: '2.5em',
            fontWeight: '700'
          }}>
             Become a Creator
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.1em' }}>
            Join our creator program and start earning with referral codes!
          </p>
        </div>

        {/* Benefits Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '30px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h2 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.8em' }}>
             Creator Benefits
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '15px' }}>
              <div style={{ fontSize: '2em', marginBottom: '10px' }}></div>
              <h3 style={{ color: '#4CAF50', marginBottom: '10px' }}>Earn Commissions</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9em' }}>
                Earn a percentage of every purchase made with your referral codes
              </p>
            </div>
            
            <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '15px' }}>
              <div style={{ fontSize: '2em', marginBottom: '10px' }}></div>
              <h3 style={{ color: '#2196F3', marginBottom: '10px' }}>Track Performance</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9em' }}>
                Access detailed analytics and performance metrics for your codes
              </p>
            </div>
            
            <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '15px' }}>
              <div style={{ fontSize: '2em', marginBottom: '10px' }}></div>
              <h3 style={{ color: '#FF9800', marginBottom: '10px' }}>Custom Codes</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9em' }}>
                Get personalized referral codes that match your brand
              </p>
            </div>
          </div>
        </div>

        {/* Application Form */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '30px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h2 style={{ color: '#fff', marginBottom: '25px', fontSize: '1.8em' }}>
             Creator Application
          </h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                color: '#fff', 
                marginBottom: '8px', 
                fontWeight: '600' 
              }}>
                Why do you want to become a creator? *
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
                rows={4}
                placeholder="Tell us about your motivation and how you plan to promote our platform..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '1rem',
                  resize: 'vertical',
                  minHeight: '100px'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                color: '#fff', 
                marginBottom: '8px', 
                fontWeight: '600' 
              }}>
                Social Media Links
              </label>
              <textarea
                name="socialMediaLinks"
                value={formData.socialMediaLinks}
                onChange={handleInputChange}
                rows={3}
                placeholder="Share your YouTube, Twitch, Twitter, TikTok, or other social media profiles..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                color: '#fff', 
                marginBottom: '8px', 
                fontWeight: '600' 
              }}>
                Content Type
              </label>
              <select
                name="contentType"
                value={formData.contentType}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '1rem'
                }}
              >
                <option value="" style={{ background: '#2a2a3e', color: '#fff' }}>Select content type...</option>
                <option value="gaming" style={{ background: '#2a2a3e', color: '#fff' }}>Gaming Content</option>
                <option value="streaming" style={{ background: '#2a2a3e', color: '#fff' }}>Live Streaming</option>
                <option value="social" style={{ background: '#2a2a3e', color: '#fff' }}>Social Media</option>
                <option value="educational" style={{ background: '#2a2a3e', color: '#fff' }}>Educational</option>
                <option value="entertainment" style={{ background: '#2a2a3e', color: '#fff' }}>Entertainment</option>
                <option value="other" style={{ background: '#2a2a3e', color: '#fff' }}>Other</option>
              </select>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                color: '#fff', 
                marginBottom: '8px', 
                fontWeight: '600' 
              }}>
                Audience Size (approximate)
              </label>
              <select
                name="audience"
                value={formData.audience}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '1rem'
                }}
              >
                <option value="" style={{ background: '#2a2a3e', color: '#fff' }}>Select audience size...</option>
                <option value="under-100" style={{ background: '#2a2a3e', color: '#fff' }}>Under 100</option>
                <option value="100-500" style={{ background: '#2a2a3e', color: '#fff' }}>100 - 500</option>
                <option value="500-1k" style={{ background: '#2a2a3e', color: '#fff' }}>500 - 1,000</option>
                <option value="1k-5k" style={{ background: '#2a2a3e', color: '#fff' }}>1,000 - 5,000</option>
                <option value="5k-10k" style={{ background: '#2a2a3e', color: '#fff' }}>5,000 - 10,000</option>
                <option value="10k-50k" style={{ background: '#2a2a3e', color: '#fff' }}>10,000 - 50,000</option>
                <option value="50k+" style={{ background: '#2a2a3e', color: '#fff' }}>50,000+</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.reason.trim()}
              style={{
                padding: '15px 30px',
                background: loading || !formData.reason.trim() 
                  ? 'rgba(255, 255, 255, 0.2)' 
                  : 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                cursor: loading || !formData.reason.trim() ? 'not-allowed' : 'pointer',
                fontSize: '1.1rem',
                fontWeight: '600',
                marginTop: '10px',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? ' Submitting...' : ' Submit Application'}
            </button>
          </form>

          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '10px',
            fontSize: '0.9em',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            <strong>Note:</strong> We review all creator applications carefully. Approval typically takes 3-5 business days. 
            We'll notify you via email once your application has been reviewed.
          </div>
        </div>
      </div>
    </div>
  );
} 