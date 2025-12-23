import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactNotificationRequest {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

async function sendEmail(payload: {
  from: string;
  to: string[];
  subject: string;
  html: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { name, email, subject, message }: ContactNotificationRequest = await req.json();

    console.log(`Sending contact notification for: ${name} <${email}>`);

    // Send notification email to admin
    const adminEmailResponse = await sendEmail({
      from: "Portfolio Contact <onboarding@resend.dev>",
      to: ["dwibayu526@gmail.com"],
      subject: `[Portfolio] Pesan baru dari ${name}${subject ? `: ${subject}` : ""}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📬 Pesan Baru dari Portfolio</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h2 style="margin-top: 0; color: #374151; font-size: 18px;">Detail Pengirim</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; width: 100px;">Nama:</td>
                  <td style="padding: 8px 0; font-weight: 600;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Email:</td>
                  <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #667eea;">${email}</a></td>
                </tr>
                ${subject ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Subjek:</td>
                  <td style="padding: 8px 0;">${subject}</td>
                </tr>
                ` : ""}
              </table>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-top: 20px;">
              <h2 style="margin-top: 0; color: #374151; font-size: 18px;">Pesan</h2>
              <p style="white-space: pre-wrap; margin: 0; color: #4b5563;">${message}</p>
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
              <a href="mailto:${email}?subject=Re: ${subject || "Pesan dari Portfolio"}" 
                 style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                Balas Email
              </a>
            </div>
          </div>
          
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
            Email ini dikirim otomatis dari form kontak portfolio bayud.my.id
          </p>
        </body>
        </html>
      `,
    });

    console.log("Admin notification sent:", adminEmailResponse);

    // Send confirmation email to sender
    const senderEmailResponse = await sendEmail({
      from: "Bayu Dwi Darmawan <onboarding@resend.dev>",
      to: [email],
      subject: "Terima kasih telah menghubungi saya!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Terima Kasih, ${name}! 🙏</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #4b5563;">
              Saya telah menerima pesan Anda dan akan segera membalas secepatnya.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Pesan Anda:</h3>
              <p style="white-space: pre-wrap; margin: 0; color: #6b7280; font-style: italic;">"${message}"</p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">
              Sementara menunggu balasan, Anda bisa mengunjungi website saya untuk melihat portfolio dan artikel blog terbaru.
            </p>
            
            <div style="text-align: center; margin-top: 20px;">
              <a href="https://www.bayud.my.id" 
                 style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                Kunjungi Portfolio
              </a>
            </div>
          </div>
          
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
            Bayu Dwi Darmawan - Proof Print Operator & Tech Blogger<br>
            <a href="https://www.bayud.my.id" style="color: #667eea;">bayud.my.id</a>
          </p>
        </body>
        </html>
      `,
    });

    console.log("Sender confirmation sent:", senderEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        adminEmail: adminEmailResponse, 
        senderEmail: senderEmailResponse 
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
