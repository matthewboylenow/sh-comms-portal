[19:04:33.569] Cloning github.com/matthewboylenow/sh-comms-portal (Branch: main, Commit: 8cecf90)
[19:04:33.832] Cloning completed: 263.000ms
[19:04:36.254] Restored build cache from previous deployment (5AwcaYGjmVESBosEQXvShXPEzNNy)
[19:04:36.344] Running build in Washington, D.C., USA (East) – iad1
[19:04:36.849] Running "vercel build"
[19:04:37.250] Vercel CLI 41.4.1
[19:04:37.564] Installing dependencies...
[19:04:38.654] 
[19:04:38.654] up to date in 876ms
[19:04:38.655] 
[19:04:38.655] 45 packages are looking for funding
[19:04:38.655]   run `npm fund` for details
[19:04:38.690] Detected Next.js version: 14.0.0
[19:04:38.694] Running "npm run build"
[19:04:38.818] 
[19:04:38.819] > sainthelen-portal@1.2.0 build
[19:04:38.819] > next build
[19:04:38.819] 
[19:04:39.566]    ▲ Next.js 14.0.0
[19:04:39.567] 
[19:04:39.567]    Creating an optimized production build ...
[19:04:49.525]  ⚠ Compiled with warnings
[19:04:49.525] 
[19:04:49.526] ./app/api/notifications/mark-all-read/route.ts
[19:04:49.526] Attempted import error: 'authOptions' is not exported from '../../auth/[...nextauth]/route' (imported as 'authOptions').
[19:04:49.526] 
[19:04:49.526] Import trace for requested module:
[19:04:49.526] ./app/api/notifications/mark-all-read/route.ts
[19:04:49.526] 
[19:04:49.526] ./app/api/notifications/mark-read/route.ts
[19:04:49.526] Attempted import error: 'authOptions' is not exported from '../../auth/[...nextauth]/route' (imported as 'authOptions').
[19:04:49.526] 
[19:04:49.526] Import trace for requested module:
[19:04:49.526] ./app/api/notifications/mark-read/route.ts
[19:04:49.526] 
[19:04:49.526] ./app/api/notifications/route.ts
[19:04:49.526] Attempted import error: 'authOptions' is not exported from '../auth/[...nextauth]/route' (imported as 'authOptions').
[19:04:49.526] 
[19:04:49.526] Import trace for requested module:
[19:04:49.526] ./app/api/notifications/route.ts
[19:04:49.526] 
[19:04:49.527]    Linting and checking validity of types ...
[19:04:55.693] Failed to compile.
[19:04:55.693] 
[19:04:55.693] ./app/api/notifications/mark-all-read/route.ts:5:10
[19:04:55.693] Type error: Module '"../../auth/[...nextauth]/route"' has no exported member 'authOptions'.
[19:04:55.693] 
[19:04:55.693] [0m [90m 3 |[39m [36mimport[39m { [33mNextRequest[39m[33m,[39m [33mNextResponse[39m } [36mfrom[39m [32m'next/server'[39m[33m;[39m[0m
[19:04:55.693] [0m [90m 4 |[39m [36mimport[39m { getServerSession } [36mfrom[39m [32m'next-auth/next'[39m[33m;[39m[0m
[19:04:55.694] [0m[31m[1m>[22m[39m[90m 5 |[39m [36mimport[39m { authOptions } [36mfrom[39m [32m'../../auth/[...nextauth]/route'[39m[33m;[39m[0m
[19:04:55.694] [0m [90m   |[39m          [31m[1m^[22m[39m[0m
[19:04:55.694] [0m [90m 6 |[39m [36mimport[39m [33mAirtable[39m [36mfrom[39m [32m'airtable'[39m[33m;[39m[0m
[19:04:55.694] [0m [90m 7 |[39m[0m
[19:04:55.694] [0m [90m 8 |[39m [36mexport[39m [36mconst[39m dynamic [33m=[39m [32m'force-dynamic'[39m[33m;[39m [90m// ensures no static generation[39m[0m
[19:04:55.779] Error: Command "npm run build" exited with 1
[19:04:56.187] 