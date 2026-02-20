import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || 're_dummy_fallback_for_build';
const resend = new Resend(resendApiKey);

const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';
const FROM_EMAIL = process.env.FROM_EMAIL ?? 'GestIA <noreply@gestia.app>';

/**
 * Invia email di verifica all'ADMIN appena registrato.
 * @param to - Email del destinatario
 * @param rawToken - Token grezzo (NON hashato) da inserire nell'URL
 */
export async function sendVerificationEmail(to: string, rawToken: string): Promise<void> {
  const verifyUrl = `${APP_URL}/verify-email?token=${rawToken}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Verifica la tua email — GestIA',
    html: `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background:#18181b;padding:24px 32px;">
              <table>
                <tr>
                  <td style="background:#3f3f46;border-radius:8px;width:36px;height:36px;text-align:center;vertical-align:middle;">
                    <span style="color:#ffffff;font-weight:700;font-size:14px;">G</span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="color:#ffffff;font-size:18px;font-weight:600;">GestIA</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#18181b;">
                Verifica la tua email
              </h1>
              <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">
                Benvenuto su GestIA! Clicca il pulsante qui sotto per confermare il tuo indirizzo email e attivare il tuo account.
              </p>

              <a href="${verifyUrl}"
                 style="display:inline-block;background:#18181b;color:#ffffff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">
                Verifica Email
              </a>

              <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;">
                Il link scade tra <strong>24 ore</strong>. Se non hai creato un account su GestIA, ignora questa email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #f4f4f5;">
              <p style="margin:0;font-size:11px;color:#a1a1aa;">
                In alternativa, copia e incolla questo link nel browser:<br/>
                <a href="${verifyUrl}" style="color:#71717a;word-break:break-all;">${verifyUrl}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `.trim(),
  });
}
