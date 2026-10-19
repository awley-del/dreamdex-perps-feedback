# Authenticated REST-over-WebSocket requests never carry the documented bearerToken — 401 for every valid token
Severity: major
Area: API

## Steps to reproduce
1. Obtain a valid SIWE token over HTTP: `GET /v0/auth/nonce` -> sign -> `POST /v0/auth/login` -> 200 token. Confirm it works: `GET /v0/portfolio?timeframe=all` with `Authorization: Bearer <token>` -> 200.
2. Connect to `wss://api.testnet.dreamdex.io/v0/ws`.
3. Invoke the same operation via RestRequest exactly as documented (`params.bearerToken` is the field named in the WS docs schema):
   `{"operation":"GetPortfolio","id":22,"params":{"bearerToken":"<valid JWT>","payload":{"timeframe":"all"}}}`

## Expected
`RestResponse` with `status: 200` and the portfolio payload — the docs state any REST endpoint can be invoked over the socket and `params.bearerToken` carries "a SIWE-issued JWT".

## Actual
- All variants return `{"id":22,"status":401,"errorName":"unauthorized","payload":{"description":"this request needs a bearer token, and the one presented does not admit it"}}`: plain `bearerToken`, `Bearer <token>` prefix, `values`-string variant, no payload — five variants total.
- Control 1: same frame without any token returns the identical 401, i.e. the server never sees `params.bearerToken` (the field is ignored on the REST-over-WS path).
- Control 2: public operations over the same socket work (`GetAuthNonce` -> 200, `GetMarkets` -> 200), so REST-over-WS itself is enabled.
- Control 3: the identical token over HTTP REST -> 200.
Net: every authenticated REST operation is unusable over WebSocket although the docs advertise bearerToken support, while public operations work — the authenticated integration path is broken, not the socket.

## Evidence
evidence/reval-20261019/A_ws_variants.json (ids 21-26: baseline, doc-shape, Bearer-prefix, values-string, no-payload, public-op), A_token.txt (token used, issued this session), A_authz_battery.json (HTTP 200 control), A_docs_ws.txt (docs schema text quoting bearerToken).

## Environment
SDK: python websocket-client 1.9.0. Network: Somnia Tokyo testnet, `wss://api.testnet.dreamdex.io/v0/ws`. Wallet: 0x7ad5236a662F1B6F85Eaf752CdC21843Cf9197bC.
Evidence date: 2026-10-19 10:05-10:12 UTC.
