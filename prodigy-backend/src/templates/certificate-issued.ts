export function certificateIssuedTemplate(data: {
  fullName: string;
  trackName: string;
  cin: string;
  issuedDate: string;
  verifyUrl: string;
}) {
  return {
    subject: `Congratulations on the Successful Completion of Your Internship! — Prodigy InfoTech`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:20px 0;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">

  <!-- Header -->
  <tr><td style="padding:24px 32px;border-bottom:3px solid #1a73e8;text-align:center;">
    <p style="margin:0;font-size:22px;font-weight:bold;color:#1a73e8;">⚡ Prodigy InfoTech</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:32px;">
    <p style="font-size:16px;color:#333;margin:0 0 16px;">Dear <strong>${data.fullName}</strong>,</p>

    <p style="font-size:15px;color:#333;margin:0 0 16px;">
      We extend our warmest congratulations on your successful completion of the 
      <strong>${data.trackName}</strong> internship program at Prodigy InfoTech. It is with great 
      pleasure and pride that we acknowledge your hard work, dedication, and remarkable achievements 
      throughout your internship journey.
    </p>

    <p style="font-size:15px;color:#333;margin:0 0 16px;">
      As a token of appreciation for your outstanding performance, we are pleased to present you 
      with a <strong>Certificate of Completion</strong>. This certificate not only recognizes your 
      successful completion of the internship but also serves as a testament to your commitment 
      and capabilities. You can verify the authenticity of your certificate by scanning the 
      provided QR Code on the Certificate.
    </p>

    <!-- CIN Display -->
    <div style="background:#e3f2fd;border:1px solid #1a73e8;border-radius:8px;
                padding:24px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px;">
        Certificate Identification Number
      </p>
      <p style="margin:8px 0;font-size:28px;font-weight:bold;color:#1a73e8;
                font-family:monospace;letter-spacing:4px;">
        ${data.cin}
      </p>
      <p style="margin:0;font-size:12px;color:#666;">Issued: ${data.issuedDate}</p>
    </div>

    <p style="font-size:15px;color:#333;margin:0 0 16px;">
      We encourage you to share your achievement on LinkedIn to showcase your dedication and 
      accomplishments to your professional network. Don't forget to tag 
      <a href="https://www.linkedin.com/company/prodigy-infotech/" style="color:#1a73e8;">Prodigy InfoTech</a> 
      and use the hashtag <strong>#ProdigyInfoTech</strong> in your post.
    </p>

    <!-- LinkedIn CTA -->
    <div style="text-align:center;margin:24px 0;">
      <a href="https://www.linkedin.com/company/prodigy-infotech/"
         style="background:#0077b5;color:#fff;padding:12px 28px;border-radius:6px;
                text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;">
        in &nbsp; Add to LinkedIn Profile
      </a>
    </div>

    <!-- Verify Button -->
    <div style="text-align:center;margin:16px 0 24px;">
      <a href="${data.verifyUrl}"
         style="background:#1a73e8;color:#fff;padding:12px 28px;border-radius:6px;
                text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;">
        Verify My Certificate →
      </a>
    </div>

    <p style="font-size:15px;color:#333;margin:0 0 16px;">
      We wish you the very best as you embark on the next chapter of your journey. 
      Your hard work and determination have set a strong foundation for your future success.
    </p>

    <p style="font-size:15px;color:#333;margin:0 0 24px;">
      Once again, congratulations on a job well done! We are proud to have had you as part of 
      our team and wish you all the success and happiness that the future holds.
    </p>

    <!-- Still have doubts -->
    <div style="text-align:center;margin:32px 0 16px;">
      <p style="font-size:20px;color:#ccc;margin:0 0 8px;">Still have doubts?</p>
      <p style="margin:0;">
        <a href="https://prodigyinfotech.dev/#faq" 
           style="color:#1a73e8;font-size:14px;text-decoration:none;">FAQs</a>
        &nbsp;&nbsp;·&nbsp;&nbsp;
        <a href="https://prodigyinfotech.dev/contact" 
           style="color:#1a73e8;font-size:14px;text-decoration:none;">Contact us</a>
      </p>
    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f8f9fa;padding:20px 32px;text-align:center;border-top:1px solid #eee;">
    <p style="margin:0 0 8px;font-size:12px;color:#999;">⚡ Prodigy InfoTech</p>
    <p style="margin:0;font-size:12px;color:#999;">
      Copyright ©${new Date().getFullYear()} Prodigy InfoTech
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`,
  };
}