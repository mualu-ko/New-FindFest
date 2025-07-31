import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const provider = new GoogleAuthProvider();

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const userCredential = isSignUp
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);

      // Refresh token to make sure it's valid
      const idToken = await userCredential.user.getIdToken(true);

      // Send ID token and user info to backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: idToken,
          name: isSignUp ? name : null,
        }),
      });

      const data = await response.json();
      if (response.ok) {

        setEmail('');
        setPassword('');
        setName('');
        navigate('/'); // Navigate to the home page after successful login/signup
      } else {
        throw new Error(data.message || 'Authentication failed');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message); // Display any error message returned by the backend
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken(true); // Refresh token to ensure it's valid

      // Send ID token to backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: idToken,
          name: user.displayName,
        }),
      });

      const data = await response.json();
      if (response.ok) {

        navigate('/'); // Navigate to the home page after successful login
      } else {
        throw new Error(data.message || 'Google Sign-in failed');
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('Google sign-in failed'); // Display specific error for Google sign-in
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">{isSignUp ? 'Sign Up' : 'Log In'}</h2>
      {error && <p className="auth-error">{error}</p>}

      {/* Google Sign-In Button */}
      <button className="google-btn" onClick={handleGoogleSignIn}>
        Sign In with Google
      </button>

      <form onSubmit={handleAuth}>
        {isSignUp && (
          <input
            className="auth-input"
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required={isSignUp}
          />
        )}
        <input
          className="auth-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="auth-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="auth-submit" type="submit">
          {isSignUp ? 'Sign Up' : 'Log In'}
        </button>
      </form>

      <p className="auth-toggle">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button className="auth-toggle-link" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'Log In' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
};

export default Auth;
