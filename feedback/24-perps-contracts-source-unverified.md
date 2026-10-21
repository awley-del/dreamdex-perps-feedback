# No perps contract has published source on the explorer

Severity: normal
Area: contracts

## Steps to reproduce
1. GET https://shannon-explorer.somnia.network/api/v2/smart-contracts/{address} for the perps stack on chainId 50312:
   - proxies: 0xdd4A14A2763FDa39b9759D2D4150DB0e0f085C4E, 0x516d2cb6de41bE98444e887793946E65989Ba07b, 0xe01ef816783DC5f95B1982cacF9d0E3DB1bC2f28, 0xac9c074A0E4BDc7ceA0993F0764853cA1C5AFB1B, 0x776f83bb37CF570e5d19BB7De76511a191fa24FE
   - implementations: 0xd368fbc86fc2049ab6c9e663e382c556d9c70fed, 0x6fc3bb5c5a14e09297b7c64ed052e8292fbe9d1f, 0x0950e20ac437d101706718e43454e76c17c6e5ca, 0x8289c75a3d4749c649725cf0158e77a384b23f98, 0x82a149f1ab42e80d0207442f0ded27e09fdbf30b
   - shared pool beacon: 0xedde71850bb7fc647cb000012e96dc695645f556
   - sample pool: 0x3892A5179F8eA0C810c45d1630546c0317b0e5B6
2. Inspect `is_verified`, `name`, and `file_path`/`source_code` in each response.

## Expected
Contracts that hold user margin and route liquidations should have verified source on the explorer (or a linked audit covering the perps scope) so builders and integrators can review the code they are trading against.

## Actual
12 of 12 probed perps addresses return `is_verified: false`, `name: null`, and no source code — only creation/deployed bytecode (proxy entries report `proxy_type: "eip1967"`). Reviewers cannot map the deployed implementations to any published source.

## Evidence
Fresh explorer API probes, 19 October 2026 (two independent passes, identical outcome):
- probe_count: 12
- verified_count: 0
- per-address responses: {"is_verified": false, "name": null, "proxy_type": "eip1967" | null} for every address in the list above

## Environment
- SDK: n/a (raw HTTP/JSON-RPC, no SDK used)
- Wallet: n/a — no wallet, no signature, no transaction broadcast
- Explorer API: https://shannon-explorer.somnia.network/api/v2/smart-contracts/{address}
- Chain: Somnia Tokyo testnet, chainId 50312, 19 October 2026
