# dreamDEX Perps Builder Bounty — Feedback Track Submission

Reproducible feedback items found against the dreamDEX Perps testnet surface during the Perps Builder Bounty window (19 Oct - 1 Nov 2026 UTC).

- Target: `https://api.testnet.dreamdex.io` and the testnet app/docs/WS surface
- Network: Somnia Tokyo testnet (chainId 50312)
- Evidence date: 19 October 2026 (each file carries its own exact timestamp)
- Every item below was reproduced against the live testnet at least twice before being filed, with raw request/response captures kept alongside the write-up

One file per issue, in `feedback/`. Each file follows the bounty template: Short title, Severity, Area, Steps to reproduce, Expected, Actual, Evidence, Environment.

## Index

| File | Severity | Area | Short title |
|------|----------|------|-------------|
| `feedback/02-cdn-bucket-listing.md` | normal | app | cdn.dreamdex.io returns full bucket listing (ListBucketResult) |
| `feedback/03-csp-report-only-leaks-internal-hosts.md` | normal | app | CSP report-only header names internal dev hosts |
| `feedback/04-unauthenticated-metrics-endpoint.md` | normal | API | `GET /metrics` open: internal route table + traffic stats |
| `feedback/05-sponsor-warm-unauthenticated-no-ratelimit.md` | normal | API | `POST /api/sponsor/warm` unauthenticated, no rate limit |
| `feedback/06-ws-subscribe-channels-all-fail.md` | major | API | Every documented WS subscribe channel ends in `subscription_failed` |
| `feedback/07-rest-over-ws-bearer-ignored.md` | major | API | REST-over-WS `params.bearerToken` ignored - authenticated ops 401 |
| `feedback/08-subscribed-then-error-double-response.md` | normal | API | Server replies `subscribed` then `subscription_failed` for one frame |
| `feedback/09-docs-unknown-symbol-400-not-silently-skipped.md` | normal | docs | Docs promise silent skip for unknown symbols, API returns 400 |
| `feedback/10-docs-comma-symbols-returns-data-not-empty.md` | normal | docs | Docs show comma symbols -> `[]`, API actually parses both |
| `feedback/11-ws-missing-param-returns-bad-request-envelope-not-invalid-parameters.md` | normal | API | WS missing param returns REST 404 `bad_request`, not `invalid_parameters` |
| `feedback/12-docs-invalid-interval-error-name-never-returned.md` | normal | docs | Error table documents `invalid_interval`, API returns `invalid_param` |
| `feedback/13-perps-dev-page-points-to-chain-50383-while-api-runs-50312.md` | major | docs | Perps dev page = chain 50383, API = chain 50312, disjoint on-chain code |
| `feedback/14-docs-21-perp-markets-perp-naming-vs-api-24-usdso-naming.md` | normal | docs | Docs list 21 `*-PERP` markets, API serves 24 `BASE:USDso`, names 404 |
| `feedback/15-docs-testnet-base-url-points-to-stg-not-api-testnet.md` | normal | docs | Docs testnet base URL points at stg host; api.testnet undocumented |
| `feedback/16-nul-byte-path-returns-400-empty-violating-json-error-contract.md` | normal | API | NUL byte in path -> 400 with empty body, no JSON error contract |
| `feedback/17-login-non-json-content-type-500-leaks-v8-error.md` | normal | API | Login with non-JSON Content-Type -> 500 leaking a V8 exception |
| `feedback/18-nonexistent-order-prepare-returns-calldata.md` | normal | API | Cancel/reduce prepares return calldata for nonexistent order ids |
| `feedback/19-leverage-above-doc-max-accepted.md` | normal | API | Leverage above documented per-market maximum accepted, amount minimum enforced |
| `feedback/20-pools-without-stop-order-registry.md` | normal | contracts | 9 of 24 pools have no stop-order registry while docs advertise TP/SL |
| `feedback/21-pools-outside-insurance-tier-ladder.md` | normal | contracts | Three pools outside the insurance-fund tier while docs present that stage |
| `feedback/22-voucher-closed-while-docs-promise-claim.md` | normal | contracts | Voucher campaign over, budget 0, claim() reverts while docs promise a claimable credit |
| `feedback/23-single-owner-eoa-controls-perps-stack.md` | normal | contracts | One EOA owns every core perps contract and the shared pool beacon |
| `feedback/24-perps-contracts-source-unverified.md` | normal | contracts | No perps contract has published source on the explorer |
| `feedback/25-docs-markets-that-do-not-exist.md` | normal | docs | Six documented perps markets do not exist in any registry |

## Reproducing

Every file is self-contained: follow its numbered steps against the live testnet. WS items need any RFC 6455 client (examples use python `websocket-client`); HTTP items are plain `curl`. No credentials are required for any item in this folder.

Per the program rules, anything security-flavored is handled privately with `security@dreamdex.io` and is intentionally not part of this repository.
