import React, { useState, useEffect } from 'react';

const MultiSigWalletApp = () => {
  // State variables
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [owners, setOwners] = useState([]);
  const [balance, setBalance] = useState('0');
  const [transactions, setTransactions] = useState([]);
  const [confirmationsRequired, setConfirmationsRequired] = useState(0);
  
  // Form state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [data, setData] = useState('0x');
  const [deploymentStep, setDeploymentStep] = useState(0);
  const [ownerAddresses, setOwnerAddresses] = useState(['']);
  const [requiredConfirmations, setRequiredConfirmations] = useState(1);
  const [contractAddress, setContractAddress] = useState('');
  
  // Connect to wallet
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Create Web3 instance
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        
        // Get current account
        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);
        
        // Set up event listener for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
          setAccount(accounts[0]);
        });
        
        return { web3: web3Instance, account: accounts[0] };
      } else {
        alert('Please install MetaMask to use this dApp');
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
    }
  };
  
  // ABI for the MultiSigWallet contract
  const contractABI = [
    {
      "inputs": [],
      "name": "getOwners",
      "outputs": [{"type": "address[]"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getTransactionCount",
      "outputs": [{"type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"type": "uint256", "name": "_txIndex"}],
      "name": "getTransaction",
      "outputs": [
        {"type": "address", "name": "to"},
        {"type": "uint256", "name": "value"},
        {"type": "bytes", "name": "data"},
        {"type": "bool", "name": "executed"},
        {"type": "uint256", "name": "numConfirmations"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {"type": "address", "name": "_to"},
        {"type": "uint256", "name": "_value"},
        {"type": "bytes", "name": "_data"}
      ],
      "name": "submitTransaction",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"type": "uint256", "name": "_txIndex"}],
      "name": "confirmTransaction",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"type": "uint256", "name": "_txIndex"}],
      "name": "executeTransaction",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"type": "uint256", "name": "_txIndex"}],
      "name": "revokeConfirmation",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"type": "uint256", "name": ""},
        {"type": "address", "name": ""}
      ],
      "name": "isConfirmed",
      "outputs": [{"type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "numConfirmationsRequired",
      "outputs": [{"type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }
  ];
  
  // Deploy a new MultiSigWallet
  const deployContract = async () => {
    try {
      if (!web3) {
        const { web3: newWeb3 } = await connectWallet();
        if (!newWeb3) return;
      }
      
      // Filter out empty addresses
      const filteredOwners = ownerAddresses.filter(addr => 
        web3.utils.isAddress(addr)
      );
      
      if (filteredOwners.length === 0) {
        alert('Please add at least one valid owner address');
        return;
      }
      
      if (requiredConfirmations <= 0 || requiredConfirmations > filteredOwners.length) {
        alert(`Required confirmations must be between 1 and ${filteredOwners.length}`);
        return;
      }
      
      setDeploymentStep(1);
      
      // Contract deployment code would go here
      // For demonstration, we'll skip actual deployment
      setDeploymentStep(2);
      alert('For this demo, please enter a contract address manually instead of actual deployment');
    } catch (error) {
      console.error('Error deploying contract:', error);
      setDeploymentStep(0);
    }
  };
  
  // Load contract data
  const loadContractData = async () => {
    try {
      if (!web3 || !contractAddress || !web3.utils.isAddress(contractAddress)) return;
      
      const contract = new web3.eth.Contract(contractABI, contractAddress);
      setContract(contract);
      
      // Get basic contract info
      const owners = await contract.methods.getOwners().call();
      const confirmationsRequired = await contract.methods.numConfirmationsRequired().call();
      const balance = await web3.eth.getBalance(contractAddress);
      
      setOwners(owners);
      setConfirmationsRequired(Number(confirmationsRequired));
      setBalance(web3.utils.fromWei(balance, 'ether'));
      
      // Load transactions
      const txCount = await contract.methods.getTransactionCount().call();
      const transactions = [];
      
      for (let i = 0; i < txCount; i++) {
        const tx = await contract.methods.getTransaction(i).call();
        const isConfirmedByCurrentUser = await contract.methods.isConfirmed(i, account).call();
        
        transactions.push({
          index: i,
          to: tx.to,
          value: web3.utils.fromWei(tx.value, 'ether'),
          data: tx.data,
          executed: tx.executed,
          numConfirmations: Number(tx.numConfirmations),
          isConfirmedByCurrentUser
        });
      }
      
      setTransactions(transactions);
    } catch (error) {
      console.error('Error loading contract data:', error);
    }
  };
  
  // Submit a new transaction
  const submitTransaction = async () => {
    try {
      if (!contract || !web3.utils.isAddress(recipient)) {
        alert('Invalid recipient address or contract not loaded');
        return;
      }
      
      const valueInWei = web3.utils.toWei(amount || '0', 'ether');
      
      await contract.methods
        .submitTransaction(recipient, valueInWei, data)
        .send({ from: account });
      
      alert('Transaction submitted successfully!');
      loadContractData();
    } catch (error) {
      console.error('Error submitting transaction:', error);
      alert(`Error: ${error.message}`);
    }
  };
  
  // Confirm a transaction
  const confirmTransaction = async (txIndex) => {
    try {
      await contract.methods
        .confirmTransaction(txIndex)
        .send({ from: account });
      
      alert('Transaction confirmed successfully!');
      loadContractData();
    } catch (error) {
      console.error('Error confirming transaction:', error);
      alert(`Error: ${error.message}`);
    }
  };
  
  // Execute a transaction
  const executeTransaction = async (txIndex) => {
    try {
      await contract.methods
        .executeTransaction(txIndex)
        .send({ from: account });
      
      alert('Transaction executed successfully!');
      loadContractData();
    } catch (error) {
      console.error('Error executing transaction:', error);
      alert(`Error: ${error.message}`);
    }
  };
  
  // Revoke a confirmation
  const revokeConfirmation = async (txIndex) => {
    try {
      await contract.methods
        .revokeConfirmation(txIndex)
        .send({ from: account });
      
      alert('Confirmation revoked successfully!');
      loadContractData();
    } catch (error) {
      console.error('Error revoking confirmation:', error);
      alert(`Error: ${error.message}`);
    }
  };
  
  // Add another owner input field
  const addOwnerField = () => {
    setOwnerAddresses([...ownerAddresses, '']);
  };
  
  // Update owner address field
  const updateOwnerAddress = (index, value) => {
    const newAddresses = [...ownerAddresses];
    newAddresses[index] = value;
    setOwnerAddresses(newAddresses);
  };
  
  // Effect to load contract data when contract address changes
  useEffect(() => {
    if (contractAddress && account) {
      loadContractData();
    }
  }, [contractAddress, account]);
  
  // Effect to add Web3 script
  useEffect(() => {
    const loadWeb3 = async () => {
      if (window.ethereum) {
        try {
          // Modern dapp browsers
          if (!window.Web3) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/web3/1.7.4/web3.min.js';
            script.async = true;
            script.onload = () => {
              const web3Instance = new Web3(window.ethereum);
              setWeb3(web3Instance);
            };
            document.body.appendChild(script);
          } else {
            const web3Instance = new Web3(window.ethereum);
            setWeb3(web3Instance);
          }
        } catch (error) {
          console.error("Failed to load Web3:", error);
        }
      }
    };
    
    loadWeb3();
  }, []);
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Multi-Signature Wallet dApp</h1>
      
      {/* Connect Wallet Button */}
      <div className="mb-6">
        {!account ? (
          <button 
            onClick={connectWallet}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Connect Wallet
          </button>
        ) : (
          <div>
            <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
          </div>
        )}
      </div>
      
      {account && (
        <>
          {/* Contract Deployment/Loading Section */}
          {!contract ? (
            <div className="mb-8 p-4 border rounded">
              <h2 className="text-xl font-semibold mb-4">
                {deploymentStep === 0 ? 'Deploy New Wallet' : 'Deploying...'}
              </h2>
              
              {deploymentStep === 0 && (
                <>
                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Owner Addresses:</h3>
                    {ownerAddresses.map((address, index) => (
                      <div key={index} className="flex mb-2">
                        <input 
                          type="text" 
                          value={address}
                          onChange={(e) => updateOwnerAddress(index, e.target.value)}
                          placeholder="Owner address (0x...)"
                          className="flex-1 p-2 border rounded mr-2"
                        />
                        {index === ownerAddresses.length - 1 && (
                          <button 
                            onClick={addOwnerField}
                            className="bg-green-500 text-white px-3 rounded"
                          >
                            +
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block mb-2">Required Confirmations:</label>
                    <input 
                      type="number" 
                      value={requiredConfirmations}
                      onChange={(e) => setRequiredConfirmations(parseInt(e.target.value))}
                      min="1"
                      max={ownerAddresses.length}
                      className="p-2 border rounded w-full"
                    />
                  </div>
                  
                  <button 
                    onClick={deployContract}
                    className="bg-purple-600 text-white px-4 py-2 rounded mr-2"
                  >
                    Deploy New Wallet
                  </button>
                  
                  <h3 className="font-medium my-4">- OR -</h3>
                  
                  <div className="mb-4">
                    <label className="block mb-2">Connect to Existing Wallet:</label>
                    <input 
                      type="text" 
                      value={contractAddress}
                      onChange={(e) => setContractAddress(e.target.value)}
                      placeholder="Contract address (0x...)"
                      className="p-2 border rounded w-full mb-2"
                    />
                    <button 
                      onClick={loadContractData}
                      className="bg-blue-500 text-white px-4 py-2 rounded"
                      disabled={!contractAddress}
                    >
                      Connect to Wallet
                    </button>
                  </div>
                </>
              )}
              
              {deploymentStep === 1 && (
                <div>
                  <p>Deploying wallet contract...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 my-4">
                    <div className="bg-blue-600 h-2.5 rounded-full w-1/2"></div>
                  </div>
                </div>
              )}
              
              {deploymentStep === 2 && (
                <div>
                  <p className="mb-4">For this demo, please enter your contract address:</p>
                  <input 
                    type="text" 
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    placeholder="Contract address (0x...)"
                    className="p-2 border rounded w-full mb-2"
                  />
                  <button 
                    onClick={loadContractData}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    disabled={!contractAddress}
                  >
                    Connect to Wallet
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Wallet Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 border rounded">
                  <h3 className="font-medium mb-2">Balance:</h3>
                  <p className="text-xl">{balance} ETH</p>
                </div>
                
                <div className="p-4 border rounded">
                  <h3 className="font-medium mb-2">Required Confirmations:</h3>
                  <p className="text-xl">{confirmationsRequired} of {owners.length}</p>
                </div>
                
                <div className="p-4 border rounded">
                  <h3 className="font-medium mb-2">Transactions:</h3>
                  <p className="text-xl">{transactions.length} total</p>
                </div>
              </div>
              
              {/* Owners List */}
              <div className="mb-6 p-4 border rounded">
                <h2 className="text-xl font-semibold mb-4">Owners</h2>
                <div className="grid gap-2">
                  {owners.map((owner, index) => (
                    <div key={index} className="p-2 border rounded flex justify-between items-center">
                      <span>{owner}</span>
                      {owner.toLowerCase() === account.toLowerCase() && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">You</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Submit Transaction Form */}
              <div className="mb-6 p-4 border rounded">
                <h2 className="text-xl font-semibold mb-4">Submit Transaction</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2">Recipient:</label>
                    <input 
                      type="text" 
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="0x..."
                      className="p-2 border rounded w-full"
                    />
                  </div>
                  <div>
                    <label className="block mb-2">Amount (ETH):</label>
                    <input 
                      type="text" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.0"
                      className="p-2 border rounded w-full"
                    />
                  </div>
                  <div>
                    <label className="block mb-2">Data (hex):</label>
                    <input 
                      type="text" 
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      placeholder="0x"
                      className="p-2 border rounded w-full"
                    />
                  </div>
                  <button 
                    onClick={submitTransaction}
                    className="bg-green-600 text-white px-4 py-2 rounded"
                  >
                    Submit Transaction
                  </button>
                </div>
              </div>
              
              {/* Transactions List */}
              <div className="p-4 border rounded">
                <h2 className="text-xl font-semibold mb-4">Transactions</h2>
                {transactions.length === 0 ? (
                  <p>No transactions yet</p>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((tx) => (
                      <div key={tx.index} className="p-4 border rounded">
                        <div className="mb-2 flex justify-between">
                          <span className="font-medium">Transaction #{tx.index}</span>
                          <span className={`px-2 py-1 rounded text-sm ${tx.executed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {tx.executed ? 'Executed' : 'Pending'}
                          </span>
                        </div>
                        <div className="mb-2">
                          <span className="text-gray-600">To: </span>
                          <span>{tx.to}</span>
                        </div>
                        <div className="mb-2">
                          <span className="text-gray-600">Value: </span>
                          <span>{tx.value} ETH</span>
                        </div>
                        <div className="mb-2">
                          <span className="text-gray-600">Confirmations: </span>
                          <span>{tx.numConfirmations} of {confirmationsRequired}</span>
                        </div>
                        
                        {!tx.executed && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {!tx.isConfirmedByCurrentUser ? (
                              <button 
                                onClick={() => confirmTransaction(tx.index)}
                                className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                              >
                                Confirm
                              </button>
                            ) : (
                              <button 
                                onClick={() => revokeConfirmation(tx.index)}
                                className="bg-orange-500 text-white px-3 py-1 rounded text-sm"
                              >
                                Revoke
                              </button>
                            )}
                            
                            {tx.numConfirmations >= confirmationsRequired && (
                              <button 
                                onClick={() => executeTransaction(tx.index)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                              >
                                Execute
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MultiSigWalletApp;