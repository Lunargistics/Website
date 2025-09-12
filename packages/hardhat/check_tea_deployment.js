const fs = require('fs');
const path = require('path');

const deploymentsDir = path.join(__dirname, 'deployments', 'teaSepolia');
console.log('\n=== TEA Sepolia Deployed Contracts ===\n');

if (fs.existsSync(deploymentsDir)) {
  const files = fs.readdirSync(deploymentsDir)
    .filter(f => f.endsWith('.json') && !f.includes('solcInputs'));
  
  files.forEach(file => {
    try {
      const contract = JSON.parse(fs.readFileSync(path.join(deploymentsDir, file), 'utf8'));
      const name = file.replace('.json', '');
      console.log(`${name}:`);
      console.log(`  Address: ${contract.address}`);
      console.log(`  Block: ${contract.receipt?.blockNumber || 'N/A'}`);
      console.log('');
    } catch (e) {
      // Skip invalid files
    }
  });
  
  console.log(`Total contracts deployed: ${files.length}`);
} else {
  console.log('No TEA Sepolia deployments found');
}
