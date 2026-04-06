export function applicationConfirmationTemplate(data: {
  fullName: string;
  trackName: string;
  applicationId: string;
}) {
  return {
    subject: `Thanks for Applying — Prodigy InfoTech ${data.trackName} Internship`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:20px 0;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">

  <!-- Header -->
  <tr><td style="background:#1a73e8;padding:24px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="color:#fff;font-size:22px;font-weight:bold;">
          ⚡ Prodigy InfoTech
        </td>
        <td align="right" style="color:#fff;font-size:18px;font-weight:bold;">
          Application Received
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:32px;">
    <p style="font-size:16px;color:#333;margin:0 0 16px;">Dear <strong>${data.fullName}</strong>,</p>

    <p style="font-size:15px;color:#333;margin:0 0 16px;">
      Thank you for applying to the <strong>${data.trackName}</strong> internship at Prodigy InfoTech.
      Your application has been received successfully.
    </p>

    <div style="background:#f8f9fa;border-left:4px solid #1a73e8;padding:16px;border-radius:4px;margin:20px 0;">
      <p style="margin:0;font-size:13px;color:#666;">Application Reference</p>
      <p style="margin:4px 0 0;font-size:20px;font-weight:bold;color:#1a73e8;font-family:monospace;">
        ${data.applicationId.slice(0, 8).toUpperCase()}
      </p>
    </div>

    <p style="font-size:15px;font-weight:bold;color:#333;margin:24px 0 8px;">
      Perks of your Internship:
    </p>
    <ul style="color:#333;font-size:14px;padding-left:20px;margin:0 0 20px;">
      <li style="margin-bottom:6px;">Offer Letter</li>
      <li style="margin-bottom:6px;">Industry Experience</li>
      <li style="margin-bottom:6px;"><strong>Verified Internship Certificate</strong></li>
      <li style="margin-bottom:6px;">Letter of Recommendation as per performance</li>
    </ul>

    <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:16px;margin:20px 0;">
      <p style="margin:0;font-size:14px;color:#856404;">
        <strong>Note:</strong> You can apply for one internship per month. Offer Letters will be 
        processed in batches on the 1st and 15th of each month.
      </p>
    </div>

    <p style="font-size:15px;font-weight:bold;color:#333;margin:24px 0 8px;">
      Join our Community:
    </p>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="padding-right:12px;">
          <a href="https://www.linkedin.com/company/prodigy-infotech/" 
             style="background:#0077b5;color:#fff;padding:8px 16px;border-radius:4px;text-decoration:none;font-size:13px;font-weight:bold;">
            LinkedIn
          </a>
        </td>
        <td style="padding-right:12px;">
          <a href="https://t.me/prodigy_infotech"
             style="background:#0088cc;color:#fff;padding:8px 16px;border-radius:4px;text-decoration:none;font-size:13px;font-weight:bold;">
            Telegram
          </a>
        </td>
        <td>
          <a href="https://instagram.com/prodigy_infotech"
             style="background:#e1306c;color:#fff;padding:8px 16px;border-radius:4px;text-decoration:none;font-size:13px;font-weight:bold;">
            Instagram
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size:13px;color:#666;border-top:1px solid #eee;padding-top:16px;margin-top:24px;">
      Please check your spam folder if you don't receive further emails from us.<br>
      Refer to our <a href="https://prodigyinfotech.dev/#faq" style="color:#1a73e8;">FAQs</a> for common questions.
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f8f9fa;padding:20px 32px;text-align:center;border-top:1px solid #eee;">
    <p style="margin:0;font-size:12px;color:#999;">
      Copyright ©${new Date().getFullYear()} Prodigy InfoTech<br>
      <a href="https://prodigyinfotech.dev" style="color:#1a73e8;">prodigyinfotech.dev</a> · 
      <a href="mailto:contact@prodigyinfotech.dev" style="color:#1a73e8;">contact@prodigyinfotech.dev</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`,
  };
}