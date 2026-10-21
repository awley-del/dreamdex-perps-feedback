# vault/approve answers HTTP 200 with a literal null body for a currency the same endpoint lists as accepted

Severity: normal
Area: API

## Steps to reproduce
With a valid bearer token:
1. `POST /v0/markets/SOMI:USDso/vault/approve` body `{"currency":"USDso","amount":"1"}` -> 200 with a transaction object.
2. `POST /v0/markets/SOMI:USDso/vault/approve` body `{"currency":"SOMI","amount":"1"}` -> 200 with the literal body `null`.
3. `POST /v0/markets/SOMI:USDso/vault/approve` body `{"currency":"NOPE","amount":"1"}` -> 400 `invalid_currency`, and the error context names the accepted set: `"accepted":["SOMI","USDso"]`.

## Expected
Every 200 from a prepare endpoint carries a transaction object, as the USDso case does. A currency the endpoint itself reports as accepted must either prepare normally or be rejected with an error the client can act on.

## Actual
`SOMI` returns `200` with body `null` and no headers or fields that distinguish it from a successful prepare, while the unknown value `NOPE` is correctly rejected with a 400 that lists `SOMI` as accepted. So the value the API says is valid is the exact value that yields an empty success.

A client that follows the documented flow (`if (status === 200) sign(body)`) receives `null` and has nothing to sign, with no error to surface. The failure is silent and only appears downstream at signing.

Reproduced 3 of 3 runs on 2026-10-20, with the controls below in the same batch:
- `SOMI:USDso` + `USDso` -> 200 transaction object
- `SOMI:USDso` + `SOMI` -> 200 `null`
- `SOMI:USDso` + `NOPE` -> 400 `invalid_currency`, `accepted:["SOMI","USDso"]`
- `ADA:USDso` + `SOMI` -> 404 `market_not_found`, `this operation does not serve perp markets` (different layer, confirming the SOMI result is not a market resolution artefact)

## Evidence
- `evidence/lane-new-20261020/null_response.json` — all three runs with status and raw body for each case.
- `evidence/lane-new-20261020/vault_retest.json` — the earlier ladder showing the same endpoint returning `encoded=None` for every SOMI amount while USDso encodes normally.

## Environment
- SDK: n/a (raw HTTP/JSON-RPC, no SDK used)
API `https://api.testnet.dreamdex.io/v0`, Somnia Tokyo testnet chainId 50312. Auth: SIWE bearer from a fresh testnet wallet. Date: 2026-10-20.
