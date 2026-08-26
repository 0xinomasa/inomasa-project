# Platform adapters

External technology adapters belong here after selection, including persistence, chain, wallet, messaging, hosting, and model-provider adapters.

Business rules must not depend directly on vendor SDKs. B3 selects PostgreSQL plus an
internal persistence implementation under `persistence/`. The Alpha adds:

- `arc/` for the exact Arc Testnet network/asset registry;
- `circle/` for the selected Circle Developer-Controlled Wallet EOA and Circle
  Gateway/x402 adapters;
- application persistence repositories under `persistence/` behind module contracts.

Circle remains replaceable implementation machinery. Its wallet ID/address does not
become Inomasa Principal or Business identity.
