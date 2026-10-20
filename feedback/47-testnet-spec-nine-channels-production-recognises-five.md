# The testnet spec advertises nine subscribe channels and production recognises five, so four documented channels answer unknown_channel on mainnet

Severity: major
Area: docs

## Steps to reproduce
1. Fetch both published specs and compare how each declares the subscribe channel set:
   - `curl -s https://api.testnet.dreamdex.io/.well-known/async.json` — 62,793 bytes, `info.version 0.1.0`, 28 messages / 42 schemas / 28 operations, servers `production` + `testnet`. The channel names live in `components.schemas.SubscribeRequest.oneOf` — nine arms, each pinning `channel.const`: orderbook, ohlcv, trades, order, pending_order, funding, liquidation, positions, markets. `UnsubscribeRequest` carries the same nine.
   - `curl -s https://api.dreamdex.io/.well-known/async.json` — 41,094 bytes, `info.version 0.0.0`, 19 messages / 27 schemas / 19 operations, servers `production` + `staging`. There is no `oneOf`: `SubscribeRequest.properties.channel.enum` lists five names — orderbook, ohlcv, trades, order, pending_order.
2. Open `wss://<host>/v0/ws/public` on each host and send one `{"operation":"subscribe","channel":<name>,"params":{…}}` frame per name, reading the returned frames.
3. Include a deliberately invalid channel name as a control, to separate "unknown to this build" from "known but not serving".

## Expected
One channel vocabulary across environments, or a mainnet spec that clearly states which of the testnet channels do not exist on mainnet. The error taxonomy already distinguishes the two cases (`unknown_channel` vs `subscription_failed`), so the distinction is observable from outside.

## Actual
Production and staging answer `unknown_channel` for four of the nine testnet channels, and recognise the five the mainnet spec lists. Testnet recognises all nine. Control behaves as expected on every host:

```
channel         api.dreamdex.io        stg.api.dreamdex.io    api.testnet.dreamdex.io
markets         ERR:unknown_channel    ERR:unknown_channel    subscribed + snapshot
positions       ERR:unknown_channel    ERR:unknown_channel    ERR:subscription_failed
funding         ERR:unknown_channel    ERR:unknown_channel    ERR:subscription_failed
liquidation     ERR:unknown_channel    ERR:unknown_channel    ERR:subscription_failed
orderbook       ERR:subscription_failed ERR:subscription_failed ERR:subscription_failed
trades          ERR:subscription_failed ERR:subscription_failed ERR:subscription_failed
ohlcv           ERR:subscription_failed ERR:subscription_failed ERR:subscription_failed
order           ERR:subscription_failed ERR:subscription_failed ERR:subscription_failed
pending_order   ERR:subscription_failed ERR:subscription_failed ERR:subscription_failed
bogus_control   ERR:unknown_channel    ERR:unknown_channel    ERR:unknown_channel
```

`markets` is the sharpest case: on testnet it is the one channel that now works end to end — `subscribed` followed by a `snapshot` frame carrying live market rows — and on production it is rejected as a channel that does not exist. A builder who develops against the testnet spec, verifies a working markets feed, and then points the same code at production gets `unknown_channel` and no feed at all.

The two spec files also disagree on surface area beyond the channel names: production's spec has no `LiquidationLeg`, no `MarketsUpdate`, and no `LiquidationSnapshot`/`FundingSnapshot` models that testnet publishes, and it reports itself as version 0.0.0 against testnet's 0.1.0. Serving two different contract versions under the same title from the same `.well-known` path means a spec-driven client is correct on one environment and wrong on the other with no signal about which.

## Evidence
```
testnet spec sha256 d74f2c0a56acfc03164f261c484dd977db0d5d2bfb0f3d223717104fa43e436b  62,793 B  v0.1.0  28 msg / 42 schema / 28 op  channels.public only
mainnet spec sha256 04778aa3c64113578c6b1d4c36743a8e4b6820a31e64e7325dac95dc857e8474  41,094 B  v0.0.0  19 msg / 27 schema / 19 op  channels.public only
```
Raw probe output: `ws_matrix_prod_vs_testnet_20261020.json`, `async_testnet_20261020.json`, `async_mainnet_20261020.json`, hashes in `SPEC-HASHES.txt`.

Note the shape of the drift: `channels` is not where the channel list lives in either file — it holds exactly one entry, `public` at address `/public`, the transport channel. Any count taken from `channels` yields one. The nine names are the `SubscribeRequest` union arms, which is why the two environments can advertise different feed sets under the same `channels` block.

## Environment
2026-10-20 (UTC). Hosts: api.dreamdex.io, stg.api.dreamdex.io, api.testnet.dreamdex.io. Read-only: one subscribe frame per channel against public market data, no auth token, no order, no state change. The `positions` and `order` subscriptions were sent without a bearer token on every host, which is why their testnet result is `subscription_failed` rather than a data feed — that is not the claim here; the claim is only which names each build recognises, and the control channel proves the recognition check is sound.
