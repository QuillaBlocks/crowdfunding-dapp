# Crowdfunding contract

Soroban contract for the Vaca crowdfunding demo. Lives in this workspace at
`contracts/crowdfunding/`. Compiled with `soroban-sdk = "26"`.

## Layout

| File         | Responsibility |
| ------------ | -------------- |
| `lib.rs`     | Crate root, module wiring, public re-exports |
| `contract.rs`| All public functions (`initialize`, `contribute`, `refund`, `withdraw`, `check_expiration`, `extend_deadline`, getters) and the `Status`, `StatusInfo`, `Error` types |
| `storage.rs` | `DataKey` enum + typed helpers over `instance()` / `persistent()` storage |
| `events.rs`  | `#[contractevent]` definitions for every emitted event |
| `test.rs`    | 21 unit tests covering happy paths and failure modes |

## Storage layout

| Key              | Location   | Type     |
| ---------------- | ---------- | -------- |
| `Admin`          | Instance   | Address  |
| `Name`           | Instance   | String   |
| `Goal`           | Instance   | i128     |
| `Deadline`       | Instance   | u64      |
| `TotalRaised`    | Instance   | i128     |
| `Status`         | Instance   | Status   |
| `Token`          | Instance   | Address  |
| `Contributors`   | Instance   | u32      |
| `Contribution(addr)` | Persistent | i128 |

Instance storage carries the global state (one read covers the whole header).
Per-user contributions live in persistent storage so they survive instance
archival and can be refunded long after the deadline.

## Events

- `ContributeEvent(from, amount, total_raised)`
- `GoalReachedEvent(total_raised)`
- `WithdrawnEvent(admin, amount)`
- `RefundedEvent(from, amount)`
- `ExpiredEvent(total_raised)`
- `DeadlineExtendedEvent(new_deadline)`

The frontend listens for `ContributeEvent` via `Server.getEvents` to build the
"latest contributors" list.

## Build & test

From the workspace root:

```bash
npm run contract:test     # cargo test
npm run contract:build    # stellar contract build → target/wasm32v1-none/release/crowdfunding.wasm
```

## Public interface (signatures)

```rust
fn initialize(admin: Address, name: String, goal: i128, deadline: u64, token: Address)
fn contribute(from: Address, amount: i128)
fn refund(from: Address) -> i128
fn withdraw() -> i128
fn check_expiration() -> Status
fn extend_deadline(new_deadline: u64)
fn get_status() -> StatusInfo
fn get_contribution(addr: Address) -> i128
fn total_raised() -> i128
fn total_contributors() -> u32
fn admin() -> Address
fn name() -> String
fn goal() -> i128
fn deadline() -> u64
fn token() -> Address
```

All admin-only functions (`initialize`, `withdraw`, `extend_deadline`) load the
stored `Admin` address and call `admin.require_auth()` before doing anything
state-changing. The auth check is what gives the contract its access control —
there are no role tables.
