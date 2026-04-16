import React from 'react';

const Tournaments = () => {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 30%, #A259F7 0%, #18122B 60%, #000 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glowing spotlights */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: 200,
        height: 200,
        background: 'radial-gradient(circle, #A259F7 0%, transparent 70%)',
        filter: 'blur(40px)',
        opacity: 0.5,
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '15%',
        width: 180,
        height: 180,
        background: 'radial-gradient(circle, #00FFD0 0%, transparent 70%)',
        filter: 'blur(40px)',
        opacity: 0.4,
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute',
        top: '40%',
        right: '30%',
        width: 120,
        height: 120,
        background: 'radial-gradient(circle, #FF61E6 0%, transparent 70%)',
        filter: 'blur(30px)',
        opacity: 0.3,
        zIndex: 0,
      }} />
      <h1
        style={{
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 800,
          fontSize: '4rem',
          color: '#fff',
          letterSpacing: '0.1em',
          textShadow: '0 0 32px #A259F7, 0 0 8px #00FFD0',
          zIndex: 2,
        }}
      >
        TOURNAMENTS
      </h1>
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          fontSize: '2rem',
          color: '#00FFD0',
          marginTop: '1.5rem',
          textShadow: '0 0 16px #00FFD0, 0 0 8px #A259F7',
          zIndex: 2,
        }}
      >
        Coming Soon
      </div>
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          color: '#fff',
          marginTop: '2.5rem',
          fontSize: '1.2rem',
          maxWidth: 500,
          textAlign: 'center',
          opacity: 0.7,
          zIndex: 2,
          letterSpacing: '0.04em',
        }}
      >
        Prepare for the ultimate Fortnite competition. Massive prizes, epic battles, and glory await. Stay tuned for more details.
      </p>
      <div
        style={{
          marginTop: '3rem',
          zIndex: 2,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            padding: '0.8rem 2.5rem',
            background: 'linear-gradient(90deg, #A259F7 0%, #00FFD0 100%)',
            color: '#18122B',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 700,
            fontSize: '1.3rem',
            borderRadius: '2rem',
            boxShadow: '0 0 24px #A259F7, 0 0 8px #00FFD0',
            letterSpacing: '0.08em',
            opacity: 0.85,
            cursor: 'not-allowed',
            userSelect: 'none',
          }}
        >
          HYPE IS BUILDING
        </span>
      </div>
    </div>
  );
};

export default Tournaments; 