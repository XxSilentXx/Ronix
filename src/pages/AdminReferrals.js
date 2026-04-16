import React, { useState } from 'react';
import AdminReferralDashboard from '../components/AdminReferralDashboard';

export default function AdminReferrals() {
  const [tab, setTab] = useState('codes');

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: '#fff', padding: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '2rem' }}>Admin Referrals</h1>
      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        <button onClick={() => setTab('codes')} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: tab === 'codes' ? '#4facfe' : '#222', color: tab === 'codes' ? '#fff' : '#b8c1ec', fontWeight: 600, fontSize: 18, cursor: 'pointer' }}>Codes</button>
        <button onClick={() => setTab('logs')} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: tab === 'logs' ? '#4facfe' : '#222', color: tab === 'logs' ? '#fff' : '#b8c1ec', fontWeight: 600, fontSize: 18, cursor: 'pointer' }}>Usage Logs</button>
        <button onClick={() => setTab('payouts')} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: tab === 'payouts' ? '#4facfe' : '#222', color: tab === 'payouts' ? '#fff' : '#b8c1ec', fontWeight: 600, fontSize: 18, cursor: 'pointer' }}>Payouts</button>
      </div>
      <div>
        {tab === 'codes' && <AdminReferralDashboard />}
        {tab === 'logs' && (
          <div style={{ background: '#181a2a', borderRadius: 12, padding: 24, maxWidth: 900, margin: '32px auto', boxShadow: '0 4px 24px #0008' }}>
            <h2>Referral Usage Logs</h2>
            <p>Coming soon: View and filter all referral code usage logs here.</p>
          </div>
        )}
        {tab === 'payouts' && (
          <div style={{ background: '#181a2a', borderRadius: 12, padding: 24, maxWidth: 900, margin: '32px auto', boxShadow: '0 4px 24px #0008' }}>
            <h2>Referral Payouts</h2>
            <p>Coming soon: Manage and review creator payouts here.</p>
          </div>
        )}
      </div>
    </div>
  );
} 