import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Applications(){
  const [jobId, setJobId] = useState<string>('');
  const [apps, setApps] = useState<any[]>([]);

  const fetchApps = async () => {
    if(!jobId) return;
    const r = await axios.get(`http://localhost:4000/recruitment/applications/${jobId}`);
    setApps(r.data);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Applications</h2>
      <div className="flex gap-2">
        <input className="input" placeholder="Job ID" value={jobId} onChange={e=>setJobId(e.target.value)} />
        <button className="btn" onClick={fetchApps}>Load</button>
      </div>
      <ul className="space-y-2">
        {apps.map(a => (
          <li key={a.id} className="p-3 bg-white rounded-xl shadow">
            <div className="font-medium">{a.firstName} {a.lastName} — {a.email}</div>
            <div className="text-sm text-gray-500">{a.status}</div>
          </li>
        ))}
      </ul>
      <style>{`.input{padding:.6rem;border:1px solid #e5e7eb;border-radius:.75rem}.btn{padding:.6rem 1rem;background:#000;color:#fff;border-radius:.75rem}`}</style>
    </div>
  );
}