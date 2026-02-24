# Email Sending API

A production-ready REST API endpoint for sending emails securely, now supporting physical file uploads (PDF, PNG, JPG).

## Features

- **Nodemailer (SMTP)**: Configured for Gmail/SMTP delivery.
- **Multipart/Form-Data**: Support for physical file uploads via `multer`.
- **Zod Validation**: Robust payload verification.
- **Security**: CORS, Helmet (security headers), and Rate Limiting.
- **Clean Architecture**: Modular Controller/Service/Validator design.

## Quick Start

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Configure Environment**:
   - Create a `.env` file based on `.env.example`.
   - Use a Gmail **App Password** for `EMAIL_PASS`.

3. **Run**:
   - `npm run dev` (Development)
   - `npm start` (Production)

## API Documentation

For full details on endpoint integration, fields, and example code, please refer to:
👉 **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**

## GitHub Workflow

This project is hosted at [eventai](https://github.com/MHassan-Tariq/eventai.git).

---

# eventai
