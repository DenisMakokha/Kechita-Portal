import React, { useState } from 'react';
import axios from 'axios';

function downloadBlob(blob: Blob, filename: string){
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  window.URL.revokeObjectURL(url);
}

export default function Offer(){
  const [form, setForm] = useState<any>({ applicationId:'', title:'', salary:'', currency:'KES' });
  const [offerId, setOfferId] = useState<string>('');
  const [templateId, setTemplateId] = useState<string>('');
  const [contractText, setContractText] = useState<string>('');

  const onChange=(e:any)=> setForm({...form, [e.target.name]: e.target.value});

  const createOffer = async (e:any)=>{ e.preventDefault(); const r = await axios.post('http://localhost:4000/recruitment/offers', form, { withCredentials:true }); alert('Offer created: '+r.data.id); setOfferId(r.data.id); };

  const genText = async ()=>{
    if(!templateId || !form.applicationId) return alert('Need templateId and applicationId');
    const r = await axios.post('http://localhost:4000/recruitment/contracts/generate', { templateId, applicationId: form.applicationId }, { withCredentials:true });
    setContractText(r.data.contractText);
  };

  const saveText = async ()=>{
    if(!offerId) return alert('Create or set offerId first');
    await axios.post(`http://localhost:4000/recruitment/offers/${offerId}/contract-text`, { contractText }, { withCredentials:true });
    alert('Saved contract text');
  };

  const downloadPdf = async ()=>{
    if(!offerId) return alert('Set offerId');
    const r = await axios.get(`http://localhost:4000/recruitment/offers/${offerId}/pdf`, { responseType:'blob', withCredentials:true });
    downloadBlob(r.data, `offer-${offerId}.pdf`);
  };

  // Signature capture
  const [sigDataUrl, setSigDataUrl] = useState<string>('');
  const sign = async ()=>{
    const id = offerId || prompt('Offer ID to sign?') || '';
    if(!id) return;
    if(!sigDataUrl) return alert('Draw signature first');
    await axios.post(`http://localhost:4000/recruitment/offers/${id}/sign`, { signatureDataUrl: sigDataUrl });
    alert('Signed & accepted');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-semibold">Offer Workflow</h2>

      <section className="space-y-3">
        <h3 className="font-medium">1) Create Offer</h3>
        <form onSubmit={createOffer} className="space-y-3">
          <input className="input" name="applicationId" placeholder="Application ID" onChange={onChange} />
          <input className="input" name="title" placeholder="Job Title" onChange={onChange} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input" name="salary" placeholder="Salary (int)" onChange={onChange} />
            <input className="input" name="currency" placeholder="Currency" defaultValue="KES" onChange={onChange} />
          </div>
          <button className="btn">Create</button>
        </form>
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">2.5) Email Offer (PDF)</h3>
        <EmailOffer offerId={offerId} />
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">2) Generate & Save Contract Text</h3>
        <div className="grid grid-cols-2 gap-3">
          <input className="input" placeholder="Template ID" value={templateId} onChange={e=>setTemplateId(e.target.value)} />
          <input className="input" placeholder="Offer ID" value={offerId} onChange={e=>setOfferId(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={genText}>Generate from Template</button>
          <button className="btn" onClick={saveText}>Save Text</button>
          <button className="btn" onClick={downloadPdf}>Download PDF</button>
        </div>
        <textarea className="input" rows={10} placeholder="Contract text..." value={contractText} onChange={e=>setContractText(e.target.value)} />
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">2.5) Email Offer (PDF)</h3>
        <EmailOffer offerId={offerId} />
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">3) E‑Signature (Candidate)</h3>
        <SignaturePad onChange={setSigDataUrl} />
        <div className="flex gap-2">
          <button className="btn" onClick={sign}>Sign & Accept</button>
        </div>
      </section>

      <style>{`.input{padding:.6rem;border:1px solid #e5e7eb;border-radius:.75rem;width:100%}.btn{padding:.6rem 1rem;background:#000;color:#fff;border-radius:.75rem}`}</style>
    </div>
  );
}

function SignaturePad({ onChange }:{ onChange:(dataUrl:string)=>void }){
  const [ref, setRef] = React.useState<HTMLCanvasElement|null>(null);
  React.useEffect(()=>{
    if(!ref) return;
    const ctx = ref.getContext('2d')!;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    let drawing = false;
    const start = (e:any)=>{ drawing = true; const {x,y}=pos(e, ref); ctx.beginPath(); ctx.moveTo(x,y); };
    const move = (e:any)=>{ if(!drawing) return; const {x,y}=pos(e, ref); ctx.lineTo(x,y); ctx.stroke(); onChange(ref.toDataURL()); };
    const end = ()=>{ drawing = false; };
    const pos = (e:any, c:HTMLCanvasElement)=>{
      const r = c.getBoundingClientRect();
      const clientX = e.touches? e.touches[0].clientX : e.clientX;
      const clientY = e.touches? e.touches[0].clientY : e.clientY;
      return { x: clientX - r.left, y: clientY - r.top };
    };
    ref.addEventListener('mousedown', start);
    ref.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    ref.addEventListener('touchstart', start);
    ref.addEventListener('touchmove', move);
    window.addEventListener('touchend', end);
    return ()=>{
      ref.removeEventListener('mousedown', start);
      ref.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
      ref.removeEventListener('touchstart', start);
      ref.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
    };
  }, [ref]);
  return <canvas ref={setRef} width={500} height={150} className="border rounded-xl bg-white" />;
}


function EmailOffer({ offerId }:{ offerId:string }){
  const [email, setEmail] = React.useState('candidate@example.com');
  const send = async ()=>{
    const id = offerId || prompt('Offer ID?') || '';
    if(!id) return;
    await axios.post(`http://localhost:4000/recruitment/offers/${id}/email`, { to: email }, { withCredentials:true });
    alert('Offer emailed.');
  };
  return (
    <div className="flex gap-2 items-center">
      <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="candidate email" />
      <button className="btn" onClick={send}>Send Offer PDF</button>
    </div>
  );
}
