import React, { useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';

export default function Interview(){
  const [form, setForm] = useState<any>({ applicationId:'', panel:'', mode:'ONLINE', location:'', startsAt:'', endsAt:'', notes:'' });
  const onChange=(e:any)=> setForm({...form, [e.target.name]: e.target.value});
  const submit = async (e:any)=>{ e.preventDefault(); await axios.post('http://localhost:4000/recruitment/interviews', form); alert('Interview scheduled'); };
  return (
    <Layout>
    <div>
    <form onSubmit={submit} className="space-y-3 max-w-xl">
      <h2 className="text-xl font-semibold">Schedule Interview</h2>
      <input className="input" name="applicationId" placeholder="Application ID" onChange={onChange} />
      <input className="input" name="panel" placeholder="Panel (comma separated)" onChange={onChange} />
      <select className="input" name="mode" onChange={onChange}>
        <option>ONLINE</option><option>PHYSICAL</option>
      </select>
      <input className="input" name="location" placeholder="Location (if PHYSICAL)" onChange={onChange} />
      <div className="grid grid-cols-2 gap-3">
        <input className="input" type="datetime-local" name="startsAt" onChange={onChange} />
        <input className="input" type="datetime-local" name="endsAt" onChange={onChange} />
      </div>
      <textarea className="input" name="notes" placeholder="Notes" onChange={onChange} />
      <button className="btn">Save</button>
      <style>{`.input{padding:.6rem;border:1px solid #e5e7eb;border-radius:.75rem;width:100%}.btn{padding:.6rem 1rem;background:#000;color:#fff;border-radius:.75rem}`}</style>
    </form>
    <ICSDownloader />
    <EmailPanel />
    </div>
    </Layout>
  );
}

function downloadFile(data: Blob, filename: string){
  const url = window.URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  window.URL.revokeObjectURL(url);
}

export function ICSDownloader(){
  const [id, setId] = React.useState('');
  const download = async ()=>{
    if(!id) return;
    const r = await fetch(`http://localhost:4000/recruitment/interviews/${id}/ics`, { credentials:'include' });
    const text = await r.text();
    const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
    downloadFile(blob, `interview-${id}.ics`);
  };
  return (
    <div className="mt-6 flex gap-2">
      <input className="input" placeholder="Interview ID" value={id} onChange={e=>setId(e.target.value)} />
      <button className="btn" onClick={download}>Download .ics</button>
      <style>{`.input{padding:.6rem;border:1px solid #e5e7eb;border-radius:.75rem}.btn{padding:.6rem 1rem;background:#000;color:#fff;border-radius:.75rem}`}</style>
    </div>
  );
}


export function EmailPanel(){
  const [id, setId] = React.useState('');
  const [emails, setEmails] = React.useState('panel1@example.com,panel2@example.com');
  const send = async ()=>{
    if(!id) return;
    await fetch(`http://localhost:4000/recruitment/interviews/${id}/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ to: emails.split(',').map(s=>s.trim()) })
    });
    alert('ICS emailed to panel.');
  };
  return (
    <div className="mt-3 flex gap-2">
      <input className="input" placeholder="Interview ID" value={id} onChange={e=>setId(e.target.value)} />
      <input className="input" placeholder="emails comma-separated" value={emails} onChange={e=>setEmails(e.target.value)} />
      <button className="btn" onClick={send}>Email .ics</button>
      <style>{`.input{padding:.6rem;border:1px solid #e5e7eb;border-radius:.75rem}.btn{padding:.6rem 1rem;background:#000;color:#fff;border-radius:.75rem}`}</style>
    </div>
  );
}
