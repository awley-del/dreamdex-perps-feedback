# Stop-order endpoints return 404 on all 24 perp markets, including the 13 that do have a stop-order registry

Severity: normal
Area: api

## Steps to reproduce
1. `curl 'https://api.testnet.dreamdex.io/v0/markets?kind=perp'` -> 24 markets. 13 of them carry a non-zero `stopRegistry` address in their own market row (ADA, AVAX, BNB, DOGE, HYPE, LINK, NEAR, SOL, SUI, TAO, WLD, XLM, XRP); 11 carry none or the two WBTC/WETH entries are dual-listed with spot.
2. Authenticate: `GET /v0/auth/nonce` -> sign the SIWE message -> `POST /v0/auth/verify` -> bearer token.
3. For every one of the 24 perp markets, call the documented stop-order endpoint: `GET /v0/markets/SOL:USDso/stop-orders` with the bearer token.

## Expected
The stop-order plane answers for perp markets whose `stopRegistry` is set, since that address is the contract the request has to reach.

## Actual
`404 market_not_found` with the description `this operation does not serve perp markets` on 22 of 24 perp markets, three times in a row. The only two perp symbols that answer 200 are `WBTC:USDso` and `WETH:USDso`, and those two are also listed as spot markets, so the 200 belongs to the spot market of the same name, not the perp.

Status distribution over all 24 perp markets, authenticated, repeated 3 times with identical results: `{200: 2, 404: 22}`.

That includes 13 markets whose own API row advertises a working registry, for example `SOL:USDso -> stopRegistry 0xc05d8f7817ba7ff2da25349b295133f49ee1feaa`, and `SOL:USDso/stop-orders -> 404 this operation does not serve perp markets`.

This is separate from the on-chain registry gap reported earlier for nine pools. That finding is about a registry that does not exist. This one is about the HTTP plane refusing the request even where the registry does exist.

## Evidence
- `evidence/lane-new-20261020/stop_api_auth.json` — full 24-market sweep with registry flag, dual-list flag, status and error description per symbol.
- `evidence/lane-new-20261020/stop_verify.json`, `final_verify.json` — 3x repeat, plus spot control (`SOMI:USDso/stop-orders -> 200`) proving the endpoint itself is live and authenticated.
- Raw: `curl -s -H "authorization: Bearer $TOK" 'https://api.testnet.dreamdex.io/v0/markets/SOL:USDso/stop-orders'`

## Environment
Chain: Somnia Tokyo testnet, chainId 50312. API: `https://api.testnet.dreamdex.io/v0`. Authenticated with a freshly minted test wallet through SIWE. Evidence date: 2026-10-20.
