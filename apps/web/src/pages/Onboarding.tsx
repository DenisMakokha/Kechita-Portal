import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Onboarding(){
  const [applicationId, setApplicationId] = useState('');
  const [items, setItems] = useState<any[]>([]);

  const seed = async()=>{ await axios.post('http://localhost:4000/recruitment/onboarding/seed-tasks'); alert('Seeded'); };
  const init = async()=>{ if(!applicationId) return; await axios.post('http://localhost:4000/recruitment/onboarding/init', { applicationId }); await load(); };
  const load = async()=>{ if(!applicationId) return; const r = await axios.get(`http://localhost:4000/recruitment/onboarding/${applicationId}`); setItems(r.data); };
  const complete = async(id:string)=>{ await axios.post(`http://localhost:4000/recruitment/onboarding/${id}/complete`, { evidenceUrl: '' }); await load(); };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Onboarding Wizard</h2>
      <div className="flex gap-2">
        <input className="input" placeholder="Application ID" value={applicationId} onChange={e=>setApplicationId(e.target.value)} />
        <button className="btn" onClick={seed}>Seed tasks</button>
        <button className="btn" onClick={init}>Init checklist</button>
        <button className="btn" onClick={load}>Refresh</button>
      </div>
      <ul className="space-y-2">
        {items.map((it:any)=> (
          <li key={it.id} className="p-3 bg-white rounded-xl shadow flex justify-between">
            <div>
              <div className="font-medium">{it.task?.label}</div>
              <div className="text-sm text-gray-500">{it.completed ? 'Completed' : 'Pending'}</div>
            </div>
            {!it.completed && <button className="btn" onClick={()=>complete(it.id)}>Mark done</button>}
          </li>
        ))}
      </ul>
      <style>{`.input{padding:.6rem;border:1px solid #e5e7eb;border-radius:.75rem}.btn{padding:.6rem 1rem;background:#000;color:#fff;border-radius:.75rem}`}</style>
    </div>
  );
}