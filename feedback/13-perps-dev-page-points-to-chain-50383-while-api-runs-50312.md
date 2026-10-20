# Perps developer page documents chain 50383 while the HTTP API and Contract Addresses page describe a different deployment on 50312; two of the six documented addresses resolve to a different contract there

Severity: normal
Area: docs

## Steps to reproduce

1. Open "Perps on testnet for developers". It states perps run on chain ID **50383** (Hideki, RPC `api.hideki2.infra.testnet.somnia.network`) and lists the contract set.
2. Open "Contract Addresses". Its testnet section is labelled **Somnia Shannon, chain ID 50312** and lists only spot contracts ($USDso `0x9c32F3827A1a99f0cf9B213de8b53eC3d57bb171`, SpotPool, SpotRouter) — no perps contract.
3. The HTTP API (`GET /v0/markets?kind=perp`) returns 24 rows, all `"chainId": 50312`, with perp pool addresses such as `0x440f5a79857cd632ae45439410969c3f4049cc41`.
4. Run `eth_chainId`, `eth_getCode` and a name read on both RPCs for each address the perps page publishes.

## Expected

Either the docs describe one testnet deployment, or they state plainly that there are two (spot on Shannon 50312, perps on Hideki 50383), which endpoints belong to which, and that an address from one is meaningless on the other.

## Actual

The two pages are each internally accurate about their own chain, and the perps page does name 50383 — but the docs never state that these are two separate deployments, and addresses published on the perps page are *reused* on 50312 rather than simply absent:

| contract (perps page) | address | code @50383 | code @50312 | `name()` @50312 |
|---|---|---|---|---|
| MarginBank | `0x478769E1177C0773c43A593DCCc4Ad15F15F1394` | 176 B (EIP-1967 proxy) | none | — |
| Collateral (USDso) | `0xed7993A74dAe1e6656B704A424DcD8711aAf4F72` | 2,840 B | none | — |
| PerpPoolFactory | `0xE631fAEE547baeE07353E290f0562ea67d856560` | 176 B proxy | **1,783 B** | **"USD Coin"** |
| LiquidationEngine | `0xA66d3C24Ad4a389d863846905D8173e1017e9F4D` | 176 B proxy | **16,656 B** | (reverts) |
| InsuranceFund | `0x50826894D47C6D4f3BeA38BFDC7Dc5c5be171b80` | 176 B proxy | none | — |
| VoucherDistributor | `0x2ACD9EFdA721450906bfE1bef3edE269636E42C4` | 176 B proxy | none | — |

`eth_chainId` returns `0xc4cf` (50383) and `0xc488` (50312) — two distinct chains, not two RPC views of one.

The dangerous rows are the two with code on both: `0xE631fAEE…` is the PerpPoolFactory on 50383 and an ERC-20 called "USD Coin" on 50312, and `0xA66d3C24…` is the LiquidationEngine on 50383 and a different 16 KB contract on 50312. A builder who copies an address off the perps page and points it at the RPC the program's own HTTP API reports (`chainId: 50312`) does not get "no code" — they get a live, unrelated contract, and a `try/catch` around the call will not catch it.

So the failure is navigational and it happens at the first step of the page the program advertises: "contracts and SDK setup" leads to a Contract Addresses page describing a different chain, and the program's API serves the other one.

## Evidence

All rows above were read 2026-10-20 with:

```
eth_chainId      api.hideki2.infra.testnet.somnia.network -> 0xc4cf (50383)
eth_chainId      50312.rpc.thirdweb.com                   -> 0xc488 (50312)
eth_getCode      <each address> on both RPCs
eth_getStorageAt <each 50383 address> 0x360894a1…2bbc     -> EIP-1967 implementation
eth_call         name() = 0x06fdde03
```

Implementation addresses behind the 50383 proxies (EIP-1967 slot `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc`), with runtime sizes:

```
MarginBank          0x478769E1… -> impl 0xf0b09d6869e6b016124f19fab86bd0f73b9c3b10   57,710 B
PerpPoolFactory     0xE631fAEE… -> impl 0x9703c46aba162b1c4b8fc8562e85a93698a1c139   89,918 B
LiquidationEngine   0xA66d3C24… -> impl 0x704352839b69a24401ebd948ad89d8373045219b   72,233 B
InsuranceFund       0x50826894… -> impl 0x930f47abc9b0b35975c884c7a1d4a6cd45f87deb   18,299 B
VoucherDistributor  0x2ACD9EFd… -> impl 0x9657f0fd53efc01cd108d93c835bb4b517732b43   12,785 B
```

The Contract Addresses page's spot `$USDso 0x9c32F382…` has 0 bytes of code on 50383 and 3,765 B on 50312, so the split is symmetric.

Docs captures: perps developer page (50383 block) and Contract Addresses page ("Testnet (Somnia Shannon, chain ID 50312)", spot-only).

## Environment

Docs + JSON-RPC only, no SDK and no wallet. Networks: Hideki 50383 vs Shannon 50312. All calls are reads.
