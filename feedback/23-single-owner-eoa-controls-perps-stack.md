# One EOA owns every core perps contract and the shared pool beacon

Severity: normal
Area: contracts

## Steps to reproduce
1. On chainId 50312 call `owner()` via eth_call on:
   - MarginBank 0xdd4A14A2763FDa39b9759D2D4150DB0e0f085C4E
   - PerpPoolFactory 0x516d2cb6de41bE98444e887793946E65989Ba07b
   - LiquidationEngine 0xe01ef816783DC5f95B1982cacF9d0E3DB1bC2f28
   - InsuranceFund 0xac9c074A0E4BDc7ceA0993F0764853cA1C5AFB1B
   - VoucherDistributor 0x776f83bb37CF570e5d19BB7De76511a191fa24FE
   - Shared pool beacon 0xedde71850bb7fc647cb000012e96dc695645f556
2. All six return the same address: 0xd58596620Ee6951B2958a931949e4ff7ce6222be.

## Expected
A perps stack that will be presented as production should document its admin model (multisig/timelock/role separation), or at least state that a single key controls every component on the testnet preview.

## Actual
A single EOA controls the margin ledger, the pool factory, the liquidation engine, the insurance fund, the voucher distributor, and the shared beacon that all 24 pool proxies hang off. Whoever holds that key can upgrade every perps implementation (beacon upgrade covers all pools at once) with no second party and no delay visible on-chain. Nothing in the docs discloses this admin concentration.

## Evidence
Fresh eth_call owner() results, 19 October 2026 (two independent passes, identical values):
- marginBank = 0xd58596620ee6951b2958a931949e4ff7ce6222be
- perpPoolFactory = 0xd58596620ee6951b2958a931949e4ff7ce6222be
- liquidationEngine = 0xd58596620ee6951b2958a931949e4ff7ce6222be
- insuranceFund = 0xd58596620ee6951b2958a931949e4ff7ce6222be
- voucherDistributor = 0xd58596620ee6951b2958a931949e4ff7ce6222be
- poolBeacon = 0xd58596620ee6951b2958a931949e4ff7ce6222be

## Environment
- Chain: Somnia Tokyo testnet, chainId 50312, RPC https://50312.rpc.thirdweb.com, 19 October 2026
