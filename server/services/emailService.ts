import nodemailer from "nodemailer";
import { Resend } from "resend";
import ReportCardSetting from "../models/ReportCardSetting";

interface SendResetEmailResult {
  success: boolean;
  id?: string;
  provider?: "smtp" | "resend";
  error?: string;
  reason?: string;
}

const stripQuotes = (val?: string | null): string =>
  (val || "").trim().replace(/^['"]+|['"]+$/g, "").trim();

const formatFromAddress = (rawFrom: string, schoolEnglish: string): string => {
  const safeSchool = (schoolEnglish || "School Portal").replace(/[<>"]/g, "").trim();
  const clean = stripQuotes(rawFrom);
  if (!clean) {
    return `${safeSchool} <onboarding@resend.dev>`;
  }
  const match = clean.match(/^(.*)<\s*([^<>]+?)\s*>$/);
  if (match) {
    const displayName = match[1].replace(/[<>"]/g, "").trim() || safeSchool;
    const emailPart = match[2].replace(/\/+$/g, "").trim();
    return `${displayName} <${emailPart}>`;
  }
  const cleanEmail = clean.replace(/\/+$/g, "").trim();
  return `${safeSchool} <${cleanEmail}>`;
};

const resolveEmailConfig = async () => {
  let schoolEnglish = "Institute of Arabic and Islamic Studies";
  let schoolArabic = "معهد التعليم العربي الإسلامي";
  let dbResendKey = "";
  let dbResendFrom = "";

  try {
    const setting = await ReportCardSetting.findOne().lean();
    if (setting?.schoolNameEnglish) schoolEnglish = setting.schoolNameEnglish;
    if (setting?.schoolNameArabic) schoolArabic = setting.schoolNameArabic;
    dbResendKey = stripQuotes(setting?.resendApiKey);
    dbResendFrom = stripQuotes(setting?.resendFromEmail);
  } catch {
    // ignore DB read failure and rely on env vars
  }

  // 1. Nodemailer / SMTP config (supports Gmail or any SMTP provider)
  const smtpUser = stripQuotes(
    process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER
  );
  let smtpPass = stripQuotes(
    process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD
  );
  const smtpHost =
    stripQuotes(process.env.SMTP_HOST) ||
    (smtpUser ? "smtp.gmail.com" : "");
  const smtpPort = Number(stripQuotes(process.env.SMTP_PORT)) || 465;
  const smtpSecure =
    process.env.SMTP_SECURE !== undefined
      ? stripQuotes(process.env.SMTP_SECURE).toLowerCase() === "true"
      : smtpPort === 465;

  // Google displays 16-char App Passwords with spaces (e.g. "abcd efgh ijkl mnop")
  if (smtpHost.toLowerCase().includes("gmail.com") && smtpPass) {
    smtpPass = smtpPass.replace(/\s+/g, "");
  }

  const smtpFromRaw = stripQuotes(process.env.SMTP_FROM || process.env.EMAIL_FROM) || smtpUser;
  const smtpFrom = smtpFromRaw ? formatFromAddress(smtpFromRaw, schoolEnglish) : "";

  // 2. Resend fallback config
  const envResendKey = stripQuotes(process.env.RESEND_API_KEY);
  const envResendFrom = stripQuotes(process.env.RESEND_FROM_EMAIL);
  const resendApiKey = envResendKey || dbResendKey;
  const resendFrom = formatFromAddress(envResendFrom || dbResendFrom, schoolEnglish);

  return {
    schoolEnglish,
    schoolArabic,
    smtp: {
      configured: Boolean(smtpHost && smtpUser && smtpPass),
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      user: smtpUser,
      pass: smtpPass,
      from: smtpFrom,
    },
    resend: {
      configured: Boolean(resendApiKey),
      apiKey: resendApiKey,
      from: resendFrom,
    },
  };
};

const sendWithNodemailer = async (
  smtp: Awaited<ReturnType<typeof resolveEmailConfig>>["smtp"],
  toEmail: string,
  subject: string,
  html: string,
  text: string
): Promise<SendResetEmailResult> => {
  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });

    const info = await transporter.sendMail({
      from: smtp.from,
      to: toEmail,
      subject,
      html,
      text,
    });

    console.log(
      `[EmailService] Sent via Nodemailer (${smtp.host}) to ${toEmail}. Message ID: ${info.messageId}`
    );
    return {
      success: true,
      provider: "smtp",
      id: info.messageId,
    };
  } catch (err: any) {
    console.error("[EmailService] Nodemailer SMTP error:", {
      message: err?.message,
      code: err?.code,
      responseCode: err?.responseCode,
      host: smtp.host,
      port: smtp.port,
      user: smtp.user,
    });
    return {
      success: false,
      provider: "smtp",
      error: err?.message || "Failed to send email via SMTP",
    };
  }
};

export const sendPasswordResetEmail = async (
  toEmail: string,
  userName: string,
  resetCode: string
): Promise<SendResetEmailResult> => {
  const config = await resolveEmailConfig();
  const { schoolEnglish, schoolArabic, smtp, resend } = config;

  if (!smtp.configured && !resend.configured) {
    console.warn(
      "[EmailService] Neither SMTP credentials (SMTP_USER/SMTP_PASS) nor RESEND_API_KEY are configured. Email will not be sent."
    );
    return {
      success: false,
      reason: "MISSING_EMAIL_CONFIG",
      error: "Email service is not configured on the server.",
    };
  }

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

  // Prefer Nodemailer SMTP when configured
  if (smtp.configured) {
    return sendWithNodemailer(smtp, toEmail, subject, htmlContent, textContent);
  }

  // Fallback to Resend
  try {
    const resendClient = new Resend(resend.apiKey);
    const { data, error } = await resendClient.emails.send({
      from: resend.from,
      to: [toEmail],
      subject,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error("[EmailService] Resend API returned error:", {
        error,
        fromAddress: resend.from,
        toEmail,
      });
      return {
        success: false,
        provider: "resend",
        error: error.message || "Failed to send email via Resend",
      };
    }

    console.log(
      `[EmailService] Password reset verification code email sent via Resend to ${toEmail}. Message ID: ${data?.id}`
    );
    return {
      success: true,
      provider: "resend",
      id: data?.id,
    };
  } catch (err: any) {
    console.error("[EmailService] Exception while sending email with Resend:", err);
    return {
      success: false,
      provider: "resend",
      error: err.message || "Unexpected error while sending email",
    };
  }
};

export const sendTestEmail = async (toEmail: string): Promise<SendResetEmailResult> => {
  const { schoolEnglish, smtp, resend } = await resolveEmailConfig();

  if (!smtp.configured && !resend.configured) {
    return {
      success: false,
      reason: "MISSING_EMAIL_CONFIG",
      error: "Neither SMTP credentials nor RESEND_API_KEY are configured.",
    };
  }

  const subject = `Email Test - ${schoolEnglish}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
      <h2 style="color: #0369a1;">Email Configuration Verified!</h2>
      <p>This is a test email sent from <strong>${schoolEnglish}</strong>.</p>
      <p>Your email configuration is functioning properly for password resets.</p>
      <p style="color: #64748b; font-size: 12px; margin-top: 24px;">Sent at: ${new Date().toISOString()}</p>
    </div>
  `;
  const text = `${schoolEnglish}: Your email configuration is verified and working properly. Sent at ${new Date().toISOString()}`;

  if (smtp.configured) {
    return sendWithNodemailer(smtp, toEmail, subject, html, text);
  }

  try {
    const resendClient = new Resend(resend.apiKey);
    const { data, error } = await resendClient.emails.send({
      from: resend.from,
      to: [toEmail],
      subject,
      html,
    });

    if (error) {
      return { success: false, provider: "resend", error: error.message || "Failed to send test email" };
    }
    return { success: true, provider: "resend", id: data?.id };
  } catch (err: any) {
    return { success: false, provider: "resend", error: err.message || "Unexpected error" };
  }
};
