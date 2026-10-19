# WS operations with missing parameters return a REST-style 404 bad_request envelope instead of the documented invalid_parameters protocol error
Severity: normal
Area: API

## Steps to reproduce
1. The WebSocket Errors docs page documents the protocol error: `invalid_parameters` — "Missing/invalid path or query parameters", example message `"missing required path parameter: symbol"`.
2. Connect `wss://api.testnet.dreamdex.io/v0/ws/public`, then send a valid operationId with a missing required parameter:
   `{"id":4,"operation":"getMarketSymbolOrder","params":{"id":"01KC1F8N2NBP5GEYKE66CRJ34A"}}`
3. Read the reply.

## Expected
A protocol error frame `{"type":"error","errorName":"invalid_parameters","message":"missing required path parameter: ...","id":4}` per the Errors doc.

## Actual
`{"id":4,"status":404,"payload":{"status":404,"name":"bad_request"}}` — a REST-envelope shape inside the WS protocol, wrong status class (404 for a malformed-request case), and the error name `bad_request` does not exist in the documented error-name tables at all. Two runs, identical response. Clients switching between HTTP and WS error handling (as the docs invite) must special-case this undocumented third shape.

## Evidence
evidence/reval-20261019/docs/C_missing_param_repro.json (two fresh runs, 10:44 UTC), original probe evidence/reval-20261019/docs/ws_probe.out (MISSING_PARAM line), docs capture evidence/reval-20261019/docs/developers_websocket-api_errors.txt.

## Environment
SDK: python websocket-client 1.9.0. Network: Somnia Tokyo testnet, `wss://api.testnet.dreamdex.io/v0/ws/public`. Wallet: n/a (no auth required for this operation). Evidence date: 2026-10-19 10:30-10:50 UTC.
