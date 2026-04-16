import React, { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function AdminReferralDashboard() {
  const [codes, setCodes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCode, setSelectedCode] = useState(null);
  const [logLoading, setLogLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');
  const [payoutMsg, setPayoutMsg] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('PayPal');
  const [payoutTxn, setPayoutTxn] = useState('');

  // New state for create code form
  const [newCode, setNewCode] = useState('');
  const [newCreator, setNewCreator] = useState('');
  const [newRate, setNewRate] = useState(10);
  const [createMsg, setCreateMsg] = useState('');
  const [createMsgType, setCreateMsgType] = useState(null);
  const [deleteMsg, setDeleteMsg] = useState('');
  const [deleteMsgType, setDeleteMsgType] = useState(null);
  const [updateMsgType, setUpdateMsgType] = useState(null);
  const [payoutMsgType, setPayoutMsgType] = useState(null);

  // Usage logs tab state
  const [usageLogs, setUsageLogs] = useState([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageCodeFilter, setUsageCodeFilter] = useState('');
  const [usageUserFilter, setUsageUserFilter] = useState('');
  const [usageStartAfter, setUsageStartAfter] = useState(null);
  const [usageHasMore, setUsageHasMore] = useState(false);
  const [usagePage, setUsagePage] = useState(1);
  const USAGE_PAGE_SIZE = 50;

  // Add state for payouts tab
  const [payouts, setPayouts] = useState([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [payoutsCreatorFilter, setPayoutsCreatorFilter] = useState('');
  const [payoutsMethodFilter, setPayoutsMethodFilter] = useState('');
  const [payoutsStartAfter, setPayoutsStartAfter] = useState(null);
  const [payoutsHasMore, setPayoutsHasMore] = useState(false);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const PAYOUTS_PAGE_SIZE = 50;

  const [activeTab, setActiveTab] = useState('codes');

  // Create code handler
  async function handleCreateCode() {
    setCreateMsg('');
    setCreateMsgType(null);
    try {
      const fn = httpsCallable(getFunctions(), 'adminUpdateReferralCode');
      await fn({
        referralCode: newCode.toUpperCase(),
        updates: {
          creatorUserId: newCreator,
          payoutRate: parseFloat(newRate) / 100,
          isActive: true,
          uses: 0,
          totalReferredAmount: 0,
          totalEarned: 0,
          createdAt: new Date().toISOString()
        }
      });
      setCreateMsg('Code created successfully.');
      setCreateMsgType('success');
      setNewCode('');
      setNewCreator('');
      setNewRate(10);
      // Refresh codes list
      fetchCodes();
    } catch (err) {
      setCreateMsg('Error: ' + (err.message || 'Failed to create code'));
      setCreateMsgType('error');
    }
  }

  // Delete code handler
  async function handleDeleteCode() {
    if (!selectedCode) return;
    
    const isConfirmed = window.confirm(
      `Are you sure you want to delete the referral code "${selectedCode}"?\n\n` +
      `This action cannot be undone and will:\n` +
      `• Remove the code from the database\n` +
      `• Prevent any future uses of this code\n` +
      `• Keep existing usage logs for record-keeping\n\n` +
      `Type "DELETE" to confirm:`
    );
    
    if (!isConfirmed) return;
    
    const confirmText = prompt('Please type "DELETE" to confirm:');
    if (confirmText !== 'DELETE') {
      setDeleteMsg('Deletion canceled: confirmation text did not match.');
      setDeleteMsgType('error');
      return;
    }
    
    setDeleteMsg('');
    setDeleteMsgType(null);
    try {
      const fn = httpsCallable(getFunctions(), 'adminDeleteReferralCode');
      await fn({ referralCode: selectedCode });
      setDeleteMsg('Code deleted successfully.');
      setDeleteMsgType('success');
      setSelectedCode(null); // Clear selection
      // Refresh codes list
      fetchCodes();
    } catch (err) {
      setDeleteMsg('Error: ' + (err.message || 'Failed to delete code'));
      setDeleteMsgType('error');
    }
  }

  // Fetch all codes
  const fetchCodes = async () => {
    setCodeLoading(true);
    try {
      const fn = httpsCallable(getFunctions(), 'adminGetAllReferralCodes');
      const res = await fn({ search });
      setCodes(res.data.codes);
    } catch (err) {
      console.error('Error fetching codes:', err);
    }
    setCodeLoading(false);
  };

  useEffect(() => {
    fetchCodes();
  }, [search]);

  // Fetch logs for selected code
  useEffect(() => {
    if (!selectedCode) return;
    setLogLoading(true);
    const fn = httpsCallable(getFunctions(), 'adminGetReferralLogs');
    fn({ referralCode: selectedCode, limit: 50 }).then(res => {
      setLogs(res.data.logs);
      setLogLoading(false);
    });
  }, [selectedCode]);

  // Update code
  async function handleUpdateCode() {
    setUpdateMsg('');
    setUpdateMsgType(null);
    try {
      const fn = httpsCallable(getFunctions(), 'adminUpdateReferralCode');
      await fn({ referralCode: selectedCode, updates: { payoutRate: parseFloat(editRate), isActive: editActive } });
      setUpdateMsg('Updated successfully.');
      setUpdateMsgType('success');
      fetchCodes(); // Refresh the list
    } catch (err) {
      setUpdateMsg('Error: ' + err.message);
      setUpdateMsgType('error');
    }
  }

  // Mark payout complete
  async function handleMarkPayout() {
    setPayoutMsg('');
    setPayoutMsgType(null);
    try {
      const fn = httpsCallable(getFunctions(), 'adminMarkReferralPayoutComplete');
      await fn({
        creatorUserId: codes.find(c => c.referralCode === selectedCode)?.creatorUserId,
        amount: parseFloat(payoutAmount),
        method: payoutMethod,
        transactionId: payoutTxn
      });
      setPayoutMsg('Payout marked complete.');
      setPayoutMsgType('success');
      setPayoutAmount('');
      setPayoutTxn('');
    } catch (err) {
      setPayoutMsg('Error: ' + err.message);
      setPayoutMsgType('error');
    }
  }

  // Calculate summary stats
  const totalCodes = codes.length;
  const activeCodes = codes.filter(c => c.isActive).length;
  const totalUses = codes.reduce((sum, c) => sum + (c.uses || 0), 0);
  const totalEarned = codes.reduce((sum, c) => sum + (c.totalEarned || 0), 0);
  const totalReferred = codes.reduce((sum, c) => sum + (c.totalReferredAmount || 0), 0);

  const cardStyle = {
    background: 'linear-gradient(135deg, #2a2d5a 0%, #1e2347 100%)',
    borderRadius: 12,
    padding: 20,
    border: '1px solid rgba(79, 172, 254, 0.2)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
  };

  const buttonStyle = {
    background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    transition: 'all 0.3s ease'
  };

  const inputStyle = {
    background: '#1a1a2e',
    color: '#fff',
    border: '1px solid #4facfe',
    borderRadius: 6,
    padding: '8px 12px',
    fontSize: 14
  };

  // Fetch usage logs for Usage Logs tab
  const fetchUsageLogs = async (opts = {}) => {
    setUsageLoading(true);
    try {
      const fn = httpsCallable(getFunctions(), 'adminGetReferralLogs');
      const params = {
        limit: USAGE_PAGE_SIZE,
        ...opts,
      };
      if (usageCodeFilter) params.referralCode = usageCodeFilter;
      if (usageUserFilter) params.userId = usageUserFilter;
      if (usageStartAfter && opts.direction === 'next') params.startAfter = usageStartAfter;
      const res = await fn(params);
      setUsageLogs(res.data.logs || []);
      setUsageHasMore((res.data.logs || []).length === USAGE_PAGE_SIZE);
      if (res.data.logs && res.data.logs.length > 0) {
        setUsageStartAfter(res.data.logs[res.data.logs.length - 1].timestamp);
      }
    } catch (e) {
      setUsageLogs([]);
      setUsageHasMore(false);
    }
    setUsageLoading(false);
  };

  // Fetch on tab switch or filter change
  useEffect(() => {
    if (activeTab === 'usageLogs') {
      setUsagePage(1);
      setUsageStartAfter(null);
      fetchUsageLogs({});
    }
    // eslint-disable-next-line
  }, [activeTab, usageCodeFilter, usageUserFilter]);

  // Pagination handlers
  const handleNextUsagePage = () => {
    setUsagePage(p => p + 1);
    fetchUsageLogs({ direction: 'next' });
  };
  const handlePrevUsagePage = () => {
    setUsagePage(p => Math.max(1, p - 1));
    setUsageStartAfter(null);
    fetchUsageLogs({});
  };

  // Fetch payouts for Payouts tab
  const fetchPayouts = async (opts = {}) => {
    setPayoutsLoading(true);
    try {
      const fn = httpsCallable(getFunctions(), 'adminGetAllReferralPayouts');
      const params = {
        limit: PAYOUTS_PAGE_SIZE,
        ...opts,
      };
      if (payoutsCreatorFilter) params.creatorUserId = payoutsCreatorFilter;
      if (payoutsMethodFilter) params.method = payoutsMethodFilter;
      if (payoutsStartAfter && opts.direction === 'next') params.startAfter = payoutsStartAfter;
      const res = await fn(params);
      setPayouts(res.data.payouts || []);
      setPayoutsHasMore((res.data.payouts || []).length === PAYOUTS_PAGE_SIZE);
      if (res.data.payouts && res.data.payouts.length > 0) {
        setPayoutsStartAfter(res.data.payouts[res.data.payouts.length - 1].paidAt);
      }
    } catch (e) {
      setPayouts([]);
      setPayoutsHasMore(false);
    }
    setPayoutsLoading(false);
  };

  // Fetch on tab switch or filter change
  useEffect(() => {
    if (activeTab === 'payouts') {
      setPayoutsPage(1);
      setPayoutsStartAfter(null);
      fetchPayouts({});
    }
    // eslint-disable-next-line
  }, [activeTab, payoutsCreatorFilter, payoutsMethodFilter]);

  // Pagination handlers
  const handleNextPayoutsPage = () => {
    setPayoutsPage(p => p + 1);
    fetchPayouts({ direction: 'next' });
  };
  const handlePrevPayoutsPage = () => {
    setPayoutsPage(p => Math.max(1, p - 1));
    setPayoutsStartAfter(null);
    fetchPayouts({});
  };

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 30 }}>
        <button onClick={() => setActiveTab('codes')} style={{ background: activeTab === 'codes' ? '#4facfe' : '#23233a', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 18, cursor: 'pointer' }}>Codes</button>
        <button onClick={() => setActiveTab('usageLogs')} style={{ background: activeTab === 'usageLogs' ? '#4facfe' : '#23233a', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 18, cursor: 'pointer' }}>Usage Logs</button>
        <button onClick={() => setActiveTab('payouts')} style={{ background: activeTab === 'payouts' ? '#4facfe' : '#23233a', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 18, cursor: 'pointer' }}>Payouts</button>
      </div>

      {/* Usage Logs Tab */}
      {activeTab === 'usageLogs' && (
        <div style={{ background: 'rgba(30,32,60,0.98)', borderRadius: 16, padding: 32, marginBottom: 40, boxShadow: '0 4px 32px #0006' }}>
          <h2 style={{ color: '#fff', fontSize: '2em', marginBottom: 18 }}>Referral Usage Logs</h2>
          <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
            <input value={usageCodeFilter} onChange={e => setUsageCodeFilter(e.target.value.toUpperCase())} placeholder="Filter by Code" style={{ padding: 8, borderRadius: 8, fontSize: 16, width: 180 }} />
            <input value={usageUserFilter} onChange={e => setUsageUserFilter(e.target.value)} placeholder="Filter by User ID" style={{ padding: 8, borderRadius: 8, fontSize: 16, width: 180 }} />
            {/* Date range filter can be added here */}
            <button onClick={() => { setUsageCodeFilter(''); setUsageUserFilter(''); }} style={{ background: '#888', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, cursor: 'pointer' }}>Clear</button>
          </div>
          {usageLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#b8c1ec' }}>Loading usage logs...</div>
          ) : usageLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#b8c1ec' }}>No usage logs found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: 'rgba(79, 172, 254, 0.1)' }}>
                    <th style={{ padding: '10px 12px', color: '#4facfe' }}>Date</th>
                    <th style={{ padding: '10px 12px', color: '#4facfe' }}>Referral Code</th>
                    <th style={{ padding: '10px 12px', color: '#4facfe' }}>User</th>
                    <th style={{ padding: '10px 12px', color: '#4facfe' }}>Amount Spent</th>
                    <th style={{ padding: '10px 12px', color: '#4facfe' }}>Payout Generated</th>
                    <th style={{ padding: '10px 12px', color: '#4facfe' }}>Device</th>
                    <th style={{ padding: '10px 12px', color: '#4facfe' }}>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {usageLogs.map((log, idx) => (
                    <tr key={log.timestamp + '-' + log.userId + '-' + idx} style={{ borderBottom: '1px solid #23233a' }}>
                      <td style={{ padding: '8px 12px', color: '#fff' }}>{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</td>
                      <td style={{ padding: '8px 12px', color: '#FFD700', fontWeight: 700 }}>{log.referralCode}</td>
                      <td style={{ padding: '8px 12px', color: '#b8c1ec' }}>{log.userId}</td>
                      <td style={{ padding: '8px 12px', color: '#51cf66' }}>{log.amountSpent ? `$${Number(log.amountSpent).toFixed(2)}` : ''}</td>
                      <td style={{ padding: '8px 12px', color: '#ffa726' }}>{log.payoutGenerated ? `$${Number(log.payoutGenerated).toFixed(2)}` : ''}</td>
                      <td style={{ padding: '8px 12px', color: '#b8c1ec' }}>{log.deviceId || ''}</td>
                      <td style={{ padding: '8px 12px', color: '#b8c1ec' }}>{log.userIp || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24 }}>
            <button onClick={handlePrevUsagePage} disabled={usagePage === 1} style={{ background: '#23233a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, cursor: usagePage === 1 ? 'not-allowed' : 'pointer', opacity: usagePage === 1 ? 0.6 : 1 }}>Prev</button>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>Page {usagePage}</span>
            <button onClick={handleNextUsagePage} disabled={!usageHasMore} style={{ background: '#23233a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, cursor: !usageHasMore ? 'not-allowed' : 'pointer', opacity: !usageHasMore ? 0.6 : 1 }}>Next</button>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 30 }}>
        <div style={cardStyle}>
          <h4 style={{ color: '#4facfe', margin: '0 0 8px 0', fontSize: 14 }}>Total Codes</h4>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#fff' }}>{totalCodes}</div>
          <div style={{ fontSize: 12, color: '#b8c1ec' }}>{activeCodes} active</div>
        </div>
        <div style={cardStyle}>
          <h4 style={{ color: '#00f2fe', margin: '0 0 8px 0', fontSize: 14 }}>Total Uses</h4>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#fff' }}>{totalUses.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: '#b8c1ec' }}>All time</div>
        </div>
        <div style={cardStyle}>
          <h4 style={{ color: '#51cf66', margin: '0 0 8px 0', fontSize: 14 }}>Total Referred</h4>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#fff' }}>${totalReferred.toFixed(2)}</div>
          <div style={{ fontSize: 12, color: '#b8c1ec' }}>Revenue generated</div>
        </div>
        <div style={cardStyle}>
          <h4 style={{ color: '#ffa726', margin: '0 0 8px 0', fontSize: 14 }}>Creator Earnings</h4>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#fff' }}>${totalEarned.toFixed(2)}</div>
          <div style={{ fontSize: 12, color: '#b8c1ec' }}>Total paid out</div>
        </div>
      </div>

      {/* Create New Code Section */}
      <div style={{ ...cardStyle, marginBottom: 30 }}>
        <h3 style={{ color: '#4facfe', margin: '0 0 20px 0', fontSize: 20 }}>Create New Referral Code</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', color: '#b8c1ec', fontSize: 12, marginBottom: 6 }}>Referral Code</label>
            <input
              value={newCode}
              onChange={e => setNewCode(e.target.value.toUpperCase())}
              placeholder="e.g. NINJA, TFUE"
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#b8c1ec', fontSize: 12, marginBottom: 6 }}>Creator User ID</label>
            <input
              value={newCreator}
              onChange={e => setNewCreator(e.target.value)}
              placeholder="Firebase User ID"
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#b8c1ec', fontSize: 12, marginBottom: 6 }}>Payout Rate (%)</label>
            <input
              type="number"
              value={newRate}
              onChange={e => setNewRate(e.target.value)}
              min={5}
              max={15}
              step={0.1}
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
          <div>
            <button onClick={handleCreateCode} style={buttonStyle}>
              Create Code
            </button>
          </div>
        </div>
        {createMsg && (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: createMsgType === 'error' ? 'rgba(255, 107, 107, 0.1)' : 'rgba(81, 207, 102, 0.1)', border: `1px solid ${createMsgType === 'error' ? '#ff6b6b' : '#51cf66'}` }}>
            <span style={{ color: createMsgType === 'error' ? '#ff6b6b' : '#51cf66', fontSize: 14 }}>{createMsg}</span>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div style={{ ...cardStyle, marginBottom: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <h3 style={{ color: '#4facfe', margin: 0, fontSize: 20 }}>Referral Codes</h3>
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search code or creator..." 
            style={{ ...inputStyle, flex: 1, maxWidth: 300 }}
          />
        </div>

        {/* Codes Table */}
        {codeLoading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#b8c1ec' }}>Loading codes...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(79, 172, 254, 0.1)', borderRadius: 8 }}>
                  {['Code', 'Creator', 'Uses', 'Referred Amount', 'Creator Earned', 'Active', 'Rate', 'Created', 'Actions'].map(header => (
                    <th key={header} style={{ padding: '12px 16px', textAlign: 'left', color: '#4facfe', fontSize: 12, fontWeight: 600, borderBottom: '1px solid rgba(79, 172, 254, 0.2)' }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {codes.map((code, index) => {
                  return (
                  <tr key={code.referralCode || `code-${index}`} style={{ 
                    background: selectedCode === code.referralCode ? 'rgba(79, 172, 254, 0.1)' : (index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'),
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 600, fontFamily: 'monospace' }}>
                      {code.referralCode}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#b8c1ec', fontSize: 12 }}>
                      {code.creatorUserId || 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 600 }}>
                      {(code.uses || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#51cf66', fontWeight: 600 }}>
                      ${(code.totalReferredAmount || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#ffa726', fontWeight: 600 }}>
                      ${(code.totalEarned || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: 4, 
                        fontSize: 10, 
                        fontWeight: 600,
                        background: code.isActive ? 'rgba(81, 207, 102, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                        color: code.isActive ? '#51cf66' : '#ff6b6b'
                      }}>
                        {code.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#4facfe', fontWeight: 600 }}>
                      {((code.payoutRate || 0) * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: '12px 16px', color: '#b8c1ec', fontSize: 12 }}>
                      {code.createdAt ? new Date(code.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button 
                        onClick={() => { 
                          setSelectedCode(code.referralCode); 
                          setEditRate(code.payoutRate || 0); 
                          setEditActive(code.isActive !== false); 
                        }}
                        style={{
                          ...buttonStyle,
                          fontSize: 12,
                          padding: '6px 12px',
                          background: selectedCode === code.referralCode ? 'linear-gradient(90deg, #51cf66 0%, #2e7d32 100%)' : 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)'
                        }}
                      >
                        {selectedCode === code.referralCode ? 'Selected' : 'Manage'}
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            
            {codes.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#b8c1ec' }}>
                No referral codes found. Create your first code above!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Code Management Panel */}
      {selectedCode && (
        <div style={{ ...cardStyle, marginBottom: 30 }}>
          <h3 style={{ color: '#4facfe', margin: '0 0 20px 0', fontSize: 20 }}>Manage Code: {selectedCode}</h3>
          
          {/* Edit Settings */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', color: '#b8c1ec', fontSize: 12, marginBottom: 6 }}>Payout Rate (%)</label>
              <input 
                type="number" 
                value={editRate} 
                onChange={e => setEditRate(e.target.value)} 
                min={5} 
                max={15} 
                step={0.1} 
                style={{ ...inputStyle, width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'end' }}>
              <label style={{ display: 'flex', alignItems: 'center', color: '#b8c1ec', fontSize: 14, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={editActive} 
                  onChange={e => setEditActive(e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                Code Active
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'end', gap: 12 }}>
              <button onClick={handleUpdateCode} style={buttonStyle}>
                Update Code
              </button>
              <button 
                onClick={() => {
                  handleDeleteCode();
                }} 
                style={{
                  ...buttonStyle,
                  background: 'linear-gradient(90deg, #ff6b6b 0%, #ee5a52 100%)',
                  fontSize: 12,
                  padding: '8px 16px'
                }}
              >
                Delete
              </button>
            </div>
          </div>
          
          {(updateMsg || deleteMsg) && (
            <div style={{ marginBottom: 20 }}>
              {updateMsg && (
                <div style={{ marginBottom: 8, padding: 10, borderRadius: 6, background: updateMsgType === 'error' ? 'rgba(255, 107, 107, 0.1)' : 'rgba(81, 207, 102, 0.1)', border: `1px solid ${updateMsgType === 'error' ? '#ff6b6b' : '#51cf66'}` }}>
                  <span style={{ color: updateMsgType === 'error' ? '#ff6b6b' : '#51cf66', fontSize: 14 }}>{updateMsg}</span>
                </div>
              )}
              {deleteMsg && (
                <div style={{ padding: 10, borderRadius: 6, background: deleteMsgType === 'error' ? 'rgba(255, 107, 107, 0.1)' : 'rgba(81, 207, 102, 0.1)', border: `1px solid ${deleteMsgType === 'error' ? '#ff6b6b' : '#51cf66'}` }}>
                  <span style={{ color: deleteMsgType === 'error' ? '#ff6b6b' : '#51cf66', fontSize: 14 }}>{deleteMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* Payout Management */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 20 }}>
            <h4 style={{ color: '#ffa726', margin: '0 0 16px 0', fontSize: 16 }}>Mark Payout Complete</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', color: '#b8c1ec', fontSize: 12, marginBottom: 6 }}>Amount ($)</label>
                <input 
                  type="number" 
                  value={payoutAmount} 
                  onChange={e => setPayoutAmount(e.target.value)}
                  placeholder="0.00"
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#b8c1ec', fontSize: 12, marginBottom: 6 }}>Method</label>
                <select 
                  value={payoutMethod} 
                  onChange={e => setPayoutMethod(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                >
                  <option value="PayPal">PayPal</option>
                  <option value="Venmo">Venmo</option>
                  <option value="CashApp">CashApp</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#b8c1ec', fontSize: 12, marginBottom: 6 }}>Transaction ID</label>
                <input 
                  value={payoutTxn} 
                  onChange={e => setPayoutTxn(e.target.value)}
                  placeholder="Transaction ID"
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>
              <div>
                <button onClick={handleMarkPayout} style={{...buttonStyle, background: 'linear-gradient(90deg, #ffa726 0%, #ff9800 100%)'}}>
                  Mark Complete
                </button>
              </div>
            </div>
            
            {payoutMsg && (
              <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: payoutMsgType === 'error' ? 'rgba(255, 107, 107, 0.1)' : 'rgba(81, 207, 102, 0.1)', border: `1px solid ${payoutMsgType === 'error' ? '#ff6b6b' : '#51cf66'}` }}>
                <span style={{ color: payoutMsgType === 'error' ? '#ff6b6b' : '#51cf66', fontSize: 14 }}>{payoutMsg}</span>
              </div>
            )}
          </div>

          {/* Recent Usage Logs */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 20, marginTop: 20 }}>
            <h4 style={{ color: '#4facfe', margin: '0 0 16px 0', fontSize: 16 }}>Recent Usage Logs</h4>
            {logLoading ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#b8c1ec' }}>Loading logs...</div>
            ) : (
              <div style={{ maxHeight: 250, overflowY: 'auto', background: 'rgba(0, 0, 0, 0.2)', borderRadius: 6, padding: 8 }}>
                {logs.length > 0 ? (
                  <table style={{ width: '100%', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: '#4facfe' }}>User</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: '#4facfe' }}>Amount</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: '#4facfe' }}>Payout</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: '#4facfe' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log, index) => (
                        <tr key={`${log.userId}-${log.timestamp}-${index}`} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '8px 12px', color: '#b8c1ec' }}>{log.userId}</td>
                          <td style={{ padding: '8px 12px', color: '#51cf66' }}>${log.amountSpent}</td>
                          <td style={{ padding: '8px 12px', color: '#ffa726' }}>${log.payoutGenerated}</td>
                          <td style={{ padding: '8px 12px', color: '#b8c1ec' }}>{new Date(log.timestamp).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ textAlign: 'center', padding: 20, color: '#b8c1ec' }}>
                    No usage logs found for this code.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payouts Tab */}
      {activeTab === 'payouts' && (
        <div style={{ background: 'rgba(30,32,60,0.98)', borderRadius: 16, padding: 32, marginBottom: 40, boxShadow: '0 4px 32px #0006' }}>
          <h2 style={{ color: '#fff', fontSize: '2em', marginBottom: 18 }}>Referral Payouts</h2>
          <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
            <input value={payoutsCreatorFilter} onChange={e => setPayoutsCreatorFilter(e.target.value)} placeholder="Filter by Creator User ID" style={{ padding: 8, borderRadius: 8, fontSize: 16, width: 180 }} />
            <input value={payoutsMethodFilter} onChange={e => setPayoutsMethodFilter(e.target.value)} placeholder="Filter by Method" style={{ padding: 8, borderRadius: 8, fontSize: 16, width: 180 }} />
            {/* Date range filter can be added here */}
            <button onClick={() => { setPayoutsCreatorFilter(''); setPayoutsMethodFilter(''); }} style={{ background: '#888', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, cursor: 'pointer' }}>Clear</button>
          </div>
          {payoutsLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#b8c1ec' }}>Loading payouts...</div>
          ) : payouts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#b8c1ec' }}>No payouts found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 215, 64, 0.08)' }}>
                    <th style={{ padding: '10px 12px', color: '#ffa726' }}>Date</th>
                    <th style={{ padding: '10px 12px', color: '#ffa726' }}>Creator User ID</th>
                    <th style={{ padding: '10px 12px', color: '#ffa726' }}>Amount</th>
                    <th style={{ padding: '10px 12px', color: '#ffa726' }}>Method</th>
                    <th style={{ padding: '10px 12px', color: '#ffa726' }}>Transaction ID</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p, idx) => (
                    <tr key={p.paidAt + '-' + p.creatorUserId + '-' + idx} style={{ borderBottom: '1px solid #23233a' }}>
                      <td style={{ padding: '8px 12px', color: '#fff' }}>{p.paidAt ? new Date(p.paidAt).toLocaleString() : ''}</td>
                      <td style={{ padding: '8px 12px', color: '#FFD700', fontWeight: 700 }}>{p.creatorUserId}</td>
                      <td style={{ padding: '8px 12px', color: '#51cf66' }}>{p.amount ? `$${Number(p.amount).toFixed(2)}` : ''}</td>
                      <td style={{ padding: '8px 12px', color: '#ffa726' }}>{p.method}</td>
                      <td style={{ padding: '8px 12px', color: '#b8c1ec' }}>{p.transactionId || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24 }}>
            <button onClick={handlePrevPayoutsPage} disabled={payoutsPage === 1} style={{ background: '#23233a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, cursor: payoutsPage === 1 ? 'not-allowed' : 'pointer', opacity: payoutsPage === 1 ? 0.6 : 1 }}>Prev</button>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>Page {payoutsPage}</span>
            <button onClick={handleNextPayoutsPage} disabled={!payoutsHasMore} style={{ background: '#23233a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, cursor: !payoutsHasMore ? 'not-allowed' : 'pointer', opacity: !payoutsHasMore ? 0.6 : 1 }}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
} 