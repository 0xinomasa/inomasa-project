# Business modules

The accelerated Alpha selects two bounded implementation modules inside the existing
modular monolith:

- `business/` owns deterministic Business templates/genesis, control-facing records,
  logical Treasury bindings, and the Treasury wallet port;
- `commerce/` owns exact USDC quantities, service offers, obligations, and settlement
  state transitions.

These folders are implementation ownership boundaries, not microservices and not a
mechanical copy of Canonical semantic domains. Vendor SDKs remain under `src/platform/`.
