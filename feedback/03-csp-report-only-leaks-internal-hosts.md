# CSP report-only header on app.testnet responses discloses internal dev/staging hosts
Severity: normal
Area: app

## Steps to reproduce
1. `curl -i -X POST 'https://app.testnet.dreamdex.io/api/sponsor/warm' -H 'Content-Type: application/json' -d '{}'`
2. Read `Content-Security-Policy-Report-Only` in the response.

## Expected
No reporting directive (or external reporting endpoint only); internal infrastructure hostnames must not be disclosed to every client.

## Actual
The report-only policy lists internal hosts: `https://dev.smk.somnia.host`, `https://hideki-dev.smk.somnia.host`, `https://smk-dev-markets-explorer-hideki-euw4-uzavbo36ra-ez.a.run.app`, `https://api.hideki2.infra.testnet.somnia.network`, `https://price-feed.dev.oracle.somnia.host`, `wss://dream-rpc.somnia.network`. Any client that triggers a CSP violation obtains the internal dev/staging topology.

## Evidence
Full response headers: evidence/reval-20261019/probe_summary.json -> F10_warm_POST.headers

## Environment
Network: Somnia Tokyo testnet (app.testnet.dreamdex.io, Vercel). SDK: n/a. Wallet: n/a.
Evidence date: 2026-10-19 09:47-09:52 UTC
