# motu-control

Bridges a MIDI controller (Akai Axiom 61 or APC40 mkII) to a MOTU UltraLite AVB's mixer,
via the MOTU AVB Discovery Service's local HTTP datastore API.

At startup the app scans connected MIDI ports and auto-detects whichever supported
controller is plugged in (`controllers/`). No manual configuration needed - just
connect one of the supported controllers before starting.

## Development

Requires the MOTU AVB Discovery Service running locally (default `http://127.0.0.1:1280`).

```sh
npm install
npm start   # runs main.ts directly via ts-node
```

To develop without real MOTU hardware, run the mock datastore server (`testServer.js`,
serves `motu.json` on port 6000) and point `motu-client.ts`'s `origin` option at
`http://127.0.0.1:6000`.

## Running automatically at login (macOS)

```sh
npm run build                       # compile to dist/, or let the installer do it
./scripts/install-launchagent.sh    # builds, installs, and starts the LaunchAgent
```

This installs a `launchd` LaunchAgent (`~/Library/LaunchAgents/com.plarso.motu-control.plist`)
that runs the compiled `dist/main.js` at login and restarts it if it crashes. The app
retries with backoff if the MOTU service or controller isn't ready yet, so it's safe to
start before either is available.

- Logs: `~/Library/Logs/motu-control/motu-control.{out,err}.log`
- Status: `launchctl print gui/$(id -u)/com.plarso.motu-control`
- Restart (e.g. after pulling new code + rebuilding): `launchctl kickstart -k gui/$(id -u)/com.plarso.motu-control`
- Remove: `./scripts/uninstall-launchagent.sh`

Re-run `install-launchagent.sh` any time to rebuild and reinstall after code changes.
