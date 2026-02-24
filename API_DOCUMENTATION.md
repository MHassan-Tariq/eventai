# eventai - API Documentation for Frontend Users

This document provides the necessary details to integrate with the Email Sending API.

## 🚀 Endpoint Overview

- **Base URL**: `https://eventai-seven.vercel.app`
- **Endpoint**: `/api/v1/single-email`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`

---

## 🛠 Request Fields

Since the API supports physical file uploads, you must use `FormData` in the frontend (multipart/form-data).

| `attachments` | `File` / `JSON` | No | One or more files (PDF, PNG, JPG). Up to 5 files allowed. If using JSON, you can provide `filename` and `path` (URL) or `content` (URL/Base64). Physical files remain as real attachments, while URLs are automatically converted to links in the email body. |

> [!TIP]
> **URL Attachments**: If you provide a URL in the `path` or `content` field of an attachment, the API will automatically list it as a clickable link at the bottom of the email instead of sending it as a physical attachment. This saves bandwidth and ensures the recipient doesn't have to download large files to view them.

---

## 📦 Bulk Sending (New Endpoint)

- **Endpoint**: `/api/v1/send-email`
- **Method**: `POST`
- **Content-Type**: `application/json`

This endpoint allows sending different emails to different people in one request.

### **1. Simple Broadcast (One Content to All)**

This is the easiest way to send the same message and same file to many people.

**Request Body:**

```json
{
  "emails": ["user1@gmail.com", "user2@gmail.com"],
  "subject": "New Announcement",
  "html": "<h1>Important Update</h1><p>Please find the flyer attached.</p>"
}
```

### **2. Individualized Content**

If you want different content for each person, provide them inside the `emails` array. Global `subject` or `html` can still act as defaults if missing in the objects.

```json
{
  "emails": [
    {
      "to": "user1@example.com",
      "subject": "Personalized Offer",
      "html": "<h1>Hi User 1</h1>"
    },
    {
      "to": "user2@example.com",
      "subject": "Greetings",
      "html": "<h1>Welcome</h1>"
    }
  ]
}
```

---

### **Bulk Physical & URL Attachments (One to All)**

Global attachments can be provided either as physical files (`attachments` field) or as a JSON string in the `attachments` field of a `multipart/form-data` request. Both will be attached to **every** email in the batch.

**Simple Broadcast cURL (One File to All):**

```bash
curl -X POST http://localhost:3000/api/v1/send-email \
  -F 'emails=["user1@gmail.com", "user2@gmail.com"]' \
  -F "subject=New Announcement" \
  -F "html=<h1>Hello</h1><p>Flyer attached.</p>" \
  -F "attachments=@/path/to/flyer.pdf"
```

**Advanced Bulk cURL (Mixed Content):**

```bash
curl -X POST http://localhost:3000/api/v1/send-email \
  -F 'emails=[
    { "to": "user1@gmail.com" },
    { "to": "user2@gmail.com", "subject": "Unique Subject for User 2" }
  ]' \
  -F "subject=Default Global Subject" \
  -F "html=<h1>Global Body</h1>" \
  -F "attachments=@/path/to/flyer.pdf"
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

### **Bulk Sending with Physical Files**

```javascript
const formData = new FormData();
// Simple Broadcast:
formData.append(
  "emails",
  JSON.stringify(["user1@example.com", "user2@example.com"]),
);
formData.append("subject", "Global Update");
formData.append("html", "<h1>Hello All</h1>");
formData.append("attachments", fileInput.files[0]); // Goes to everyone

fetch("/api/v1/send-email", { method: "POST", body: formData });
```

---

**Single Email (one content) test:**

```bash
curl -X POST https://eventai-seven.vercel.app/api/v1/single-email \
  -F "to=user1@gmail.com,user2@gmail.com" \
  -F "subject=Single Test" \
  -F "html=<h1>Hello</h1>"
```

**Bulk JSON test:**

```bash
curl -X POST https://eventai-seven.vercel.app/api/v1/send-email \
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
