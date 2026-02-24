# eventai - API Documentation for Frontend Users

This document provides the necessary details to integrate with the Email Sending API.

## 🚀 Endpoint Overview

- **Base URL**: `https://eventai-seven.vercel.app`
- **Endpoint**: `/api/v1/send-email`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`

---

## 🛠 Request Fields

Since the API supports physical file uploads, you must use `FormData` in the frontend (multipart/form-data).

| Field         | Type               | Required | Description                                                                                                       |
| :------------ | :----------------- | :------- | :---------------------------------------------------------------------------------------------------------------- |
| `to`          | `string` / `array` | Yes      | One or more recipient email addresses. Can be a comma-separated string or an array of strings.                    |
| `subject`     | `string`           | Yes      | Subject line of the email.                                                                                        |
| `html`        | `string`           | Yes      | HTML content of the email body.                                                                                   |
| `attachments` | `File`             | No       | One or more files (PDF, PNG, JPG). Up to 5 files allowed. These will be sent to ALL recipients in the `to` field. |

---

## 📦 Bulk Sending (New Endpoint)

- **Endpoint**: `/api/v1/send-bulk`
- **Method**: `POST`
- **Content-Type**: `application/json`

This endpoint allows sending different emails to different people in one request.

### **Request Body Example**

```json
{
  "emails": [
    {
      "to": "user1@example.com",
      "subject": "Personalized Offer",
      "html": "<h1>Hi User 1</h1><p>Check your unique PDF.</p>",
      "attachments": [
        {
          "filename": "Special-Offer.pdf",
          "path": "https://example.com/files/offer-1.pdf"
        }
      ]
    },
    {
      "to": "user2@example.com",
      "subject": "Greetings",
      "html": "<h1>Welcome</h1>",
      "attachments": [
        {
          "filename": "welcome.png",
          "content": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
          "contentType": "image/png"
        }
      ]
    }
  ]
}
```

---

### **Individualized Physical Attachments**

You can also send different **physical files** to each user by combining the `emails` JSON field with physical file uploads. Mapping is done via the `filename` property.

**cURL Example (Individualized Physical Files):**

```bash
curl -X POST http://localhost:3000/api/v1/send-bulk \
  -F 'emails=[
    {
      "to": "user1@example.com",
      "subject": "Your Invoice",
      "html": "<h1>Invoice attached</h1>",
      "attachments": [{"filename": "invoice_john.pdf"}]
    },
    {
      "to": "user2@example.com",
      "subject": "Your Receipt",
      "html": "<h1>Receipt attached</h1>",
      "attachments": [{"filename": "receipt_doe.png"}]
    }
  ]' \
  -F "attachments=@/path/to/invoice_john.pdf" \
  -F "attachments=@/path/to/receipt_doe.png"
```

## 💻 Frontend Integration (JavaScript Fetch)

### **Single Email with Multiple Recipients**

```javascript
const formData = new FormData();
// Multiple recipients can be added like this:
formData.append("to", "first@example.com, second@example.com");
// OR by appending multiple times (multipart behavior):
// formData.append('to', 'first@example.com');
// formData.append('to', 'second@example.com');

formData.append("subject", "Hello Everyone");
formData.append("html", "<h1>Welcome</h1>");
```

---

## 📡 Terminal Test (cURL)

**Multi-recipient test:**

```bash
curl -X POST https://eventai-seven.vercel.app/api/v1/send-email \
  -F "to=user1@gmail.com,user2@gmail.com" \
  -F "subject=Bulk Test" \
  -F "html=<h1>Hello</h1>"
```

**Bulk JSON test:**

```bash
curl -X POST https://eventai-seven.vercel.app/api/v1/send-bulk \
  -H "Content-Type: application/json" \
  -d '{
    "emails": [
      { "to": "user1@example.com", "subject": "Test 1", "html": "body 1" },
      { "to": "user2@example.com", "subject": "Test 2", "html": "body 2" }
    ]
  }'
```

---

## 📦 Response Formats

### **Success (200 OK) - Single Email**

```json
{
  "status": "success",
  "message": "Email sent successfully",
  "data": { ... nodemailer info ... }
}
```

### **Success (200 OK) - Bulk Sending**

```json
{
  "status": "success",
  "message": "Bulk processing completed",
  "results": [
    { "status": "success", "to": "...", "messageId": "..." },
    { "status": "error", "to": "...", "error": "..." }
  ]
}
```

### **Validation Error (400 Bad Request)**

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": { ... field details ... }
}
```

### **Rate Limit Error (429 Too Many Requests)**

```json
{
  "status": "error",
  "message": "Too many requests, please try again after a minute."
}
```
