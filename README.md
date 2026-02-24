Here is the updated and comprehensive `README.md` reflecting your recent architectural shifts, the new SaaS "Free Trial" model, and the specific rules for managing the Demo and Production environments.

# MerchantPro: M-Pesa QR & Digital Menu Dashboard

An end-to-end FinTech SaaS solution designed for the Kenyan market that bridges the gap between physical QR codes, digital menus, and M-Pesa STK Push technology. This application allows merchants to generate dynamic QR codes and digital catalogs that customers can scan to trigger instant, secure M-Pesa payment prompts on their mobile devices.

## 🚀 Application Overview

* **Frictionless QR Payments**: Customers scan a merchant's QR code via the application, which automatically extracts merchant details and triggers a Safaricom STK Push.
* **Digital Menu Add-on**: A public-facing digital catalog where customers can view items, confirm orders, and pay instantly via M-Pesa.
* **SaaS "Reverse Trial" Model**: A frictionless 10-Day Unrestricted Free Trial granting full "Pro" access, designed to maximize conversions before requiring payment.
* **Live Merchant Analytics**: A comprehensive, real-time dashboard for merchants to track revenue trends, success rates, and transaction volume.
* **HCI-Optimized UI/UX**: Built with a strict, accessibility-first Tailwind design system featuring an OLED-optimized Dark Mode (to prevent eye strain/halation) and color-blind safe status indicators.

---

## 🛠 Technical Stack

* **Frontend**: React.js, React Router, Tailwind CSS (Custom Design System), Recharts, Lucide-React.
* **Backend**: Node.js, Express.js, Axios.
* **Database & Auth**: Firebase Firestore, Firebase Authentication, Firebase Admin SDK.
* **Payment Gateway**: Safaricom Daraja API (M-Pesa Express/STK Push).
* **Tunneling**: Ngrok (for local development and Daraja callbacks).

---

## 🎭 Demo Environment & Simulator

To facilitate sales and beta testing without requiring users to create accounts, the system includes a robust Demo Mode.

### 1. Frictionless Auto-Login

Accessing `/login` automatically provisions and logs the user into a shared demo account (`demo@merchantpro.com`).

* **1-Hour Session Guard**: To prevent abuse, the frontend utilizes a `localStorage` timestamp (`demo_start_time`) paired with a `setInterval` watchdog. The dashboard will automatically lock out the user exactly 60 minutes after their first interaction.

### 2. Live Data Simulator (`demo-simulator.js`)

To make the demo dashboard feel "alive," a backend Node.js script recursively injects fake transactions into Firestore.

* **Beta/VS Code Mode**: The timing engine drips a new transaction every **30 seconds to 2.5 minutes** to conserve Firebase Free Tier write quotas. Run via: `node demo-simulator.js`
* **Production/Live Demo Mode**: For a busier feel during live pitches, the timing engine can be tightened to **2 to 15 seconds**. Run via PM2: `pm2 start demo-simulator.js --name "merchant-demo-sim"`

---

## 🚀 Production Rules & Guidelines

Before deploying MerchantPro to a live production environment, the following strict rules must be implemented:

### 1. Daraja API Callbacks

* **Remove Ngrok**: Ngrok is strictly for local development. In production, `SERVER_URL` must be updated to a secure, SSL-certified domain (e.g., `https://api.merchantpro.co.ke`). Safaricom Daraja will instantly reject callbacks to non-HTTPS or localhost addresses.

### 2. Database Maintenance (Cron Jobs)

* **Demo Data Cleanup**: Because the `demo-simulator.js` continuously writes to Firestore, a server-side cron job must be established to delete documents associated with the Demo UID that are older than 24 hours. Failure to do so will result in Firestore storage bloat and increased billing.

### 3. Security Rules

* **Admin SDK Boundaries**: The backend utilizes the Firebase Admin SDK, which bypasses all Firestore Security Rules. Ensure that every backend API route strictly validates `req.user.uid` via the Firebase JWT token before returning sensitive transaction data.
* **Client-Side Firebase Rules**: Ensure Firestore rules are locked down so authenticated users can only read/write documents where `merchantId == request.auth.uid`.

---

## 📋 Setup Requirements

### 1. Environment Variables (`.env`)

You must configure the following keys in your backend directory to establish connectivity with M-Pesa and Firebase:

```env
# Server Config
PORT=5000
NODE_ENV=development
SERVER_URL=https://your-ngrok-url.ngrok-free.dev
FRONTEND_URL=http://localhost:3000

# M-Pesa Daraja Credentials (Sandbox/Production)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_SHORTCODE=174379
MPESA_BASE_URL=https://sandbox.safaricom.co.ke

# Firebase Config
FIREBASE_PROJECT_ID=your-project-id
# (Service Account Key JSON must be securely referenced in your backend config)

```

### 2. Ngrok Configuration (Local Dev Only)

To receive M-Pesa callbacks locally, run:

```bash
ngrok http 5000

```

**Important**: Update the `SERVER_URL` in your `.env` every time the ngrok URL session restarts. Furthermore, all frontend axios requests to ngrok must include the following header to bypass the abuse interstitial:
`headers: { 'ngrok-skip-browser-warning': 'true' }`

---

## 🔧 Technical Documentation & Architecture Notes

### UI/UX Design System (`tailwind.config.js`)

Do not use standard Tailwind color classes (e.g., `text-red-500` or `bg-zinc-900`) for structural or status elements. The application uses strictly defined semantic variables to ensure WCAG accessibility and OLED preservation:

* **Backgrounds & Surfaces**: `bg-brand-light`, `bg-brand-black`, `bg-brand-surface`
* **Typography**: `text-content-main`, `text-content-muted`
* **Status Indicators**: `text-status-success`, `bg-status-errorBg`

### Phone Number Sanitization

The Safaricom Daraja API strictly requires phone numbers in the `254XXXXXXXXX` format. The frontend UI includes automatic sanitization logic that strips `0` or `+254` prefixes and sanitizes non-numeric characters before submission to the backend.

### Database Indexing

The dashboard relies on complex compound queries (filtering by Period + Status). Ensure the following composite indexes are deployed in your Firebase Console to prevent `Failed precondition` errors:

1. **Collection**: `transactions` | **Fields**: `merchantId` (Asc), `createdAt` (Desc).
2. **Collection**: `transactions` | **Fields**: `merchantId` (Asc), `status` (Asc), `createdAt` (Desc).