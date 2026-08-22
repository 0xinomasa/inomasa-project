# Platform adapters

External technology adapters belong here after selection, including persistence, chain, wallet, messaging, hosting, and model-provider adapters.

Business rules must not depend directly on vendor SDKs. B3 selects PostgreSQL plus an internal persistence implementation under `persistence/`; it does not select a hosted provider as an application boundary or create domain schema. Future modules must reach persistence through accepted module/application ports rather than importing the adapter's query types directly.
