export const EmailTemplates = {
  // ==========================================
  // B2B PARTNER (Sie)
  // ==========================================

  partnerWelcome: (companyName: string, userName: string, email: string, password: string) => `
    <div style="font-family: sans-serif; color: #1e3a5f; line-height: 1.6;">
      <h1 style="color: #163B40;">Willkommen beim Wirbelsäulenstützpunkt – Ihr Partner-Zugang</h1>
      <p>Sehr geehrte(r) ${userName},</p>
      <p>wir freuen uns, Ihre Firma <strong>${companyName}</strong> als Partner begrüßen zu dürfen. Ihr Admin-Zugang für das WSP Portal wurde erfolgreich eingerichtet.</p>
      <p>Hier können Sie ab sofort Ihre Mitarbeiter verwalten und Kontingente einsehen.</p>
      
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top:0; color: #15803d; font-size: 16px;">Ihre Zugangsdaten</h3>
        <p style="margin: 5px 0;"><strong>E-Mail:</strong> ${email}</p>
        <p style="margin: 5px 0;"><strong>Passwort:</strong> <code>${password}</code></p>
      </div>

      <p>Wir empfehlen, das Passwort nach der ersten Anmeldung zu ändern.</p>
      
      <div style="margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL}/login" style="display: inline-block; background: #163B40; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Zum Partner Portal</a>
      </div>

      <p>Wir freuen uns auf eine gesunde Zusammenarbeit.<br/>
      Ihr WSP Team</p>
    </div>
  `,

  // ==========================================
  // MITARBEITER & B2C KUNDEN (Du)
  // ==========================================

  accountCredentials: (userName: string, email: string, password: string) => `
    <div style="font-family: sans-serif; color: #1e3a5f; line-height: 1.6;">
      <h1 style="color: #163B40;">Dein Start im WSP – Hier sind deine Zugangsdaten 🚀</h1>
      <p>Hey ${userName},</p>
      <p>willkommen an Bord! Dein Account für das Wirbelsäulenstützpunkt-Portal ist startklar.</p>
      <p>Ab jetzt kannst du deine Trainings ganz bequem per App buchen und verwalten.</p>
      
      <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top:0; color: #555; font-size: 16px;">Dein Login</h3>
        <p style="margin: 5px 0;"><strong>E-Mail:</strong> ${email}</p>
        <p style="margin: 5px 0;"><strong>Passwort:</strong> <code>${password}</code></p>
      </div>

      <p>Logge dich am besten gleich ein und ändere dein Passwort.</p>
      
      <div style="margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL}/login" style="display: inline-block; background: #163B40; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Jetzt einloggen & Training buchen</a>
      </div>

      <p>Wir sehen uns im Training!<br/>
      Dein WSP Team</p>
    </div>
  `,

  bookingConfirmation: (userName: string, date: string, time: string) => `
    <div style="font-family: sans-serif; color: #1e3a5f; line-height: 1.6;">
      <h1 style="color: #163B40;">Training bestätigt! ✅</h1>
      <p>Hey ${userName},</p>
      <p>dein Slot ist reserviert. Klasse, dass du was für dich tust!</p>
      
      <div style="background: #eaf8f7; border: 1px solid #2cc8c5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #163B40;">${date} um ${time}</p>
      </div>

      <p>Bitte sei 5 Minuten vor Beginn da, damit wir pünktlich starten können.</p>
      
      <p>Bis dann,<br/>
      Dein WSP Team</p>
    </div>
  `,

  reminder: (userName: string, date: string, time: string) => `
    <div style="font-family: sans-serif; color: #1e3a5f; line-height: 1.6;">
      <h1 style="color: #ff6f61;">Morgen gilt's! Dein Training im WSP 💪</h1>
      <p>Hey ${userName},</p>
      <p>nur eine kurze Erinnerung: Morgen steht dein Training an!</p>
      
      <div style="background: #fff3e0; border: 1px solid #ffe0b2; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #e65100;">${date} um ${time}</p>
      </div>

      <p>Wir freuen uns auf dich. Falls etwas dazwischenkommt, kannst du den Termin im Portal verschieben.</p>
      
      <div style="margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL}/login" style="display: inline-block; background: #163B40; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Zum Portal</a>
      </div>

      <p>Sportliche Grüße,<br/>
      Dein WSP Team</p>
    </div>
  `,

  cancellation: (userName: string, date: string) => `
    <div style="font-family: sans-serif; color: #1e3a5f; line-height: 1.6;">
      <h1 style="color: #d32f2f;">Schade – Dein Training wurde storniert</h1>
      <p>Hallo ${userName},</p>
      <p>dein Termin am <strong>${date}</strong> wurde wie gewünscht storniert.</p>
      <p>Hoffentlich klappt es beim nächsten Mal wieder! Buche dir am besten gleich einen neuen Slot, um im Rhythmus zu bleiben.</p>
      
      <div style="margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL}/user/schedule" style="display: inline-block; background: #163B40; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Neuen Termin finden</a>
      </div>

      <p>Dein WSP Team</p>
    </div>
  `,
};
