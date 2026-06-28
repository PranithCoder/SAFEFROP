import React, { useState } from 'react';
import { LogIn, AlertCircle } from 'lucide-react';
import { getDB, addAuditLog } from '../utils/db';
import { auth } from '../utils/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setError('');

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const db = getDB();
        const loggedEmail = userCredential.user.email;
        const user = db.users.find(u => u.email.toLowerCase() === loggedEmail.toLowerCase());

        // Map Auth user to DB role metadata
        const userSession = user || {
          id: `SD-AUTH-${userCredential.user.uid.slice(0, 6)}`,
          email: loggedEmail,
          name: loggedEmail.split('@')[0],
          role: loggedEmail.includes('superadmin') || loggedEmail.includes('pranith') ? 'super_admin' : 'admin'
        };

        sessionStorage.setItem('safedrop_user', JSON.stringify(userSession));
        addAuditLog('Login Success', `User ${userSession.name} (${userSession.email}) successfully logged in via Firebase Auth.`);
        onLoginSuccess(userSession);
      })
      .catch((err) => {
        console.error("Auth error:", err);
        addAuditLog('Login Failure', `Failed login attempt for email: ${email}. Error: ${err.message}`);

        if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
          setError('Authentication is not enabled in Firebase Console. Please enable Email/Password provider in the console.');
        } else {
          setError('Invalid email address or password. Please try again.');
        }
      });
  };

  const handleQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    
    // Submit using state updates in a timeout to let state apply
    setTimeout(() => {
      setError('');
      signInWithEmailAndPassword(auth, quickEmail, quickPassword)
        .then((userCredential) => {
          const db = getDB();
          const user = db.users.find(u => u.email.toLowerCase() === quickEmail.toLowerCase());

          const userSession = user || {
            id: 'SD-DEMO-USER',
            email: quickEmail,
            name: quickEmail.split('@')[0],
            role: quickEmail.includes('superadmin') || quickEmail.includes('pranith') ? 'super_admin' : 'admin'
          };

          sessionStorage.setItem('safedrop_user', JSON.stringify(userSession));
          addAuditLog('Login Success', `User ${userSession.name} (${userSession.email}) logged in via Quick Demo (Firebase Auth).`);
          onLoginSuccess(userSession);
        })
        .catch((err) => {
          console.error("Quick login Auth error:", err);
          addAuditLog('Login Failure', `Failed Quick Demo login attempt for email: ${quickEmail}. Error: ${err.message}`);

          if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
            setError('Authentication is not enabled in Firebase Console. Please enable Email/Password provider in the console.');
          } else {
            setError('Quick login failed. Firebase Auth rejects credentials or is not enabled.');
          }
        });
    }, 50);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Blur Spheres */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '40vw',
        height: '40vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)',
        filter: 'blur(80px)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-10%',
        width: '40vw',
        height: '40vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(2, 132, 199, 0.1) 0%, transparent 70%)',
        filter: 'blur(80px)',
        zIndex: 0
      }} />

      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '450px',
        padding: '2.5rem',
        zIndex: 10,
        position: 'relative'
      }}>
        {/* Logo and Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M50 8C50 8 82 45 82 66C82 83.6731 67.6731 92 50 92C32.3269 92 18 83.6731 18 66C18 45 50 8 50 8Z" 
                stroke="url(#dropletGradLogin)" 
                strokeWidth="6" 
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path 
                d="M21 70C30 63 40 76 50 70C60 64 70 76 79 70C79.8 74.5 80 81 80 84C69 88.5 59 88 50 88C41 88 31 88.5 20 84C20 81 20.2 74.5 21 70Z" 
                fill="url(#dropletGradLogin)"
              />
              <rect x="35" y="44" width="30" height="28" rx="2" fill="#1e293b" stroke="#38bdf8" strokeWidth="2"/>
              <rect x="44" y="40" width="12" height="4" rx="1" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5"/>
              <line x1="36" y1="51" x2="64" y2="51" stroke="#38bdf8" strokeWidth="1.5"/>
              <line x1="36" y1="58" x2="64" y2="58" stroke="#38bdf8" strokeWidth="1.5"/>
              <line x1="36" y1="65" x2="64" y2="65" stroke="#38bdf8" strokeWidth="1.5"/>
              <line x1="58" y1="44" x2="58" y2="72" stroke="#e2e8f0" strokeWidth="1.5"/>
              <line x1="58" y1="49" x2="64" y2="49" stroke="#e2e8f0" strokeWidth="1"/>
              <line x1="58" y1="54" x2="64" y2="54" stroke="#e2e8f0" strokeWidth="1"/>
              <line x1="58" y1="59" x2="64" y2="59" stroke="#e2e8f0" strokeWidth="1"/>
              <line x1="58" y1="64" x2="64" y2="64" stroke="#e2e8f0" strokeWidth="1"/>
              <line x1="58" y1="69" x2="64" y2="69" stroke="#e2e8f0" strokeWidth="1"/>
              <defs>
                <linearGradient id="dropletGradLogin" x1="50" y1="8" x2="50" y2="92" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>SafeDrop</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase' }}>Water Tank Sanitation SOP</span>
        </div>

        {/* Errors */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: 'rgba(255, 23, 68, 0.1)',
            border: '1px solid rgba(255, 23, 68, 0.2)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-error)',
            fontSize: '0.85rem',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ color: 'var(--text-secondary)' }}>Corporate Email</label>
            <input 
              type="email" 
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@safedrop.com"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ color: 'var(--text-secondary)' }}>Password</label>
            <input 
              type="password" 
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', height: '44px' }}>
            <LogIn size={18} /> Sign In to SOP Portal
          </button>
        </form>

        {/* Quick Demo Logins Section */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.75rem', textAlign: 'center', textTransform: 'uppercase' }}>
            Quick Demo Login Accounts
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button 
              onClick={() => handleQuickLogin('pranith@safedrop.com', 'admin123')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: '2px', height: 'auto' }}
            >
              <strong>Pranith (Super Admin)</strong>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Full CRUD Access</span>
            </button>
            <button 
              onClick={() => handleQuickLogin('anurathan@safedrop.com', 'admin123')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: '2px', height: 'auto' }}
            >
              <strong>Anurathan (Admin)</strong>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Operations view & restricted</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
