# WBTC and WETH are listed as both spot and perp under the identical symbol, and every write resolves to the spot market, leaving the perp side unaddressable

Severity: normal
Area: api

## Steps to reproduce
1. `curl 'https://api.testnet.dreamdex.io/v0/markets?kind=spot'` -> 3 markets, including `WBTC:USDso` and `WETH:USDso`.
2. `curl 'https://api.testnet.dreamdex.io/v0/markets?kind=perp'` -> 24 markets, including `WBTC:USDso` and `WETH:USDso` with different contracts and a non-zero `stopRegistry`.
3. `curl 'https://api.testnet.dreamdex.io/v0/markets/WBTC:USDso'` -> `kind: "spot"`.
4. Post a perp order to the symbol: `POST /v0/markets/WBTC:USDso/orders` with `{"type":"limit","side":"buy","amount":"50","price":"0.2","fundingSource":"marginBank"}`.
5. Post a spot order to the same symbol: `... "amount":"1","fundingSource":"wallet"`.

## Expected
The market namespace is unambiguous: either the perp side is addressable by some documented discriminator (query parameter, body field, path segment), or the two markets do not share a symbol.

## Actual
- Step 4 returns `400 invalid_param` / `funding source "marginBank" is not valid on spot markets` — the request was routed to the spot market and rejected there.
- Step 5 returns `200` with calldata whose `to` is the spot contract, never the perp contract.
- The perp side of the same symbol does answer reads: `GET /v0/markets/WBTC:USDso/funding -> 200`, while `GET /v0/markets/WBTC:USDso -> kind "spot"`. The symbol resolves to spot for the market detail, to perp for funding, and to spot for every order.
- Tried and rejected as disambiguators, all three times consistently: `?kind=perp` on the order path, `?chainId=50312&kind=perp`, `kind` in the request body, `/perp/` path segment, `WBTC-PERP:USDso`. All still resolve to spot or 404.
- Control: a perp-only symbol accepts the identical perp body — `POST /v0/markets/ADA:USDso/orders` with `fundingSource: marginBank` returns `200`.

So for the two symbols that exist on both planes there is no documented way to reach the perp market's write path, and a caller that follows the docs lands on the spot market instead.

## Evidence
- `evidence/lane-new-20261020/perp_unreachable.json` — per-disambiguator attempt, resolved `to` address, and the spot vs perp contract addresses side by side.
- `evidence/lane-new-20261020/final_verify.json` — 3x repeat, F1 CONFIRMED, with the perp-only control.
- `evidence/lane-new-20261020/ambiguity.json` — endpoint-by-endpoint resolution of the symbol across the surface.

## Environment
Chain: Somnia Tokyo testnet, chainId 50312. API: `https://api.testnet.dreamdex.io/v0`. Authenticated with a freshly minted test wallet through SIWE. Evidence date: 2026-10-20.
