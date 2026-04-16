import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminCreatorApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'creatorApplications'),
        orderBy('submittedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const apps = [];
      querySnapshot.forEach((doc) => {
        apps.push({ id: doc.id, ...doc.data() });
      });
      setApplications(apps);
    } catch (error) {
      console.error('Error fetching creator applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId, status, reviewNotes = '') => {
    try {
      const appRef = doc(db, 'creatorApplications', applicationId);
      await updateDoc(appRef, {
        status: status,
        reviewedAt: new Date(),
        reviewedBy: currentUser.uid,
        reviewNotes: reviewNotes
      });

      // Refresh applications
      fetchApplications();
      alert(`Application ${status} successfully!`);
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Failed to update application');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    if (date.toDate) return date.toDate().toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'approved': return '#4CAF50';
      case 'rejected': return '#f44336';
      default: return '#757575';
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  if (loading) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        color: '#fff'
      }}>
        <h2>Loading Creator Applications...</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      minHeight: '100vh',
      padding: '20px 0'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
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
             Creator Applications
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.1em' }}>
            Review and manage creator program applications
          </p>
        </div>

        {/* Filter Buttons */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '15px',
          padding: '20px',
          marginBottom: '30px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          {['all', 'pending', 'approved', 'rejected'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                border: 'none',
                background: filter === filterOption 
                  ? 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)' 
                  : 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: '600',
                textTransform: 'capitalize'
              }}
            >
              {filterOption} ({applications.filter(app => filterOption === 'all' || app.status === filterOption).length})
            </button>
          ))}
        </div>

        {/* Applications List */}
        <div style={{ display: 'grid', gap: '20px' }}>
          {filteredApplications.length === 0 ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '40px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              <div style={{ fontSize: '3em', marginBottom: '15px' }}></div>
              <p>No {filter !== 'all' ? filter : ''} applications found.</p>
            </div>
          ) : (
            filteredApplications.map((app) => (
              <div key={app.id} style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '25px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                position: 'relative'
              }}>
                {/* Status Badge */}
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: getStatusColor(app.status),
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8em',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  {app.status}
                </div>

                {/* Application Details */}
                <div style={{ marginRight: '100px' }}>
                  <h3 style={{ color: '#fff', marginBottom: '15px', fontSize: '1.4em' }}>
                    {app.displayName} ({app.userEmail})
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <strong style={{ color: '#4CAF50' }}>Content Type:</strong>
                      <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '5px 0' }}>
                        {app.contentType || 'Not specified'}
                      </p>
                    </div>
                    
                    <div>
                      <strong style={{ color: '#2196F3' }}>Audience Size:</strong>
                      <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '5px 0' }}>
                        {app.audience || 'Not specified'}
                      </p>
                    </div>
                    
                    <div>
                      <strong style={{ color: '#FF9800' }}>Submitted:</strong>
                      <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '5px 0' }}>
                        {formatDate(app.submittedAt)}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#fff' }}>Motivation:</strong>
                    <p style={{ 
                      color: 'rgba(255, 255, 255, 0.8)', 
                      margin: '8px 0',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '10px',
                      borderRadius: '8px',
                      lineHeight: 1.6
                    }}>
                      {app.reason}
                    </p>
                  </div>

                  {app.socialMediaLinks && (
                    <div style={{ marginBottom: '15px' }}>
                      <strong style={{ color: '#fff' }}>Social Media:</strong>
                      <p style={{ 
                        color: 'rgba(255, 255, 255, 0.8)', 
                        margin: '8px 0',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '10px',
                        borderRadius: '8px',
                        lineHeight: 1.6
                      }}>
                        {app.socialMediaLinks}
                      </p>
                    </div>
                  )}

                  {app.reviewNotes && (
                    <div style={{ marginBottom: '15px' }}>
                      <strong style={{ color: '#fff' }}>Review Notes:</strong>
                      <p style={{ 
                        color: 'rgba(255, 255, 255, 0.8)', 
                        margin: '8px 0',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '10px',
                        borderRadius: '8px',
                        lineHeight: 1.6
                      }}>
                        {app.reviewNotes}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {app.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
                      <button
                        onClick={() => {
                          const notes = prompt('Review notes (optional):');
                          updateApplicationStatus(app.id, 'approved', notes || '');
                        }}
                        style={{
                          padding: '10px 20px',
                          background: '#4CAF50',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                         Approve
                      </button>
                      
                      <button
                        onClick={() => {
                          const notes = prompt('Rejection reason (required):');
                          if (notes) {
                            updateApplicationStatus(app.id, 'rejected', notes);
                          }
                        }}
                        style={{
                          padding: '10px 20px',
                          background: '#f44336',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                         Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 