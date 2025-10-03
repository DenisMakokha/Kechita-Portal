
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

export default function JobRules() {
  const { id } = useParams();
  const [rules, setRules] = useState<any>({ mustHave: [], preferred: [], shortlistThreshold: 35, rejectThreshold: 15, autoRegret: false });
  const [must, setMust] = useState('loan,microfinance');
  const [pref, setPref] = useState('collections,credit,field,portfolio,kpi');

  useEffect(()=>{
    axios.get(`http://localhost:4000/recruitment/jobs/${id}/rules`, { withCredentials: true }).then(r=> {
      if(r.data) { 
        setRules(r.data); 
        setMust((r.data.mustHave||[]).join(',')); 
        setPref((r.data.preferred||[]).join(',')); 
      }
    });
  }, [id]);

  const save = async ()=>{
    const payload = {
      mustHave: must.split(',').map(s=>s.trim()).filter(Boolean),
      preferred: pref.split(',').map(s=>s.trim()).filter(Boolean),
      shortlistThreshold: rules.shortlistThreshold,
      rejectThreshold: rules.rejectThreshold,
      autoRegret: rules.autoRegret
    };
    const r = await axios.put(`http://localhost:4000/recruitment/jobs/${id}/rules`, payload, { withCredentials: true });
    setRules(r.data);
    alert('Saved rule-set');
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-xl font-semibold">Recruitment Rule-Set</h2>
      <label className="block">
        <div className="text-sm text-gray-600">Must-have keywords (comma separated)</div>
        <input className="input" value={must} onChange={e=>setMust(e.target.value)}/>
      </label>
      <label className="block">
        <div className="text-sm text-gray-600">Preferred keywords (comma separated)</div>
        <input className="input" value={pref} onChange={e=>setPref(e.target.value)}/>
      </label>
      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <div className="text-sm text-gray-600">Shortlist threshold</div>
          <input className="input" type="number" value={rules.shortlistThreshold} onChange={e=>setRules({...rules, shortlistThreshold:Number(e.target.value)})}/>
        </label>
        <label className="block">
          <div className="text-sm text-gray-600">Reject threshold</div>
          <input className="input" type="number" value={rules.rejectThreshold} onChange={e=>setRules({...rules, rejectThreshold:Number(e.target.value)})}/>
        </label>
        <label className="block">
          <div className="text-sm text-gray-600">Auto-regret</div>
          <select className="input" value={String(rules.autoRegret)} onChange={e=>setRules({...rules, autoRegret: e.target.value==='true'})}>
            <option value="false">false</option>
            <option value="true">true</option>
          </select>
        </label>
      </div>
      <button className="btn" onClick={save}>Save Rule-Set</button>
      <style>{`.input{padding:.6rem;border:1px solid #e5e7eb;border-radius:.75rem;width:100%}.btn{padding:.6rem 1rem;background:#000;color:#fff;border-radius:.75rem}`}</style>
    </div>
  );
}
