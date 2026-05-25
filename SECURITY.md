# Security Policy

## Supported Versions

Security fixes target the latest published version of `@phessophissy/amemployer-sdk`.

## Reporting a Vulnerability

Please do not open public issues for suspected vulnerabilities. Instead, report
the issue privately to the repository owner with:

- affected SDK version or commit
- impact summary
- reproduction steps
- any relevant transaction hashes, RPC responses, or backend responses

## SDK Safety Notes

- Never commit private keys, seed phrases, RPC credentials, or API tokens.
- Use an `ethers.Signer` only from trusted wallet/provider contexts.
- Review token approvals before calling write helpers such as `approveToken`.
- Prefer testnet validation before using new integrations on Celo mainnet.
