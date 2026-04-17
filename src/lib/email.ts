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

export function verificationEmailTemplate(url: string, name: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Verify your email</title>
    </head>
    <body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width:520px;background:#ffffff;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;">

              <!-- Header -->
              <tr>
                <td style="padding:32px 40px 0;">
                  <p style="margin:0;font-size:15px;font-weight:700;color:#09090b;letter-spacing:-0.3px;">
                    CollabSpace
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:28px 40px;">
                  <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#09090b;letter-spacing:-0.4px;">
                    Verify your email address
                  </h1>
                  <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">
                    Hi ${name}, thanks for signing up! Click the button below to verify your email and activate your CollabSpace account.
                  </p>

                  <!-- CTA Button -->
                  <a href="${url}"
                    style="display:inline-block;background:#09090b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;padding:10px 24px;border-radius:6px;">
                    Verify email address
                  </a>

                  <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;line-height:1.6;">
                    This link will expire in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:20px 40px;border-top:1px solid #f4f4f5;">
                  <p style="margin:0;font-size:11px;color:#a1a1aa;">
                    © ${new Date().getFullYear()} CollabSpace. All rights reserved.
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

export function existingUserEmailTemplate(name: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Sign-up attempt notice</title>
    </head>
    <body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width:520px;background:#ffffff;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;">

              <tr>
                <td style="padding:32px 40px 0;">
                  <p style="margin:0;font-size:15px;font-weight:700;color:#09090b;">CollabSpace</p>
                </td>
              </tr>

              <tr>
                <td style="padding:28px 40px;">
                  <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#09090b;">
                    Sign-up attempt on your account
                  </h1>
                  <p style="margin:0 0 16px;font-size:14px;color:#71717a;line-height:1.6;">
                    Hi ${name}, someone just tried to create a new CollabSpace account using your email address.
                  </p>
                  <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">
                    <strong style="color:#09090b;">Was this you?</strong> Try signing in instead — your account already exists.
                    <br/>
                    <strong style="color:#09090b;">Wasn't you?</strong> No action needed. Your account is safe and no changes were made.
                  </p>

                  <a href="${process.env.BETTER_AUTH_URL}/sign-in"
                    style="display:inline-block;background:#09090b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;padding:10px 24px;border-radius:6px;">
                    Go to sign in
                  </a>
                </td>
              </tr>

              <tr>
                <td style="padding:20px 40px;border-top:1px solid #f4f4f5;">
                  <p style="margin:0;font-size:11px;color:#a1a1aa;">
                    © ${new Date().getFullYear()} CollabSpace. All rights reserved.
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

export function resetPasswordEmailTemplate(url: string, name: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Reset your password</title>
    </head>
    <body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width:520px;background:#ffffff;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;">
              <tr>
                <td style="padding:32px 40px 0;">
                  <p style="margin:0;font-size:15px;font-weight:700;color:#09090b;">CollabSpace</p>
                </td>
              </tr>
              <tr>
                <td style="padding:28px 40px;">
                  <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#09090b;">
                    Reset your password
                  </h1>
                  <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">
                    Hi ${name}, we received a request to reset your CollabSpace password. Click the button below to choose a new one.
                  </p>
                  <a href="${url}"
                    style="display:inline-block;background:#09090b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;padding:10px 24px;border-radius:6px;">
                    Reset password
                  </a>
                  <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;line-height:1.6;">
                    This link expires in <strong>1 hour</strong>. If you didn't request this, ignore this email — your account is safe.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 40px;border-top:1px solid #f4f4f5;">
                  <p style="margin:0;font-size:11px;color:#a1a1aa;">
                    © ${new Date().getFullYear()} CollabSpace. All rights reserved.
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
