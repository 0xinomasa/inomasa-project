# Platform adapters

External technology adapters belong here after selection, including persistence, chain, wallet, messaging, hosting, and model-provider adapters.

Business rules must not depend directly on vendor SDKs. B3 selects PostgreSQL plus an
internal persistence implementation under `persistence/`. The Alpha adds:

- `arc/` for the exact Arc Testnet network/asset registry, chain-observed settlement
  proof, and ERC-8004 registry verification;
- `circle/` for the selected Circle Developer-Controlled Wallet EOA and Circle
  Gateway/x402 adapters, plus generic idempotent EVM contract execution;
- application persistence repositories under `persistence/` behind module contracts.

Circle remains replaceable implementation machinery. Its wallet ID/address does not
become Inomasa Principal or Business identity.

The generic contract-execution port is intentionally owned by `modules/agent/`, not
the Circle SDK. Replacing Circle changes submission/reconciliation machinery; it
does not change the Agent, ERC-8004 reference, Business relationship, or action
identity linkage.
