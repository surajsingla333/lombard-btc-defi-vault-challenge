import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { ERC20_ABI } from "./ABI/erc20.js";
import { VAULT_ABI } from "./ABI/minimum_vault.js";
import { impersonateUser } from "./utils.js";

dotenv.config();
// load shared first
dotenv.config({ path: ".env" });
// load environment-specific second (overrides)
dotenv.config({ path: ".env.wrapper" });

// ---- ENV VALIDATION ----
const LOCAL_RPC = process.env.LOCAL_RPC;
const IMPERSONATED_ACCOUNT_FOR_LBTCV = process.env.IMPERSONATED_ACCOUNT_FOR_LBTCV!;
const IMPERSONATED_ACCOUNT_FOR_LBTC = process.env.IMPERSONATED_ACCOUNT_FOR_LBTC!;
const VAULT_ADDRESS = process.env.VAULT_ADDRESS!;

if (!LOCAL_RPC || !IMPERSONATED_ACCOUNT_FOR_LBTCV || !IMPERSONATED_ACCOUNT_FOR_LBTC || !VAULT_ADDRESS) {
  throw new Error("Missing required env variables");
}
// ---- PROVIDER ----
const provider = new ethers.JsonRpcProvider(LOCAL_RPC);

async function main() {

  const depositAmountBase = "0.000015"
  const withdrawAmountBase = "0.000013"
  let signer = await impersonateUser(IMPERSONATED_ACCOUNT_FOR_LBTCV, provider)

  // 2️⃣ Vault contract
  let vault = new ethers.Contract(
    VAULT_ADDRESS,
    VAULT_ABI,
    signer
  );

  // // 3️⃣ Resolve underlying asset
  const assetAddress = await vault.asset();
  let token = new ethers.Contract(
    assetAddress,
    ERC20_ABI,
    signer
  );

  // 4️⃣ Metadata
  const vaultName = await vault.name();
  const symbol = await token.symbol();
  const tokenName = await token.name();
  const decimals = await token.decimals();
  const totalAssets = await vault.totalAssets();

  console.log(`\nVault: ${vaultName}`);
  console.log(`\nToken name: ${tokenName}`);
  console.log(`Token: ${symbol} (${decimals} decimals)`);
  console.log(
    `TVL (raw): ${ethers.formatUnits(totalAssets, decimals)}`
  );


  console.log("\n\n========1. Depositing BTCv on the vault to receive BTCe as the shares token =========\n\n")
  // 5️⃣ Balances
  const balanceBefore = await vault.balanceOf(
    IMPERSONATED_ACCOUNT_FOR_LBTCV
  );

  console.log(`\nWallet: ${IMPERSONATED_ACCOUNT_FOR_LBTCV}`);
  console.log(
    `Balance before: ${ethers.formatUnits(
      balanceBefore,
      decimals
    )}`
  );

  // 6️⃣ Deposit
  const depositAmount = ethers.parseUnits(
    depositAmountBase,
    decimals
  );


  console.log("Depositing...");
  await token.approve(VAULT_ADDRESS, depositAmount);
  console.log("Approved token transfer to vault for amount:", ethers.formatUnits(depositAmount, decimals));
  await vault.deposit(depositAmount, IMPERSONATED_ACCOUNT_FOR_LBTCV);
  // console.log({gas})
  const balanceAfter = await vault.balanceOf(
    IMPERSONATED_ACCOUNT_FOR_LBTCV
  );

  console.log(
    `Balance after: ${ethers.formatUnits(
      balanceAfter,
      decimals
    )}`
  );

  // 7️⃣ Withdraw
  console.log("Withdrawing...");
  await vault.withdraw(
    depositAmount,
    IMPERSONATED_ACCOUNT_FOR_LBTCV,
    IMPERSONATED_ACCOUNT_FOR_LBTCV
  );

  const balanceFinal = await vault.balanceOf(
    IMPERSONATED_ACCOUNT_FOR_LBTCV
  );

  console.log(
    `Balance final: ${ethers.formatUnits(
      balanceFinal,
      decimals
    )}`
  );

  console.log("\n✅ Completed for depositing BTCv on the vault to receive BTCe as the shares token!");


  console.log("\n\n========2. Depositing LBTCv on the vault to receive BTCe as the shares token. =========\n\n")
  console.log(`In this, BTCv vault will internally hold LBTCv and mint BTCv as the shares tokens
    that will be transferred to BTCe vault and BTCe vault will hold BTCv and user will receive BTCe.\n`)

  signer = await impersonateUser(IMPERSONATED_ACCOUNT_FOR_LBTC, provider)

  vault = new ethers.Contract(
    VAULT_ADDRESS,
    VAULT_ABI,
    signer
  );

  const LBTC_ADDRESS = process.env.ASSET_ADDRESS!;
  token = new ethers.Contract(
    LBTC_ADDRESS,
    ERC20_ABI,
    signer
  );

  const balanceBefore2 = await vault.balanceOf(
    IMPERSONATED_ACCOUNT_FOR_LBTC
  );

  console.log(`\nWallet: ${IMPERSONATED_ACCOUNT_FOR_LBTC}`);
  console.log(
    `Balance before: ${ethers.formatUnits(
      balanceBefore2,
      decimals
    )}`
  );

  // 6️⃣ Deposit
  const withdrawAmount = ethers.parseUnits(
    withdrawAmountBase,
    decimals
  );

  console.log("Depositing...");
  await token.approve(VAULT_ADDRESS, depositAmount);
  console.log("Approved token transfer to vault for amount:", ethers.formatUnits(depositAmount, decimals));
  await vault.deposit(LBTC_ADDRESS, depositAmount, IMPERSONATED_ACCOUNT_FOR_LBTC, 0);
  const balanceAfter2 = await vault.balanceOf(
    IMPERSONATED_ACCOUNT_FOR_LBTC
  );

  const maxWd = await vault.maxWithdraw(IMPERSONATED_ACCOUNT_FOR_LBTC);

  console.log("Max withdrawable:", ethers.formatUnits(maxWd, decimals));

  console.log(
    `Balance after: ${ethers.formatUnits(
      balanceAfter2,
      decimals
    )}`
  );

  // 7️⃣ Withdraw
  console.log("Withdrawing...");
  await vault.withdraw(
    withdrawAmount,
    IMPERSONATED_ACCOUNT_FOR_LBTC,
    IMPERSONATED_ACCOUNT_FOR_LBTC
  );

  const balanceFinal2 = await vault.balanceOf(
    IMPERSONATED_ACCOUNT_FOR_LBTC
  );

  console.log(
    `Balance final: ${ethers.formatUnits(
      balanceFinal2,
      decimals
    )}`
  );

  console.log("\n✅ Completed for depositing LBTCv on the vault to receive BTCe as the shares token!");

}

main().catch((err) => {
  console.error("❌ Error:", err, err);
  process.exit(1);
});
