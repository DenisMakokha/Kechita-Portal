import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function JobDetails(){
  const { id } = useParams();
  const [job, setJob] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [form, setForm] = useState<any>({ firstName:'', lastName:'', email:'', phone:'', applicantType:'EXTERNAL', resumeUrl:'' });

  useEffect(()=>{
    axios.get(`http://localhost:4000/recruitment/jobs/${id}`).then(r=>setJob(r.data));
  }, [id]);

  const onChange = (e:any)=> setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e:any)=>{
    e.preventDefault();
    const payload = { ...form, jobId: id };
    const r = await axios.post('http://localhost:4000/recruitment/applications/apply', payload);
    setResult(r.data);
    alert(`Submitted. Decision: ${r.data.decision} (score ${r.data.score})`);
  };

  if(!job) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl shadow p-4">
        <h2 className="text-xl font-semibold">{job.title}</h2>
        <div className="text-sm text-gray-500">{job.branch} — {job.region}</div>
        <p className="mt-3 whitespace-pre-wrap">{job.description}</p>
        <div className="text-sm text-gray-500 mt-2">Deadline: {new Date(job.deadline).toLocaleDateString()}</div>
      </section>

      <section className="bg-white rounded-xl shadow p-4">
        <h3 className="text-lg font-semibold mb-3">Apply for this job</h3>
        <form onSubmit={submit} className="grid gap-3 max-w-2xl">
          <div className="grid grid-cols-2 gap-3">
            <input className="input" name="firstName" placeholder="First name" onChange={onChange} required />
            <input className="input" name="lastName" placeholder="Last name" onChange={onChange} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="input" type="email" name="email" placeholder="Email" onChange={onChange} required />
            <input className="input" name="phone" placeholder="Phone" onChange={onChange} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select className="input" name="applicantType" onChange={onChange}>
              <option>EXTERNAL</option>
              <option>INTERNAL</option>
            </select>
            <input className="input" name="resumeUrl" placeholder="Resume URL (optional)" onChange={onChange} />
          </div>
          <button className="px-4 py-2 bg-black text-white rounded-lg w-fit">Submit Application</button>
        </form>

        {result && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
            <div className="font-medium">Decision: {result.decision} (score {result.score})</div>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {result.reasons?.map((r:string, idx:number)=> <li key={idx}>{r}</li>)}
            </ul>
          </div>
        )}

        <style>{`.input{padding:.75rem;border:1px solid #e5e7eb;border-radius:.75rem;width:100%}`}</style>
      </section>
    </div>
  );
}
