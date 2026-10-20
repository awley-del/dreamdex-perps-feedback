#!/usr/bin/env node
// Repro for feedback/48-docs-open-interest-cap-is-2x-or-4x-the-on-chain-cap.md
//
// Shows that the "Open interest cap" column of
// https://docs.dreamdex.io/trading/perps-testnet does not match the per-market
// maxOpenInterest enforced by the perp pools on the chain the same docs name for
// perps (Hideki, chain 50383).
//
// Reads only. No account, no funds, no writes.
//
//   npm i
//   node audit.mjs
//
// The docs column is pasted verbatim below so the comparison stays auditable if the
// docs site changes; every chain value is read live, and pools are enumerated from the
// factory CONTRACT rather than from an API list, so a stale indexer row cannot fake it.
import { SOMNIA_HIDEKI_TESTNET_ADDRESSES, SomniaMarkets } from "@somnia-chain/markets-sdk";
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains";
import { createPublicClient, http, parseAbi } from "viem";

// --- docs: "Perps on Testnet for Traders" -> Markets -> Open interest cap ---
const DOCS_OI_CAP = {
  BTC: "246.81545 BTC",
  ETH: "3,995.6125 ETH",
  HYPE: "23,812.72 HYPE",
  SOL: "47,654.44 SOL",
  XRP: "344,632 XRP",
  ADA: "2,254,678 ADA",
  AVAX: "66,672.2 AVAX",
  BNB: "693.975 BNB",
  DOGE: "5,613,590 DOGE",
  LINK: "42,643.6 LINK",
  NEAR: "250,410 NEAR",
  SUI: "635,009 SUI",
  XLM: "2,677,780 XLM",
  "1000PEPE": "130,285,600 1000PEPE",
  LIT: "138,896.6 LIT",
  PUMP: "87,993,700 PUMP",
  TAO: "2,185.491 TAO",
  VVV: "21,786.14 VVV",
  WLD: "1,264,000 WLD",
  ZEC: "420 ZEC",
  ZRO: "250,599.5 ZRO",
};
// --- same docs row, Min size column: the control ---
const DOCS_MIN_SIZE = {
  BTC: "0.00013 BTC", ETH: "0.004 ETH", HYPE: "0.12 HYPE", SOL: "0.1 SOL", XRP: "6.9 XRP",
  ADA: "46 ADA", AVAX: "1.4 AVAX", BNB: "0.014 BNB", DOGE: "120 DOGE", LINK: "0.9 LINK",
  NEAR: "5.1 NEAR", SUI: "13 SUI", XLM: "54 XLM", "1000PEPE": "2,700 1000PEPE",
  LIT: "2.8 LIT", PUMP: "1,800 PUMP", TAO: "0.044 TAO", VVV: "0.44 VVV", WLD: "26 WLD",
  ZEC: "0.009 ZEC", ZRO: "5.1 ZRO",
};

const RPC = "https://api.hideki2.infra.testnet.somnia.network";
const INDEXER = "https://hideki-dev.smk.somnia.host/v1/graphql";

const client = createPublicClient({ chain: hidekiTestnet, transport: http(RPC) });
const markets = new SomniaMarkets({
  chain: hidekiTestnet,
  indexerUrl: INDEXER,
  addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES,
});

// ABI strings copied from the SDK's own readsAbi (perpPoolReadAbi / perpPoolFactoryReadAbi).
// maxOpenInterest and maxPositionSize are struct fields 4 and 5; getOpenInterest returns ONE
// total, not a (long, short) pair.
const factoryAbi = parseAbi(["function getPerpPools() view returns (address[])"]);
const poolAbi = parseAbi([
  "function getPerpPoolParameters() view returns ((uint256 initialMarginBps, uint256 maintenanceMarginBps, uint256 closeOutMarginBps, uint256 maxOpenInterest, uint256 maxPositionSize, uint256 takerFeeBpsTimes1k, int256 makerFeeBpsTimes1k, uint256 insuranceFundShareBps))",
  "function getOrderBookParameters() view returns ((uint256 tickSize, uint256 minQuantity, uint256 lotSize))",
  "function getOpenInterest() view returns (uint256 openInterest)",
]);

// "130,285,600 1000PEPE" -> 130285600n scaled to the market's base decimals, exact
function toScaled(text, decimals) {
  const m = String(text).match(/^([\d,]+)(?:\.(\d+))?/);
  if (!m) throw new Error(`unparsable docs value: ${text}`);
  const frac = (m[2] ?? "").padEnd(decimals, "0").slice(0, decimals);
  return BigInt(m[1].replace(/,/g, "")) * 10n ** BigInt(decimals) + BigInt(frac || "0");
}
const gcd = (x, y) => (y === 0n ? x : gcd(y, x % y));
function fmt(v, d) {
  const s = v.toString().padStart(d + 1, "0");
  const frac = s.slice(s.length - d).replace(/0+$/, "");
  return `${s.slice(0, s.length - d)}${frac ? "." + frac : ""}`;
}

const sdkRows = await markets.client.listPerpMarkets();
const byPool = new Map(sdkRows.map((m) => [m.poolAddress.toLowerCase(), m]));

// independent discovery: the factory contract's own pool list, and the factory
// address itself read back from MarginBank rather than trusted from the docs
const sys = await markets.client.getPerpSystemConfig(SOMNIA_HIDEKI_TESTNET_ADDRESSES.marginBank);
const pools = await client.readContract({ address: sys.perpPoolFactory, abi: factoryAbi, functionName: "getPerpPools" });

const rows = [];
for (const pool of pools) {
  const m = byPool.get(pool.toLowerCase());
  if (!m) { rows.push({ sym: "(pool not in SDK list)", err: "unmapped", pool }); continue; }
  const dec = m.baseDecimals;
  const p = await client.readContract({ address: pool, abi: poolAbi, functionName: "getPerpPoolParameters" });
  const book = await client.readContract({ address: pool, abi: poolAbi, functionName: "getOrderBookParameters" });
  const live = await client.readContract({ address: pool, abi: poolAbi, functionName: "getOpenInterest" });

  const docsCap = toScaled(DOCS_OI_CAP[m.baseSymbol], dec);
  const docsMin = toScaled(DOCS_MIN_SIZE[m.baseSymbol], dec);
  const k = gcd(p.maxOpenInterest, docsCap);
  // what the docs' prose rule ("capped at a tenth of it") implies for this account
  const derived = docsCap / 10n;
  // exact comparison against the real per-account cap — no tolerance, no floats
  const cmp = derived === p.maxPositionSize ? "EQUAL" : derived > p.maxPositionSize ? "OVER" : "UNDER";
  const devPct = Number(((derived - p.maxPositionSize) * 1_000_000n) / p.maxPositionSize) / 10000;

  rows.push({
    sym: m.baseSymbol,
    dec,
    docsCap: fmt(docsCap, dec),
    chainCap: fmt(p.maxOpenInterest, dec),
    ratio: `${p.maxOpenInterest / k}:${docsCap / k}`,
    docsMin: fmt(docsMin, dec),
    chainMin: fmt(book.minQuantity, dec),
    minControl: docsMin === book.minQuantity ? "PASS" : "FAIL",
    maxPos: fmt(p.maxPositionSize, dec),
    derived: fmt(derived, dec),
    cmp,
    devPct,
    live: fmt(live, dec),
    liveVsDocsPct: Number((live * 1_000_000n) / docsCap) / 10000,
    liveVsChainPct: Number((live * 1_000_000n) / p.maxOpenInterest) / 10000,
  });
}
rows.sort((a, b) => a.sym.localeCompare(b.sym));

const pad = (s, n) => String(s).padEnd(n);
const pp = (s, n) => String(s).padStart(n);

console.log(`pools enumerated from the factory contract: ${pools.length}`);
console.log(`factory address (read back from MarginBank, not copied from the docs): ${sys.perpPoolFactory}`);
console.log(`MarginBank fullyWired:                       ${sys.fullyWired}`);
console.log(`markets matched to an SDK row:               ${rows.filter((r) => !r.err).length}`);
console.log(`block:                                       ${await client.getBlockNumber()}  (captured ${new Date().toISOString()})`);
console.log("");
console.log([pad("market", 10), pad("dec", 4), pad("docs cap", 14), pad("chain cap", 14), pad("chain:docs", 11), pad("min ctrl", 9), "live OI".padStart(14)].join(""));
for (const r of rows) {
  console.log([pad(r.sym, 10), pad(r.dec, 4), pad(r.docsCap, 14), pad(r.chainCap, 14), pad(r.ratio, 11), pad(r.minControl, 9), pp(r.live, 14)].join(""));
}

const mismatched = rows.filter((r) => r.ratio !== "1:1");
const groups = {};
for (const r of rows) (groups[r.ratio] ??= []).push(r.sym);
const pass = rows.filter((r) => r.minControl === "PASS").length;

console.log("");
console.log(`PASS  control: Min size column == getOrderBookParameters().minQuantity on ${pass}/${rows.length} markets`);
console.log(`FAIL  OI cap column disagrees with maxOpenInterest on ${mismatched.length} of ${rows.length} markets`);
console.log(`      ratio groups (chain : docs): ${JSON.stringify(groups)}`);

console.log("");
console.log("--- docs prose: \"A single account is capped at a tenth of it on most markets\" ---");
console.log("      comparing docsCap/10 with the real maxPositionSize()");
const eq = rows.filter((r) => r.cmp === "EQUAL");
const over = rows.filter((r) => r.cmp === "OVER");
const under = rows.filter((r) => r.cmp === "UNDER");
console.log(`      EQUAL to the real cap: ${eq.length}/${rows.length} -> ${eq.map((r) => r.sym).join(", ") || "none"}`);
console.log(`      OVER the documented rule (docsCap/10 > maxPositionSize; the docs say such an order reverts MaxPositionSizeExceeded 0x714b36d6): ${over.length} -> ` +
  (over.map((r) => `${r.sym} ${r.derived} vs ${r.maxPos} (+${r.devPct.toFixed(4)}%)`).join(", ") || "none"));
console.log(`      UNDER the real cap (builder silently under-sizes): ${under.length} -> ` +
  (under.map((r) => `${r.sym} ${(Number(r.maxPos) / Number(r.derived)).toFixed(1)}x`).join(", ") || "none"));

console.log("");
console.log("--- live trading vs the published cap ---");
const pastDocs = rows.filter((r) => r.liveVsDocsPct > 100);
const pastChain = rows.filter((r) => r.liveVsChainPct > 100);
console.log(`      markets already past the DOCUMENTED cap: ${pastDocs.length}` +
  (pastDocs.length ? " -> " + pastDocs.map((r) => `${r.sym} ${r.liveVsDocsPct.toFixed(1)}% (live ${r.live})`).join(", ") : ""));
console.log(`      markets past the CHAIN cap:              ${pastChain.length}`);

process.exitCode = mismatched.length > 0 ? 1 : 0;
// the viem transport keeps a handle alive, so node would linger after printing.
// flush stdout, then exit explicitly with the finding code.
await new Promise((res) => process.stdout.write("", res));
process.exit(process.exitCode);
