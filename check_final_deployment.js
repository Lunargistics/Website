const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(60));
console.log('TEA SEPOLIA DEPLOYMENT STATUS');
console.log('='.repeat(60) + '\n');

const deploymentsDir = path.join(__dirname, 'deployments', 'teaSepolia');

if (fs.existsSync(deploymentsDir)) {
  const files = fs.readdirSync(deploymentsDir)
    .filter(f => f.endsWith('.json') && !f.includes('solcInputs'));
  
  const contracts = [];
  
  files.forEach(file => {
    try {
      const contract = JSON.parse(fs.readFileSync(path.join(deploymentsDir, file), 'utf8'));
      const name = file.replace('.json', '');
      contracts.push({
        name,
        address: contract.address,
        block: contract.receipt?.blockNumber || 'N/A',
        transactionHash: contract.transactionHash || 'N/A'
      });
    } catch (e) {
      // Skip invalid files
    }
  });
  
  // Sort by name
  contracts.sort((a, b) => a.name.localeCompare(b.name));
  
  console.log('✅ DEPLOYED CONTRACTS:\n');
  contracts.forEach((c, i) => {
    console.log(`${i + 1}. ${c.name}`);
    console.log(`   Address: ${c.address}`);
    console.log(`   Block: ${c.block}`);
    console.log(`   Explorer: https://testnet.explorer.tea.xyz/address/${c.address}`);
    console.log('');
  });
  
  console.log('-'.repeat(60));
  console.log(`TOTAL CONTRACTS DEPLOYED: ${contracts.length}`);
  console.log('-'.repeat(60));
  
  // List expected contracts
  const expectedContracts = [
    'YourContract',
    'SpaceActivityManager',
    'MissionRegistry',
    'SpaceEquipmentNFT',
    'SpaceDocumentNFT',
    'AsteroidCommodityToken',
    'StandardsCompliance',
    'SpaceElementsNFT',
    'SpaceElementsMarketplace',
    'AsteroidDEX',
    'AsteroidFutures',
    'AsteroidLiquidityPool',
    'AsteroidOracle',
    'AsteroidTokenFactory',
    'ERC6551Registry',
    'SpaceSmartWallet'
  ];
  
  const deployedNames = contracts.map(c => c.name);
  const pending = expectedContracts.filter(name => !deployedNames.includes(name));
  
  if (pending.length > 0) {
    console.log('\n⏳ PENDING CONTRACTS:\n');
    pending.forEach((name, i) => {
      console.log(`${i + 1}. ${name}`);
    });
  } else {
    console.log('\n✅ ALL CONTRACTS DEPLOYED SUCCESSFULLY!');
  }
  
} else {
  console.log('❌ No TEA Sepolia deployments found');
}

console.log('\n' + '='.repeat(60) + '\n');