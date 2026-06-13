const { ethers } = require("hardhat");

async function main() {
  console.log("🚨 EMERGENCY WALLET MIGRATION SCRIPT");
  console.log("=====================================\n");

  // Generate new secure wallet
  const newWallet = ethers.Wallet.createRandom();

  console.log("🔐 NEW SECURE WALLET GENERATED:");
  console.log("=====================================");
  console.log("Address:", newWallet.address);
  console.log("Private Key:", newWallet.privateKey);
  console.log("=====================================");
  console.log("⚠️  SAVE THIS PRIVATE KEY SECURELY!");
  console.log("⚠️  DO NOT COMMIT TO GIT!\n");

  // Get the compromised wallet (current signer)
  const [compromisedSigner] = await ethers.getSigners();
  console.log("📍 Compromised wallet address:", compromisedSigner.address);

  // Check balance
  const balance = await ethers.provider.getBalance(compromisedSigner.address);
  console.log("💰 Current balance:", ethers.formatEther(balance), "TEA\n");

  if (balance > 0n) {
    console.log("📤 Preparing to transfer funds to new wallet...");
    console.log("   From:", compromisedSigner.address);
    console.log("   To:", newWallet.address);
    console.log("   Amount:", ethers.formatEther(balance), "TEA\n");

    // We'll need to leave some for gas
    const gasPrice = await ethers.provider.getFeeData();
    const gasLimit = 21000n; // Standard transfer
    const gasCost = gasPrice.gasPrice * gasLimit;
    const amountToSend = balance - gasCost - gasCost / 2n; // Leave extra for safety

    if (amountToSend > 0n) {
      console.log(
        "💸 Transferring",
        ethers.formatEther(amountToSend),
        "TEA (keeping",
        ethers.formatEther(balance - amountToSend),
        "for gas)...",
      );

      try {
        const tx = await compromisedSigner.sendTransaction({
          to: newWallet.address,
          value: amountToSend,
        });

        console.log("📝 Transaction sent:", tx.hash);
        console.log("⏳ Waiting for confirmation...");

        const receipt = await tx.wait();
        console.log("✅ Transfer confirmed in block:", receipt.blockNumber);
        console.log("✅ New wallet funded successfully!\n");
      } catch (error) {
        console.error("❌ Transfer failed:", error.message);
      }
    } else {
      console.log("⚠️  Balance too low to transfer (would be consumed by gas)");
    }
  } else {
    console.log("⚠️  No balance to transfer\n");
  }

  // List deployed contracts that need ownership transfer
  console.log("📋 DEPLOYED CONTRACTS REQUIRING OWNERSHIP TRANSFER:");
  console.log("=====================================");

  const contracts = [
    { name: "YourContract", address: "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690" },
    { name: "SpaceActivityManager", address: "0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44" },
    { name: "MissionRegistry", address: "0x4A679253410272dd5232B3Ff7cF5dbB88f295319" },
    { name: "SpaceEquipmentNFT", address: "0x7a2088a1bFc9d81c55368AE168C2C02570cB814F" },
    { name: "SpaceDocumentNFT", address: "0x09635F643e140090A9A8Dcd712eD6285858ceBef" },
    { name: "AsteroidCommodityToken", address: "0xc5a5C42992dECbae36851359345FE25997F5C42d" },
  ];

  for (const contract of contracts) {
    console.log(`- ${contract.name}: ${contract.address}`);
  }

  console.log("\n⚠️  NEXT STEPS:");
  console.log("1. Save the new private key securely");
  console.log("2. Update .env file with new private key");
  console.log("3. Run ownership transfer script for each contract");
  console.log("4. Verify all contracts have new owner");
  console.log("5. Update deployment documentation");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
