const { ethers } = require('hardhat');

async function main() {
  console.log('🔐 CONTRACT OWNERSHIP TRANSFER');
  console.log('=====================================\n');
  
  // NEW SECURE WALLET
  const NEW_OWNER = '0x7B870fcD9de8a32a85758B30C0889743929C9DEB';
  
  // Get the compromised wallet (current owner)
  const [currentOwner] = await ethers.getSigners();
  console.log('📍 Current owner (compromised):', currentOwner.address);
  console.log('📍 New owner (secure):', NEW_OWNER, '\n');
  
  // Contracts to transfer ownership
  const contracts = [
    { name: 'YourContract', address: '0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690' },
    { name: 'SpaceActivityManager', address: '0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44' },
    { name: 'MissionRegistry', address: '0x4A679253410272dd5232B3Ff7cF5dbB88f295319' },
    { name: 'SpaceEquipmentNFT', address: '0x7a2088a1bFc9d81c55368AE168C2C02570cB814F' },
    { name: 'SpaceDocumentNFT', address: '0x09635F643e140090A9A8Dcd712eD6285858ceBef' },
    { name: 'AsteroidCommodityToken', address: '0xc5a5C42992dECbae36851359345FE25997F5C42d' }
  ];
  
  // Common Ownable ABI (works for OpenZeppelin Ownable contracts)
  const ownableABI = [
    'function owner() view returns (address)',
    'function transferOwnership(address newOwner)',
    'function renounceOwnership()'
  ];
  
  console.log('📋 TRANSFERRING OWNERSHIP OF CONTRACTS:\n');
  
  for (const contractInfo of contracts) {
    console.log(`\n🔧 ${contractInfo.name} (${contractInfo.address})`);
    
    try {
      // Connect to contract
      const contract = new ethers.Contract(contractInfo.address, ownableABI, currentOwner);
      
      // Check current owner
      try {
        const currentContractOwner = await contract.owner();
        console.log(`   Current owner: ${currentContractOwner}`);
        
        if (currentContractOwner.toLowerCase() === currentOwner.address.toLowerCase()) {
          // Transfer ownership
          console.log(`   📤 Transferring ownership to ${NEW_OWNER}...`);
          
          const tx = await contract.transferOwnership(NEW_OWNER);
          console.log(`   📝 Transaction: ${tx.hash}`);
          
          const receipt = await tx.wait();
          console.log(`   ✅ Ownership transferred! (Block: ${receipt.blockNumber})`);
          
        } else if (currentContractOwner.toLowerCase() === NEW_OWNER.toLowerCase()) {
          console.log(`   ✅ Already owned by new wallet!`);
        } else {
          console.log(`   ⚠️  Not owned by compromised wallet (owner: ${currentContractOwner})`);
        }
      } catch (error) {
        if (error.message.includes('owner')) {
          console.log(`   ⚠️  Contract might not have Ownable pattern`);
        } else {
          console.log(`   ❌ Error checking ownership: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Failed to process: ${error.message}`);
    }
  }
  
  console.log('\n\n✅ OWNERSHIP TRANSFER COMPLETE!');
  console.log('=====================================');
  console.log('⚠️  IMPORTANT NEXT STEPS:');
  console.log('1. Update .env file with new private key');
  console.log('2. Verify all contracts have new owner');
  console.log('3. Update deployment documentation');
  console.log('4. Never use the compromised key again!');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});