export function offerLetterTemplate(data: {
  fullName: string;
  trackName: string;
  startDate: string;
  endDate: string;
  batchId: string;
}) {
  return {
    subject: `Offer Letter — ${data.trackName} Internship at vedgrow `,
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
    <h2 style="color: #111827; margin-top: 0;">Congratulations! 🎉</h2>

    <p>Dear <strong>${data.fullName}</strong>,</p>

    <p>We are pleased to offer you a position as an intern in our <strong>${data.trackName}</strong> program.</p>

    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 24px 0;">
      <h3 style="margin-top: 0; color: #111827;">Internship Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Program</td>
          <td style="padding: 8px 0; font-weight: bold;">${data.trackName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Start Date</td>
          <td style="padding: 8px 0; font-weight: bold;">${data.startDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">End Date</td>
          <td style="padding: 8px 0; font-weight: bold;">${data.endDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Mode</td>
          <td style="padding: 8px 0; font-weight: bold;">Remote</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Stipend</td>
          <td style="padding: 8px 0; font-weight: bold;">Unpaid (Certificate Program)</td>
        </tr>
      </table>
    </div>

    <h3 style="color: #111827;">Your Responsibilities</h3>
    <ul style="padding-left: 20px; color: #374151;">
      <li style="margin-bottom: 8px;">Complete all assigned tasks within the internship period</li>
      <li style="margin-bottom: 8px;">Submit your work via the Task Submission Form (sent ~10 days after start)</li>
      <li style="margin-bottom: 8px;">Maintain professionalism throughout the program</li>
    </ul>

    <p>Upon successful completion, you will receive a <strong>verified Certificate of Completion</strong> with a unique Certificate Identification Number (CIN) that employers can verify online.</p>

    <p style="font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px;">
      Questions? Email us at <a href="mailto:support@vedgrow.dev" style="color: #4F46E5;">support@vedgrow.dev</a>
    </p>
  </div>

  <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 16px;">
    © ${new Date().getFullYear()} vedgrow  · support@vedgrow.dev
  </p>
</body>
</html>`,
  };
}