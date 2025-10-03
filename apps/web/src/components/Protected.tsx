import React, { useEffect } from 'react';
import { useAuth } from '../stores/auth';
import { Navigate } from 'react-router-dom';

export default function Protected({ roles = [], children }:{ roles?: string[], children: React.ReactNode }){
  const { user, fetchMe } = useAuth();
  useEffect(()=>{ if(!user) fetchMe(); },[]);
  if(!user) return <div className="p-6">Checking auth...</div>;
  if(roles.length && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
