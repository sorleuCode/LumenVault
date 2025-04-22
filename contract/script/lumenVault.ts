const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xb88877a121B0e96c2c794dd68c8D507D584a64c3";
  // Replace with the recipient's wallet address
  const recipientAddress = "<recipient_wallet_address>";

  // Connect to the MockUsdt contract
  const MockUsdt = await ethers.getContractAt("MockUsdt", contractAddress);

  // Query the balance
  const balance = await MockUsdt.balanceOf(recipientAddress);
  console.log(`Balance of ${recipientAddress}: ${ethers.formatUnits(balance, 18)} MUSDT`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });