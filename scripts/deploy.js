// deploy.js - Script to deploy MultiSigWallet to Monad network
const hre = require("hardhat");

async function main() {
  console.log("Deploying MultiSigWallet to Monad network...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying from address: ${deployer.address}`);
  
  // Get initial configuration
  const owners = [
    deployer.address,
    "0x3AB5AfaF05E53d9949a3d87EfD31696950e519eF"
  ];
  
  const requiredConfirmations = 1;
  
  try {
    // Get the contract factory
    const MultiSigWallet = await hre.ethers.getContractFactory("MultiSigWallet");
    console.log("Contract factory created successfully");
    
    // Log deployment parameters
    console.log("Deployment parameters:", {
      owners,
      requiredConfirmations
    });
    
    console.log("Starting deployment...");
    
    // Deploy the contract without explicit gas limit - let hardhat handle it
    const multiSig = await MultiSigWallet.deploy(
      owners,
      requiredConfirmations
    );
    
    console.log("Contract deployment initiated");
    console.log(`Transaction hash: ${multiSig.deploymentTransaction().hash}`);
    console.log("Waiting for confirmation...");
    
    // Wait for deployment with more details
    const receipt = await multiSig.deploymentTransaction().wait();
    console.log("Deployment receipt:", {
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status,
      contractAddress: receipt.contractAddress
    });
    
    const contractAddress = await multiSig.getAddress();
    
    console.log(`MultiSigWallet deployed to: ${contractAddress}`);
    console.log(`Owner addresses: ${owners.join(', ')}`);
    console.log(`Required confirmations: ${requiredConfirmations}`);
    
    // Verify the contract was deployed correctly
    const deployedCode = await hre.ethers.provider.getCode(contractAddress);
    if (deployedCode === "0x") {
      throw new Error("Contract deployment failed - no code at contract address");
    }
    
    return contractAddress;
  } catch (error) {
    console.error("Deployment failed with error:", error);
    if (error.transaction) {
      console.error("Transaction details:", {
        from: error.transaction.from,
        to: error.transaction.to,
        data: error.transaction.data?.substring(0, 66) + "...", // Show start of data
        gasLimit: error.transaction.gasLimit?.toString(),
        value: error.transaction.value?.toString()
      });
    }
    if (error.receipt) {
      console.error("Transaction receipt:", {
        status: error.receipt.status,
        gasUsed: error.receipt.gasUsed?.toString(),
        blockNumber: error.receipt.blockNumber,
        contractAddress: error.receipt.contractAddress
      });
    }
    process.exit(1);
  }
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });