import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    await transporter.verify();
    console.log("Email transporter is working");
  } catch (error) {
    console.error("Email transporter is not working", error);
    return;
  }

  await transporter.sendMail({
    from: `"CollabSpace" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

/**
 * Master email layout generator to ensure 100% consistent styling
 * across all transactional emails (Verification, Password Reset, etc.)
 */
function renderEmailLayout({
  title,
  heading,
  bodyHtml,
  buttonText,
  buttonUrl,
  noteText,
}: {
  title: string;
  heading: string;
  bodyHtml: string;
  buttonText: string;
  buttonUrl: string;
  noteText: string;
}): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${title}</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;padding:48px 16px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.04), 0 2px 4px -2px rgba(0,0,0,0.03);">
              
              <!-- Top Gradient Accent -->
              <tr>
                <td style="height:4px;background:linear-gradient(90deg, #4f46e5 0%, #06b6d4 100%);"></td>
              </tr>

              <!-- Card Content Area -->
              <tr>
                <td style="padding:36px 40px;">
                  
                  <!-- Brand Header -->
                  <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                    <tr>
                      <td style="width:32px;height:32px;background-color:#4f46e5;border-radius:8px;text-align:center;vertical-align:middle;color:#ffffff;font-size:16px;font-weight:800;line-height:32px;">
                        C
                      </td>
                      <td style="padding-left:10px;font-size:17px;font-weight:800;color:#0f172a;letter-spacing:-0.4px;">
                        CollabSpace<span style="color:#4f46e5;">.</span>
                      </td>
                    </tr>
                  </table>

                  <!-- Heading -->
                  <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;line-height:1.35;">
                    ${heading}
                  </h1>

                  <!-- Body Copy -->
                  <div style="font-size:14px;color:#475569;line-height:1.65;margin-bottom:28px;">
                    ${bodyHtml}
                  </div>

                  <!-- CTA Button -->
                  <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                    <tr>
                      <td align="left">
                        <a href="${buttonUrl}" target="_blank"
                          style="display:inline-block;background-color:#0f172a;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:12px 28px;border-radius:8px;letter-spacing:-0.2px;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
                          ${buttonText} &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Expiration & Security Callout -->
                  <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
                    <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">
                      ⏱️ <strong>Note:</strong> ${noteText}
                    </p>
                  </div>

                  <!-- Fallback URL (Clean and Safe) -->
                  <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
                    Button not working? You can also <a href="${buttonUrl}" style="color:#4f46e5;text-decoration:underline;">click here directly</a> to proceed.
                  </p>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:20px 40px;background-color:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#64748b;">
                    CollabSpace
                  </p>
                  <p style="margin:0;font-size:11px;color:#94a3b8;">
                    Focused, real-time team communication. &copy; ${new Date().getFullYear()} CollabSpace. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function verificationEmailTemplate(url: string, name: string): string {
  return renderEmailLayout({
    title: "Verify your email - CollabSpace",
    heading: "Verify your email address",
    bodyHtml: `Hi <strong>${name}</strong>,<br/><br/>Welcome to CollabSpace! Please confirm your email address by clicking the button below to activate your account and start collaborating with your team.`,
    buttonText: "Verify Email Address",
    buttonUrl: url,
    noteText:
      "This verification link will expire in <strong>24 hours</strong>. If you did not create an account, you can safely ignore this email.",
  });
}

export function resetPasswordEmailTemplate(url: string, name: string): string {
  return renderEmailLayout({
    title: "Reset your password - CollabSpace",
    heading: "Reset your password",
    bodyHtml: `Hi <strong>${name}</strong>,<br/><br/>We received a request to reset the password for your CollabSpace account. Click the button below to set a new password.`,
    buttonText: "Reset Password",
    buttonUrl: url,
    noteText:
      "This link will expire in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your account remains secure.",
  });
}

export function existingUserEmailTemplate(name: string): string {
  return renderEmailLayout({
    title: "Account Alert - CollabSpace",
    heading: "Sign-up attempt on your account",
    bodyHtml: `Hi <strong>${name}</strong>,<br/><br/>Someone just attempted to register a new CollabSpace account using your email address.<br/><br/><strong>Was this you?</strong> You already have an account with us. You can sign in directly below.<br/><strong>Wasn't you?</strong> No action is needed. Your account is completely secure.`,
    buttonText: "Go to Sign In",
    buttonUrl: `${process.env.BETTER_AUTH_URL}/sign-in`,
    noteText:
      "If you have security concerns about your account, you can reset your password anytime from the sign-in page.",
  });
}
