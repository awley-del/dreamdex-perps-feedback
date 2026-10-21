# Public storage bucket listing enabled on cdn.dreamdex.io
Severity: normal
Area: app

## Steps to reproduce
1. `curl -i 'https://cdn.dreamdex.io/'`

## Expected
`403 AccessDenied` (objects individually public, listing disabled).

## Actual
`200`, `Content-Type: application/xml`, body is a full `ListBucketResult` (20164 bytes) enumerating every object key, size and ETag in the bucket.

## Evidence
Raw response: evidence/reval-20261019/F21_cdn_listing.xml

## Environment
- SDK: n/a (raw HTTP).
- Network: Somnia Tokyo testnet assets CDN.
- Wallet: n/a.
- Evidence date: 2026-10-19 09:47-09:52 UTC
