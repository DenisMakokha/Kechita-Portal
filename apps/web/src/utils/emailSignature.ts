// Email Signature Template Generator for Kechita Capital

interface StaffDetails {
  firstName: string;
  lastName: string;
  position: string;
  email: string;
  phone?: string;
  branch?: string;
}

interface CompanyInfo {
  name: string;
  website: string;
  phone: string;
  email: string;
  address?: string;
  logoUrl?: string;
}

const KECHITA_INFO: CompanyInfo = {
  name: 'Kechita Capital',
  website: 'www.kechitacapital.co.ke',
  phone: '+254 797 553 815',
  email: 'info@kechita.co.ke',
  address: 'Nairobi, Kenya',
  logoUrl: '/src/assets/KechitaLogo.svg'
};

const SIGNATURE_QUOTES = [
  '"Empowering Dreams, Financing Growth"',
  '"Your Success is Our Investment"',
  '"Building Prosperity, One Loan at a Time"',
  '"Turning Aspirations into Achievements"',
  '"Where Capital Meets Opportunity"',
  '"Fueling Business. Funding Futures."',
  '"Your Partner in Financial Growth"'
];

export const generateEmailSignature = (staff: StaffDetails, includeQuote: boolean = true): string => {
  const randomQuote = SIGNATURE_QUOTES[Math.floor(Math.random() * SIGNATURE_QUOTES.length)];
  
  return `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; border-top: 3px solid #018ede; padding-top: 20px; margin-top: 20px;">
  <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
    <tr>
      <td style="vertical-align: top; padding-right: 20px;">
        <img src="${KECHITA_INFO.logoUrl}" alt="Kechita Capital" style="width: 80px; height: 80px; border-radius: 8px;" />
      </td>
      <td style="vertical-align: top;">
        <div style="margin-bottom: 12px;">
          <div style="font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px;">
            ${staff.firstName} ${staff.lastName}
          </div>
          <div style="font-size: 14px; color: #018ede; font-weight: 600; margin-bottom: 4px;">
            ${staff.position}
          </div>
          ${staff.branch ? `<div style="font-size: 13px; color: #666; margin-bottom: 8px;">${staff.branch}</div>` : ''}
        </div>
        
        <div style="font-size: 13px; color: #444; line-height: 1.8;">
          <div style="margin-bottom: 4px;">
            <span style="color: #018ede; font-weight: 600;">📧</span>
            <a href="mailto:${staff.email}" style="color: #444; text-decoration: none;">${staff.email}</a>
          </div>
          ${staff.phone ? `
          <div style="margin-bottom: 4px;">
            <span style="color: #018ede; font-weight: 600;">📱</span>
            <a href="tel:${staff.phone}" style="color: #444; text-decoration: none;">${staff.phone}</a>
          </div>` : ''}
        </div>
      </td>
    </tr>
  </table>
  
  <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e5e5;">
    <div style="font-size: 15px; font-weight: 700; color: #018ede; margin-bottom: 8px;">
      ${KECHITA_INFO.name}
    </div>
    <div style="font-size: 13px; color: #666; line-height: 1.6;">
      <div style="margin-bottom: 3px;">
        <span style="font-weight: 600;">🌐</span>
        <a href="https://${KECHITA_INFO.website}" style="color: #018ede; text-decoration: none;">${KECHITA_INFO.website}</a>
      </div>
      <div style="margin-bottom: 3px;">
        <span style="font-weight: 600;">☎️</span>
        <a href="tel:${KECHITA_INFO.phone}" style="color: #666; text-decoration: none;">${KECHITA_INFO.phone}</a>
      </div>
      <div>
        <span style="font-weight: 600;">✉️</span>
        <a href="mailto:${KECHITA_INFO.email}" style="color: #666; text-decoration: none;">${KECHITA_INFO.email}</a>
      </div>
    </div>
  </div>
  
  ${includeQuote ? `
  <div style="margin-top: 16px; padding: 12px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #018ede; border-radius: 4px;">
    <div style="font-size: 13px; font-style: italic; color: #0369a1; text-align: center; font-weight: 500;">
      ${randomQuote}
    </div>
  </div>` : ''}
  
  <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e5e5; font-size: 11px; color: #999;">
    <div style="margin-bottom: 4px;">
      <strong style="color: #018ede;">CONFIDENTIALITY NOTICE:</strong> This email and any attachments are confidential and intended solely for the addressee. 
      If you are not the intended recipient, please delete this email and notify the sender immediately.
    </div>
    <div style="margin-top: 8px;">
      <a href="https://${KECHITA_INFO.website}/terms" style="color: #018ede; margin-right: 12px; text-decoration: none;">Terms of Service</a>
      <a href="https://${KECHITA_INFO.website}/privacy" style="color: #018ede; margin-right: 12px; text-decoration: none;">Privacy Policy</a>
      <a href="https://${KECHITA_INFO.website}/unsubscribe" style="color: #999; text-decoration: none;">Unsubscribe</a>
    </div>
  </div>
  
  <div style="margin-top: 12px; text-align: center;">
    <a href="https://www.linkedin.com/company/kechita-capital" style="margin: 0 6px;"><img src="https://img.icons8.com/color/28/linkedin.png" alt="LinkedIn" /></a>
    <a href="https://twitter.com/kechitacapital" style="margin: 0 6px;"><img src="https://img.icons8.com/color/28/twitter.png" alt="Twitter" /></a>
    <a href="https://www.facebook.com/kechitacapital" style="margin: 0 6px;"><img src="https://img.icons8.com/color/28/facebook.png" alt="Facebook" /></a>
  </div>
</div>
  `.trim();
};

export const getPlainTextSignature = (staff: StaffDetails): string => {
  return `
--
${staff.firstName} ${staff.lastName}
${staff.position}
${staff.branch || ''}

📧 ${staff.email}
${staff.phone ? `📱 ${staff.phone}` : ''}

${KECHITA_INFO.name}
🌐 ${KECHITA_INFO.website}
☎️  ${KECHITA_INFO.phone}
✉️  ${KECHITA_INFO.email}

"Empowering Dreams, Financing Growth"
  `.trim();
};
