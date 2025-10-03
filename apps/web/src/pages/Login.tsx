import React, { useState } from 'react';
import { useAuth } from '../stores/auth';

export default function Login(){
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('hr@kechita.local');
  const [password, setPassword] = useState('password');
  const submit = async (e:any)=>{ e.preventDefault(); await login(email, password); };
  return (
    <form onSubmit={submit} className="max-w-sm mx-auto mt-10 space-y-3">
      <h2 className="text-xl font-semibold">Sign In</h2>
      <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
      <input className="input" value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" />
      <button className="btn" disabled={loading}>Sign in</button>
      <p className="text-sm text-gray-500 mt-2">Use seeded accounts via API: <code>POST /auth/seed-dev</code></p>
      <style>{`.input{padding:.6rem;border:1px solid #e5e7eb;border-radius:.75rem;width:100%}.btn{padding:.6rem 1rem;background:#000;color:#fff;border-radius:.75rem}`}</style>
    </form>
  );
}
