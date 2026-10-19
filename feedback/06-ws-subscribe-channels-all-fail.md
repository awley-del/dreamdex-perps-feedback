# Every documented WebSocket subscribe channel fails with subscription_failed on testnet
Severity: major
Area: API

## Steps to reproduce
1. Connect to the documented testnet socket from the AsyncAPI spec (`/.well-known/async.json`, server `testnet`): `wss://api.testnet.dreamdex.io/v0/ws` (also fails identically on the channel address variant `/v0/ws/public`).
2. Send a schema-exact subscribe frame (SubscribeRequest requires exactly operation/channel/params, verified against AsyncAPI 3.0):
   `{"operation":"subscribe","channel":"markets","params":{"chainId":50312}}`
3. Repeat for `ohlcv` ({symbol, interval:"1m"}), `orderbook` ({symbol}), `trades` ({symbol} or with from/limit), `positions` ({chainId, bearerToken:<valid SIWE JWT>}), `order`, `pending_order`.

## Expected
Per the WS docs page and AsyncAPI spec: `subscribed` confirmation followed by snapshot + incremental updates. The docs advertise these as the primary real-time market data feeds for building on dreamDEX perps.

## Actual
- `ping`/`pong` and REST-over-WS public operations work, so the socket itself is healthy.
- EVERY channel subscription ends in `{"type":"error","errorName":"subscription_failed","message":"subscription failed to channel: <name>"}`.
- For `markets` and `positions` (and `order`) the server first replies `{"type":"subscribed","channel":"<name>"}` and THEN sends `subscription_failed` — a contradictory double response for one subscribe frame; a client built to the documented flow would believe it is subscribed and never receive data.
- `positions` fails even with a valid bearer token that works over HTTP REST (same token, `GET /v0/portfolio?timeframe=all` -> 200).
- Repeated on 3 separate connections, 2 documented endpoints, and both schema-perfect and documented example params. Zero update frames ever received.

## Evidence
evidence/reval-20261019/A_ws_log.json, A_ws_focus.json, A_ws_variants.json, A_ws_retest.json (raw send/recv with timestamps), A_asyncapi.json (official spec), A_docs_ws.txt (docs text). Minimal repro: ~10 lines of `websocket-client`.

## Environment
SDK: python websocket-client 1.9.0 (any RFC6455 client behaves the same; frames match AsyncAPI 3.0 exactly). Network: Somnia Tokyo testnet (chainId 50312), `wss://api.testnet.dreamdex.io/v0/ws`. Wallet: 0x7ad5236a662F1B6F85Eaf752CdC21843Cf9197bC (SIWE-issued JWT used for positions).
Evidence date: 2026-10-19 10:05-10:12 UTC.
