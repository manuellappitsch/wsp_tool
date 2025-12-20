export const EmailTemplates = {
  bookingConfirmation: (userName: string, date: string, time: string) => `
    <div style="font-family: sans-serif; color: #1e3a5f;">
      <h1 style="color: #d32f2f;">Training Bestätigt! 🚀</h1>
      <p>Hey ${userName},</p>
      <p>Deine Session steht! Wir freuen uns darauf, dich im WSP zu sehen.</p>
      <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Datum:</strong> ${date}</p>
        <p><strong>Zeit:</strong> ${time}</p>
      </div>
      <p>Bitte sei 5 Minuten vor Beginn da.</p>
      <p>Dein WSP Team</p>
    </div>
  `,

  reminder: (userName: string, date: string, time: string) => `
    <div style="font-family: sans-serif; color: #1e3a5f;">
      <h1 style="color: #d32f2f;">Morgen gilt's! 💪</h1>
      <p>Hallo ${userName},</p>
      <p>Nur eine kurze Erinnerung an dein Training morgen.</p>
      <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Datum:</strong> ${date}</p>
        <p><strong>Zeit:</strong> ${time}</p>
      </div>
      <p>Wir zählen auf dich!</p>
      <p>Dein WSP Team</p>
    </div>
  `,

  cancellation: (userName: string) => `
    <div style="font-family: sans-serif; color: #1e3a5f;">
      <h1>Schade, dass es nicht klappt.</h1>
      <p>Hallo ${userName},</p>
      <p>Deine Buchung wurde erfolgreich storniert. Wir hoffen, dich bald wiederzusehen!</p>
      <p>Buch direkt deinen nächsten Slot in der App.</p>
      <a href="${process.env.NEXTAUTH_URL}/user/schedule" style="display: inline-block; background: #d32f2f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Neuen Termin buchen</a>
    </div>
  `,

  accountCredentials: (userName: string, email: string, password: string) => `
    <div style="font-family: sans-serif; color: #1e3a5f;">
      <h1 style="color: #163B40;">Willkommen im B2B Portal! 🎉</h1>
      <p>Hallo ${userName},</p>
      <p>Dein Firmen-Administrator hat dir einen Account für das <strong>WSP Partner Portal</strong> erstellt.</p>
      <p>Hier sind deine Zugangsdaten:</p>
      <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>E-Mail:</strong> ${email}</p>
        <p><strong>Passwort:</strong> <code>${password}</code></p>
      </div>
      <p>Bitte ändere dein Passwort nach dem ersten Login.</p>
      <a href="${process.env.NEXTAUTH_URL}/login" style="display: inline-block; background: #163B40; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Zum Login</a>
      <p style="margin-top:20px; font-size: 12px; color: #888;">Hinweis: Wenn du das Passwort nicht selbst angefordert hast, wende dich bitte an deinen Administrator.</p>
    </div>
  `,

  partnerWelcome: (companyName: string, userName: string, email: string, password: string) => `
    <div style="font-family: sans-serif; color: #1e3a5f;">
      <h1 style="color: #163B40;">Herzlich Willkommen, ${companyName}! 🚀</h1>
      <p>Hallo ${userName},</p>
      <p>Wir freuen uns, euch als neuen Partner beim <strong>Wirbelsäulenstützpunkt</strong> begrüßen zu dürfen.</p>
      <p>Ihr B2B-Firmenaccount wurde erfolgreich eingerichtet. Mit diesem Zugang können Sie Ihre Kontingente verwalten und Mitarbeiter anlegen.</p>
      
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top:0; color: #15803d;">Admin Zugangsdaten</h3>
        <p><strong>Login E-Mail:</strong> ${email}</p>
        <p><strong>Initial-Passwort:</strong> <code>${password}</code></p>
      </div>

      <p>Wir empfehlen, das Passwort nach der ersten Anmeldung in den Einstellungen zu ändern.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL}/login" style="display: inline-block; background: #163B40; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Jetzt anmelden</a>
      </div>

      <p>Bei Fragen stehen wir Ihnen jederzeit gerne zur Verfügung.</p>
      <p>Beste Grüße,<br/>Ihr WSP Team</p>
    </div>
  `,
};
