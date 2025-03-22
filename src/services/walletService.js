// src/services/walletService.js
import { ethers } from 'ethers';

// ABI for the MultiSigWallet contract
const MULTISIG_ABI = [
  "function getOwners() view returns (address[])",
  "function getTransactionCount() view returns (uint256)",
  "function getTransaction(uint256 _txIndex) view returns (address to, uint256 value, bytes data, bool executed, uint256 numConfirmations)",
  "function submitTransaction(address _to, uint256 _value, bytes _data)",
  "function confirmTransaction(uint256 _txIndex)",
  "function executeTransaction(uint256 _txIndex)",
  "function revokeConfirmation(uint256 _txIndex)",
  "function isConfirmed(uint256, address) view returns (bool)",
  "function numConfirmationsRequired() view returns (uint256)",
  "event SubmitTransaction(address indexed owner, uint256 indexed txIndex, address indexed to, uint256 value, bytes data)",
  "event ConfirmTransaction(address indexed owner, uint256 indexed txIndex)",
  "event RevokeConfirmation(address indexed owner, uint256 indexed txIndex)",
  "event ExecuteTransaction(address indexed owner, uint256 indexed txIndex)"
];

// MultiSig wallet bytecode
// This would come from compiling the Solidity contract
const MULTISIG_BYTECODE = "0x60806040523480156200001157600080fd5b5060405162001b5b38038062001b5b83398..."; // Truncated for brevity

class WalletService {
  constructor(provider) {
    this.provider = provider;
    this.signer = null;
    this.wallet = null;
  }

  // Connect to a wallet
  async connect(provider) {
    if (provider) {
      this.provider = provider;
    }
    
    if (!this.provider) {
      throw new Error("Provider is required");
    }
    
    try {
      this.signer = this.provider.getSigner();
      const address = await this.signer.getAddress();
      
      return { address };
    } catch (error) {
      console.error("Error connecting wallet:", error);
      throw error;
    }
  }

  // Deploy a new MultiSig wallet contract
  async deployWallet(owners, requiredConfirmations) {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }
    
    try {
      // Validate inputs
      if (!owners || owners.length === 0) {
        throw new Error("At least one owner address is required");
      }
      
      if (requiredConfirmations <= 0 || requiredConfirmations > owners.length) {
        throw new Error(`Required confirmations must be between 1 and ${owners.length}`);
      }
      
      // Create contract factory
      const factory = new ethers.ContractFactory(
        MULTISIG_ABI,
        MULTISIG_BYTECODE,
        this.signer
      );
      
      // Deploy the contract
      const contract = await factory.deploy(owners, requiredConfirmations);
      await contract.deployed();
      
      return {
        address: contract.address,
        txHash: contract.deployTransaction.hash,
        owners,
        requiredConfirmations
      };
    } catch (error) {
      console.error("Error deploying wallet:", error);
      throw error;
    }
  }

  // Connect to an existing MultiSig wallet
  async connectToWallet(walletAddress) {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }
    
    try {
      this.wallet = new ethers.Contract(
        walletAddress,
        MULTISIG_ABI,
        this.signer
      );
      
      // Verify contract validity by calling a view function
      await this.wallet.getOwners();
      
      return { address: walletAddress };
    } catch (error) {
      console.error("Error connecting to wallet contract:", error);
      this.wallet = null;
      throw error;
    }
  }

  // Get basic wallet information
  async getWalletInfo() {
    if (!this.wallet) {
      throw new Error("No wallet connected");
    }
    
    try {
      const [owners, numConfirmationsRequired, balance] = await Promise.all([
        this.wallet.getOwners(),
        this.wallet.numConfirmationsRequired(),
        this.provider.getBalance(this.wallet.address)
      ]);
      
      return {
        address: this.wallet.address,
        owners,
        numConfirmationsRequired: numConfirmationsRequired.toNumber(),
        balance: ethers.utils.formatEther(balance)
      };
    } catch (error) {
      console.error("Error getting wallet info:", error);
      throw error;
    }
  }

  // Get all transactions
  async getTransactions() {
    if (!this.wallet) {
      throw new Error("No wallet connected");
    }
    
    try {
      const signerAddress = await this.signer.getAddress();
      const txCount = await this.wallet.getTransactionCount();
      const transactions = [];
      
      for (let i = 0; i < txCount; i++) {
        const [tx, isConfirmed] = await Promise.all([
          this.wallet.getTransaction(i),
          this.wallet.isConfirmed(i, signerAddress)
        ]);
        
        transactions.push({
          index: i,
          to: tx.to,
          value: ethers.utils.formatEther(tx.value),
          data: tx.data,
          executed: tx.executed,
          numConfirmations: tx.numConfirmations.toNumber(),
          isConfirmedByCurrentUser: isConfirmed
        });
      }
      
      return transactions;
    } catch (error) {
      console.error("Error getting transactions:", error);
      throw error;
    }
  }

  // Submit a new transaction
  async submitTransaction(to, value, data = "0x") {
    if (!this.wallet) {
      throw new Error("No wallet connected");
    }
    
    try {
      const valueWei = ethers.utils.parseEther(value.toString());
      const tx = await this.wallet.submitTransaction(to, valueWei, data);
      const receipt = await tx.wait();
      
      // Find the SubmitTransaction event in the receipt
      const event = receipt.events.find(e => e.event === 'SubmitTransaction');
      const txIndex = event ? event.args.txIndex.toNumber() : null;
      
      return {
        txHash: tx.hash,
        txIndex
      };
    } catch (error) {
      console.error("Error submitting transaction:", error);
      throw error;
    }
  }

  // Confirm a transaction
  async confirmTransaction(txIndex) {
    if (!this.wallet) {
      throw new Error("No wallet connected");
    }
    
    try {
      const tx = await this.wallet.confirmTransaction(txIndex);
      await tx.wait();
      
      return { txHash: tx.hash };
    } catch (error) {
      console.error("Error confirming transaction:", error);
      throw error;
    }
  }

  // Revoke a confirmation
  async revokeConfirmation(txIndex) {
    if (!this.wallet) {
      throw new Error("No wallet connected");
    }
    
    try {
      const tx = await this.wallet.revokeConfirmation(txIndex);
      await tx.wait();
      
      return { txHash: tx.hash };
    } catch (error) {
      console.error("Error revoking confirmation:", error);
      throw error;
    }
  }

  // Execute a transaction
  async executeTransaction(txIndex) {
    if (!this.wallet) {
      throw new Error("No wallet connected");
    }
    
    try {
      const tx = await this.wallet.executeTransaction(txIndex);
      await tx.wait();
      
      return { txHash: tx.hash };
    } catch (error) {
      console.error("Error executing transaction:", error);
      throw error;
    }
  }

  // Listen for events
  setupEventListeners(callbacks = {}) {
    if (!this.wallet) {
      throw new Error("No wallet connected");
    }
    
    // Remove any existing listeners
    this.removeEventListeners();
    
    // Set up listeners for each event type
    if (callbacks.onSubmit) {
      this.wallet.on('SubmitTransaction', (owner, txIndex, to, value, data) => {
        callbacks.onSubmit({
          owner,
          txIndex: txIndex.toNumber(),
          to,
          value: ethers.utils.formatEther(value),
          data
        });
      });
    }
    
    if (callbacks.onConfirm) {
      this.wallet.on('ConfirmTransaction', (owner, txIndex) => {
        callbacks.onConfirm({
          owner,
          txIndex: txIndex.toNumber()
        });
      });
    }
    
    if (callbacks.onRevoke) {
      this.wallet.on('RevokeConfirmation', (owner, txIndex) => {
        callbacks.onRevoke({
          owner,
          txIndex: txIndex.toNumber()
        });
      });
    }
    
    if (callbacks.onExecute) {
      this.wallet.on('ExecuteTransaction', (owner, txIndex) => {
        callbacks.onExecute({
          owner,
          txIndex: txIndex.toNumber()
        });
      });
    }
  }

  // Remove event listeners
  removeEventListeners() {
    if (this.wallet) {
      this.wallet.removeAllListeners();
    }
  }

  // Disconnect wallet
  disconnect() {
    this.removeEventListeners();
    this.wallet = null;
    this.signer = null;
  }
}

export default WalletService;