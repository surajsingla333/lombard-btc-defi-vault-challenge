import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { ERC20_ABI } from "./ABI/erc20.js";
import { impersonateUser } from "./utils.js";
import { TELLER_ABI } from "./ABI/teller.js";
import { AUTHORITY_ABI } from "./ABI/authority.js";
import { VAULT_ABI } from "./ABI/vault.js";

dotenv.config();

// load shared first
dotenv.config({ path: ".env" });
// load environment-specific second (overrides)
dotenv.config({ path: ".env.teller" });

// ---- ENV VALIDATION ----
const LOCAL_RPC = process.env.LOCAL_RPC;
const IMPERSONATED_ACCOUNT = process.env.IMPERSONATED_ACCOUNT!;
const AUTHORITY_OWNER_IMPERSONATED = process.env.AUTHORITY_OWNER_ADDRESS!;
const VAULT_ADDRESS = process.env.VAULT_ADDRESS!;

if (!LOCAL_RPC || !IMPERSONATED_ACCOUNT || !VAULT_ADDRESS) {
  throw new Error("Missing required env variables");
}
// ---- PROVIDER ----
const provider = new ethers.JsonRpcProvider(LOCAL_RPC);

async function main() {

  const depositAmountBase = "0.00015"
  const withrawAmountBase = "0.0001"
  let signer = await impersonateUser(IMPERSONATED_ACCOUNT, provider)

  // 2️⃣ Vault contract
  const vault = new ethers.Contract(
    VAULT_ADDRESS,
    VAULT_ABI,
    signer
  );

  const TELLER_ADDRESS = process.env.TELLER_ADDRESS!
  let teller = new ethers.Contract(
    TELLER_ADDRESS,
    TELLER_ABI,
    signer
  );

  // // 3️⃣ Resolve underlying asset
  // const assetAddress = await vault.asset();
  const assetAddress = process.env.ASSET_ADDRESS!;
  const token = new ethers.Contract(
    assetAddress,
    ERC20_ABI,
    signer
  );

  // 4️⃣ Metadata
  const vaultName = await vault.name();
  const symbol = await token.symbol();
  const decimals = await token.decimals();
  // const totalAssets = await vault.totalAssets();

  console.log(`\nVault: ${vaultName}`);
  console.log(`Token: ${symbol} (${decimals} decimals)`);
  // console.log(
  //   `TVL (raw): ${ethers.formatUnits(totalAssets, decimals)}`
  // );

  // 5️⃣ Balances
  const balanceBefore = await vault.balanceOf(
    IMPERSONATED_ACCOUNT
  );

  console.log(`\nWallet: ${IMPERSONATED_ACCOUNT}`);
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
  await teller.deposit(assetAddress, depositAmount, 0);

  const balanceAfter = await vault.balanceOf(
    IMPERSONATED_ACCOUNT
  );

  console.log(
    `Balance after: ${ethers.formatUnits(
      balanceAfter,
      decimals
    )}`
  );

  const unlockTime = await teller.shareUnlockTime(
    IMPERSONATED_ACCOUNT
  );
  console.log("Unlock time (timestamp):", unlockTime.toString());

  // AUTHORIZATION
  signer = await impersonateUser(AUTHORITY_OWNER_IMPERSONATED, provider)
  const AUTHORIZATION_ADDRESS = process.env.AUTHORITY_CONTRACT_ADDRESS!
  const authorization = new ethers.Contract(
    AUTHORIZATION_ADDRESS,
    AUTHORITY_ABI,
    signer
  );

  await authorization.setUserRole(IMPERSONATED_ACCOUNT, 18, true)
  console.log("Set user role for impersonated account");
  await authorization.setRoleCapability(18, TELLER_ADDRESS, "0x3e64ce99", true);

  // END OF AUTHORIZATION FOR WITHDRAWAL

  // START OF WITHDRAWAL

  signer = await impersonateUser(IMPERSONATED_ACCOUNT, provider)

  const withdrawAmount = ethers.parseUnits(
    withrawAmountBase,
    decimals
  );

  console.log("Withdrawing...");
  const gasEstimate = await teller.bulkWithdraw.estimateGas(
    assetAddress,
    withdrawAmount,
    0,
    IMPERSONATED_ACCOUNT,
  );

  console.log("Gas estimate for withdraw:", gasEstimate.toString());

  await teller.bulkWithdraw(
    assetAddress,
    withdrawAmount,
    0,
    IMPERSONATED_ACCOUNT,
    { gasLimit: gasEstimate },
  );

  const balanceFinal = await vault.balanceOf(
    IMPERSONATED_ACCOUNT
  );

  console.log(
    `Balance final: ${ethers.formatUnits(
      balanceFinal,
      decimals
    )}`
  );

  console.log("\n✅ Complete!");
}

main().catch((err) => {
  console.error("❌ Error:", err, err.info);
  process.exit(1);
});
