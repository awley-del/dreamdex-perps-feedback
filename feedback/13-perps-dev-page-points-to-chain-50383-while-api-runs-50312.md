# Perps developer page documents chain 50383 (Hideki) contract addresses that have no code on the chain the perps API actually runs (50312)
Severity: major
Area: docs

## Steps to reproduce
1. Open the bounty resource page "Perps on testnet for developers" (linked in this program's Resources): it says perps run on chain ID 50383 (Hideki, RPC api.hideki2.infra.testnet.somnia.network) and lists MarginBank `0x478769E1177C0773c43A593DCCc4Ad15F15F1394`, Collateral (USDso) `0xed7993A74dAe1e6656B704A424DcD8711aAf4F72`.
2. The HTTP API spec (and the Contract Addresses page) say testnet is chain 50312 with USDso `0x9c32F3827A1a99f0cf9B213de8b53eC3d57bb171`; `GET /v0/markets?kind=perp` returns markets with `"chainId":50312` and perp contracts like `0x440f5a79857cd632ae45439410969c3f4049cc41`.
3. Compare on-chain code with eth_getCode on both RPCs (`https://50312.rpc.thirdweb.com` and `https://api.hideki2.infra.testnet.somnia.network`).

## Expected
Both official pages describe the same testnet deployment, so an address taken from the perps page exists on the chain the API trades on.

## Actual
The two deployments are disjoint — eth_getCode:
- MarginBank 0x478769E1...: code on 50383 (354B), EMPTY on 50312.
- USDso perps page 0xed7993A7...: code on 50383 (56822B), EMPTY on 50312.
- USDso contracts page 0x9c32F382...: code on 50312 (7532B), EMPTY on 50383.
- API perp contract 0x440f5a79...: code on 50312 (644B), EMPTY on 50383.
A builder following the perps developer page against the API environment (or the HTTP API against that page's addresses) reads no contract at the documented address — setup fails at step one of "contracts and SDK setup", the exact link this bounty advertises.

## Evidence
evidence/reval-20261019/docs/E_getcode_matrix.json (full matrix, saved 10:36 UTC), docs captures evidence/reval-20261019/docs/perps-testnet.txt (50383 block) and developers_contracts_contract-addresses.txt (50312 block), API markets evidence/reval-20261019/sdk/markets-perp.json.

## Environment
SDK: n/a (docs + eth_getCode). Network: Somnia Tokyo testnet chainId 50312 vs Hideki chainId 50383 (chainIds verified via eth_chainId on both RPCs: 0xc488, 0xc4cf). Wallet: n/a (read-only). Evidence date: 2026-10-19 10:30-10:50 UTC.
