# FDC Tax – Luna Onboarding (SANDBOX)

This is a **sandbox environment** for the new client onboarding flow that will eventually power MyFDC's new-educator setup.

## 🎨 Design System

- **Primary Color (Teal):** #15ADC2
- **Secondary Color (Indigo):** #6366F1
- **Font:** Inter (Google Fonts)
- **Framework:** Next.js with Tailwind CSS
- **Components:** shadcn/ui

## 🗄️ Database

- **Type:** PostgreSQL
- **Status:** Awaiting connection string
- **Connection:** Configure `DATABASE_URL` in `.env`

## 🔐 Integrations

### Annature (Sandbox)

Environment variables ready:
- `ANNATURE_API_KEY`
- `ANNATURE_API_SECRET`
- `ANNATURE_ENVIRONMENT=sandbox`

## 🚀 Getting Started

1. Add PostgreSQL connection string to `.env`:
   ```
   DATABASE_URL=your_postgresql_connection_string
   ```

2. Add Annature sandbox keys to `.env`:
   ```
   ANNATURE_API_KEY=your_api_key
   ANNATURE_API_SECRET=your_api_secret
   ```

3. Install dependencies (if needed):
   ```bash
   yarn install
   ```

4. Restart the application:
   ```bash
   sudo supervisorctl restart nextjs
   ```

## 📋 Features

- ✅ Permanent "SANDBOX" banner on all pages
- ✅ Clean, professional landing page
- ✅ MyFDC design system styling
- ✅ PostgreSQL-ready architecture
- ✅ Annature integration placeholders
- ⏳ Magic-link authentication (coming soon)
- ⏳ Luna first-run interview flow (coming soon)
- ⏳ Start-up email flow (coming soon)

## 🏗️ Project Structure

```
/app
├── app/
│   ├── api/[[...path]]/route.js  # API endpoints
│   ├── page.js                    # Landing page
│   ├── layout.js                  # Root layout with SANDBOX banner
│   └── globals.css                # Global styles
├── components/                     # Reusable components
├── lib/                           # Utility functions
├── .env                           # Environment variables
└── README.md                      # This file
```

## 🎯 Next Steps

1. Provide PostgreSQL connection string
2. Add Annature sandbox keys
3. Begin Luna onboarding flow development
4. Implement magic-link authentication
5. Build interview and email workflows

## ⚠️ Important Notes

- This is a **SANDBOX** environment - no production data
- Completely separate from current MyFDC project
- Fresh database with no existing data
- All integrations use sandbox/test credentials

---

**Status:** Ready for development 🚀
**Environment:** Sandbox 🧪
**Framework:** Next.js 14+ with App Router