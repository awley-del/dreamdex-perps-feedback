# Trader docs table lists six perps markets that do not exist anywhere on the testnet

Severity: normal
Area: docs

## Steps to reproduce
1. Open the "Perps on Testnet for Traders" page and read its 21-market table. Besides the tradeable names it contains: 1000PEPE-PERP, LIT-PERP, PUMP-PERP, VVV-PERP, ZEC-PERP, ZRO-PERP — each with full trading parameters (max leverage, initial/maintenance margin, lot size, minimum size, max open interest).
2. Query the API registry: GET /v0/markets (all kinds, both testnet chains, captured in markets-all.json). None of the six symbols appear as any kind of market — not as a perp, not as a spot pair, not under an alternate name.
3. Query the contracts: read the perps factory pool list on chainId 50312 (24 pools). None of the six base assets is among them (AVAX, DOGE, HYPE, LINK, NEAR, SUI, SW*, TAO, W*, XLM).
4. Control: the other 15 documented markets each resolve to a live API row whose maxLeverage, initialMarginFraction, and maintenanceMarginFraction match the docs table exactly (15/15), so the comparison method is sound.

## Expected
Every row of the documented market table should resolve to a tradeable market (API row + pool), or the table should not list markets that cannot be traded.

## Actual
Six of the 21 documented perps markets — 1000PEPE, LIT, PUMP, VVV, ZEC, ZRO — have no API market under any symbol, no pool on the bounty chain, and no spot counterpart. A builder or trader who sizes a position from the published table (lot size, minimum, max OI) for these rows hits an empty registry at runtime, and a bot that iterates the docs table to enumerate markets will target products that were never deployed.

## Evidence
Docs rows (verbatim from the 21-market table):
1000PEPE-PERP | 5x | 20% / 10% | 0.0000001 | 2,700 1000PEPE | 130,285,600 1000PEPE
LIT-PERP | 5x | 20% / 10% | 0.0001 | 2.8 LIT | 138,896.6 LIT
PUMP-PERP | 5x | 20% / 10% | 0.000001 | 1,800 PUMP | 87,993,700 PUMP
VVV-PERP | 5x | 20% / 10% | 0.001 | 0.44 VVV | 21,786.14 VVV
ZEC-PERP | 5x | 20% / 10% | 0.001 | 0.009 ZEC | 420 ZEC
ZRO-PERP | 5x | 20% / 10% | 0.0001 | 5.1 ZRO | 250,599.5 ZRO

Registry checks, 19 October 2026:
- markets-all.json (GET /v0/markets, 40 rows, all kinds/chains): 1000PEPE/LIT/PUMP/VVV/ZEC/ZRO matches = 0
- Factory pool list (24 pools): no base token for any of the six
- Control, matched pairs: 15/15 docs rows agree with API maxLeverage/IM/MM (saved in evidence/docs_api_diff.json)

## Environment
- API: https://api.testnet.dreamdex.io/v0 (unauthenticated GET), 19 October 2026
- Chain: Somnia Tokyo testnet, chainId 50312, factory 0x516d2cb6de41bE98444e887793946E65989Ba07b
- Docs: "Perps on Testnet for Traders" (bounty resource page)
