# `markets` WebSocket channel serves only event contracts, the one kind the spec says the feed excludes

Severity: normal
Area: API / docs

## Steps to reproduce

The published spec documents a WebSocket feed and states explicitly which market kinds it
does not serve. In `MarketKindFilter` (`components/schemas`) the description reads:

> The cross-market tape (`/v0/trades/all`) and the WebSocket feeds don't serve event
> contracts yet.

The gateway is live at `wss://api.testnet.dreamdex.io/v0/ws`. It is not listed in the
spec's `servers` block, which declares only the HTTPS base URL, so the endpoint has to be
recovered by probing paths on the API host. `/v0/ws` completes the upgrade; every other
candidate (`/ws`, `/v0/stream`, `/realtime`, `/socket`, `/feed`, `/v0/feed`,
`/ws/ohlcv`) answers HTTP 404.

Subscribe to the `markets` channel:

```python
import asyncio, json, websockets

async def main():
    async with websockets.connect("wss://api.testnet.dreamdex.io/v0/ws") as ws:
        await ws.send(json.dumps({
            "operation": "subscribe", "id": 1,
            "channel": "markets", "params": {"symbol": "SOMI:USDso"}}))
        for _ in range(2):
            print(await ws.recv())

asyncio.run(main())
```

## Expected

Either the `markets` channel serves spot and perp markets and excludes event contracts as
documented, or the documentation states that the feed is event-only.

## Actual

The first frame after `subscribed` is a `snapshot` containing 13 markets, and every one of
them is an event contract:

```json
{"channel":"markets","type":"snapshot","chainId":50312,"markets":[
  {"symbol":"BTC-198550:tUSDC","asset":"BTC","interval":"1m",
   "tradingStart":1792480202000,"expiry":1792480260000}, ...]}
```

Stable across three independent sockets, three runs:

```
run1 frames=2 unique_syms=13 kinds={'event': 13}
run2 frames=2 unique_syms=13 kinds={'event': 13}
run3 frames=4 unique_syms=13 kinds={'event': 13}
```

Meanwhile the spot and perp data the channel is advertised to carry is present in REST and
absent from the feed:

```
REST ?kind=spot : 200 3
REST ?kind=perp : 200 24
REST ?kind=event: 200 13
WS markets snapshot: 13 unique symbols, 13 classified event, 0 spot, 0 perp
```

25 symbols present in `?kind=all` never appear in the WS snapshot: `ADA:USDso`,
`AVAX:USDso`, `BNB:USDso`, `DOGE:USDso`, `HYPE:USDso`, `LINK:USDso`, and the rest of the
perp set plus all three spot markets.

The inverse also holds: `?kind=all` returns 38 markets and the WS snapshot returns the 13
event contracts out of those 38. Set difference in both directions is exact.

## Evidence

- `ws_markets.json` - full captured frames, WS market map, REST sets, and both set
  differences
- `ws_verify3.json` - three independent subscriptions plus the REST coverage counts
- `ws_probe.json` - the path sweep that located `/v0/ws` and the HTTP 404 on all eleven
  other candidates

## Environment

- API `https://api.testnet.dreamdex.io`, gateway `wss://api.testnet.dreamdex.io/v0/ws`
- Spec `/.well-known/oapi.json`
- `websockets` 17.1, Python 3, chainId 50312
