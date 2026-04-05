export function applicationConfirmationTemplate(data: {
  fullName: string;
  trackName: string;
  applicationId: string;
}) {
  return {
    subject: `Application Received — ${data.trackName} Internship`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #4F46E5; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">vedgrow </h1>
    <p style="color: #C7D2FE; margin: 4px 0 0;">Remote Internship Program</p>
  </div>

  <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #111827; margin-top: 0;">Application Received ✅</h2>

    <p>Dear <strong>${data.fullName}</strong>,</p>

    <p>Thank you for applying to the <strong>${data.trackName}</strong> internship program at vedgrow . We have received your application successfully.</p>

    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; font-size: 14px; color: #6b7280;">Application Reference ID</p>
      <p style="margin: 4px 0 0; font-size: 18px; font-weight: bold; color: #4F46E5; font-family: monospace;">${data.applicationId.slice(0, 8).toUpperCase()}</p>
    </div>

    <h3 style="color: #111827;">What happens next?</h3>
    <ol style="padding-left: 20px; color: #374151;">
      <li style="margin-bottom: 8px;">Complete your ₹129 documentation fee payment (if not done already)</li>
      <li style="margin-bottom: 8px;">Our team processes applications in batches on the 1st and 15th of each month</li>
      <li style="margin-bottom: 8px;">You will receive your Offer Letter via email once processed</li>
      <li style="margin-bottom: 8px;">Complete the internship tasks and submit them via the form we send</li>
      <li>Receive your verified Certificate of Completion</li>
    </ol>

    <p style="font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px;">
      Questions? Check our <a href="#" style="color: #4F46E5;">FAQ page</a> or reply to this email.<br>
      Please check your spam folder if you don't receive further emails from us.
    </p>
  </div>

  <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 16px;">
    © ${new Date().getFullYear()} vedgrow  · support@vedgrow.dev
  </p>
</body>
</html>`,
  };
}