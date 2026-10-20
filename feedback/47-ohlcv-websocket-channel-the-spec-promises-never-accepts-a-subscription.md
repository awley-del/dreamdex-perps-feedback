# `ohlcv` WebSocket channel the spec promises never accepts a subscription

Severity: normal
Area: API / docs

## Steps to reproduce

`GET /v0/markets/{symbol}/candles` documents the WebSocket equivalent in its description:

> For spot and perp, the `ohlcv` WebSocket channel serves the same aggregation, so a chart
> can snapshot here and stream there without them disagreeing; it doesn't stream event
> contracts yet.

The gateway is `wss://api.testnet.dreamdex.io/v0/ws`. Channel names are matched against a
vocabulary: an unknown one answers `unknown_channel`. `ohlcv` passes that check, so it is a
registered channel, and then the subscription fails.

```python
import asyncio, json, websockets

async def main():
    async with websockets.connect("wss://api.testnet.dreamdex.io/v0/ws") as ws:
        await ws.send(json.dumps({
            "operation": "subscribe", "id": 1,
            "channel": "ohlcv",
            "params": {"symbol": "SOMI:USDso", "interval": "1m"}}))
        print(await ws.recv())

asyncio.run(main())
```

## Expected

`{"type":"subscribed","channel":"ohlcv"}` followed by a snapshot of the current candle,
matching what `GET /v0/markets/SOMI:USDso/candles?interval=1m` returns.

## Actual

```
{"type":"error","errorName":"subscription_failed",
 "message":"subscription failed to channel: ohlcv"}
```

Eight attempts across four parameter shapes and two runs each, on fresh sockets, all fail
identically:

```
{"symbol":"SOMI:USDso","interval":"1m"}             run1 FAIL  subscription_failed
{"symbol":"SOMI:USDso","interval":"1m"}             run2 FAIL  subscription_failed
{"symbol":"SOMI:USDso","interval":"1m","limit":100} run1 FAIL  subscription_failed
{"symbol":"SOMI:USDso","interval":"1m","limit":100} run2 FAIL  subscription_failed
{"symbol":"SOMI:USDso"}                             run1 FAIL  subscription_failed
{"symbol":"SOMI:USDso"}                             run2 FAIL  subscription_failed
{"symbols":["SOMI:USDso"],"interval":"1m"}          run1 FAIL  subscription_failed
{"symbols":["SOMI:USDso"],"interval":"1m"}          run2 FAIL  subscription_failed
```

The same happens on a perp symbol (`ADA:USDso`) and on an event symbol
(`BTC-198546:tUSDC`). Not a parameter problem, because the failure is identical for every
shape, including the no-interval shape the `markets` channel accepted.

The REST equivalent is healthy for the exact same symbol, so the data exists:

```
GET /v0/markets/SOMI:USDso/candles?interval=1m&limit=2 -> 200
{"symbol":"SOMI:USDso","interval":"1m","candles":[
  {"timestamp":1792480440000,"open":"0.1869","high":"0.1869",
   "low":"0.1868","close":"0.1868","volume":"150"}, ...]}
```

## Additional observation

The gateway itself is undocumented. The spec's `servers` block declares only
`https://api.testnet.dreamdex.io`. There are no WebSocket paths in `paths`, no channel or
subscription schemas in `components/schemas`, and no `x-` vendor extension describing the
protocol. A developer reading the spec is told the `ohlcv` channel exists but is given no
URL, no message envelope, and no channel list. The envelope has to be discovered:

- `{"operation": "..."}` is required, empty is rejected
- every message needs an integer `id`
- the channel goes in `channel`, its arguments in `params`
- `ping` returns `{"operation":"pong","serverTimestamp":...}`
- recognised channels are `markets`, `ohlcv`, `trades`, `orderbook`, `funding`,
  `positions`; everything else answers `unknown_channel`

Of those six, only `markets` ever returns data. Documenting the protocol would remove the
need to find any of this by probing.

## Evidence

- `ws_ohlcv_proof.json` - `{"ohlcv_served": false, "rest_status": 200, "frames": [...]}`,
  all ten probe frames plus the REST control
- `ws_chan2.json` - channel vocabulary sweep: 38 candidates harvested from the shipped
  bundle, 4 recognised, only `markets` returns data
- `ws_ops.json` - operation vocabulary; every state-changing name answers `unknown_operation`
- `ws_probe.json` - path sweep that located `/v0/ws`

## Environment

- API `https://api.testnet.dreamdex.io`, gateway `wss://api.testnet.dreamdex.io/v0/ws`
- Spec `/.well-known/oapi.json`, `websockets` 17.1, Python 3, chainId 50312
