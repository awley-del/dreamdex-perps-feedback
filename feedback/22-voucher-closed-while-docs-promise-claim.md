# Voucher distributor campaign is over with zero budget and claim() reverts while the docs still promise any address can claim 1,000 USDso

Severity: normal
Area: contracts

## Steps to reproduce
1. On chainId 50312 call `getConfig()` on VoucherDistributor 0x776f83bb37CF570e5d19BB7De76511a191fa24FE. The config words decode to: grant amount word = 5000000000000000000, expiry word = 2592000, campaign start = 1784583208 (2026-07-20T21:33:28Z), campaign end = 1792359208 (2026-10-18T21:33:28Z).
2. Call `budgetRemaining()` -> 0.
3. Call `claim()` from any address via eth_call -> revert.
4. USDso `decimals()` on 0x9c32F3827A1a99f0cf9B213de8b53eC3d57bb171 -> 18, so the grant word equals 5 USDso, not the documented 1,000 USDso.

## Expected
Either the distributor still honours the documented flow ("Any address can claim the 1,000 USDso perps credit once, as long as it holds no perp positions or orders") or the docs state the campaign window and the current closed state.

## Actual
The campaign ended 2026-10-18T21:33:28Z (one day before this audit), budgetRemaining is 0, and claim() reverts for every caller. The SDK snippet the docs publish (getPerpVoucherEligibility -> claimPerpVoucher) leads straight into a revert path, and the documented grant amount (1,000 USDso) does not match the configured grant word (5 USDso at 18 decimals).

## Evidence
Fresh eth_call results, 19 October 2026 (repeated in two independent passes):
- getConfig words: [.., 5000000000000000000, 2592000, 1784583208, 1792359208]
- start = 2026-07-20T21:33:28Z, end = 2026-10-18T21:33:28Z
- budgetRemaining() = 0
- claim() = revert
- USDso decimals() = 18
- Docs quote (perps testnet page): "Paper USDso. Any address can claim the 1,000 USDso perps credit once, as long as it holds no perp positions or orders"

## Environment
- SDK: n/a (raw HTTP/JSON-RPC, no SDK used)
- Wallet: n/a — no wallet, no signature, no transaction broadcast
- Chain: Somnia Tokyo testnet, chainId 50312, RPC https://50312.rpc.thirdweb.com, 19 October 2026
- Contracts: VoucherDistributor 0x776f83bb37CF570e5d19BB7De76511a191fa24FE, USDso 0x9c32F3827A1a99f0cf9B213de8b53eC3d57bb171
