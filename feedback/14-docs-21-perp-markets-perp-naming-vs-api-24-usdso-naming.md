# Trader docs list 21 markets as BTC-PERP style names; the testnet API serves 24 perps under BASE:USDso and 404s every documented name
Severity: normal
Area: docs

## Steps to reproduce
1. The "Perps on Testnet for Traders" page (bounty resource) states "All 21 markets are margined in USDso" and lists them as BTC-PERP, ETH-PERP, HYPE-PERP, SOL-PERP, XRP-PERP, ADA-PERP, ... The app routes perp markets as /trade/perps/tokyo/BTC-PERP.
2. Query the API: `curl 'https://api.testnet.dreamdex.io/v0/markets?kind=perp'` -> 24 markets, all named BASE:USDso (ADA:USDso, WBTC:USDso, SWBTC:USDso, ...).
3. Look up the documented names: `curl 'https://api.testnet.dreamdex.io/v0/markets/BTC-PERP'` and `.../ETH-PERP`.

## Expected
Either the documented market names resolve (200), or the docs list the names the API actually serves.

## Actual
Both lookups return 404 `market_not_found`. There is no BTC:USDso or ETH:USDso perp either (only WBTC/WETH and SWBTC* variants), so the primary documented market "BTC-PERP" has no API counterpart under any obvious name, while the API's 24 markets (3 extra, including a SWBTCA-D series) are absent from the doc table. Nothing maps the two naming schemes.

## Evidence
evidence/reval-20261019/docs/trading_perps-testnet.txt (21-market table with BTC-PERP), evidence/reval-20261019/sdk/markets-perp.json (live 24), fresh 404 responses quoted above (10:34 UTC, also saved evidence/reval-20261019/docs/p_market_btcperp.body).

## Environment
SDK: curl 8.5.0. Network: Somnia Tokyo testnet, `https://api.testnet.dreamdex.io/v0`. Wallet: n/a (unauthenticated GET). Evidence date: 2026-10-19 10:30-10:50 UTC.
