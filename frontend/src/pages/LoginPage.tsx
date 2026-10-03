import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { createSession } from '../services/session';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const nextUrl = searchParams.get('next') || '/dashboard/assets';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailTrimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailTrimmed) {
      setError('Please enter your email address.');
      return;
    }

    if (!emailRegex.test(emailTrimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter a password.');
      return;
    }

    // Demo authentication succeeds
    createSession(emailTrimmed);
    navigate(nextUrl, { replace: true });
  };

  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center px-6 py-20 bg-background text-foreground relative selection:bg-signal/20">
      <div className="w-full max-w-sm space-y-8">
        {/* Wordmark & Brand */}
        <div className="text-center space-y-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 group focus:outline-none focus-visible:ring-1 focus-visible:ring-white"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polygon points="5 4 15 12 5 20 5 4" fill="white" />
              <line
                x1="18"
                y1="4"
                x2="18"
                y2="20"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="font-display text-2xl tracking-tight text-white">
              CreatorAi
            </span>
          </Link>
          <h1 className="font-serif text-4xl text-white tracking-tight pt-2">
            Log in
          </h1>
          <p className="text-xs text-muted-foreground">
            Access the unified content operations console.
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-secondary/40 border border-border/80 rounded-lg p-6 sm:p-8 space-y-5 backdrop-blur-md shadow-2xl"
        >
          {error && (
            <div
              role="alert"
              className="p-3 rounded-md bg-warn/15 border border-warn/40 text-xs text-warn font-medium leading-relaxed"
            >
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs uppercase tracking-wider font-mono text-muted-foreground"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="creator@example.com"
              className="w-full px-3.5 py-2.5 rounded-md bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-white/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs uppercase tracking-wider font-mono text-muted-foreground"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Any demo password"
              className="w-full px-3.5 py-2.5 rounded-md bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-white/50 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full liquid-glass rounded-md py-3 text-sm font-semibold text-white border border-white/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Log in
          </button>

          <p className="text-[11px] text-muted-foreground text-center leading-normal pt-2 border-t border-border/40">
            Demo login. No account is created and nothing leaves your browser.
          </p>
        </form>

        {/* Links */}
        <div className="flex flex-col items-center gap-3 text-xs text-muted-foreground">
          <Link
            to="/"
            className="hover:text-white transition-colors underline-offset-4 hover:underline"
          >
            Back to home
          </Link>
          <div className="flex items-center gap-3 pt-2">
            <Link
              to="/privacy"
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <span>&middot;</span>
            <Link
              to="/terms"
              className="hover:text-white transition-colors"
            >
              Terms and Conditions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
