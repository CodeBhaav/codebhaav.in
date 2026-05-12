# E2E tests

Playwright suite under `tests/e2e/`. Two flavors:

| Spec | What it does | Auth required? |
| --- | --- | --- |
| `01-home.spec.ts` … `08-mobile-menu.spec.ts` | Functional smoke tests against anonymous routes | No |
| `09-runtime-errors.spec.ts` | Visits every public + dynamic + protected route, fails on uncaught exceptions, fatal console patterns, or visible `ErrorBoundary` state | No |
| `10-signed-in-runtime-errors.spec.ts` | Same budget but on **signed-in** routes  catches bugs that only manifest after authentication | **Yes** (skips silently if creds not set) |

## Scripts

```bash
pnpm e2e          # everything (signed-in specs skip if creds missing)
pnpm e2e:smoke    # just 09  fast pre-deploy gut check
pnpm e2e:auth     # 09 + 10  full runtime-error budget incl. signed-in
pnpm predeploy    # build + e2e:auth  recommended before every push
pnpm e2e:report   # open the last HTML report
```

## Enabling the signed-in spec

You need a Clerk **development** instance (never production) and a test
user with a known password.

1. In your Clerk dashboard (dev instance), create a user, e.g.
   `e2e-test@codebhaav.in`. Set a strong password and remember it.
2. Add the following to `.env.local`:

   ```bash
   # already present in the project  used by clerkSetup at suite start
   PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...

   # NEW  used by tests/e2e/10-signed-in-runtime-errors.spec.ts
   E2E_CLERK_USER_USERNAME=e2e-test@codebhaav.in
   E2E_CLERK_USER_PASSWORD=<the password you set>
   ```

3. Run `pnpm e2e:auth`. The signed-in spec will sign the user in via
   Clerk's password strategy, navigate to each protected/authenticated
   route, and assert the runtime-error budget.

Missing any of the three vars → the spec skips itself with a clear
message in the report. Default `pnpm e2e` stays green for contributors
who haven't configured the test user.

**Never** point this at a production Clerk instance. `clerkSetup` already
refuses production secret keys, but adding `_test` to the user's email is
a useful belt-and-suspenders guardrail.

## How auth works in the spec

- `tests/e2e/global-setup.ts` calls `clerkSetup` once per suite to fetch
  a testing token that bypasses Clerk's bot detection.
- `tests/e2e/helpers/clerk-auth.ts` exposes `signInAndGoto(page, path, creds)`
  which calls `setupClerkTestingToken({ page })` → `page.goto("/")` →
  `clerk.signIn({ ... password strategy })` → `page.goto(target)`.
- `tests/e2e/helpers/load-env.ts` parses `.env.local` into `process.env`
  because Playwright's globalSetup runs outside Astro's auto-load path.
  Explicit env vars (CI secrets) always win over file values.

## Adding a new signed-in route to the budget

Open `tests/e2e/10-signed-in-runtime-errors.spec.ts` and append to
`SIGNED_IN_ROUTES`:

```ts
{ path: "/dashboard/some-new-page", label: "new page (signed-in)" },
```

Each entry runs the full runtime-error capture (pageerror + console
fatal patterns + ErrorBoundary visibility) against that route.
