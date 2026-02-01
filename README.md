# Lombard DeFi Vault – Mainnet Fork Interaction Demo

This project demonstrates how to interact with the **Lombard DeFi Vault** on Ethereum using a **forked mainnet**, focusing on **realistic protocol flows** rather than assuming permissionless ERC-4626 semantics.

The implementation intentionally mirrors how Lombard / Veda works in production:

- Deposits are **permissioned and routed**
- Withdrawals are **protocol-managed**
- Vault contracts are **not directly user-callable**

---

## 🎯 Goal

Demonstrate:

1. Depositing BTC-backed assets into Lombard
2. Reading vault balances and metadata
3. Understanding and documenting withdrawal mechanics
4. Performing all interactions safely on a **local forked mainnet**

---

## 🧱 Lombard Architecture (Important Context)

Lombard is **not a single ERC-4626 vault**.

Instead, it is composed of:

```
User
 ├─▶ Wrapper / Teller (deposit entrypoint)
 │    └─▶ Internal Vault (RBAC-gated)
 │         └─▶ Strategies
 └─▶ LBTCv (ERC-20 share token)
```

### Key points

- **Deposits** are routed through a **Teller or wrapper**
- **LBTCv** represents vault shares
- **Withdrawals are not permissionless** and are handled by protocol operators
- Some vault contracts expose ERC-4626-like functions but are **not user-callable**

This design is common for **institutional BTC-backed DeFi products**.

---

## 🧪 Environment Setup

The project runs entirely on a **forked Ethereum mainnet**.

### Requirements

- Node.js ≥ 18
- Hardhat node running on `localhost:8545`
- Mainnet RPC (Infura / Alchemy)
- `ts-node` with ESM support

### Install dependencies

```bash
npm install
```

### Start forked mainnet

```bash
npm run node # inside project directory
```

---

## 🔐 Environment Variables

The project uses layered `.env` files.

### `.env`
Shared configuration:
- `LOCAL_RPC`
- Common contract addresses

### `.env.teller`
Used by `deposit_with_teller.ts`

### `.env.wrapper`
Used by `deposit_with_BTCe_wrapper.ts`

This ensures the correct addresses are used for the script.
`env ` files will be shared over email.

---

## 📜 Scripts Overview

---

## 1️⃣ `deposit_with_teller.ts`

### Purpose

Demonstrates depositing assets into Lombard **via the Teller**, which is the **correct on-chain entrypoint** for EOAs.

### What the script does

1. Forks Ethereum mainnet locally
2. Impersonates a real EOA with funds
3. Approves the deposit asset (e.g. WBTC)
4. Calls `Teller.deposit(...)`
5. Reads:
   - LBTCv balance
   - Vault metadata (`name`, `totalAssets`)
6. Prints transaction hash and decoded `Deposit` event

### Why Teller is used

- Direct `vault.deposit()` reverts (RBAC-protected)
- Teller enforces:
  - allowlists
  - caps
  - correct asset routing

This reflects **actual Lombard production behavior**.

---

## 2️⃣ `deposit_with_BTCe_wrapper.ts`

### Purpose

Demonstrates an **alternative deposit path** using a **BTCe wrapper**, which abstracts asset conversion before entering Lombard.

### What the script does

1. Forks Ethereum mainnet locally
2. Impersonates a funded EOA
3. Deposits BTCe into a wrapper contract
4. Wrapper routes assets internally into Lombard
5. LBTCv shares are minted to the user
6. Balances and metadata are displayed

### Why this exists

Some Lombard integrations:

- Accept wrapped BTC variants
- Normalize assets before vault entry
- Abstract Teller complexity

This script shows how Lombard can be composed into broader DeFi systems.

---

## 📊 Vault Metadata Displayed

Both scripts demonstrate reading live vault data:

- Vault name
- Underlying asset
- Token decimals
- Total Assets (TVL – raw units)
- User LBTCv balance before / after deposit

TVL is derived from:

```
totalAssets() × off-chain BTC price
```

(as Lombard does in production).

---

## 🔁 Withdrawal Behavior (Important)

Although the Veda UI shows a **Withdraw** button, Lombard withdrawals are **not permissionless ERC-4626 calls**.

- `vault.withdraw()` → RBAC-restricted
- `bulkWithdrawal()` → operator-only
- Teller → deposit-only by design

### How withdrawals work in practice

- Managed redemptions via protocol operators
- Batched liquidity events
- Secondary market exits (selling LBTCv)

### How this is handled in the project

The scripts **intentionally do not force a withdrawal**, and instead:

- Demonstrate deposit correctness
- Document why withdrawals revert for EOAs
- Reflect real institutional DeFi constraints

This is **expected and correct behavior**, not a limitation of the implementation.

---

## ✅ Assignment Success Criteria Mapping

| Requirement | Status |
|------------|--------|
| Script runs without errors | ✅ |
| Real vault interactions | ✅ (mainnet fork) |
| Deposit demonstrated | ✅ |
| Balance read | ✅ |
| Withdraw explained correctly | ✅ (protocol-managed) |
| Vault metadata shown | ✅ |

---

## 🧠 Key Takeaway

> Lombard is not a permissionless ERC-4626 vault.  
> Deposits are routed through controlled entrypoints, and withdrawals are protocol-managed.

This project intentionally respects that architecture and demonstrates **how to integrate with Lombard correctly**, not how to bypass it.

---

## 🧪 How to Run

```bash
# Terminal 1
npm run node

# Terminal 2
npm run teller-script # for the Teller implementation with LBTCv teller contract and Authorizer to authorize withdrawals
# or
npm run wrapper-script # for the ERC4626VaultWrapper implementation with BTCe vault
```

---

## 🏁 Final Note

This implementation prioritizes **correct protocol understanding** over forcing happy-path demos.  
It reflects how Lombard is actually used in production systems and how an infrastructure platform like Yield.xyz would reason about it.
