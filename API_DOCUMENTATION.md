# eventai - API Documentation for Frontend Users

This document provides the necessary details to integrate with the Email Sending API.

## 🚀 Endpoint Overview

- **Base URL**: `http://localhost:3000` (Update for production)
- **Endpoint**: `/api/v1/send-email`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`

---

## 🛠 Request Fields

Since the API supports physical file uploads, you must use `FormData` in the frontend (multipart/form-data).

| Field         | Type     | Required | Description                                               |
| :------------ | :------- | :------- | :-------------------------------------------------------- |
| `to`          | `string` | Yes      | Recipient email address.                                  |
| `subject`     | `string` | Yes      | Subject line of the email.                                |
| `html`        | `string` | Yes      | HTML content of the email body.                           |
| `attachments` | `File`   | No       | One or more files (PDF, PNG, JPG). Up to 5 files allowed. |

---

## 💻 Frontend Integration (JavaScript Fetch)

```javascript
const sendEmail = async (formData) => {
  // formData should be an instance of FormData
  // const formData = new FormData();
  // formData.append('to', 'recipient@example.com');
  // formData.append('subject', 'Hello!');
  // formData.append('html', '<h1>Welcome</h1>');
  // formData.append('attachments', fileInput.files[0]); // Physical file

  try {
    const response = await fetch("http://localhost:3000/api/v1/send-email", {
      method: "POST",
      // Note: Do NOT manually set 'Content-Type' header.
      // The browser will set it automatically with the boundary for FormData.
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      console.log("Success:", result.message);
    } else {
      console.error("Error:", result.message, result.errors);
    }
  } catch (error) {
    console.error("Network Error:", error);
  }
};
```

---

## 📡 Terminal Test (cURL)

**Note**: Use the `-F` flag to send multipart data.

```bash
curl -X POST http://localhost:3000/api/v1/send-email \
  -F "to=recipient@example.com" \
  -F "subject=API Documentation Test" \
  -F "html=<h1>It Works!</h1><p>Sent via multipart form data.</p>" \
  -F "attachments=@/path/to/your/file.pdf"
```

---

## 📦 Response Formats

### **Success (200 OK)**

```json
{
  "status": "success",
  "message": "Email sent successfully",
  "data": { ... nodemailer info ... }
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
