# App redirects every visitor to a default market that does not exist in the API registry

Severity: normal
Area: app

## Steps to reproduce
1. `curl -sI https://app.testnet.dreamdex.io/` (repeat with a desktop browser User-Agent).
   Response: `HTTP/2 307` with `location: /trade/spot/tokyo/STT:USDso`.
   Reproduced 3 times (2026-10-19, ~12:35 and ~13:0x UTC; identical with and without a browser UA).
2. Ask the API for the market the landing page just selected:
   `curl -s 'https://api.testnet.dreamdex.io/v0/markets/STT%3AUSDso'`
   Response: `404 market_not_found` (also reproduced twice inside the lane evidence at 12:35 UTC).
3. Confirm STT:USDso is absent from the registry entirely: `GET /v0/markets` returns 40 markets, none of them `STT:USDso`.

## Expected
The market the front page redirects to is a market that exists, so the trade page can load orderbook, candles and ticker on first visit.

## Actual
The server 307s every first-time visitor to `STT:USDso`, and the API answers `market_not_found` for that symbol. The landing trade page starts with a market that cannot resolve — its data requests fail until the user manually picks another market.

## Evidence
```
$ curl -sI https://app.testnet.dreamdex.io/
HTTP/2 307
location: /trade/spot/tokyo/STT:USDso

$ curl -s 'https://api.testnet.dreamdex.io/v0/markets/STT%3AUSDso'
{"status":404,"name":"market_not_found","description":"market not found","symbol":"STT:USDso"}

$ curl -s 'https://api.testnet.dreamdex.io/v0/markets' | <filter STT>
(no STT:USDso among the 40 markets)
```
Note: `/v0/markets?kind=event` and the `kind` enum (`spot|perp|event|all`) were checked and are fine — this report is only about the default landing market.

## Environment
- SDK: n/a (raw HTTP/JSON-RPC, no SDK used)
- Network: Somnia Tokyo testnet, 2026-10-19 (UTC): API: https://api.testnet.dreamdex.io
- Wallet: n/a — no wallet, no signature, no transaction broadcast
- App: https://app.testnet.dreamdex.io
- WebSocket: wss://api.testnet.dreamdex.io/v0/ws/public
- Bot kit: github.com/somnia-chain/dreamdex-bot-kit (cloned for this report)
