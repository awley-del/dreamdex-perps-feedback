# Nine of twenty-four perps pools have no stop-order registry while the docs advertise TP/SL on every market

Severity: normal
Area: contracts

## Steps to reproduce
1. On Somnia Tokyo testnet (chainId 50312, RPC https://50312.rpc.thirdweb.com) read the pool list from the perps factory `0x516d2cb6de41bE98444e887793946E65989Ba07b` (24 pools).
2. For each pool call `getStopOrderRegistry(address)` on the factory via eth_call.
3. Count zero-address results: 9 of 24 pools return `0x0000000000000000000000000000000000000000` — SWBTC, SWBTCA, SWBTCB, SWBTCC, SWBTCD, SWETH, SWDOGE, SWBNB, SWSOL. The other 15 return a registry address.
4. Cross-check activity: SWDOGE (one of the zero-registry pools) received order activity on 19 October 2026 06:03 UTC.

## Expected
Either every market the docs present as tradeable has a stop-order registry wired (the SDK's TP/SL path calls the PerpStopOrderRegistry), or the docs carry a per-market caveat that TP/SL is unavailable on those nine markets.

## Actual
For the nine markets above the perps TP/SL plane has no contract to call. The orders docs present TP/SL as a general feature ("Take profit and stop loss ... Set them on a new order, or on an open position from the positions table") with no per-market caveat, so builders following the docs will target markets whose stop-order path is not wired.

## Evidence
- Fresh eth_call sweep on 19 October 2026 (repeated in two independent audit passes, same result):
  - zero registries (9): SWBTC, SWBTCA, SWBTCB, SWBTCC, SWBTCD, SWETH, SWDOGE, SWBNB, SWSOL
  - set registries: 15 of 24
- Docs quote (orders page): "Take profit and stop loss A take profit (TP) closes a position when the price reaches your target, and a stop loss (SL) closes it when the price moves against you. Both are reduce-only. Set them on a new order, or on an open position from the positions table."

## Environment
- SDK: n/a (raw HTTP/JSON-RPC, no SDK used)
- Network: Somnia Tokyo testnet, chainId 50312, RPC https://50312.rpc.thirdweb.com, 19 October 2026 Contracts: PerpPoolFactory 0x516d2cb6de41bE98444e887793946E65989Ba07b (owner of the registry wiring)
- Wallet: n/a — no wallet, no signature, no transaction broadcast
