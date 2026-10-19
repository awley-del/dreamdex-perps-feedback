# Subscribe replies subscribed and then subscription_failed for the same frame (contradictory protocol responses)
Severity: normal
Area: API

## Steps to reproduce
1. Connect to `wss://api.testnet.dreamdex.io/v0/ws`.
2. Send `{"operation":"subscribe","channel":"markets","params":{"chainId":50312}}`.
3. Read the next two server frames.

## Expected
Exactly one terminal reply per subscribe, per the AsyncAPI Subscribe message contract: either `subscribed` (then data) or `error` (then no subscription).

## Actual
The server sends `{"type":"subscribed","channel":"markets"}` followed ~0.3s later by `{"type":"error","errorName":"subscription_failed","message":"subscription failed to channel: markets"}`. Same double response observed for `positions` (with a valid token) and `order`. The error carries no reason field, so the client cannot distinguish validation failure from backend failure. Any SDK implementing the documented flow ("on success replies with a subscribed confirmation, then the feed's current state") will mis-handle this: it marks the subscription active, never gets data, and has no distinct error to react to.

## Evidence
evidence/reval-20261019/A_ws_retest.json and A_ws_log.json — sequences with timestamps (subscribed -> error pairs for markets/positions/order).

## Environment
SDK: python websocket-client 1.9.0. Network: Somnia Tokyo testnet, `wss://api.testnet.dreamdex.io/v0/ws`. Wallet: 0x7ad5236a662F1B6F85Eaf752CdC21843Cf9197bC. Reproduced on 4 connections.
Evidence date: 2026-10-19 10:05-10:12 UTC.
