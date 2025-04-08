[18:32:23.672] Cloning github.com/matthewboylenow/sh-comms-portal (Branch: main, Commit: 9999d14)
[18:32:23.994] Cloning completed: 322.000ms
[18:32:25.775] Restored build cache from previous deployment (14j9XCNS4bsGDe8R117uPpEdxMXt)
[18:32:25.887] Running build in Washington, D.C., USA (East) – iad1
[18:32:26.503] Running "vercel build"
[18:32:27.018] Vercel CLI 41.4.1
[18:32:27.407] Installing dependencies...
[18:32:29.157] 
[18:32:29.157] added 3 packages in 1s
[18:32:29.157] 
[18:32:29.157] 45 packages are looking for funding
[18:32:29.157]   run `npm fund` for details
[18:32:29.198] Detected Next.js version: 14.0.0
[18:32:29.203] Running "npm run build"
[18:32:29.337] 
[18:32:29.337] > sainthelen-portal@1.2.0 build
[18:32:29.337] > next build
[18:32:29.338] 
[18:32:30.333]    ▲ Next.js 14.0.0
[18:32:30.333] 
[18:32:30.333]    Creating an optimized production build ...
[18:32:42.019]  ✓ Compiled successfully
[18:32:42.026]    Linting and checking validity of types ...
[18:32:49.560] Failed to compile.
[18:32:49.560] 
[18:32:49.561] ./app/admin/AdminClient.tsx:759:106
[18:32:49.561] Type error: Cannot find name 'MegaphoneIcon'.
[18:32:49.561] 
[18:32:49.561] [0m [90m 757 |[39m           [33m<[39m[33mnav[39m className[33m=[39m[32m"flex space-x-2 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-md"[39m[33m>[39m[0m
[18:32:49.561] [0m [90m 758 |[39m             {[[0m
[18:32:49.561] [0m[31m[1m>[22m[39m[90m 759 |[39m               { id[33m:[39m [32m'announcements'[39m[33m,[39m label[33m:[39m [32m'Announcements'[39m[33m,[39m count[33m:[39m filteredAnnouncements[33m.[39mlength[33m,[39m icon[33m:[39m [33m<[39m[33mMegaphoneIcon[39m className[33m=[39m[32m"h-4 w-4"[39m [33m/[39m[33m>[39m }[33m,[39m[0m
[18:32:49.561] [0m [90m     |[39m                                                                                                          [31m[1m^[22m[39m[0m
[18:32:49.561] [0m [90m 760 |[39m               { id[33m:[39m [32m'websiteUpdates'[39m[33m,[39m label[33m:[39m [32m'Website Updates'[39m[33m,[39m count[33m:[39m filteredWebsiteUpdates[33m.[39mlength[33m,[39m icon[33m:[39m [33m<[39m[33mGlobeAltIcon[39m className[33m=[39m[32m"h-4 w-4"[39m [33m/[39m[33m>[39m }[33m,[39m[0m
[18:32:49.561] [0m [90m 761 |[39m               { id[33m:[39m [32m'smsRequests'[39m[33m,[39m label[33m:[39m [32m'SMS Requests'[39m[33m,[39m count[33m:[39m filteredSmsRequests[33m.[39mlength[33m,[39m icon[33m:[39m [33m<[39m[33mChatBubbleLeftRightIcon[39m className[33m=[39m[32m"h-4 w-4"[39m [33m/[39m[33m>[39m }[33m,[39m[0m
[18:32:49.562] [0m [90m 762 |[39m               { id[33m:[39m [32m'avRequests'[39m[33m,[39m label[33m:[39m [32m'A/V Requests'[39m[33m,[39m count[33m:[39m filteredAvRequests[33m.[39mlength[33m,[39m icon[33m:[39m [33m<[39m[33mVideoCameraIcon[39m className[33m=[39m[32m"h-4 w-4"[39m [33m/[39m[33m>[39m }[33m,[39m[0m
[18:32:49.639] Error: Command "npm run build" exited with 1
[18:32:50.055] 