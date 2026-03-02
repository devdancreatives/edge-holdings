import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(to: string, otp: string) {
  console.log(`🚀 Attempting to send OTP email via Resend to: ${to}`);

  const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #09090b; margin: 0; padding: 0; color: #e4e4e7; }
            .container { max-width: 600px; margin: 40px auto; background: #18181b; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3); border: 1px solid #27272a; }
            .header { background: #18181b; padding: 40px 30px 20px; text-align: center; border-bottom: 1px solid #27272a; }
            .logo-circle { width: 48px; height: 48px; background-color: #eab308; border-radius: 50%; margin: 0 auto 16px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: bold; color: #ffffff; letter-spacing: -0.5px; }
            .content { padding: 40px 30px; text-align: center; }
            .title { font-size: 20px; font-weight: 600; color: #ffffff; margin-bottom: 16px; }
            .text { color: #a1a1aa; font-size: 16px; line-height: 1.5; margin-bottom: 30px; }
            .otp-box { background: #27272a; border-radius: 12px; padding: 24px; margin: 30px 0; border: 1px solid #3f3f46; }
            .otp-label { margin: 0; color: #a1a1aa; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
            .otp-code { font-size: 42px; font-weight: bold; color: #eab308; letter-spacing: 8px; margin: 16px 0; font-family: monospace; }
            .expiry { margin: 0; color: #71717a; font-size: 13px; }
            .footer { background: #09090b; padding: 30px; text-align: center; color: #52525b; font-size: 12px; border-top: 1px solid #27272a; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-circle"></div>
              <h1>EdgePoint Holdings</h1>
            </div>
            <div class="content">
              <div class="title">Verify Your Email</div>
              <p class="text">Welcome to EdgePoint Holdings! Please use the verification code below to complete your secure registration.</p>
              <div class="otp-box">
                <p class="otp-label">Verification Code</p>
                <div class="otp-code">${otp}</div>
                <p class="expiry">Valid for 10 minutes</p>
              </div>
              <p class="text" style="font-size: 14px; margin-bottom: 0;">If you didn't request this code, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} EdgePoint Holdings. All rights reserved.</p>
              <p>Secure Crypto Investment Platform</p>
            </div>
          </div>
        </body>
      </html>
    `;

  try {
    const { data, error } = await resend.emails.send({
      from: "EdgePoint Holdings <noreply@kraftkonect.com>",
      to: [to],
      subject: "Verify Your Email - EdgePoint Holdings",
      html,
    });

    if (error) {
      console.error(`❌ Resend failed to send email to ${to}:`, error);
      throw new Error(error.message);
    }

    console.log(
      `✅ OTP email sent successfully via Resend to ${to}. MessageId: ${data?.id}`
    );
    return data;
  } catch (error: any) {
    console.error(`❌ Resend failed to send email to ${to}:`, error.message);
    throw error;
  }
}

export async function sendDepositNotification(
  to: string,
  name: string,
  amount: number,
  txHash: string
) {
  console.log(`🚀 Sending deposit notification to: ${to}`);

  const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #09090b; margin: 0; padding: 0; color: #e4e4e7; }
            .container { max-width: 600px; margin: 40px auto; background: #18181b; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3); border: 1px solid #27272a; }
            .header { background: linear-gradient(135deg, #eab308 0%, #f59e0b 100%); padding: 40px 30px; text-align: center; }
            .icon { width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 32px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: bold; color: #ffffff; }
            .content { padding: 40px 30px; }
            .title { font-size: 20px; font-weight: 600; color: #ffffff; margin-bottom: 16px; text-align: center; }
            .text { color: #a1a1aa; font-size: 16px; line-height: 1.5; margin-bottom: 30px; }
            .amount-box { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center; }
            .amount-label { margin: 0; color: rgba(255,255,255,0.8); font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
            .amount { font-size: 48px; font-weight: bold; color: #ffffff; margin: 16px 0; }
            .details { background: #27272a; border-radius: 12px; padding: 20px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #3f3f46; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { color: #a1a1aa; font-size: 14px; }
            .detail-value { color: #ffffff; font-size: 14px; font-weight: 500; }
            .tx-hash { color: #eab308; font-family: monospace; font-size: 12px; word-break: break-all; }
            .button { display: inline-block; background: linear-gradient(135deg, #eab308 0%, #f59e0b 100%); color: #18181b; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .footer { background: #09090b; padding: 30px; text-align: center; color: #52525b; font-size: 12px; border-top: 1px solid #27272a; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">✓</div>
              <h1>Deposit Confirmed!</h1>
            </div>
            <div class="content">
              <div class="title">Hi ${name},</div>
              <p class="text">Great news! Your USDT deposit has been confirmed and credited to your account.</p>
              
              <div class="amount-box">
                <p class="amount-label">Deposited Amount</p>
                <div class="amount">$${amount.toLocaleString()} USDT</div>
              </div>

              <div class="details">
                <div class="detail-row">
                  <span class="detail-label">Network</span>
                  <span class="detail-value">TRON (TRC20)</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Status</span>
                  <span class="detail-value" style="color: #22c55e;">Confirmed</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Transaction Hash</span>
                  <span class="detail-value tx-hash">${txHash}</span>
                </div>
              </div>

              <div style="text-align: center;">
                <a href="https://tronscan.org/#/transaction/${txHash}" class="button" target="_blank">View on TronScan</a>
              </div>

              <p class="text" style="font-size: 14px; margin-top: 30px;">Your funds are now available for investment. Start growing your portfolio today!</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} EdgePoint Holdings. All rights reserved.</p>
              <p>Secure Crypto Investment Platform</p>
            </div>
          </div>
        </body>
      </html>
    `;

  try {
    const { data, error } = await resend.emails.send({
      from: "EdgePoint Holdings <noreply@kraftkonect.com>",
      to: [to],
      subject: `✅ Deposit Confirmed - $${amount.toLocaleString()} USDT`,
      html,
    });

    if (error) {
      console.error(`❌ Failed to send deposit notification to ${to}:`, error);
      // Don't throw - notification failure shouldn't stop deposit processing
      return null;
    }

    console.log(
      `✅ Deposit notification sent to ${to}. MessageId: ${data?.id}`
    );
    return data;
  } catch (error: any) {
    console.error(`❌ Error sending deposit notification:`, error.message);
    return null;
  }
}
