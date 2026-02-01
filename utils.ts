import { ethers } from "ethers";

export async function impersonateUser(account: string, provider: ethers.JsonRpcProvider): Promise<ethers.JsonRpcSigner> {
  if (!ethers.isAddress(account)) {
    throw new Error("Invalid impersonated address");
  }

  // 1️⃣ Impersonate account
  await provider.send("hardhat_impersonateAccount", [
    account
  ]);

  console.log(`\nImpersonated account: ${account}`);

   // give it ETH for gas
  await provider.send("hardhat_setBalance", [
    account,
    "0x56BC75E2D63100000", // 100 ETH
  ]);

   // const signer = await provider.getSigner(account);
  const signer = new ethers.JsonRpcSigner(
  provider,
  account
);
return signer
}