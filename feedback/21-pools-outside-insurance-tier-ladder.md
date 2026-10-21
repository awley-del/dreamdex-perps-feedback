# Three pools sit outside the insurance-fund tier while the docs present the Insurance Fund as the standard ladder stage

Severity: normal
Area: contracts

## Steps to reproduce
1. On chainId 50312 call `getPoolTier(address)` on MarginBank `0xdd4A14A2763FDa39b9759D2D4150DB0e0f085C4E` for:
   - SWBTC pool 0x961E81c074F2269BE3afD6b7B8B5A8A729eD1423 -> tier 0
   - SWBTCA pool 0x73386BF06b3df26025c09Ce8f48c87A0C7E135E7 -> tier 0
   - SWBTCB pool 0xf18d319f823759c3F1dcd6DE9268b89ac74BF0a9 -> tier 0
   - Control, WBTC pool 0x3892A5179F8eA0C810c45d1630546c0317b0e5B6 -> tier 1
2. Call `getMarketStatus()` on the same pools: the three tier-0 pools return 1, the control returns 0.
3. Read the docs margin & liquidations page for the documented liquidation ladder.

## Expected
The docs describe the post-book liquidation ladder as backstop bidder -> Insurance Fund -> ADL, and only disclose one testnet deviation ("No backstop bidders are registered on testnet, so the later stages come in sooner"). Per-pool coverage exclusions should be disclosed too, because on an uncovered pool the documented Insurance Fund step does not exist.

## Actual
Three pools are outside the insurance tier (getPoolTier = 0) while the docs describe the Insurance Fund as a general stage of the ladder. On those markets the documented fund step is skipped and shortfall handling falls through to ADL. The three pools are currently in marketStatus 1, which may indicate a wind-down, but nothing in the docs tells builders or traders that these markets run without insurance-fund coverage.

## Evidence
Fresh eth_call results, 19 October 2026 (two independent passes):
- getPoolTier: SWBTC=0, SWBTCA=0, SWBTCB=0, WBTC control=1
- marketStatus: SWBTC=1, SWBTCA=1, SWBTCB=1, WBTC control=0
- Docs quote: "If closing on the book is not enough, the protocol escalates: a registered backstop bidder can take the position over, the Insurance Fund covers any remaining shortfall, and only when both are exhausted does auto-deleveraging (ADL) start. ... No backstop bidders are registered on testnet, so the later stages come in sooner."

## Environment
- SDK: n/a (raw HTTP/JSON-RPC, no SDK used)
- Wallet: n/a — no wallet, no signature, no transaction broadcast
- Chain: Somnia Tokyo testnet, chainId 50312, RPC https://50312.rpc.thirdweb.com, 19 October 2026
- Contracts: MarginBank 0xdd4A14A2763FDa39b9759D2D4150DB0e0f085C4E
