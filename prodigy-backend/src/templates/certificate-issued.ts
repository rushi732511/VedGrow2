export function certificateIssuedTemplate(data: {
  fullName: string;
  trackName: string;
  cin: string;
  issuedDate: string;
  verifyUrl: string;
}) {
  return {
    subject: `Your Certificate of Completion — ${data.trackName} Internship`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #4F46E5; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">vedgrow </h1>
    <p style="color: #C7D2FE; margin: 4px 0 0;">Remote Internship Program</p>
  </div>

  <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #111827; margin-top: 0;">Congratulations on Completing Your Internship! 🎓</h2>

    <p>Dear <strong>${data.fullName}</strong>,</p>

    <p>We are thrilled to inform you that you have successfully completed the <strong>${data.trackName}</strong> internship program. Your hard work and dedication are commendable.</p>

    <div style="background: white; border: 2px solid #4F46E5; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Certificate Identification Number</p>
      <p style="margin: 8px 0 0; font-size: 28px; font-weight: bold; color: #4F46E5; font-family: monospace; letter-spacing: 3px;">${data.cin}</p>
      <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Issued: ${data.issuedDate}</p>
    </div>

    <p>Your certificate can be verified online by anyone — share your CIN with confidence.</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.verifyUrl}"
         style="background: #4F46E5; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
        View & Verify Certificate →
      </a>
    </div>

    <h3 style="color: #111827;">How to Share Your Certificate</h3>
    <ul style="padding-left: 20px; color: #374151;">
      <li style="margin-bottom: 8px;">Add your CIN to your LinkedIn profile under Licenses & Certifications</li>
      <li style="margin-bottom: 8px;">Share the verification link with potential employers</li>
      <li>Include it in your resume under Certifications</li>
    </ul>

    <p style="font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px;">
      We wish you the very best in your career journey!<br><br>
      The vedgrow  Team
    </p>
  </div>

  <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 16px;">
    © ${new Date().getFullYear()} vedgrow  · support@vedgrow.dev
  </p>
</body>
</html>`,
  };
}