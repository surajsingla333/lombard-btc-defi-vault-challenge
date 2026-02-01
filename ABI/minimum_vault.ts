// ERC-4626 style vault ABI (minimal)
export const VAULT_ABI = [
  "function name() view returns (string)",
  "function asset() view returns (address)",
  "function totalAssets() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function maxWithdraw(address) view returns (uint256)",
  "function deposit(uint256 assets, address receiver )",
  "function deposit(address token, uint256 assets, address receiver, uint256 minShareAmount )",
  "function withdraw(uint256 assets, address receiver, address owner)"
];

