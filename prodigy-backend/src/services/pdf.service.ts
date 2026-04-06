import puppeteer, { Browser } from 'puppeteer';
import logger from '../utils/logger';

// ─── Browser Singleton ────────────────────────────────────────────────────────
// Reuse one browser instance across all PDF generations.
// Launching Chrome is expensive (~500ms) — keeping it alive saves time.
let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.connected) {
    logger.info('Launching Puppeteer browser...');
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Required in Docker
      ],
    });
  }
  return browserInstance;
}

// ─── Core PDF generator ───────────────────────────────────────────────────────
async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

// ─── Offer Letter PDF ─────────────────────────────────────────────────────────
export async function generateOfferLetterPdf(data: {
  fullName: string;
  trackName: string;
  startDate: string;
  endDate: string;
  cin: string;
  issueDate: string;
}): Promise<Buffer> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      font-size: 14px;
      color: #333;
      width: 794px;
      min-height: 1123px;
      position: relative;
      background: #fff;
    }

    /* Top decorative bar */
    .top-bar {
      height: 12px;
      background: linear-gradient(to right, #1a73e8, #0d47a1);
    }

    /* Bottom decorative bar */
    .bottom-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 12px;
      background: linear-gradient(to right, #1a73e8, #0d47a1);
    }

    .container {
      padding: 48px 56px;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      width: 56px;
      height: 56px;
    }

    .logo-text {
      font-size: 22px;
      font-weight: 900;
      color: #1a73e8;
      letter-spacing: 1px;
      line-height: 1.1;
    }

    .doc-type {
      text-align: right;
    }

    .doc-type h1 {
      font-size: 36px;
      font-weight: 900;
      color: #111;
      letter-spacing: 2px;
      line-height: 1.1;
    }

    .divider {
      height: 2px;
      background: #1a73e8;
      margin: 24px 0;
    }

    .meta {
      text-align: right;
      margin-bottom: 32px;
    }

    .meta p {
      font-size: 13px;
      color: #444;
      margin-bottom: 4px;
    }

    .cin {
      font-weight: bold;
      text-decoration: underline;
      color: #1a73e8;
    }

    .salutation {
      font-size: 14px;
      margin-bottom: 20px;
    }

    .salutation strong {
      font-weight: bold;
    }

    .body-text {
      font-size: 14px;
      line-height: 1.8;
      color: #333;
      margin-bottom: 16px;
      text-align: justify;
    }

    .body-text strong {
      font-weight: bold;
    }

    .signature-section {
      margin-top: 48px;
    }

    .signature-section p {
      font-size: 14px;
      margin-bottom: 4px;
      color: #333;
    }

    .signature-name {
      font-weight: bold;
      font-size: 15px;
      margin-top: 4px;
    }

    /* Footer contact bar */
    .footer-bar {
      margin-top: 48px;
      padding: 16px 0;
      border-top: 1px solid #ddd;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #555;
    }

    .badge {
      width: 56px;
      height: 56px;
    }
  </style>
</head>
<body>
  <div class="top-bar"></div>
  <div class="container">

    <!-- Header -->
    <div class="header">
      <div class="logo">
        <!-- SVG lightbulb logo similar to Prodigy InfoTech -->
        <svg class="logo-icon" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <circle cx="30" cy="30" r="28" fill="#e3f2fd" stroke="#1a73e8" stroke-width="2"/>
          <text x="30" y="38" text-anchor="middle" font-size="28" font-weight="bold" fill="#1a73e8">P</text>
        </svg>
        <div class="logo-text">PRODIGY<br>INFOTECH</div>
      </div>
      <div class="doc-type">
        <h1>OFFER<br>LETTER</h1>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Meta -->
    <div class="meta">
      <p>${data.issueDate}</p>
      <p>CIN: <span class="cin">${data.cin}</span></p>
    </div>

    <!-- Body -->
    <p class="salutation">Dear <strong>${data.fullName}</strong>,</p>

    <p class="body-text">
      We are delighted to offer you the position of <strong>${data.trackName} Intern</strong> 
      at Prodigy InfoTech. As an intern, you will have the opportunity to work on real-world 
      projects, build practical skills, and contribute meaningfully to our team. We are excited 
      to welcome you aboard and look forward to supporting your professional growth throughout 
      this journey.
    </p>

    <p class="body-text">
      The internship is scheduled to commence on the <strong>${data.startDate}</strong> and 
      will conclude on the <strong>${data.endDate}</strong>, resulting in a 1-month duration 
      for the program.
    </p>

    <p class="body-text">
      Please note that this program is intended solely for educational purposes and does not 
      constitute an offer of employment. Successful completion of the internship does not 
      guarantee future employment with Prodigy InfoTech.
    </p>

    <p class="body-text">
      As part of the program, you agree to adhere to all company policies and guidelines 
      applicable to non-employee interns. This letter outlines the complete understanding 
      between you and Prodigy InfoTech regarding your internship and supersedes any prior 
      discussions or agreements. Any modifications must be made in writing and signed by 
      both parties.
    </p>

    <p class="body-text">
      We look forward to your participation in the internship program and wish you a rewarding 
      and enriching experience with us.
    </p>

    <!-- Signature -->
    <div class="signature-section">
      <p>Sincerely,</p>
      <p class="signature-name">Prodigy InfoTech</p>
    </div>

    <!-- Footer bar -->
    <div class="footer-bar">
      <div class="footer-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#1a73e8">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
        contact@prodigyinfotech.dev
      </div>
      <div class="footer-item">
        <!-- MSME badge placeholder -->
        <svg class="badge" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <circle cx="30" cy="30" r="28" fill="#f5f5f5" stroke="#ccc" stroke-width="1"/>
          <text x="30" y="28" text-anchor="middle" font-size="7" fill="#555">MSME</text>
          <text x="30" y="38" text-anchor="middle" font-size="6" fill="#777">REGISTERED</text>
        </svg>
      </div>
      <div class="footer-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#1a73e8">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        prodigyinfotech.dev
      </div>
    </div>

  </div>
  <div class="bottom-bar"></div>
</body>
</html>`;

  return htmlToPdf(html);
}

// ─── Certificate PDF ──────────────────────────────────────────────────────────
export async function generateCertificatePdf(data: {
  fullName: string;
  trackName: string;
  startDate: string;
  endDate: string;
  cin: string;
  issuedDate: string;
  verifyUrl: string;
}): Promise<Buffer> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      width: 1123px;
      height: 794px;
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #e3f2fd 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .certificate {
      width: 1060px;
      height: 730px;
      background: #fff;
      border-radius: 12px;
      border: 3px solid #90caf9;
      padding: 40px 60px;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      margin-bottom: 8px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-text {
      font-size: 18px;
      font-weight: 900;
      color: #1a73e8;
    }

    .title-block {
      text-align: right;
    }

    .title-block h1 {
      font-size: 32px;
      font-weight: 900;
      color: #222;
      letter-spacing: 3px;
      line-height: 1.1;
    }

    .title-block h2 {
      font-size: 18px;
      font-weight: 400;
      color: #555;
      letter-spacing: 4px;
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
      width: 100%;
      margin: 16px 0;
    }

    .meta-row p {
      font-size: 13px;
      color: #555;
    }

    .meta-row strong {
      color: #222;
    }

    .divider {
      width: 100%;
      height: 1px;
      background: #90caf9;
      margin: 8px 0;
    }

    .presented-to {
      font-size: 15px;
      color: #555;
      margin: 16px 0 4px;
      font-style: italic;
    }

    .recipient-name {
      font-size: 52px;
      font-weight: 300;
      color: #1a73e8;
      font-family: Georgia, serif;
      letter-spacing: 2px;
      margin: 4px 0 8px;
    }

    .underline {
      width: 600px;
      height: 2px;
      background: #90caf9;
      margin: 0 auto 16px;
    }

    .description {
      font-size: 14px;
      color: #444;
      text-align: center;
      line-height: 1.8;
      max-width: 700px;
    }

    .description strong {
      font-weight: bold;
      color: #222;
    }

    .footer-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      margin-top: auto;
      padding-top: 16px;
    }

    .footer-item {
      font-size: 11px;
      color: #666;
      display: flex;
      align-items: center;
      gap: 6px;
    }
  </style>
</head>
<body>
<div class="certificate">

  <!-- Header -->
  <div class="header">
    <div class="logo">
      <svg width="44" height="44" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="28" fill="#e3f2fd" stroke="#1a73e8" stroke-width="2"/>
        <text x="30" y="38" text-anchor="middle" font-size="28" font-weight="bold" fill="#1a73e8">P</text>
      </svg>
      <div class="logo-text">PRODIGY<br>INFOTECH</div>
    </div>
    <div class="title-block">
      <h1>CERTIFICATE</h1>
      <h2>OF COMPLETION</h2>
    </div>
  </div>

  <div class="divider"></div>

  <!-- Meta -->
  <div class="meta-row">
    <p>CIN: <strong>${data.cin}</strong></p>
    <p>Issued on: <strong>${data.issuedDate}</strong></p>
  </div>

  <!-- Main content -->
  <p class="presented-to">This Certificate is proudly presented to</p>

  <p class="recipient-name">${data.fullName}</p>
  <div class="underline"></div>

  <p class="description">
    for successfully completing a <strong>1-month</strong> internship from 
    <strong>${data.startDate}</strong> to <strong>${data.endDate}</strong> in 
    <strong>${data.trackName}</strong> with outstanding remarks at 
    Prodigy InfoTech.
  </p>

  <!-- Footer -->
  <div class="footer-row">
    <div class="footer-item">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#1a73e8">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
      </svg>
      contact@prodigyinfotech.dev
    </div>

    <!-- QR code placeholder -->
    <div style="text-align:center;">
      <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" fill="#f5f5f5" stroke="#ccc" stroke-width="1"/>
        <text x="32" y="28" text-anchor="middle" font-size="7" fill="#999">VERIFY</text>
        <text x="32" y="38" text-anchor="middle" font-size="6" fill="#999">${data.cin}</text>
        <text x="32" y="48" text-anchor="middle" font-size="5" fill="#bbb">QR</text>
      </svg>
      <p style="font-size:9px;color:#999;margin-top:2px;">Scan to verify</p>
    </div>

    <div class="footer-item">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#1a73e8">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
      prodigyinfotech.dev
    </div>
  </div>

</div>
</body>
</html>`;

  return htmlToPdf(html);
}

// ─── Letter of Recommendation PDF ────────────────────────────────────────────
export async function generateLorPdf(data: {
  fullName: string;
  trackName: string;
  cin: string;
  issuedDate: string;
  collegeName?: string;
}): Promise<Buffer> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      font-size: 14px;
      color: #333;
      width: 794px;
      min-height: 1123px;
      position: relative;
      background: #fff;
    }

    .top-bar {
      height: 12px;
      background: linear-gradient(to right, #1a73e8, #0d47a1);
    }

    .bottom-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 12px;
      background: linear-gradient(to right, #1a73e8, #0d47a1);
    }

    .container { padding: 48px 56px; }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-text {
      font-size: 20px;
      font-weight: 900;
      color: #1a73e8;
      line-height: 1.1;
    }

    .doc-type {
      text-align: right;
    }

    .doc-type h1 {
      font-size: 28px;
      font-weight: 900;
      color: #1a73e8;
      line-height: 1.1;
    }

    .divider {
      height: 2px;
      background: #1a73e8;
      margin: 20px 0;
    }

    .meta {
      text-align: right;
      margin-bottom: 32px;
    }

    .meta p { font-size: 13px; color: #444; margin-bottom: 4px; }

    .greeting { font-size: 14px; margin-bottom: 20px; }

    .body-text {
      font-size: 14px;
      line-height: 1.9;
      color: #333;
      margin-bottom: 16px;
      text-align: justify;
    }

    .signature-section { margin-top: 40px; }
    .signature-section p { font-size: 14px; margin-bottom: 4px; }

    .sig-image {
      width: 120px;
      height: 50px;
      margin: 8px 0;
      border-bottom: 1px solid #333;
    }

    .sig-name { font-weight: bold; font-size: 14px; }
    .sig-title { font-size: 13px; color: #555; }

    .footer-bar {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid #ddd;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #555;
    }
  </style>
</head>
<body>
  <div class="top-bar"></div>
  <div class="container">

    <div class="header">
      <div class="logo">
        <svg width="52" height="52" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <circle cx="30" cy="30" r="28" fill="#e3f2fd" stroke="#1a73e8" stroke-width="2"/>
          <text x="30" y="38" text-anchor="middle" font-size="28" font-weight="bold" fill="#1a73e8">P</text>
        </svg>
        <div class="logo-text">PRODIGY<br>INFOTECH</div>
      </div>
      <div class="doc-type">
        <h1>Letter of<br>Recommendation</h1>
      </div>
    </div>

    <div class="divider"></div>

    <div class="meta">
      <p>CIN: ${data.cin}</p>
      <p>Date: ${data.issuedDate}</p>
    </div>

    <p class="greeting">To Whom It May Concern,</p>

    <p class="body-text">
      I am writing this letter to highly recommend <strong>${data.fullName}</strong>
      ${data.collegeName ? `from <strong>${data.collegeName}</strong>` : ''}
      for his/her exceptional performance and dedication during his/her tenure as a 
      <strong>${data.trackName} intern</strong> at Prodigy InfoTech. He/She has truly 
      impressed me with his/her strong work ethic, passion, and ability to excel in 
      his/her assigned tasks.
    </p>

    <p class="body-text">
      Throughout his/her internship, he/she consistently demonstrated a high level of 
      professionalism, taking initiative, and exceeding expectations. He/She exhibited 
      remarkable technical skills and a strong understanding of the industry. He/She tackled 
      complex projects with enthusiasm, displaying great problem-solving abilities and an 
      aptitude for learning.
    </p>

    <p class="body-text">
      His/Her attention to detail, creativity, and willingness to go the extra mile set him/her 
      apart from his/her peers. Based on his/her outstanding performance and potential, I have 
      no doubt that he/she will continue to thrive and make significant contributions in his/her 
      future endeavours. It is with great pleasure that I recommend him/her for any future 
      opportunities or positions he/she may seek.
    </p>

    <div class="signature-section">
      <p>Best regards,</p>
      <div class="sig-image"></div>
      <p class="sig-name">Deven Chopra</p>
      <p class="sig-title">Software Engineering Manager</p>
    </div>

    <div class="footer-bar">
      <div class="footer-item">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#1a73e8">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
        contact@prodigyinfotech.dev
      </div>
      <div class="footer-item">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#1a73e8">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        Mumbai, MH, India
      </div>
    </div>

  </div>
  <div class="bottom-bar"></div>
</body>
</html>`;

  return htmlToPdf(html);
}