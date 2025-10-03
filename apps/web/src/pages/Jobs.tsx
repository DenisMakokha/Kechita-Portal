import { Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Jobs(){
  const [jobs, setJobs] = useState<any[]>([]);
  useEffect(()=>{ axios.get('http://localhost:4000/recruitment/jobs').then(r=>setJobs(r.data)); },[]);
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Open Positions</h2>
      <div className="grid gap-4">
        {jobs.map(j => (
          <div key={j.id} className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between">
              <h3 className="font-medium">{j.title}</h3>
              <span className="text-sm text-gray-500">{new Date(j.deadline).toLocaleDateString()}</span>
            </div>
            <p className="text-gray-600 mt-2">{j.description}</p>
            <div className="mt-3 text-sm text-gray-500">{j.branch} — {j.region}</div>
            <div className="mt-3"><Link className="text-blue-600 underline" to={`/job/${j.id}`}>View & Apply</Link></div>
          </div>
        ))}
      </div>
    </div>
  );
}