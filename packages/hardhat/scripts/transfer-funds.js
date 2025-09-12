const { ethers } = require('hardhat');

async function main() {
  console.log('💸 EMERGENCY FUND TRANSFER');
  console.log('=====================================\n');
  
  // NEW SECURE WALLET (generated from previous script)
  const NEW_WALLET_ADDRESS = '0x7B870fcD9de8a32a85758B30C0889743929C9DEB';
  
  // Get the compromised wallet
  const [compromisedSigner] = await ethers.getSigners();
  console.log('📍 Compromised wallet:', compromisedSigner.address);
  console.log('📍 New secure wallet:', NEW_WALLET_ADDRESS);
  
  // Check balance
  const balance = await ethers.provider.getBalance(compromisedSigner.address);
  console.log('💰 Current balance:', ethers.formatEther(balance), 'TEA\n');
  
  if (balance > 0n) {
    // Calculate gas costs more conservatively
    const gasPrice = await ethers.provider.getFeeData();
    const gasLimit = 21000n; // Standard transfer
    const estimatedGasCost = gasPrice.gasPrice * gasLimit * 2n; // Double for safety
    
    console.log('⛽ Estimated gas cost:', ethers.formatEther(estimatedGasCost), 'TEA');
    
    if (balance > estimatedGasCost) {
      const amountToSend = balance - estimatedGasCost;
      
      console.log('📤 Transferring:', ethers.formatEther(amountToSend), 'TEA');
      console.log('📤 Keeping for gas:', ethers.formatEther(estimatedGasCost), 'TEA\n');
      
      try {
        const tx = await compromisedSigner.sendTransaction({
          to: NEW_WALLET_ADDRESS,
          value: amountToSend,
          gasLimit: gasLimit,
          gasPrice: gasPrice.gasPrice
        });
        
        console.log('📝 Transaction sent:', tx.hash);
        console.log('⏳ Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.log('✅ Transfer confirmed!');
        console.log('   Block:', receipt.blockNumber);
        console.log('   Gas used:', receipt.gasUsed.toString());
        
        // Check new balances
        const newBalanceOld = await ethers.provider.getBalance(compromisedSigner.address);
        const newBalanceNew = await ethers.provider.getBalance(NEW_WALLET_ADDRESS);
        
        console.log('\n📊 FINAL BALANCES:');
        console.log('   Old wallet:', ethers.formatEther(newBalanceOld), 'TEA');
        console.log('   New wallet:', ethers.formatEther(newBalanceNew), 'TEA');
        
      } catch (error) {
        console.error('❌ Transfer failed:', error.message);
        
        // Try with even less amount
        console.log('\n🔄 Retrying with smaller amount...');
        const saferAmount = balance / 2n; // Transfer only half
        
        try {
          const tx2 = await compromisedSigner.sendTransaction({
            to: NEW_WALLET_ADDRESS,
            value: saferAmount
          });
          
          console.log('📝 Retry transaction sent:', tx2.hash);
          const receipt2 = await tx2.wait();
          console.log('✅ Transfer confirmed on retry!');
          
        } catch (error2) {
          console.error('❌ Retry also failed:', error2.message);
        }
      }
    } else {
      console.log('⚠️  Balance too low to transfer (would be consumed by gas)');
    }
  } else {
    console.log('⚠️  No balance to transfer');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});