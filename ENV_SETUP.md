# Environment Variables Setup - Student Portal Frontend

## 📋 Required Environment Variables

Create a `.env` file in the root directory (`Student_Portal_Frontend-main/.env`) with the following variables:

```env
# Student Service Backend API URL
# Development: http://localhost:3006/api
# Production: https://studentservice.iypan.com/api
VITE_API_URL=https://studentservice.iypan.com/api

# Chat Service API URL
# Development: http://localhost:3030
# Production: https://chatservice.iypan.com (or your chat service URL)
VITE_CHAT_API_URL=https://chatservice.iypan.com
```

## 🔧 Setup Instructions

1. **Create `.env` file:**
   ```bash
   cd Student_Portal_Frontend-main
   touch .env
   ```

2. **Add the environment variables** (copy from above)

3. **For Development:**
   ```env
   VITE_API_URL=http://localhost:3006/api
   VITE_CHAT_API_URL=http://localhost:3030
   ```

4. **For Production:**
   ```env
   VITE_API_URL=https://studentservice.iypan.com/api
   VITE_CHAT_API_URL=https://chatservice.iypan.com
   ```

5. **Restart the development server** after creating/updating `.env`:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

## ⚠️ Important Notes

- **Vite requires `VITE_` prefix** for environment variables to be exposed to the frontend
- **Never commit `.env` file** to version control (it should be in `.gitignore`)
- **Restart dev server** after changing environment variables
- The `api.ts` file uses these variables with fallback to localhost for development

## 📍 Current Configuration in `api.ts`

```typescript
// Line 21
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3006/api";

// Line 723
const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || "http://localhost:3030";
```

## ✅ Verification

After setting up, verify the environment variables are loaded:
1. Check browser console for API calls
2. API calls should go to the URL specified in `VITE_API_URL`
3. Chat API calls should go to the URL specified in `VITE_CHAT_API_URL`



