# Trader docs list 21 markets as BTC-PERP style names; the REST registry serves BASE:USDso and 404s every -PERP name, including markets whose base ticker it does carry

Severity: normal
Area: docs

## Steps to reproduce

1. "Perps on Testnet for Traders" states "All 21 markets are margined in USDso" and lists them as BTC-PERP, ETH-PERP, HYPE-PERP, SOL-PERP, XRP-PERP, ADA-PERP, … (21 rows).
2. On the chain both pages name for perps (Hideki, 50383) those 21 markets exist: `getPerpPools()` on `PerpPoolFactory 0xE631fAEE547baeE07353E290f0562ea67d856560` returns 21 pools, and `minQuantity` / `baseDecimals` / `initialMarginBps` agree with the docs table (21/21 on each column that can be cross-checked).
3. Query the REST registry the docs also describe: `curl 'https://api.testnet.dreamdex.io/v0/markets?kind=perp'` -> 24 rows, every symbol in `BASE:USDso` form.
4. Look up the documented form: `GET /v0/markets/BTC-PERP` -> **404**, `GET /v0/markets/ADA-PERP` -> **404**, `GET /v0/markets/HYPE-PERP` -> **404**.
5. Look up the registry form for the same base asset: `GET /v0/markets/ADA:USDso` -> **200**, `GET /v0/markets/HYPE:USDso` -> **200**, but `GET /v0/markets/BTC:USDso` -> **404**. The registry carries 13 of the 21 documented base tickers (ADA, AVAX, BNB, DOGE, HYPE, LINK, NEAR, SOL, SUI, TAO, WLD, XLM, XRP) and none of BTC, ETH, 1000PEPE, LIT, PUMP, VVV, ZEC, ZRO; instead it carries WBTC, WETH and eight `SW*` wrapped/staked variants.

## Expected

Either the documented `-PERP` names resolve on the REST registry, or the docs state that the REST symbol space (`BASE:USDso`, chainId 50312) and the on-chain perp ticker space (Hideki, 50383) are separate namespaces, and give the mapping between them.

## Actual

- The 21 documented perps are fully specified on Hideki (50383): factory pools 21/21, and the docs columns we can cross-check agree 21/21 (`minQuantity`, `baseDecimals` per group, `initialMarginBps`).
- The REST registry does not serve the documented name form at all: every `-PERP` lookup 404s, including for base assets the registry does carry under a different name (`ADA-PERP` 404 vs `ADA:USDso` 200).
- The two spaces are not a rename of each other. `BTC` exists as a perp on the chain and does not exist in the REST registry under either form; the registry instead carries `WBTC` and `SWBTC`, which are different assets. A builder who maps documented `BTC-PERP` to `WBTC:USDso` trades wrapped BTC while believing it is the documented market.
- Neither page states the mapping or warns that the two lists are different asset sets.

## Evidence

- Docs: "Perps on Testnet for Traders", 21-row Markets table, captured 2026-10-20.
- Chain: `getPerpPools()` = 21 pools on Hideki 50383; `getOrderBookParameters().minQuantity` == docs Min size on 21/21 (see item 48's repro for the enumeration and the printed table).
- REST, captured 2026-10-20:

```
GET /v0/markets?kind=perp        -> 200, 24 rows, every symbol "BASE:USDso"
GET /v0/markets/BTC-PERP         -> 404     GET /v0/markets/BTC:USDso   -> 404
GET /v0/markets/ADA-PERP         -> 404     GET /v0/markets/ADA:USDso   -> 200
GET /v0/markets/HYPE-PERP        -> 404     GET /v0/markets/HYPE:USDso  -> 200
GET /v0/markets/WBTC:USDso       -> 200
```

- Registry set (24): ADA, AVAX, BNB, DOGE, HYPE, LINK, NEAR, SOL, SUI, SWBTCA, SWBTCB, SWBTCC, SWBTCD, SWBNB, SWBTC, SWDOGE, SWETH, SWSOL, TAO, WBTC, WETH, WLD, XLM, XRP.

## Environment
- SDK: `@somnia-chain/markets-sdk@0.32.1`.
- Network: Docs: perps trader page + perps developer page (both name Hideki 50383 for perps). Chain: Hideki 50383, RPC `https://api.hideki2.infra.testnet.somnia.network`, factory `0xE631fAEE547baeE07353E290f0562ea67d856560`.
- Wallet: none, all reads.
- REST: `https://api.testnet.dreamdex.io/v0` (rows report chainId 50312).
