import React, { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export default function CreatorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [payoutMethod, setPayoutMethod] = useState({ type: '', value: '' });
  const [editingPayout, setEditingPayout] = useState(false);
  const [payoutInput, setPayoutInput] = useState('');
  const [payoutType, setPayoutType] = useState('paypal');
  const [saveMsg, setSaveMsg] = useState('');
  const [availableBalance, setAvailableBalance] = useState(0);
  const [pendingBuffer, setPendingBuffer] = useState(0);
  const db = getFirestore();
  const functions = getFunctions();
  const [savingPayout, setSavingPayout] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const fn = httpsCallable(getFunctions(), 'getCreatorReferralDashboard');
        const res = await fn();
        
        // Check if user has any referral codes
        if (!res.data || !res.data.codes || res.data.codes.length === 0) {
          setError('You do not have any referral codes. Contact support to become a creator.');
          return;
        }
        
        setData(res.data);
      } catch (err) {
        console.error('Error loading creator dashboard:', err);
        if (err.code === 'unauthenticated') {
          navigate('/login');
        } else {
          setError('Failed to load creator dashboard. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [currentUser, navigate]);

  useEffect(() => {
    if (data && typeof data.pendingAmount === 'number') {
      const buffer = Math.round(data.pendingAmount * 0.2 * 100) / 100;
      setPendingBuffer(buffer);
      setAvailableBalance(Math.round((data.pendingAmount - buffer) * 100) / 100);
    }
  }, [data]);

  useEffect(() => {
    // For demo, just set PayPal as default
    setPayoutMethod({ type: 'paypal', value: 'your@email.com' });
  }, []);

  // Load payout method from Firestore
  useEffect(() => {
    if (!currentUser) return;
    const fetchPayoutMethod = async () => {
      try {
        const ref = doc(db, 'creatorPayoutStatus', currentUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data.payoutMethod) setPayoutMethod(data.payoutMethod);
        }
      } catch (e) { /* ignore */ }
    };
    fetchPayoutMethod();
  }, [currentUser]);

  const handleEditPayout = () => {
    setEditingPayout(true);
    setPayoutType(payoutMethod.type || 'paypal');
    setPayoutInput(payoutMethod.value || '');
    setSaveMsg('');
  };

  // Save payout method to Firestore
  const handleSavePayout = async () => {
    if (!payoutInput.trim()) {
      setSaveMsg('Please enter your payout details.');
      return;
    }
    setSavingPayout(true);
    try {
      const ref = doc(db, 'creatorPayoutStatus', currentUser.uid);
      await setDoc(ref, { payoutMethod: { type: payoutType, value: payoutInput.trim() } }, { merge: true });
      setPayoutMethod({ type: payoutType, value: payoutInput.trim() });
      setEditingPayout(false);
      setSaveMsg('Payout method saved!');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (e) {
      setSaveMsg('Failed to save payout method.');
    }
    setSavingPayout(false);
  };

  // Request payout (call backend)
  const handleRequestPayout = async () => {
    setRequestingPayout(true);
    setSaveMsg('');
    try {
      const fn = httpsCallable(functions, 'creatorRequestPayout');
      const res = await fn({
        amount: availableBalance,
        payoutMethod: payoutMethod
      });
      setSaveMsg('Payout request submitted!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e) {
      setSaveMsg(e.message || 'Failed to request payout.');
    }
    setRequestingPayout(false);
  };

  const formatCurrency = (amount) => {
    return typeof amount === 'number' ? `$${amount.toFixed(2)}` : '$0.00';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getEarningsColor = (amount) => {
    if (amount >= 100) return '#4CAF50'; // Green for high earnings
    if (amount >= 50) return '#FF9800';  // Orange for medium earnings
    return '#2196F3'; // Blue for low earnings
  };

  if (loading) {
    return (
      <div className="page-container" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
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
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTop: '3px solid #fff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h3>Loading Creator Dashboard...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
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
          <div style={{ fontSize: '48px', marginBottom: '20px' }}></div>
          <h3 style={{ marginBottom: '15px' }}>Access Denied</h3>
          <p style={{ opacity: 0.9, lineHeight: 1.6 }}>{error}</p>
          <button 
            onClick={() => navigate('/')}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '10px',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const totalEarnings = data.totalEarned || 0;
  const pendingEarnings = data.pendingAmount || 0;
  const totalReferrals = data.referredUsersCount || 0;
  const totalCodes = data.codes?.length || 0;
  const activeCodes = data.codes?.filter(code => code.isActive)?.length || 0;

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
            fontWeight: '700',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
             Creator Dashboard
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.1em' }}>
            Track your referral performance and earnings
          </p>
        </div>

        {/* Payout Method Settings */}
        <div style={{
          background: 'rgba(255,255,255,0.12)',
          borderRadius: '18px',
          padding: '28px',
          marginBottom: '30px',
          border: '1px solid rgba(255,255,255,0.18)',
          maxWidth: 500,
          margin: '0 auto 30px auto',
        }}>
          <h2 style={{ color: '#fff', fontSize: '1.3em', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
             Payout Method
          </h2>
          {editingPayout ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ color: '#fff', fontWeight: 600, marginBottom: 4 }}>Select Method:</label>
              <select value={payoutType} onChange={e => setPayoutType(e.target.value)} style={{ padding: 8, borderRadius: 8, fontSize: 16 }}>
                <option value="paypal">PayPal</option>
                <option value="venmo">Venmo</option>
                <option value="cashapp">Cash App</option>
              </select>
              <input
                type="text"
                placeholder={payoutType === 'paypal' ? 'PayPal Email' : payoutType === 'venmo' ? 'Venmo Username' : 'Cash App $Cashtag'}
                value={payoutInput}
                onChange={e => setPayoutInput(e.target.value)}
                style={{ padding: 10, borderRadius: 8, fontSize: 16, marginTop: 4 }}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button onClick={handleSavePayout} disabled={savingPayout} style={{ background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, cursor: savingPayout ? 'not-allowed' : 'pointer', opacity: savingPayout ? 0.7 : 1 }}>Save</button>
                <button onClick={() => setEditingPayout(false)} style={{ background: '#888', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              </div>
              {saveMsg && <div style={{ color: saveMsg.includes('fail') ? '#ff4757' : '#4CAF50', marginTop: 6 }}>{saveMsg}</div>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
                {payoutMethod.type === 'paypal' && <>PayPal: <span style={{ color: '#FFD700' }}>{payoutMethod.value}</span></>}
                {payoutMethod.type === 'venmo' && <>Venmo: <span style={{ color: '#FFD700' }}>{payoutMethod.value}</span></>}
                {payoutMethod.type === 'cashapp' && <>Cash App: <span style={{ color: '#FFD700' }}>{payoutMethod.value}</span></>}
                {!payoutMethod.value && <span style={{ color: '#ffb300' }}>No payout method set</span>}
              </div>
              <button onClick={handleEditPayout} style={{ background: 'linear-gradient(90deg, #A259F7 0%, #00FFD0 100%)', color: '#18122B', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, marginTop: 8, cursor: 'pointer' }}>Edit</button>
            </div>
          )}
        </div>

        {/* Balances Section */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 30 }}>
          <div style={{ background: 'rgba(255,255,255,0.10)', borderRadius: 14, padding: 24, minWidth: 220, textAlign: 'center', border: '1px solid rgba(255,255,255,0.18)' }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Available Balance</div>
            <div style={{ color: '#4CAF50', fontWeight: 800, fontSize: 28, marginBottom: 2 }}>{formatCurrency(availableBalance)}</div>
            <div style={{ color: '#fff', fontSize: 13, opacity: 0.7 }}>Withdrawable now</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.10)', borderRadius: 14, padding: 24, minWidth: 220, textAlign: 'center', border: '1px solid rgba(255,255,255,0.18)' }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Pending Buffer</div>
            <div style={{ color: '#FF9800', fontWeight: 800, fontSize: 28, marginBottom: 2 }}>{formatCurrency(pendingBuffer)}</div>
            <div style={{ color: '#fff', fontSize: 13, opacity: 0.7 }}>Held for 72h (anti-fraud)</div>
          </div>
        </div>

        {/* Request Payout Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <button
            disabled={availableBalance < 10 || !payoutMethod.value || requestingPayout}
            style={{
              background: availableBalance >= 10 && payoutMethod.value && !requestingPayout ? 'linear-gradient(90deg, #4CAF50 0%, #00FFD0 100%)' : '#888',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '18px 38px',
              fontWeight: 800,
              fontSize: '1.25em',
              cursor: availableBalance >= 10 && payoutMethod.value && !requestingPayout ? 'pointer' : 'not-allowed',
              boxShadow: availableBalance >= 10 && payoutMethod.value && !requestingPayout ? '0 2px 16px #4CAF5077' : 'none',
              opacity: availableBalance >= 10 && payoutMethod.value && !requestingPayout ? 1 : 0.7,
              transition: 'background 0.2s, color 0.2s',
            }}
            title={availableBalance < 10 ? 'You need at least $10 available to request a payout.' : !payoutMethod.value ? 'Set your payout method first.' : ''}
            onClick={handleRequestPayout}
          >
            {requestingPayout ? 'Requesting...' : 'Request Payout'}
          </button>
        </div>

        {/* Key Metrics Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px', 
          marginBottom: '30px' 
        }}>
          {/* Pending Earnings */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
            padding: '25px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${getEarningsColor(pendingEarnings)}, ${getEarningsColor(pendingEarnings)}80)`
            }}></div>
            <div style={{ fontSize: '2.5em', marginBottom: '10px' }}></div>
            <h3 style={{ color: '#fff', marginBottom: '5px' }}>Pending Earnings</h3>
            <p style={{ 
              fontSize: '1.8em', 
              fontWeight: 'bold', 
              color: getEarningsColor(pendingEarnings),
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>
              {formatCurrency(pendingEarnings)}
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9em' }}>
              Available for payout
            </p>
          </div>

          {/* Total Earnings */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
            padding: '25px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #4CAF50, #4CAF5080)'
            }}></div>
            <div style={{ fontSize: '2.5em', marginBottom: '10px' }}></div>
            <h3 style={{ color: '#fff', marginBottom: '5px' }}>Total Earned</h3>
            <p style={{ 
              fontSize: '1.8em', 
              fontWeight: 'bold', 
              color: '#4CAF50',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>
              {formatCurrency(totalEarnings)}
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9em' }}>
              Lifetime earnings
            </p>
          </div>

          {/* Total Referrals */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
            padding: '25px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #2196F3, #2196F380)'
            }}></div>
            <div style={{ fontSize: '2.5em', marginBottom: '10px' }}></div>
            <h3 style={{ color: '#fff', marginBottom: '5px' }}>Referred Users</h3>
            <p style={{ 
              fontSize: '1.8em', 
              fontWeight: 'bold', 
              color: '#2196F3',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>
              {totalReferrals}
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9em' }}>
              Users referred
            </p>
          </div>

          {/* Active Codes */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
            padding: '25px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #FF9800, #FF980080)'
            }}></div>
            <div style={{ fontSize: '2.5em', marginBottom: '10px' }}></div>
            <h3 style={{ color: '#fff', marginBottom: '5px' }}>Active Codes</h3>
            <p style={{ 
              fontSize: '1.8em', 
              fontWeight: 'bold', 
              color: '#FF9800',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>
              {activeCodes}/{totalCodes}
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9em' }}>
              Referral codes
            </p>
          </div>
        </div>

        {/* Referral Codes Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '30px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h2 style={{ 
            color: '#fff', 
            marginBottom: '25px', 
            fontSize: '1.8em',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
             Your Referral Codes
          </h2>
          
          {data.codes && data.codes.length > 0 ? (
            <div style={{ display: 'grid', gap: '15px' }}>
              {data.codes.map((code, index) => (
                <div key={code.referralCode} style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '15px',
                  padding: '20px',
                  border: `2px solid ${code.isActive ? '#4CAF50' : '#f44336'}`,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '15px',
                    background: code.isActive ? '#4CAF50' : '#f44336',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8em',
                    fontWeight: 'bold'
                  }}>
                    {code.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    <div>
                      <h3 style={{ 
                        color: '#fff', 
                        marginBottom: '10px',
                        fontSize: '1.4em',
                        fontFamily: 'monospace',
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        display: 'inline-block'
                      }}>
                        {code.referralCode}
                      </h3>
                      <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                        <strong>Payout Rate:</strong> {((code.payoutRate || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#2196F3' }}>
                          {code.uses || 0}
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9em' }}>
                          Uses
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#4CAF50' }}>
                          {formatCurrency(code.totalEarned || 0)}
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9em' }}>
                          Earned
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.3em', fontWeight: 'bold', color: '#FF9800' }}>
                        {formatCurrency(code.totalReferredAmount || 0)}
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9em' }}>
                        Revenue Generated
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', padding: '40px' }}>
              No referral codes found. Contact support to get your creator codes.
            </p>
          )}
        </div>

        {/* Payout History Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '30px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h2 style={{ 
            color: '#fff', 
            marginBottom: '25px', 
            fontSize: '1.8em',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
             Payout History
          </h2>
          
          {data.payoutHistory && data.payoutHistory.length > 0 ? (
            <div style={{ display: 'grid', gap: '10px' }}>
              {data.payoutHistory.map((payout, index) => (
                <div key={`${payout.paidAt}-${payout.amount}-${index}`} style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '15px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div>
                    <span style={{ 
                      color: '#4CAF50', 
                      fontWeight: 'bold', 
                      fontSize: '1.1em' 
                    }}>
                      {formatCurrency(payout.amount)}
                    </span>
                    <span style={{ 
                      color: 'rgba(255, 255, 255, 0.7)', 
                      marginLeft: '15px' 
                    }}>
                      via {payout.method || 'Unknown'}
                    </span>
                  </div>
                  <div style={{ 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    fontSize: '0.9em' 
                  }}>
                    {formatDate(payout.paidAt)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              <div style={{ fontSize: '3em', marginBottom: '15px' }}></div>
              <p>No payouts yet. Start earning by sharing your referral codes!</p>
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '30px',
          marginTop: '30px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h2 style={{ 
            color: '#fff', 
            marginBottom: '20px', 
            fontSize: '1.6em',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
             Creator Tips
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            <div style={{ padding: '15px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px' }}>
              <strong style={{ color: '#4CAF50' }}> Share Everywhere:</strong>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '5px 0 0', fontSize: '0.9em' }}>
                Share your codes on social media, streams, and with your community
              </p>
            </div>
            <div style={{ padding: '15px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px' }}>
              <strong style={{ color: '#2196F3' }}> Track Performance:</strong>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '5px 0 0', fontSize: '0.9em' }}>
                Monitor which codes perform best and focus your efforts there
              </p>
            </div>
            <div style={{ padding: '15px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px' }}>
              <strong style={{ color: '#FF9800' }}> Minimum Payout:</strong>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '5px 0 0', fontSize: '0.9em' }}>
                Reach $10 in pending earnings to request your first payout
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 