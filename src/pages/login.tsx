import React, { useState } from 'react';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Option 1: Let TypeScript infer the event type automatically
  const handleEmailLogin = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert(`Logging in with Email: ${email}`);
  };

  const handleGoogleLogin = () => {
    alert('Google login clicked');
  };

  return (
    <div>
      <h2>Sign In</h2>

      {/* Google Login Button */}
      <button type="button" onClick={handleGoogleLogin}>
        Continue with Google
      </button>

      <hr />

      {/* Email Login Form */}
      <form onSubmit={handleEmailLogin}>
        <div>
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit">Sign In</button>
      </form>
    </div>
  );
};

export default LoginForm;