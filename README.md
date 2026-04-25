# Ember

Ember is a mobile-first wellness app for reflection, routines, reminders, planning, and small daily wins.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Cloud save with Supabase

Ember can now keep all user-created data in Supabase:

- Coach activities
- Small wins
- Journal entries
- Plan items
- Researches and Links
- Profile details

### 1. Create a Supabase project

Create a project in Supabase, then copy:

- Project URL
- Anon public key

### 2. Add environment variables

Create a local `.env.local` file from [.env.example](/Users/sarahgoossen/ember/.env.example):

```bash
cp .env.example .env.local
```

Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:you@example.com
CRON_SECRET=long-random-secret
```

### 3. Create the cloud table

In the Supabase SQL editor, run:

- [supabase/ember_app_state.sql](/Users/sarahgoossen/ember/supabase/ember_app_state.sql)
- [supabase/ember_push.sql](/Users/sarahgoossen/ember/supabase/ember_push.sql)

This creates one secure per-user JSON record and enables row-level security so users can only access their own Ember data.

### 4. Enable email sign-in

In Supabase Auth:

- enable Email provider
- enable magic link / passwordless email flow

### 5. Restart Ember

```bash
npm run dev
```

Then open `Profile` in Ember and use `Email me a sign-in link`.

## Push notifications

Ember now supports server-sent push reminders for signed-in users.

### 1. Generate VAPID keys

Run:

```bash
npx web-push generate-vapid-keys
```

Copy the public key to `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and the private key to `VAPID_PRIVATE_KEY`.

### 2. Add cron auth

Set `CRON_SECRET` in your deployment platform. The scheduled push route expects:

```text
Authorization: Bearer <CRON_SECRET>
```

### 3. Schedule the sender

This repo includes [vercel.json](/Users/sarahgoossen/ember/vercel.json) to call `/api/push/send-due` once per day on Vercel Hobby. If you deploy elsewhere, point any scheduler at that route and include the bearer token above.

### 4. Turn push on per device

Each phone, tablet, or laptop browser must:

- sign into the same Ember cloud account
- allow notifications
- enable push in `Profile`

### 5. iPhone and iPad note

For iOS/iPadOS web push, users typically need to add Ember to the Home Screen first, then enable push from the installed web app.

## Notes

- Without Supabase configured, Ember still works locally on the device.
- With Supabase connected, Ember keeps the local copy and also syncs to the cloud after sign-in.
- Pushing new code does not normally erase user data saved in Supabase.
