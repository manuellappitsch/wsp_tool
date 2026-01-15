# API Dokumentation: Fillout Webhook Integration

Diese Dokumentation beschreibt die Schnittstelle (`webhook`), mit der automatisch neue Partner (Tenants) im WSP Portal erstellt werden können, wenn ein Formular in Fillout ausgefüllt wird.

## 1. Übersicht
*   **Endpunkt URL:** `https://<DEINE-DOMAIN>/api/webhooks/fillout`
*   **Methode:** `POST`
*   **Authentifizierung:** Über URL-Parameter `token`

## 2. Einrichtung & Sicherheit

Damit der Zugriff geschützt ist, muss ein geheimer Token definiert werden.

1.  **Token generieren:** Denk dir ein sicheres Wort/Passwort aus (z.B. `MeinGeheimerToken1234!`).
2.  **Server konfigurieren:** Füge diesen Token in deine `.env` Datei ein:
    ```env
    FILLOUT_WEBHOOK_SECRET=MeinGeheimerToken1234!
    ```
    *(In Vercel unter Settings -> Environment Variables hinzufügen)*

3.  **Webhook URL zusammensetzen:**
    Die URL für Fillout lautet dann:
    ```
    https://deine-domain.com/api/webhooks/fillout?token=MeinGeheimerToken1234!
    ```

## 3. Webhook Einrichtung in Fillout

1.  Öffne dein Formular in Fillout.
2.  Gehe zu **Integrations** -> **Webhooks**.
3.  Erstelle einen neuen Webhook:
    *   **URL:** (Die URL von oben)
    *   **Method:** POST
    *   **Headers:** (Leer lassen)

## 4. Daten-Format (JSON Body)

Fillout sendet die Daten als JSON. Du musst im Fillout-Webhook Menü die Felder deines Formulars den Schlüsseln unserer API zuordnen.

### Pflichtfelder

| Schlüssel (Key) | Typ | Beschreibung |
| :--- | :--- | :--- |
| `companyName` | String | Name der Firma (z.B. "Muster GmbH") |
| `firstName` | String | Vorname des Ansprechpartners/Admins |
| `lastName` | String | Nachname des Ansprechpartners/Admins |
| `email` | String | E-Mail Adresse des Admins (wird für Login & Mails genutzt) |

### Optionale Felder

| Schlüssel (Key) | Typ | Standard | Beschreibung |
| :--- | :--- | :--- | :--- |
| `dailyKontingent` | Zahl | `1` | Anzahl der täglichen Buchungen pro Mitarbeiter |
| `billingAddress` | String | - | Straße & Hausnummer für Rechnung |
| `billingZip` | String | - | Postleitzahl |
| `billingCity` | String | - | Stadt |
| `billingEmail` | String | - | Alternative Rechnungs-E-Mail |
| `logoUrl` | String | - | Direkter Link zum Firmenlogo (falls vorhanden) |

### Beispiel JSON Payload

So sieht das JSON aus, das Fillout senden sollte:

```json
{
  "companyName": "Tech Solutions GmbH",
  "firstName": "Max",
  "lastName": "Mustermann",
  "email": "max@tech-solutions.de",
  "dailyKontingent": 5,
  "billingAddress": "Musterstraße 1",
  "billingZip": "10115",
  "billingCity": "Berlin",
  "billingEmail": "buchhaltung@tech-solutions.de"
}
```

## 5. Rückgabewerte (Response)

Die API antwortet mit folgenden Status-Codes:

*   **200 OK**: Erfolgreich erstellt.
    ```json
    {
      "success": true,
      "message": "Tenant created successfully",
      "tenantEmail": "max@tech-solutions.de"
    }
    ```
*   **400 Bad Request**: Fehlende Daten oder E-Mail bereits vorhanden.
    ```json
    {
      "error": "Diese E-Mail wird bereits verwendet."
    }
    ```
*   **401 Unauthorized**: Falscher oder fehlender Token.
*   **500 Internal Server Error**: Technischer Fehler auf dem Server.

## 6. Automatischer Ablauf

Sobald der Webhook erfolgreich empfangen wurde:
1.  Ein neuer **Tenant** (Firma) wird in der Datenbank angelegt.
2.  Ein erster **Admin-User** wird erstellt.
3.  Ein zufälliges **Passwort** wird generiert.
4.  Eine **Willkommens-E-Mail** wird automatisch an die angegebene E-Mail Adresse gesendet (Absender: Partner Support).
    *   *Hinweis:* Das Passwort steht direkt in dieser E-Mail.

---

---

# Teil 2: CRM Integration (HubSpot, etc.)

Diese Schnittstelle (`crm`) dient dazu, **Endkunden (B2C)** zu verwalten, wenn sie Produkte kaufen (z.B. Abo oder 10er Block).

## 1. Übersicht
*   **Endpunkt URL:** `https://<DEINE-DOMAIN>/api/webhooks/crm`
*   **Methode:** `POST`
*   **Authentifizierung:** Über URL-Parameter `token` (nutzt `CRM_WEBHOOK_SECRET` oder fallback auf `FILLOUT_WEBHOOK_SECRET`)

## 2. Einrichtung (HubSpot Workflow)
Erstelle einen Workflow, der bei Kaufabschluss einen **Webhook** sendet.

**URL:** `https://deine-domain.com/api/webhooks/crm?token=MeinGeheimerToken1234!`

## 3. Daten-Format (JSON Body)

Du kannst Kunden erstellen ODER aktualisieren ("Upsert"). Die E-Mail ist der eindeutige Schlüssel.

### Felder

| Schlüssel (Key) | Typ | Beschreibung |
| :--- | :--- | :--- |
| `email` | String | **Pflichtfeld**. Kunde wird anhand der E-Mail identifiziert. |
| `firstName` | String | Vorname |
| `lastName` | String | Nachname |
| `phone` | String | (Optional) Telefonnummer |
| `addCredits` | Zahl | (Optional) Fügt Credits hinzu (z.B. `10` für 10er Block). |
| `setSubscriptionMonths` | Zahl | (Optional) Verlängert das Abo um X Monate. |

### Beispiele

#### Beispiel A: Kunde kauft 10er Block
Der Kunde bekommt 10 Credits gutgeschrieben.

```json
{
  "email": "kunde@privat.at",
  "firstName": "Susi",
  "lastName": "Sorglos",
  "addCredits": 10
}
```

#### Beispiel B: Kunde schließt Jahresabo ab (12 Monate)
Das Abo wird aktiviert oder um 12 Monate verlängert.

```json
{
  "email": "sporty@spice.com",
  "firstName": "Max",
  "lastName": "Power",
  "setSubscriptionMonths": 12
}
```

#### Beispiel C: Kombination
Neukunde kauft Abo + Extra Block.

```json
{
  "email": "neu@kunde.at",
  "firstName": "Neu",
  "lastName": "Hier",
  "setSubscriptionMonths": 6,
  "addCredits": 5
}
```

