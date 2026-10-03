import { Resend } from "resend";
import ReportCardSetting from "../models/ReportCardSetting";

interface SendResetEmailResult {
  success: boolean;
  id?: string;
  error?: string;
  reason?: string;
}

export const sendPasswordResetEmail = async (
  toEmail: string,
  userName: string,
  resetCode: string
): Promise<SendResetEmailResult> => {
  let apiKey = process.env.RESEND_API_KEY?.trim() || "";
  let customFrom = process.env.RESEND_FROM_EMAIL?.trim() || "";

  // Fetch school name and email settings if available
  let schoolEnglish = "Institute of Arabic and Islamic Studies";
  let schoolArabic = "معهد التعليم العربي الإسلامي";
  try {
    const setting = await ReportCardSetting.findOne().lean();
    if (setting?.schoolNameEnglish) schoolEnglish = setting.schoolNameEnglish;
    if (setting?.schoolNameArabic) schoolArabic = setting.schoolNameArabic;
    if (setting?.resendApiKey?.trim()) apiKey = setting.resendApiKey.trim();
    if (setting?.resendFromEmail?.trim()) customFrom = setting.resendFromEmail.trim();
  } catch {
    // ignore
  }

  if (!apiKey) {
    console.warn("[EmailService] RESEND_API_KEY is not defined in environment variables or database settings. Email will not be sent.");
    return {
      success: false,
      reason: "MISSING_API_KEY",
      error: "RESEND_API_KEY is not configured. Please set it in Admin Settings or in .env file.",
    };
  }

  try {
    const resend = new Resend(apiKey);

    const fromAddress =
      customFrom ||
      `${schoolEnglish} <onboarding@resend.dev>`;

    const subject = `Your Password Reset Verification Code: ${resetCode}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #0c4a6e, #0369a1); padding: 28px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; color: #bae6fd; font-family: 'Amiri', serif, Arial; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #0f172a; }
    .message { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .code-card { background-color: #f0fdf4; border: 2px dashed #22c55e; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }
    .code-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #15803d; font-weight: 700; margin-bottom: 8px; }
    .code-value { font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #166534; font-family: monospace, Courier; margin: 0; }
    .expiry { font-size: 12px; color: #64748b; margin-top: 8px; }
    .security-note { font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 28px; }
    .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${schoolEnglish}</h1>
      <p dir="rtl">${schoolArabic}</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${userName || "User"},</div>
      <div class="message">
        We received a request to reset your password for the school management portal. Use the 6-digit verification code below to complete your password reset:
      </div>
      
      <div class="code-card">
        <div class="code-label">Verification Code</div>
        <div class="code-value">${resetCode}</div>
        <div class="expiry">This code will expire in <strong>15 minutes</strong>.</div>
      </div>

      <div class="security-note">
        <strong>Security Notice:</strong> If you did not request a password reset, please ignore this email or notify your school administrator immediately. Your password remains safe and unchanged.
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ${schoolEnglish}. All rights reserved.
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
${schoolEnglish}
${schoolArabic}

Hello ${userName || "User"},

We received a request to reset the password for your school portal account.

Your verification code is: ${resetCode}

This code will expire in 15 minutes.

If you did not request a password reset, please ignore this email or contact your administrator.
    `.trim();

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error("[EmailService] Resend API returned error:", error);
      return {
        success: false,
        error: error.message || "Failed to send email via Resend",
      };
    }

    console.log(`[EmailService] Password reset verification code email sent successfully to ${toEmail}. Message ID: ${data?.id}`);
    return {
      success: true,
      id: data?.id,
    };
  } catch (err: any) {
    console.error("[EmailService] Exception while sending email with Resend:", err);
    return {
      success: false,
      error: err.message || "Unexpected error while sending email",
    };
  }
};

export const sendTestEmail = async (toEmail: string): Promise<SendResetEmailResult> => {
  let apiKey = process.env.RESEND_API_KEY?.trim() || "";
  let customFrom = process.env.RESEND_FROM_EMAIL?.trim() || "";

  let schoolEnglish = "Institute of Arabic and Islamic Studies";
  try {
    const setting = await ReportCardSetting.findOne().lean();
    if (setting?.schoolNameEnglish) schoolEnglish = setting.schoolNameEnglish;
    if (setting?.resendApiKey?.trim()) apiKey = setting.resendApiKey.trim();
    if (setting?.resendFromEmail?.trim()) customFrom = setting.resendFromEmail.trim();
  } catch {
    // ignore
  }

  if (!apiKey) {
    return {
      success: false,
      reason: "MISSING_API_KEY",
      error: "RESEND_API_KEY is not configured.",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const fromAddress = customFrom || `${schoolEnglish} <onboarding@resend.dev>`;

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject: `Resend Test Email - ${schoolEnglish}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
          <h2 style="color: #0369a1;">Resend Email Configuration Verified!</h2>
          <p>This is a test email sent from <strong>${schoolEnglish}</strong>.</p>
          <p>Your Resend API key and email dispatch are functioning properly for password resets.</p>
          <p style="color: #64748b; font-size: 12px; margin-top: 24px;">Sent at: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    if (error) {
      return { success: false, error: error.message || "Failed to send test email" };
    }
    return { success: true, id: data?.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Unexpected error" };
  }
};

