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
```

### 3. Create the cloud table

In the Supabase SQL editor, run:

- [supabase/ember_app_state.sql](/Users/sarahgoossen/ember/supabase/ember_app_state.sql)

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

## Notes

- Without Supabase configured, Ember still works locally on the device.
- With Supabase connected, Ember keeps the local copy and also syncs to the cloud after sign-in.
- Pushing new code does not normally erase user data saved in Supabase.
