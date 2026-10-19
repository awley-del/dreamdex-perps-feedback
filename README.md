# dreamDEX Perps Builder Bounty — reproducible testnet findings

One file per issue in `feedback/` (39 files: 4 major, 35 normal), per the bounty template.

Security-critical items were sent privately to security@dreamdex.io instead of this repository.

| # | File | Severity | Area | Title |
|---|------|----------|------|-------|
| 2 | feedback/02-cdn-bucket-listing.md | normal | app | Public storage bucket listing enabled on cdn.dreamdex.io |
| 3 | feedback/03-csp-report-only-leaks-internal-hosts.md | normal | app | CSP report-only header on app.testnet responses discloses internal dev/staging hosts |
| 4 | feedback/04-unauthenticated-metrics-endpoint.md | normal | API | Unauthenticated /metrics on api.testnet.dreamdex.io exposes internal route table and traffic stats |
| 5 | feedback/05-sponsor-warm-unauthenticated-no-ratelimit.md | normal | API | State-changing POST /api/sponsor/warm accepts unauthenticated calls without rate limiting |
| 6 | feedback/06-ws-subscribe-channels-all-fail.md | major | API | Every documented WebSocket subscribe channel fails with subscription_failed on testnet |
| 7 | feedback/07-rest-over-ws-bearer-ignored.md | major | API | Authenticated REST-over-WebSocket requests never carry the documented bearerToken — 401 for every valid token |
| 8 | feedback/08-subscribed-then-error-double-response.md | normal | API | Subscribe replies subscribed and then subscription_failed for the same frame (contradictory protocol responses) |
| 9 | feedback/09-docs-unknown-symbol-400-not-silently-skipped.md | normal | docs | Market Data docs promise unknown symbols are silently skipped (empty []), live API returns 400 invalid_param |
| 10 | feedback/10-docs-comma-symbols-returns-data-not-empty.md | normal | docs | Market Data docs show comma-separated symbols returning [], live API parses both symbols (200 with data) |
| 11 | feedback/11-ws-missing-param-returns-bad-request-envelope-not-invalid-parameters.md | normal | API | WS operations with missing parameters return a REST-style 404 bad_request envelope instead of the documented invalid_parameters protocol error |
| 12 | feedback/12-docs-invalid-interval-error-name-never-returned.md | normal | docs | Error Handling table documents error name invalid_interval, live API returns invalid_param for the same case |
| 13 | feedback/13-perps-dev-page-points-to-chain-50383-while-api-runs-50312.md | major | docs | Perps developer page documents chain 50383 (Hideki) contract addresses that have no code on the chain the perps API actually runs (50312) |
| 14 | feedback/14-docs-21-perp-markets-perp-naming-vs-api-24-usdso-naming.md | normal | docs | Trader docs list 21 markets as BTC-PERP style names; the testnet API serves 24 perps under BASE:USDso and 404s every documented name |
| 15 | feedback/15-docs-testnet-base-url-points-to-stg-not-api-testnet.md | normal | docs | HTTP API base-URL table sends testnet developers to stg.api.dreamdex.io while the perps testnet host api.testnet.dreamdex.io is undocumented anywhere |
| 16 | feedback/16-nul-byte-path-returns-400-empty-violating-json-error-contract.md | normal | API | NUL byte in the URL path returns 400 with empty body and no Error-Name header, violating the documented JSON error contract |
| 17 | feedback/17-login-non-json-content-type-500-leaks-v8-error.md | normal | API | POST /v0/auth/login with a non-JSON Content-Type returns 500 internal_error and leaks a V8 exception string |
| 18 | feedback/18-nonexistent-order-prepare-returns-calldata.md | normal | API | Cancel/reduce prepares return calldata for nonexistent order ids |
| 19 | feedback/19-leverage-above-doc-max-accepted.md | normal | API | Leverage above documented per-market maximum accepted, amount minimum enforced |
| 20 | feedback/20-pools-without-stop-order-registry.md | normal | contracts | 9 of 24 pools have no stop-order registry while docs advertise TP/SL |
| 21 | feedback/21-pools-outside-insurance-tier-ladder.md | normal | contracts | Three pools outside the insurance-fund tier while docs present that stage |
| 22 | feedback/22-voucher-closed-while-docs-promise-claim.md | normal | contracts | Voucher campaign over, budget 0, claim() reverts while docs promise a claimable credit |
| 23 | feedback/23-single-owner-eoa-controls-perps-stack.md | normal | contracts | One EOA owns every core perps contract and the shared pool beacon |
| 24 | feedback/24-perps-contracts-source-unverified.md | normal | contracts | No perps contract has published source on the explorer |
| 25 | feedback/25-docs-markets-that-do-not-exist.md | normal | docs | Docs table lists six perps markets that do not exist on the testnet |
| 26 | feedback/26-app-default-landing-market-404.md | normal | app | App 307s visitors to STT:USDso; API 404 market_not_found |
| 27 | feedback/27-app-offers-10m-candle-interval-api-rejects.md | normal | app | App offers 10m candles; API/spec enum accepts only 1m|5m|15m|1h|4h|1d |
| 28 | feedback/28-bot-kit-shipped-defaults-target-nonexistent-spot-market.md | normal | SDK | Bot kit default USDC.e:USDso not in live spot registry |
| 29 | feedback/29-ws-two-hosts-two-validators-same-surface.md | normal | API | stg and api.testnet WS hosts answer same malformed frame with different validators |
| 30 | feedback/30-ws-path-shapes-spec-docs-slash.md | normal | docs | WS feed published as /v0/ws, /v0/ws/public and dead /v0/ws/ (404) |
| 31 | feedback/31-numeric-input-overflows-500-503-leak-internal-versions.md | major | API | Numeric overflows 500/503 leak viem version, markets-sdk package, RPC method |
| 32 | feedback/32-no-request-body-size-limit-5mb-echo.md | normal | API | 5MB body accepted, 500 instead of 413, 10MB echo |
| 33 | feedback/33-known-route-unsupported-method-returns-404-not-405.md | normal | API | Unsupported method on known routes returns 404 bad_request, not 405 |
| 34 | feedback/34-patch-missing-body-no-content-type-reports-invalid_amount.md | normal | API | PATCH missing body without Content-Type reports invalid_amount, not invalid_request_body |
| 35 | feedback/35-duplicate-json-keys-accepted-silently.md | normal | API | Duplicate JSON keys accepted last-key-wins and produce calldata |
| 36 | feedback/36-query-param-validation-lax-limit-hex-unknown-ignored.md | normal | API | limit accepts 0x10/1e3; unknown/negative query params silently ignored |
| 37 | feedback/37-404-envelope-uses-undocumented-name-and-omits-error-name-header.md | normal | API | Unknown-route 404 uses undocumented bad_request name and omits Error-Name header |
| 38 | feedback/38-margin-deposit-currency-param-ignored-vs-vault-rejection.md | normal | API | Margin deposit ignores currency while vault rejects same values |
| 39 | feedback/39-rate-limit-threshold-and-fixed-retry-after.md | normal | API | Rate limit trips only at ~175 RPS; every 429 has Retry-After: 1 |
| 40 | feedback/40-gzip-request-body-rejected-as-json-not-415.md | normal | API | Gzipped body rejected as invalid JSON instead of 415 |
