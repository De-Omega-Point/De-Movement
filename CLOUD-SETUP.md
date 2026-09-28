# De-Movement Cloud Setup · Phase 7

De-Movement remains local-first. The cloud layer adds cross-device sync and Coach / Administrator workflows.

## Architecture

Roles:

- `mover` — owns movement data, trains, receives Coach assignments
- `coach` — sees only assigned Movers, creates assignments and private Coach notes
- `administrator` — governs roles, account status and Coach↔Mover relationships

## 1. Create or connect a Supabase project

Do not place a service-role key in this repository or in browser JavaScript.

Browser configuration needs only:

- Supabase project URL
- public anon / publishable key

## 2. Apply the schema

Run:

`supabase-schema.sql`

The schema creates:

- profiles
- training profiles
- Movement Passport state
- readiness check-ins
- training logs
- saved flows
- Coach↔Mover relationships
- private Coach notes
- Coach assignments
- Coach invitations
- Administrator audit log
- RLS policies
- server-checked role / invite / transfer RPCs

## 3. Bootstrap the first Administrator

After signing in once so the auth trigger creates the profile, use the Supabase SQL editor or connected Supabase tooling for the one-time bootstrap:

```sql
update public.profiles
set role='administrator'
where lower(email)=lower('YOUR_ADMIN_EMAIL');
```

After that, role changes should happen through the Administrator Console / checked RPC rather than direct browser table writes.

## 4. Configure browser public values

Copy `config.example.js` to the values used by `config.js`:

```js
window.DEMOVEMENT_CONFIG={
  supabaseUrl:'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey:'YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY'
};
```

Never place a service-role key here.

## 5. Configure authentication redirects

For the current GitHub Pages deployment, allow at least:

- `https://de-omega-point.github.io/De-Movement/account.html`
- `https://de-omega-point.github.io/De-Movement/invite.html`
- `https://de-omega-point.github.io/De-Movement/`

If a custom domain replaces GitHub Pages, add the equivalent custom-domain URLs before launch.

## 6. Three-account acceptance test

Create three real test accounts:

1. Mover
2. Coach
3. Administrator

Verify:

- Mover cannot open Coach data through API calls
- Mover cannot change their own role or account status
- Mover can update only assignment status, not rewrite assignment payload
- Coach can read only assigned Mover evidence
- Coach cannot delete or overwrite a Mover's saved Flow
- Coach private notes are not visible to the Mover
- Coach can create an invite and assignment only for an active relationship
- Administrator can change roles and account status through RPCs
- Administrator can transfer a Mover between active Coaches
- suspended accounts cannot read or write cloud training data
- revoked/expired/incorrect-email invitations fail safely

## 7. Current cloud-sync behaviour

When signed in as an active Mover:

- training profile syncs
- Passport syncs
- latest readiness syncs
- training / Flow completion logs sync
- current Flow builder syncs
- Coach assignments appear in the Today view

Local data remains the immediate working copy. Cloud sync is additive rather than a login wall.

## Not yet included

Phase 7 deliberately does not include:

- billing
- public launch monitoring
- formal data-retention automation
- account-deletion Edge Function
- AI Coach decision-making
- production incident response

Those belong to later market-readiness work.
