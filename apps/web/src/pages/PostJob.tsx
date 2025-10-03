import React, { useState } from 'react';
import axios from 'axios';

export default function PostJob(){
  const [form, setForm] = useState({ title:'', description:'', branch:'HQ', region:'Nairobi', deadline:'', employmentType:'FULL_TIME' });
  const onChange = (e:any)=> setForm({...form, [e.target.name]: e.target.value});
  const submit = async (e:any)=>{ e.preventDefault(); await axios.post('http://localhost:4000/recruitment/jobs', form); alert('Posted'); };
  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4">
      <h2 className="text-xl font-semibold">Post a Job</h2>
      <input className="input" name="title" placeholder="Title" onChange={onChange} />
      <textarea className="input" name="description" placeholder="Description" onChange={onChange} />
      <div className="grid grid-cols-2 gap-3">
        <input className="input" name="branch" placeholder="Branch" onChange={onChange} />
        <input className="input" name="region" placeholder="Region" onChange={onChange} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input className="input" type="date" name="deadline" onChange={onChange} />
        <select className="input" name="employmentType" onChange={onChange}>
          <option>FULL_TIME</option><option>PART_TIME</option><option>CONTRACT</option><option>INTERNSHIP</option>
        </select>
      </div>
      <button className="px-4 py-2 bg-black text-white rounded-lg">Publish</button>
      <style>{`.input{padding:.75rem;border:1px solid #e5e7eb;border-radius:.75rem;width:100%}`}</style>
    </form>
  );
}