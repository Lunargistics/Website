const fs = require("fs");
const path = require("path");

console.log("\n" + "=".repeat(60));
console.log("TEA SEPOLIA DEPLOYED CONTRACTS");
console.log("=".repeat(60) + "\n");

const deploymentsDir = path.join(__dirname, "deployments", "teaSepolia");
const contracts = [];

if (fs.existsSync(deploymentsDir)) {
  const files = fs.readdirSync(deploymentsDir).filter(f => f.endsWith(".json") && !f.includes("solcInputs"));

  files.forEach(file => {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(deploymentsDir, file), "utf8"));
      const name = file.replace(".json", "");
      contracts.push({
        name,
        address: content.address,
        block: content.receipt?.blockNumber || "N/A",
      });
    } catch {}
  });

  contracts.sort((a, b) => a.name.localeCompare(b.name));

  contracts.forEach((c, i) => {
    console.log(`${i + 1}. ${c.name}`);
    console.log(`   Address: ${c.address}`);
    console.log(`   Explorer: https://testnet.explorer.tea.xyz/address/${c.address}`);
    console.log("");
  });

  console.log(`TOTAL: ${contracts.length} contracts deployed`);
} else {
  console.log("No deployments found");
}
