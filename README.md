# Family Dashboard API

Backend API for the local Family Dashboard.

## Google Calendar

The API uses a Google Cloud service account instead of interactive Google OAuth.

1. Enable the Google Calendar API in the Google Cloud project.
2. Share each household calendar with the service-account email.
3. Give it **See all event details** permission.
4. Set `GOOGLE_APPLICATION_CREDENTIALS` to the local service-account key path.

Calendars already stored in MongoDB are preserved and validated through the service account. Calendars visible in the service account's calendar list are discovered automatically.

Copy `.env.example` to `.env` and populate the remaining integrations before starting the API.

## Development

```bash
npm install
npm run dev
```

Health check: `http://localhost:3000/health`
