# Margin deposit ignores the currency parameter entirely while the market vault rejects the same values

Severity: normal
Area: API

## Steps to reproduce
With a valid bearer token:
```
POST /v0/account/margin/deposit
{"amount":"1","currency":"FAKE"}
-> 200 + calldata   (same for currency "" and "<script>" and "USDT")

POST /v0/markets/SOMI:USDso/vault/deposit
{"amount":"1","currency":"FAKE"}
-> 400 invalid_currency
```
All four margin responses are byte-identical: `to`=MarginBank `0xdd4A...5C4E`, `data`=deposit(1e18), `approval.token`=USDso `0x9c32...b171` — the currency string is never consulted. Fresh 2026-10-19 13:25 UTC; same pattern twice in the fuzz runs (12:27, 12:30 UTC).

## Expected
Either the margin endpoint validates `currency` the way the vault does (rejecting unknown values), or the docs mark the field as ignored. One contract across the two deposit paths.

## Actual
The same value is a hard `400 invalid_currency` on the vault path and a silent `200` on the margin path — where the field is dead input (always USDso calldata). Integrators get contradictory validation for the same concept, and a client that gates on the vault's behavior will still hand users a margin response for junk currencies with no feedback that the field was discarded.

## Evidence
```
margin FAKE/""/<script>/USDT -> 200 identical USDso calldata
vault  FAKE                  -> 400 invalid_currency
```

## Environment
Testnet 2026-10-19 (UTC):
- API: https://api.testnet.dreamdex.io (chain 50312)
- Auth: fresh SIWE bearer minted for this test
- Re-run: every step is a plain curl
