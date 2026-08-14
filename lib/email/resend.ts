import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface SessionEmailPayload {
  recipientEmail: string;
  recipientName: string;
  sessionTitle: string;
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
  jitsiRoomUrl: string;
  partnerName: string;
}

export async function sendSessionScheduledEmail(payload: SessionEmailPayload): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { recipientEmail, recipientName, sessionTitle, scheduledDate, startTime, durationMinutes, jitsiRoomUrl, partnerName } = payload;

    const fromAddress = process.env.RESEND_FROM_EMAIL || "SkillSwap <onboarding@resend.dev>";
    const subject = `🗓 New Learning Session Scheduled: ${sessionTitle}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8faf9; margin: 0; padding: 20px; color: #1e293b; }
            .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; }
            .header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 16px; margin-bottom: 24px; }
            .logo { font-size: 24px; font-weight: bold; color: #0f766e; }
            .title { font-size: 20px; font-weight: bold; color: #0f766e; margin-top: 0; }
            .card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 20px 0; }
            .meta-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
            .meta-label { font-weight: bold; color: #047857; }
            .button { display: inline-block; background-color: #d97706; color: #ffffff !important; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; margin-top: 16px; text-align: center; }
            .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">SkillSwap</div>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">Peer Skill Exchange Network</p>
            </div>
            
            <h2 class="title">New 1-to-1 Learning Session Scheduled!</h2>
            <p>Hi <strong>${recipientName}</strong>,</p>
            <p>Your exchange partner <strong>${partnerName}</strong> has scheduled a new learning session with you on SkillSwap.</p>
            
            <div class="card">
              <h3 style="margin-top: 0; color: #065f46;">${sessionTitle}</h3>
              <div class="meta-row">
                <span class="meta-label">Date:</span>
                <span>${new Date(scheduledDate).toLocaleDateString()}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Start Time:</span>
                <span>${startTime}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Duration:</span>
                <span>${durationMinutes} Minutes</span>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="${jitsiRoomUrl}" class="button" target="_blank">Join 1-to-1 Video Session</a>
            </div>

            <p style="font-size: 13px; margin-top: 24px; color: #475569;">
              You can also join directly from your SkillSwap Exchange Workspace.
            </p>

            <div class="footer">
              <p>© 2026 SkillSwap — Democratic Peer Learning Platform</p>
            </div>
          </div>
        </body>
      </html>
    `;

    if (!resend) {
      console.log(`[Resend Email Simulated] To: ${recipientEmail} | Subject: ${subject}`);
      return { success: true, data: { simulated: true } };
    }

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [recipientEmail],
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend API error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error("sendSessionScheduledEmail exception:", err);
    return { success: false, error: err.message || "Failed to send email." };
  }
}
