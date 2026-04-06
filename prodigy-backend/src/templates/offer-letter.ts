export function offerLetterTemplate(data: {
  fullName: string;
  trackName: string;
  startDate: string;
  endDate: string;
  batchId: string;
  submissionDeadline?: string;
  taskListUrl?: string;
}) {
  const submissionDeadline = data.submissionDeadline ?? '5th of the following month';
  const taskListUrl = data.taskListUrl ?? 'https://prodigyinfotech.dev/tasks';

  return {
    subject: `Congratulations, you have been Selected for the Internship! — Prodigy InfoTech`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:20px 0;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">

  <!-- Header -->
  <tr><td style="padding:24px 32px;border-bottom:3px solid #1a73e8;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size:22px;font-weight:bold;color:#1a73e8;">⚡ Prodigy InfoTech</td>
      </tr>
    </table>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:32px;">
    <p style="font-size:16px;color:#333;margin:0 0 16px;">Dear <strong>${data.fullName}</strong>,</p>

    <p style="font-size:15px;color:#333;margin:0 0 16px;">
      We are pleased to inform you that you have been selected for the 
      <strong>${data.trackName}</strong> Internship Program at Prodigy InfoTech! 
      Congratulations on this exciting achievement!
    </p>

    <p style="font-size:15px;color:#333;margin:0 0 16px;">
      As a <strong>${data.trackName} intern</strong>, you will have the opportunity to gain 
      hands-on experience and develop valuable skills that will prepare you for your future career.
    </p>

    <p style="font-size:15px;color:#333;margin:0 0 16px;">
      Enclosed with this email, you will find your <strong>Offer Letter</strong>. 
      We kindly request that you consult the 
      <a href="${taskListUrl}" style="color:#1a73e8;">Task Lists Document</a> 
      to fully understand your assigned roles and responsibilities.
    </p>

    <!-- Important Points -->
    <p style="font-size:15px;font-weight:bold;color:#333;margin:24px 0 12px;">
      During your internship, please keep in mind:
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px;">
      ${[
        'It is mandatory that you update your LinkedIn profile and share your Offer Letter on LinkedIn.',
        'Following the completion of each task, it is mandatory that you create a post on LinkedIn outlining the tasks you have completed and the knowledge gained.',
        `It is compulsory that you tag <strong>Prodigy InfoTech</strong> and use the hashtag <strong>#ProdigyInfoTech</strong> in all posts related to your internship.`,
        `For submission of your completed tasks, a Task Submission Form will be sent to you by a separate email between 11–14 days after your start date.`,
        'The internship program is unpaid. The program offers certificates & LoR upon successful completion.',
        'It is important to be punctual and meet all deadlines provided.',
      ].map(point => `
        <tr>
          <td valign="top" style="padding:6px 0;color:#333;font-size:14px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td valign="top" style="padding-right:10px;color:#1a73e8;font-size:16px;">▸</td>
                <td style="font-size:14px;color:#333;">${point}</td>
              </tr>
            </table>
          </td>
        </tr>
      `).join('')}
    </table>

    <!-- Certificate Requirements -->
    <div style="background:#e8f5e9;border:1px solid #4caf50;border-radius:6px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:bold;color:#2e7d32;">
        🏆 Certificate Requirements:
      </p>
      <p style="margin:0 0 4px;font-size:13px;color:#333;">
        • Complete at least <strong>2 Tasks</strong> → Certificate of Completion
      </p>
      <p style="margin:0;font-size:13px;color:#333;">
        • Complete <strong>4 Tasks</strong> → Letter of Recommendation (LoR)
      </p>
    </div>

    <!-- GitHub Naming -->
    <div style="background:#e3f2fd;border:1px solid #1a73e8;border-radius:6px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:bold;color:#1565c0;">
        📂 GitHub Repository Naming:
      </p>
      <p style="margin:0 0 4px;font-size:13px;color:#333;">
        Create a <strong>public GitHub repository</strong> following this format:
      </p>
      <p style="margin:8px 0;font-family:monospace;font-size:14px;background:#fff;
         padding:8px 12px;border-radius:4px;border:1px solid #ccc;color:#1a73e8;">
        Prodigy_[TrackCode]_[TaskNumber]
      </p>
      <p style="margin:0;font-size:12px;color:#666;">
        Example: <code>Prodigy_WD_02</code> (Web Development, Task 2)
      </p>
    </div>

    <!-- Timeline -->
    <p style="font-size:16px;font-weight:bold;color:#333;margin:28px 0 16px;">Timeline</p>
    <table width="100%" cellpadding="0" cellspacing="0" 
           style="border:1px solid #eee;border-radius:6px;overflow:hidden;">
      <tr>
        <td style="padding:12px 16px;border-right:1px solid #eee;border-bottom:1px solid #eee;
                   width:25%;background:#f8f9fa;">
          <p style="margin:0;font-size:12px;color:#1a73e8;font-weight:bold;">Start</p>
          <p style="margin:4px 0 0;font-size:13px;color:#333;font-weight:bold;">${data.startDate}</p>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #eee;width:25%;background:#f8f9fa;">
          <p style="margin:0;font-size:12px;color:#1a73e8;font-weight:bold;">End</p>
          <p style="margin:4px 0 0;font-size:13px;color:#333;font-weight:bold;">${data.endDate}</p>
        </td>
        <td style="padding:12px 16px;border-right:1px solid #eee;width:25%;background:#f8f9fa;">
          <p style="margin:0;font-size:12px;color:#1a73e8;font-weight:bold;">Submission</p>
          <p style="margin:4px 0 0;font-size:13px;color:#333;font-weight:bold;">${submissionDeadline}</p>
        </td>
        <td style="padding:12px 16px;width:25%;background:#f8f9fa;">
          <p style="margin:0;font-size:12px;color:#1a73e8;font-weight:bold;">Certificate</p>
          <p style="margin:4px 0 0;font-size:13px;color:#333;font-weight:bold;">After ${data.endDate}</p>
        </td>
      </tr>
    </table>

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
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
      <tr>
        <td style="padding:0 8px;">
          <a href="https://www.linkedin.com/company/prodigy-infotech/" style="text-decoration:none;">in</a>
        </td>
        <td style="padding:0 8px;">
          <a href="https://instagram.com/prodigy_infotech" style="text-decoration:none;">📷</a>
        </td>
        <td style="padding:0 8px;">
          <a href="https://t.me/prodigy_infotech" style="text-decoration:none;">✈️</a>
        </td>
      </tr>
    </table>
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