export function taskSubmissionTemplate(data: {
  fullName: string;
  trackName: string;
  submissionFormUrl: string;
  deadline: string;
}) {
  return {
    subject: `Action Required: Submit Your ${data.trackName} Internship Tasks`,
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
    <h2 style="color: #111827; margin-top: 0;">Time to Submit Your Tasks 📝</h2>

    <p>Dear <strong>${data.fullName}</strong>,</p>

    <p>You are now halfway through your <strong>${data.trackName}</strong> internship. It's time to submit the tasks you have completed so far.</p>

    <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 6px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; font-weight: bold; color: #92400E;">⏰ Submission Deadline: ${data.deadline}</p>
      <p style="margin: 8px 0 0; font-size: 14px; color: #92400E;">Missing this deadline may affect your certificate eligibility.</p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.submissionFormUrl}"
         style="background: #4F46E5; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
        Submit My Tasks →
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280;">If the button above doesn't work, copy and paste this link into your browser:<br>
    <a href="${data.submissionFormUrl}" style="color: #4F46E5; word-break: break-all;">${data.submissionFormUrl}</a></p>

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