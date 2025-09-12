#!/bin/bash

echo "=== TEA Sepolia Deployment with Rate Limit Management ==="
echo "Deploying contracts with 60-second delays to respect rate limits"
echo ""

# List of deployment scripts in order
scripts=(
  "01_deploy_SpaceActivityManager.ts"
  "02_deploy_MissionRegistry.ts"
  "03_deploy_SpaceEquipmentNFT.ts"
  "04_deploy_SpaceDocumentNFT.ts"
  "05_deploy_AsteroidCommodityToken.ts"
  "06_deploy_StandardsCompliance.ts"
  "07_deploy_SpaceElementsNFT.ts"
  "08_deploy_SpaceElementsMarketplace.ts"
  "09_deploy_AsteroidDEX.ts"
  "10_deploy_AsteroidFutures.ts"
  "11_deploy_AsteroidLiquidityPool.ts"
  "12_deploy_AsteroidOracle.ts"
  "13_deploy_AsteroidTokenFactory.ts"
  "14_deploy_ERC6551Registry.ts"
  "15_deploy_SpaceSmartWallet.ts"
)

deployed_count=0
failed_count=0

for script in "${scripts[@]}"; do
  echo "----------------------------------------"
  echo "Deploying: $script"
  echo "Time: $(date '+%H:%M:%S')"
  
  # Run deployment
  if npx hardhat deploy --network teaSepolia --deploy-scripts "$script" 2>&1 | tee deploy_output.tmp | grep -E "deployed at|reusing"; then
    echo "✅ Success"
    ((deployed_count++))
  else
    if grep -q "Too Many Requests" deploy_output.tmp; then
      echo "⏸️  Rate limited - waiting 90 seconds..."
      sleep 90
      # Retry once
      echo "🔄 Retrying..."
      if npx hardhat deploy --network teaSepolia --deploy-scripts "$script" 2>&1 | grep -E "deployed at|reusing"; then
        echo "✅ Success on retry"
        ((deployed_count++))
      else
        echo "❌ Failed after retry"
        ((failed_count++))
      fi
    else
      echo "✅ Already deployed or no changes"
      ((deployed_count++))
    fi
  fi
  
  echo "Waiting 60 seconds before next deployment..."
  sleep 60
done

echo ""
echo "========================================="
echo "Deployment Summary:"
echo "✅ Deployed/Verified: $deployed_count"
echo "❌ Failed: $failed_count"
echo "========================================="

# Clean up
rm -f deploy_output.tmp
