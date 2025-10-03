
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

export default function RegretsManager(){
  const { id } = useParams(); // jobId
  const [templates, setTemplates] = useState<any[]>([]);
  const [name, setName] = useState('Default Regret');
  const [subject, setSubject] = useState('Application Update — {{jobTitle}}');
  const [bodyHtml, setBodyHtml] = useState("<p>Dear {{firstName}},</p><p>Thank you for your interest in <b>{{jobTitle}}</b> at {{company}}. After review, we won't proceed at this time.</p><p>Kind regards,<br/>Kechita HR</p>");
  const [bodyText, setBodyText] = useState("Dear {{firstName}},\nThank you for your interest in {{jobTitle}} at {{company}}. After review, we won't proceed at this time.\nKind regards,\nKechita HR");
  const [selected, setSelected] = useState<string>('');

  const load = async()=>{
    const r = await axios.get('http://localhost:4000/recruitment/regret-templates', { withCredentials: true });
    setTemplates(r.data);
  };
  useEffect(()=>{ load(); }, []);

  const createTpl = async()=>{
    const r = await axios.post('http://localhost:4000/recruitment/regret-templates', { name, subject, bodyHtml, bodyText, jobId: id }, { withCredentials: true });
    setSelected(r.data.id);
    await load();
    alert('Template created');
  };

  const batchSend = async()=>{
    if(!selected) return alert('Select a template');
    const r = await axios.post('http://localhost:4000/recruitment/regrets/batch', { jobId: id, templateId: selected, statusFilter: ['REJECTED'] }, { withCredentials: true });
    alert('Regrets sent: '+r.data.count);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-semibold">Regret Templates & Batch Send</h2>

      <section className="space-y-3">
        <h3 className="font-medium">Create Template</h3>
        <input className="input" placeholder="Name" value={name} onChange={e=>setName(e.target.value)}/>
        <input className="input" placeholder="Subject" value={subject} onChange={e=>setSubject(e.target.value)}/>
        <textarea className="input" rows={6} placeholder="HTML body" value={bodyHtml} onChange={e=>setBodyHtml(e.target.value)}/>
        <textarea className="input" rows={6} placeholder="Text body" value={bodyText} onChange={e=>setBodyText(e.target.value)}/>
        <button className="btn" onClick={createTpl}>Save Template</button>
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">Batch Send</h3>
        <select className="input" value={selected} onChange={e=>setSelected(e.target.value)}>
          <option value="">-- Select Template --</option>
          {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button className="btn" onClick={batchSend}>Send regrets for REJECTED</button>
      </section>

      <style>{`.input{padding:.6rem;border:1px solid #e5e7eb;border-radius:.75rem;width:100%}.btn{padding:.6rem 1rem;background:#000;color:#fff;border-radius:.75rem}`}</style>
    </div>
  );
}
