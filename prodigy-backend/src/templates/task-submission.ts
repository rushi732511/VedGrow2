export function taskSubmissionTemplate(data: {
  fullName: string;
  trackName: string;
  submissionFormUrl: string;
  deadline: string;
}) {
  return {
    subject: `Reminder: Internship Submission Form is Open — Prodigy InfoTech`,
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
      Greetings! We hope this email finds you in good health. We wanted to remind you that the 
      <strong>Internship Submission Form</strong> is open and available for all students to submit 
      their internship work.
    </p>

    <p style="font-size:15px;color:#333;margin:0 0 24px;">
      Please ensure timely submission of your 
      <a href="${data.submissionFormUrl}" style="color:#1a73e8;">Internship Tasks</a> 
      in order to be eligible for the Verified Certificate of Completion.
    </p>

    <!-- CTA Button -->
    <div style="text-align:center;margin:24px 0;">
      <a href="${data.submissionFormUrl}"
         style="background:#1a73e8;color:#fff;padding:14px 32px;border-radius:6px;
                text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
        Submission Form
      </a>
    </div>

    <!-- Deadline -->
    <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:6px;
                padding:16px;margin:24px 0;display:flex;align-items:center;gap:12px;">
      <p style="margin:0;font-size:14px;color:#856404;">
        📅 <strong>The deadline for submission is 11:59 PM IST on ${data.deadline}.</strong>
      </p>
    </div>

    <!-- If already submitted -->
    <p style="font-size:14px;color:#333;margin:24px 0 8px;">
      If you are receiving this email after submitting the form, it could be for the following reasons:
    </p>
    <ul style="font-size:14px;color:#333;padding-left:20px;margin:0 0 24px;">
      <li style="margin-bottom:6px;">You have provided incorrect or missing links for your GitHub Repository.</li>
      <li style="margin-bottom:6px;">You have provided incorrect or missing links for your LinkedIn Post.</li>
      <li style="margin-bottom:6px;">You have submitted the wrong proof of payment.</li>
      <li style="margin-bottom:6px;">You have submitted the form recently.</li>
    </ul>

    <p style="font-size:14px;color:#333;margin:0 0 24px;">
      Please review the information you provided and ensure all details are accurate. 
      If any discrepancies are found, kindly correct them and resubmit.
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