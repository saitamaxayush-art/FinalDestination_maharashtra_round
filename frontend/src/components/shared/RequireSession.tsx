import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { hasSession } from '../../services/session';

interface RequireSessionProps {
  children: React.ReactElement;
}

export const RequireSession: React.FC<RequireSessionProps> = ({ children }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => hasSession());

  useEffect(() => {
    const handleSessionChange = () => {
      setIsAuthenticated(hasSession());
    };

    window.addEventListener('creatorai:session-changed', handleSessionChange);
    return () => {
      window.removeEventListener('creatorai:session-changed', handleSessionChange);
    };
  }, []);

  if (!isAuthenticated) {
    const nextPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${nextPath}`} replace />;
  }

  return children;
};
