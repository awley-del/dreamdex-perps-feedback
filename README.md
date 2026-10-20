# dreamDEX Perps Builder Bounty — reproducible testnet findings

One file per issue in `feedback/` (41 files: 2 major, 39 normal), per the bounty template.

Security-critical items were sent privately to security@dreamdex.io instead of this repository.

Every file below is backed by a script in `~/hunts/dreamdex/evidence/` that replays the case against the live testnet.

| # | File | Severity | Area | Title |
|---|------|----------|------|-------|
| 2 | feedback/02-cdn-bucket-listing.md | normal | app | Public storage bucket listing enabled on cdn.dreamdex.io |
| 3 | feedback/03-csp-report-only-leaks-internal-hosts.md | normal | app | CSP report-only header on app.testnet responses discloses internal dev/staging hosts |
| 4 | feedback/04-unauthenticated-metrics-endpoint.md | normal | API | Unauthenticated /metrics on api.testnet.dreamdex.io exposes internal route table and traffic stats |
| 5 | feedback/05-sponsor-warm-unauthenticated-no-ratelimit.md | normal | API | State-changing POST /api/sponsor/warm accepts unauthenticated calls without rate limiting |
| 9 | feedback/09-docs-unknown-symbol-400-not-silently-skipped.md | normal | docs | Market Data docs promise unknown symbols are silently skipped (empty []), live API returns 400 invalid_param |
| 10 | feedback/10-docs-comma-symbols-returns-data-not-empty.md | normal | docs | Market Data docs show comma-separated symbols returning [], live API parses both symbols (200 with data) |
| 11 | feedback/11-ws-missing-param-returns-bad-request-envelope-not-invalid-parameters.md | normal | API | WS operations with missing parameters return a REST-style 404 bad_request envelope instead of the documented invalid_parameters protocol error |
| 12 | feedback/12-docs-invalid-interval-error-name-never-returned.md | normal | docs | Error Handling table documents error name invalid_interval, live API returns invalid_param for the same case |
| 13 | feedback/13-perps-dev-page-points-to-chain-50383-while-api-runs-50312.md | major | docs | Perps developer page documents chain 50383 (Hideki) contract addresses that have no code on the chain the perps API actually runs (50312) |
| 14 | feedback/14-docs-21-perp-markets-perp-naming-vs-api-24-usdso-naming.md | normal | docs | Trader docs list 21 markets as BTC-PERP style names; the testnet API serves 24 perps under BASE:USDso and 404s every documented name |
| 15 | feedback/15-docs-testnet-base-url-points-to-stg-not-api-testnet.md | normal | docs | HTTP API base-URL table sends testnet developers to stg.api.dreamdex.io while the perps testnet host api.testnet.dreamdex.io is undocumented anywhere |
| 16 | feedback/16-nul-byte-path-returns-400-empty-violating-json-error-contract.md | normal | API | NUL byte in the URL path returns 400 with empty body and no Error-Name header, violating the documented JSON error contract |
| 17 | feedback/17-login-non-json-content-type-500-leaks-v8-error.md | normal | API | POST /v0/auth/login with a non-JSON Content-Type returns 500 internal_error and leaks a V8 exception string |
| 18 | feedback/18-nonexistent-order-prepare-returns-calldata.md | normal | API | Cancel and reduce prepares return calldata for an order id that does not exist |
| 19 | feedback/19-leverage-above-doc-max-accepted.md | normal | API | Leverage endpoint accepts values far above the documented per-market maximum while amount validation enforces the documented minimum |
| 20 | feedback/20-pools-without-stop-order-registry.md | normal | contracts | Nine of twenty-four perps pools have no stop-order registry while the docs advertise TP/SL on every market |
| 21 | feedback/21-pools-outside-insurance-tier-ladder.md | normal | contracts | Three pools sit outside the insurance-fund tier while the docs present the Insurance Fund as the standard ladder stage |
| 22 | feedback/22-voucher-closed-while-docs-promise-claim.md | normal | contracts | Voucher distributor campaign is over with zero budget and claim() reverts while the docs still promise any address can claim 1,000 USDso |
| 23 | feedback/23-single-owner-eoa-controls-perps-stack.md | normal | contracts | One EOA owns every core perps contract and the shared pool beacon |
| 24 | feedback/24-perps-contracts-source-unverified.md | normal | contracts | No perps contract has published source on the explorer |
| 25 | feedback/25-docs-markets-that-do-not-exist.md | normal | docs | Trader docs table lists six perps markets that do not exist anywhere on the testnet |
| 26 | feedback/26-app-default-landing-market-404.md | normal | app | App redirects every visitor to a default market that does not exist in the API registry |
| 27 | feedback/27-app-offers-10m-candle-interval-api-rejects.md | normal | app | App ships a 10m candle interval option that the candles endpoint and its own OpenAPI spec reject |
| 28 | feedback/28-bot-kit-shipped-defaults-target-nonexistent-spot-market.md | normal | SDK | Bot kit ships with a default spot symbol that does not exist on the testnet it targets |
| 29 | feedback/29-ws-two-hosts-two-validators-same-surface.md | normal | API | Same malformed WebSocket frame returns two different validator messages on the two hosts the kit and docs call "testnet" |
| 30 | feedback/30-ws-path-shapes-spec-docs-slash.md | normal | docs | One WebSocket feed is published under three different path shapes and the spec's own path variant with a trailing slash 404s |
| 31 | feedback/31-numeric-input-overflows-500-503-leak-internal-versions.md | major | API | Numeric input overflows return 500/503 that leak internal library versions, package names and RPC method names |
| 32 | feedback/32-no-request-body-size-limit-5mb-echo.md | normal | API | Order endpoints accept a 5MB JSON body, answer 500 instead of 413, and echo ~10MB back |
| 33 | feedback/33-known-route-unsupported-method-returns-404-not-405.md | normal | API | Known routes answer unsupported HTTP methods with 404 bad_request instead of 405 |
| 34 | feedback/34-patch-missing-body-no-content-type-reports-invalid_amount.md | normal | API | PATCH with no body and no Content-Type reports invalid_amount instead of invalid_request_body |
| 35 | feedback/35-duplicate-json-keys-accepted-silently.md | normal | API | Duplicate JSON keys in an order request are accepted silently (last-key-wins) and produce calldata |
| 36 | feedback/36-query-param-validation-lax-limit-hex-unknown-ignored.md | normal | API | Query parameter validation is lax: limit accepts non-integer syntax and unknown/negative params are silently ignored |
| 37 | feedback/37-404-envelope-uses-undocumented-name-and-omits-error-name-header.md | normal | API | 404 envelopes use an undocumented error name and skip the Error-Name header the docs promise |
| 38 | feedback/38-margin-deposit-currency-param-ignored-vs-vault-rejection.md | normal | API | Margin deposit ignores the currency parameter entirely while the market vault rejects the same values |
| 39 | feedback/39-rate-limit-threshold-and-fixed-retry-after.md | normal | API | Rate limiting only trips after high-RPS bursts and every 429 advertises Retry-After: 1 |
| 40 | feedback/40-gzip-request-body-rejected-as-json-not-415.md | normal | API | gzip-compressed request body is rejected as invalid JSON instead of 415 Unsupported Media Type |
| 41 | feedback/41-perp-stop-orders-404-on-all-24-markets-including-15-with-a-registry.md | normal | API | Stop-order endpoints return 404 on all 24 perp markets, including the 15 that do have a stop-order registry |
| 42 | feedback/42-dual-listed-symbol-resolves-to-spot-so-perp-side-is-unaddressable.md | normal | API | WBTC and WETH are listed as both spot and perp under the identical symbol, and every write resolves to the spot market, leaving the perp side unaddressable |
| 43 | feedback/43-approve-encodes-fee-above-pool-cap-producing-a-transaction-that-always-reverts.md | normal | API | builder/approve encodes any max fee the caller asks for, including values above the pool cap, producing a transaction the pool always reverts |
| 44 | feedback/44-spec-omits-maximum-on-builder-fee-fields-while-the-pool-enforces-one.md | normal | docs | The spec declares the builder-fee ceilings as unbounded integers while every pool enforces a finite on-chain cap |
| 45 | feedback/45-vault-approve-returns-http-200-with-a-null-body-for-a-supported-currency.md | normal | API | vault/approve answers HTTP 200 with a literal null body for a currency the same endpoint lists as accepted |
