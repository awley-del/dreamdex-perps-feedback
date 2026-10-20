# Trader docs open-interest cap is 2x or 4x the on-chain cap on 20 of 21 markets

Severity: major
Area: docs

## Steps to reproduce

1. Open "Perps on Testnet for Traders" and read the Markets table's **Open interest cap** column. The page says the figures "are read from the live markets and can be retuned at any time", that the cap "is market-wide, across every account, and is held in the base asset", and that "a single account is capped at a tenth of it on most markets".
2. Read the same markets on the chain both docs pages name for perps (Hideki, chain 50383): enumerate pools from `PerpPoolFactory.getPerpPools()` (21 pools), then `getPerpPoolParameters()` on each pool. Field `maxOpenInterest` is the market-wide cap in **raw base units** (the SDK's own ABI comment: "Market-wide open-interest cap, raw base units"); field `maxPositionSize` is the per-account cap.
3. Compare at each market's own `baseDecimals`.

Repro, self-contained, no login and no funds (reads only):

```
cd scripts/perp-oi-cap
npm i            # @somnia-chain/markets-sdk + viem
node audit.mjs
```

The script enumerates pools from the **factory contract**, not from an API list, and prints one row per market. It exits `1` when the mismatch is present — that non-zero exit *is* the finding, not a crash.

## Expected

The cap the docs publish is the cap the pool enforces, so a builder sizing against the table and a trader reading it both see the limit the contract applies.

## Actual

**20 of 21 caps are wrong, and every error is a clean power of two** — never a rounding difference:

| market | docs cap | on-chain `maxOpenInterest` | chain ÷ docs |
|---|---|---|---|
| BTC | 246.81545 | 493.6309 | **2x** |
| ETH | 3,995.6125 | 7,991.225 | **2x** |
| HYPE | 23,812.72 | 47,625.44 | **2x** |
| SOL | 47,654.44 | 95,308.88 | **2x** |
| 1000PEPE | 130,285,600 | 521,142,400 | **4x** |
| ADA | 2,254,678 | 9,018,712 | **4x** |
| AVAX | 66,672.2 | 266,688.8 | **4x** |
| BNB | 693.975 | 2,775.9 | **4x** |
| DOGE | 5,613,590 | 22,454,360 | **4x** |
| LINK | 42,643.6 | 170,574.4 | **4x** |
| LIT | 138,896.6 | 555,586.4 | **4x** |
| NEAR | 250,410 | 1,001,640 | **4x** |
| PUMP | 87,993,700 | 351,974,800 | **4x** |
| SUI | 635,009 | 2,540,036 | **4x** |
| VVV | 21,786.14 | 87,144.56 | **4x** |
| WLD | 1,264,000 | 5,056,000 | **4x** |
| XLM | 2,677,780 | 10,711,120 | **4x** |
| XRP | 344,632 | 1,378,528 | **4x** |
| ZEC | 420 | 1,680 | **4x** |
| ZRO | 250,599.5 | 1,002,398 | **4x** |
| TAO | 2,185.491 | 2,185.491 | 1x — the only market that matches |

Two consequences that are not cosmetic:

**1. The published cap is already falsified by live trading.** `getOpenInterest()` (one total, not a long/short pair) reads BTC at 286.09889 against a published cap of 246.81545 — **115.9%** — and XRP at 758,749.8 against 344,632 — **220.2%**. Both markets trade past the number the docs publish, while neither is near the real cap (57.8% and 52.3%). So the table is not a stale snapshot of the same quantity; it is a different, smaller number. (These two readings drift with trading; the committed `run.log` shows block 28,595,939 at 2026-10-20T15:51:30Z, and the same two markets sit above their published cap on every run.)

**2. The "tenth" per-account rule does not hold, and using it as a formula gives the wrong ceiling.** Comparing `docsCap / 10` with the real `maxPositionSize` on every market:

| outcome of `docsCap / 10` vs the real `maxPositionSize` | markets | detail |
|---|---|---|
| EQUAL | **1** | WLD only |
| OVER the documented rule — the size the docs' "tenth of it" rule authorises is larger than the pool's real `maxPositionSize` | **9** | 1000PEPE, ETH, HYPE, LIT, PUMP, SOL, TAO, VVV, ZRO — by +0.0004%, +0.0000%, +0.0000%, +0.0004%, +0.0007%, +0.0000%, +0.0000%, +0.0001%, +0.0001% |
| UNDER — the builder silently caps itself below what the pool allows | **11** | ADA 2.0x, AVAX 2.0x, BNB 2.0x, DOGE 2.0x, LINK 2.0x, NEAR 2.0x, SUI 2.0x, XLM 2.0x, XRP 2.0x, BTC 4.1x, ZEC 10.0x |

The nine OVER rows are the sharp ones. The developer page states the rule and its consequence verbatim: "Each account has a position cap per market, a tenth of the market's open interest cap on most markets. An order that would take the account past it reverts with `MaxPositionSizeExceeded()` (`0x714b36d6`); `getMaxPerpOrderSize` reports the cap as `maxPositionSize`." The overshoot is only a few ten-thousandths of a percent — it is the rounding of the docs printing the cap to a handful of decimals — but it lands on the wrong side of the `<=` the contract compares with, so the size the prose authorises is above the real cap. Sizing a 1000PEPE position at the documented tenth means 13,028,560 against a real cap of 13,028,500.

Calibration note: the `maxPositionSize` values above are read from the pool, and the equality/inequality against `docsCap / 10` is exact integer arithmetic — but no order was submitted, so the revert itself is the docs' stated behaviour, not something this write-up executed. No wallet, no funds, no transaction; every call here is a read.

## Evidence

**Control 1 — same docs row, same pool, different column.** The `Min size` column is read through the same code path at the same `baseDecimals`, and it equals `getOrderBookParameters().minQuantity` on **21/21** markets (BTC 0.00013, XLM 54, NEAR 5.1, 1000PEPE 2,700, ZEC 0.009, ZRO 5.1 …). Had the decimal handling or the read path been wrong, this control would fail too.

**Control 2 — the docs' own decimals table.** The developer page states base decimals per group: 6 = ADA/HYPE/PUMP/XRP, 7 = XLM, 8 = BTC/DOGE/ZEC, 9 = SOL/SUI/TAO, 18 = 1000PEPE/AVAX/BNB/ETH/LINK/LIT/VVV/WLD/ZRO, 24 = NEAR. `baseDecimals` read off the live market rows reproduces that grouping exactly, all 21 markets — so the scaling applied to the OI column is the scaling the docs themselves use.

**Control 3 — two independent discovery paths agree.** Pools enumerated from `PerpPoolFactory.getPerpPools()` (21) map 1:1 to the SDK's market rows (21/21), and a raw `getPerpPoolParameters()` read matches the SDK's typed `getPerpRiskParams()` on 21/21 markets. The mismatch is not an artefact of one client.

**Repro output** (`node audit.mjs`, 2026-10-20):

```
PASS  control: Min size column == getOrderBookParameters().minQuantity on 21/21 markets
FAIL  OI cap column disagrees with maxOpenInterest on 20 of 21 markets
      ratio groups (chain : docs): {"4:1":["1000PEPE","ADA","AVAX","BNB","DOGE","LINK",
        "LIT","NEAR","PUMP","SUI","VVV","WLD","XLM","XRP","ZEC","ZRO"],
        "2:1":["BTC","ETH","HYPE","SOL"], "1:1":["TAO"]}

--- docs prose: "A single account is capped at a tenth of it on most markets" ---
      EQUAL to the real cap: 1/21 -> WLD
      OVER the real cap (order reverts MaxPositionSizeExceeded 0x714b36d6): 9 ->
        1000PEPE 13028560 vs 13028500, ETH 399.56125 vs 399.5612, HYPE 2381.272 vs 2381.27,
        LIT 13889.66 vs 13889.6, PUMP 8799370 vs 8799300, SOL 4765.444 vs 4765.44,
        TAO 218.5491 vs 218.549, VVV 2178.614 vs 2178.61, ZRO 25059.95 vs 25059.9
      UNDER the real cap: 11 -> ADA 2.0x, AVAX 2.0x, BNB 2.0x, BTC 4.1x, DOGE 2.0x,
        LINK 2.0x, NEAR 2.0x, SUI 2.0x, XLM 2.0x, XRP 2.0x, ZEC 10.0x

--- live trading vs the published cap ---
      markets already past the DOCUMENTED cap: 2 -> BTC 115.9% (live 286.09889), XRP 220.2% (live 758749.8)
      markets past the CHAIN cap:              0
```

A 2x/4x split that tracks nothing else in the table — the ratio is not leverage: every `initialMarginBps = 500` market (20x: BTC, ETH, HYPE, SOL, XRP) is 2x, while both the `1000` (10x) and `2000` (5x) markets are 4x, and the single `2000` market that does match (TAO) breaks even that grouping. So it is not a per-side or per-leverage derivation; the publisher's number is simply not `maxOpenInterest`.

## Why "the figures can be retuned at any time" does not cover this

The page does say the figures "are read from the live markets and can be retuned at any time", so the obvious response is that the table is merely a stale snapshot. Live trading rules that out: BTC's `getOpenInterest()` is 286.09889 against a published cap of 246.81545. A snapshot can be out of date, but it cannot be a smaller number than the quantity it claims to cap while that quantity is trading *above* it and the pool is not near its limit. The published value is not a past reading of `maxOpenInterest`; it is a different quantity — consistently half or a quarter of it, on 20 of 21 markets, which is what a systematic derivation error looks like and not what drift looks like.

Second, staleness still would not explain the prose. "A tenth of it" is stated as a rule, not as a figure, and it is the number builders implement. Comparing `docsCap / 10` with the real `maxPositionSize`: exact on 1 market (WLD), above the real cap on 9, and below it on 11 — 20 of 21 markets disagree, 9 of them in the direction where the documented tenth is larger than the cap the pool enforces.

## Environment

- Docs: "Perps on Testnet for Traders", Markets table; "Perps on testnet for developers", position-cap prose. Captured 2026-10-20.
- Network: **Somnia Tokyo testnet**. Perps run on its **Hideki** chain, which the app shows as the "DreamDEX" region and whose explorer path is `/tokyo` — stated on the perps developer page itself. chainId **50383** (`0xc4cf`), confirmed by `eth_chainId` on the RPC below.
- RPC `https://api.hideki2.infra.testnet.somnia.network`; indexer `https://hideki-dev.smk.somnia.host/v1/graphql`.
- Contracts: `PerpPoolFactory 0xE631fAEE547baeE07353E290f0562ea67d856560`, and the script does not take that address on trust — it reads `perpPoolFactory` back from `MarginBank.getSystemConfig()` (`MarginBank` reports `fullyWired: true`), then enumerates pools from that contract. Per-pool: `getPerpPoolParameters()`, `getOrderBookParameters()`, `getOpenInterest()`.
- SDK: `@somnia-chain/markets-sdk@0.32.1` (the version the developer page says the app runs), `viem@2.57.7`.
- Wallet: none. Every call is a read; no account and no test funds required.
