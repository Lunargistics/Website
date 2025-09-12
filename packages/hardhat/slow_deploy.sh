#!/bin/bash
echo "Starting slow deployment with 30-second delays..."

# Get balance first
echo "Checking deployer balance..."
npx hardhat run --network teaSepolia <(echo '
async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "TEA");
}
main().catch(console.error);
') 2>/dev/null || echo "Could not check balance"

echo ""
echo "Deploying contracts one by one..."

# Deploy each contract individually
for script in deploy/*.ts; do
  if [[ "$script" == *"00_deploy_your_contract.ts" ]]; then
    continue  # Skip YourContract as it's already deployed
  fi
  
  echo "Processing $script..."
  npx hardhat deploy --network teaSepolia --deploy-scripts "$(basename $script)" 2>&1 | grep -E "deployed at|reusing|error" || true
  echo "Waiting 30 seconds..."
  sleep 30
done

echo "Deployment attempt complete!"
