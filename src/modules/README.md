# Business modules

The verified Alpha selects bounded implementation modules inside the existing
modular monolith:

- `business/` owns the four reusable BUILD templates, deterministic generic
  Business genesis, the locked MIGRATE entry guard, Business Package semantics,
  control-facing records, logical Treasury bindings, and the Treasury wallet port;
- `commerce/` owns exact USDC quantities, service offers, obligations, and settlement
  state transitions.
- `authority/` owns bounded grants, intents, policy decisions, execution
  authorizations, and allowance accounting.

These folders are implementation ownership boundaries, not microservices and not a
mechanical copy of the active Concept & Architecture layers. Current Business and
Agent fixtures do not define generic product capacity. Vendor SDKs remain under
`src/platform/`.
