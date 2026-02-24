# Email Sending API

A production-ready REST API endpoint for sending emails securely.

## Features

- **Nodemailer (SMTP)**: Send emails via any SMTP provider (Gmail, Outlook, SendGrid, etc.).
- **Zod Validation**: Ensures payloads are correct.
- **Security**: CORS, Helmet (security headers), and Rate Limiting (5 emails/min).
- **Clean Architecture**: Controller/Service pattern.

## Quick Start

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Configure Environment**:
   - Copy `.env.example` to `.env`.
   - Update the SMTP settings with your provider's details.
   - For Gmail, use an [App Password](https://myaccount.google.com/apppasswords).

3. **Run the API**:
   - Development: `npm run dev`
   - Production: `npm start`

## API Usage

### Endpoint: `POST /api/v1/send-email`

**Payload**:

```json
{
  "to": "recipient@example.com",
  "subject": "Hello World",
  "html": "<h1>Welcome</h1><p>This is a test email.</p>"
}
```

### Example Frontend Call (Fetch)

```javascript
const sendEmail = async (data) => {
  try {
    const response = await fetch("http://localhost:3000/api/v1/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: data.email,
        subject: "New Contact Request",
        html: `<p>You have a new message from ${data.name}</p>`,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      alert("Email sent successfully!");
    } else {
      console.error("Failed to send:", result.message);
    }
  } catch (error) {
    console.error("Network error:", error);
  }
};
```
# eventai
