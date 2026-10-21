# Leverage endpoint accepts values far above the documented per-market maximum while amount validation enforces the documented minimum

Severity: normal
Area: API

## Steps to reproduce
1. Sign in with SIWE (own wallet), bearer on all requests.
2. Docs reference: the market table in the perps testnet docs lists `ADA-PERP | 10x | 10% / 5% | 0.0001 | 46 ADA ...` and the margin docs say "Each market's maximum leverage is in the market table." So the documented maximum for ADA is 10x.
3. POST /v0/markets/ADA:USDso/leverage with {"leverage":11} -> 200, and the value 11 appears in the returned calldata.
4. Repeat with {"leverage":100} -> 200, value in calldata.
5. Repeat with {"leverage":65535} -> 200, value in calldata.
6. Control for the other direction: POST /v0/markets/ADA:USDso/orders with {"type":"market","side":"buy","amount":"1","fundingSource":"marginBank"} -> 400 `invalid_amount`, "Invalid amount: amount must be at least the market minimum of 46".
7. GET the market row for ADA:USDso -> {"maxLeverage": null, "minQuantity": "46", "lotSize": "1"} (maxLeverage is not published per market).

## Expected
The leverage endpoint should reject values above the market's documented maximum (10 for ADA) with a validation error, symmetric to how amount below the market minimum is rejected with 400 `invalid_amount`.

## Actual
Leverage 11, 100, and 65535 are all accepted with 200 and encoded into the returned transaction calldata, while amount=1 against the same market is rejected with 400. Server-side limit enforcement is asymmetric: the lower bound is enforced, the documented upper bound is not. The market row itself returns `maxLeverage: null`, so a client has no way to learn the cap from the API either.

Honest scope note: this is a server-side validation gap observed in the prepare flow. Whether the on-chain margin engine independently caps leverage at the per-market initial-margin bound was not exercised in this review.

## Evidence
- leverage=11 -> 200, leverage_in_calldata=True
- leverage=100 -> 200, leverage_in_calldata=True
- leverage=65535 -> 200, leverage_in_calldata=True
- amount=1 -> 400 {"status":400,"name":"invalid_amount","description":"Invalid amount: amount must be at least the market minimum of 46","context":{"minQuantity":"46"}}
- market row: {"symbol":"ADA:USDso","maxLeverage":null,"minQuantity":"46","lotSize":"1"}
- Docs: market table "ADA-PERP | 10x | 10% / 5% | 0.0001 | 46 ADA | 2,254,678 ADA | Yes"; margin docs "Each market's maximum leverage is in the market table."

Reproduced twice (two runs per value) on 19 October 2026, two independent sessions.

## Environment

- SDK: n/a (raw HTTP/JSON-RPC, no SDK used)
- Network: API: https://api.testnet.dreamdex.io (v0), 19 October 2026 Network: Somnia Tokyo testnet, chainId 50312 Auth: bearer from SIWE login, own fresh testnet wallet
- Wallet: n/a — request signed none; prepare returned calldata, nothing broadcast
