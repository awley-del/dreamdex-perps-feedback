# Bot kit ships with a default spot symbol that does not exist on the testnet it targets

Severity: normal
Area: SDK

## Steps to reproduce
1. Clone the kit: `git clone https://github.com/somnia-chain/dreamdex-bot-kit`.
2. Read the shipped defaults:
   - `scripts/operator-setup.ts:12` — `OP_SYMBOL=USDC.e:USDso` (usage example is the default path)
   - `scripts/order-history.ts:20` — `SYMBOL=USDC.e:USDso npx tsx scripts/order-history.ts`
   - `examples/06-multipair-competition/*` (bot/executor.py, market_scanner.py, tests) — `USDC.e:USDso` defaults
   - `README.md` — documents `USDC.e:USDso` as the spot symbol
3. List the spot markets the testnet actually serves:
   `curl -s 'https://api.testnet.dreamdex.io/v0/markets?kind=spot'` → exactly `SOMI:USDso`, `WBTC:USDso`, `WETH:USDso` (reproduced 13:0x UTC).
4. Look up the shipped default: `curl -s 'https://api.testnet.dreamdex.io/v0/markets/USDC.e%3AUSDso'` → `404 market_not_found` (13:05 UTC).

## Expected
A kit whose purpose is "run the examples against testnet" ships defaults that resolve on that testnet, so a first `npx tsx scripts/...` run works out of the box.

## Actual
Every script run with the shipped default symbol fails against the live market registry with `market_not_found`. A new integrator has to discover the real spot list themselves before anything runs.

## Evidence
```
kind=spot on api.testnet → [SOMI:USDso, WBTC:USDso, WETH:USDso]
USDC.e:USDso             → 404 market_not_found
kit defaults             → operator-setup.ts, order-history.ts, examples/06, README.md
```

## Environment
- SDK: @dreamdex-bot-kit 0.1.0 (cloned upstream)
- Wallet: n/a — no wallet, no signature, no transaction broadcast
Testnet 2026-10-19 (UTC):
- App: https://app.testnet.dreamdex.io
- API: https://api.testnet.dreamdex.io
- WebSocket: wss://api.testnet.dreamdex.io/v0/ws/public
- Bot kit: github.com/somnia-chain/dreamdex-bot-kit (cloned for this report)
