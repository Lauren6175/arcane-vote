import { ethers } from "hardhat";

async function main() {
  console.log("\n🧪 Testing Sepolia Deployment...\n");

  const contractAddress = "0xf1D27321cF3916853fde8964eEB725Edad8B10CE";
  
  // Get signer
  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();
  const balance = await ethers.provider.getBalance(signerAddress);

  console.log("📍 Contract Address:", contractAddress);
  console.log("👤 Signer Address:", signerAddress);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
  console.log("🌐 Network:", (await ethers.provider.getNetwork()).name);
  console.log("🔗 Chain ID:", (await ethers.provider.getNetwork()).chainId);
  
  // Get contract
  const PrivateVotingSimple = await ethers.getContractFactory("PrivateVotingSimple");
  const contract = PrivateVotingSimple.attach(contractAddress);

  console.log("\n📊 Reading Contract State...\n");

  try {
    // Check poll count
    const pollCount = await contract.pollCount();
    console.log("✅ Poll Count:", pollCount.toString());

    // Check if signer is authorized decryptor
    const isAuthorized = await contract.isAuthorizedDecryptor(signerAddress);
    console.log("✅ Is Authorized Decryptor:", isAuthorized);

    console.log("\n🎉 Contract is accessible and working!\n");

    // Optional: Create a test poll
    console.log("📝 Would you like to create a test poll? (This will cost gas)");
    console.log("Run: npx hardhat run test-sepolia.ts --network sepolia\n");

  } catch (error) {
    console.error("❌ Error reading contract:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

