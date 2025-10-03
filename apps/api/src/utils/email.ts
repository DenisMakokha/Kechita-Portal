import nodemailer from 'nodemailer';

export function getTransport(){
  const host = process.env.SMTP_HOST || '';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const secure = port === 465;
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
}

export async function sendMail({ to, subject, text, html, attachments }:{ to:string|string[], subject:string, text?:string, html?:string, attachments?: any[] }){
  const from = process.env.SMTP_FROM || 'no-reply@kechita.local';
  const transporter = getTransport();
  const info = await transporter.sendMail({ from, to, subject, text, html, attachments });
  return info;
}
