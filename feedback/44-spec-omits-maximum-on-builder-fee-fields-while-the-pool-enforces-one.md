# The spec declares the builder-fee ceilings as unbounded integers while every pool enforces a finite on-chain cap

Severity: normal
Area: docs

## Steps to reproduce
1. Read the request schema for `POST /v0/markets/{symbol}/builder/approve` in the published spec: `maxFeeBpsTimes1k` is declared as `{"type":"integer","minimum":0}`.
2. Read the same field in the order-prepare schemas that carry a builder fee.
3. Compare with the pool's enforced ceiling: `eth_call getMaxBuilderFeeBpsTimes1k()` -> `10000` on ADA:USDso, `100000` on SOMI:USDso.
4. Send a value above the ceiling and observe that the API accepts it.

## Expected
The spec states the upper bound, or points at the endpoint that returns it per pool, so a builder validating against the schema cannot construct a request that the contract will reject.

## Actual
`minimum: 0` is the only constraint in the schema, with no maximum and no reference to the per-pool ceiling. The field type is therefore a strict superset of what the chain accepts.

The value that actually matters is only obtainable from `GET /v0/markets/{symbol}/builder/max-fee`, and that endpoint is absent from the spec's own path list even though the same spec documents `BuilderMaxFee` as a response schema and describes `protocolMaxFee` in the builder-approval prose. `GET /v0/markets/{symbol}/builder/approval` is missing the same way: the `BuilderApproval` schema exists, the path does not.

A client generated from this spec will type the field as a non-negative integer, validate successfully, prepare a transaction, and only discover the real bound when the pool reverts with `BuilderFeeExceedsCap()`.

## Evidence
- `evidence/lane-new-20261020/spec_builder.py` — dumps the declared schema for each builder path, showing `minimum: 0` and no maximum, and the two paths that carry schemas without existing in `paths`.
- `evidence/lane-new-20261020/approve_clamp.json` — the API accepting and encoding `1000000000` for a 10000 pool.
- `evidence/lane-new-20261020/final_builder.json` — on-chain ceiling read, agreeing with the undocumented API endpoint.
- Spec file used: `evidence/lane-new-20261020/oapi.json`.

## Environment
- SDK: n/a (raw HTTP/JSON-RPC, no SDK used)
- Network: Somnia Tokyo testnet, chainId 50312.
- Wallet: n/a — no wallet, no signature, no transaction broadcast
- Spec: `https://api.testnet.dreamdex.io/.well-known/openapi.json`, fetched 2026-10-20.
