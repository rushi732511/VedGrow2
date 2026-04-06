export function lorIssuedTemplate(data: {
  fullName: string;
  trackName: string;
  cin: string;
}) {
  return {
    subject: `Congratulations on Qualifying for Your Letter of Recommendation! — Prodigy InfoTech`,
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
      We are delighted to inform you that you have successfully qualified for a 
      <strong>Letter of Recommendation (LoR)</strong> based on your exceptional performance 
      during your <strong>${data.trackName}</strong> internship at Prodigy InfoTech.
    </p>

    <p style="font-size:15px;color:#333;margin:0 0 16px;">
      The LoR is a testament to your dedication, hard work, and valuable contributions during 
      your tenure with us. It serves as a significant achievement and a valuable asset to 
      showcase your skills and accomplishments to future employers and academic institutions.
    </p>

    <!-- Achievement box -->
    <div style="background:#e8f5e9;border:1px solid #4caf50;border-radius:8px;
                padding:20px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 4px;font-size:13px;color:#2e7d32;font-weight:bold;">
        🏆 Outstanding Achievement
      </p>
      <p style="margin:4px 0 0;font-size:14px;color:#333;">
        CIN Reference: <strong style="font-family:monospace;">${data.cin}</strong>
      </p>
    </div>

    <p style="font-size:15px;color:#333;margin:0 0 16px;">
      We encourage you to share your achievement on LinkedIn to showcase your dedication. 
      Posting your LoR is a great way to enhance your profile. Don't forget to tag 
      <a href="https://www.linkedin.com/company/prodigy-infotech/" style="color:#1a73e8;">Prodigy InfoTech</a> 
      and use the hashtag <strong>#ProdigyInfoTech</strong> in your post.
    </p>

    <p style="font-size:15px;color:#333;margin:0 0 24px;">
      Feel free to utilize the LoR as part of your job applications, further education pursuits, 
      or any other opportunities where a strong endorsement can make a difference.
    </p>

    <p style="font-size:15px;color:#333;margin:0 0 24px;">
      Once again, congratulations on your remarkable achievement! We are proud to have had you 
      as part of our team, and we have no doubt that you will continue to excel in your future endeavors.
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