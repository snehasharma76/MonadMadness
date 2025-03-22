// monad-config.js
// Configuration file for Monad network settings

const NETWORKS = {
    // Monad Testnet
    monadTestnet: {
      name: 'Monad Testnet',
      chainId: 1286,
      rpcUrl: 'https://rpc.monad.xyz/testnet',
      blockExplorer: 'https://explorer.testnet.monad.xyz',
      nativeCurrency: {
        name: 'MONAD',
        symbol: 'MONAD',
        decimals: 18
      }
    },
    
    // Monad Mainnet - Update with correct values when available
    monadMainnet: {
      name: 'Monad Mainnet',
      chainId: 1287, // This is a placeholder, use the correct chainId
      rpcUrl: 'https://rpc.monad.xyz/mainnet', // Placeholder URL
      blockExplorer: 'https://explorer.monad.xyz', // Placeholder URL
      nativeCurrency: {
        name: 'MONAD',
        symbol: 'MONAD',
        decimals: 18
      }
    }
  }
  
  // Get network info by chain ID
  function getNetworkInfoByChainId(chainId) {
    for (const key in NETWORKS) {
      if (NETWORKS[key].chainId === chainId) {
        return NETWORKS[key];
      }
    }
    return null;
  }
  
  // Format transaction hash for block explorer
  function formatTxHashUrl(txHash, networkKey = 'monadTestnet') {
    const network = NETWORKS[networkKey];
    if (!network || !network.blockExplorer) return '';
    
    return `${network.blockExplorer}/tx/${txHash}`;
  }
  
  // Format address for block explorer
  function formatAddressUrl(address, networkKey = 'monadTestnet') {
    const network = NETWORKS[networkKey];
    if (!network || !network.blockExplorer) return '';
    
    return `${network.blockExplorer}/address/${address}`;
  }
  
  module.exports = {
    NETWORKS,
    addMonadNetworkToMetaMask,
    switchToMonadNetwork,
    getNetworkInfoByChainId,
    formatTxHashUrl,
    formatAddressUrl
  };;
  
  // Function to add Monad network to MetaMask
  async function addMonadNetworkToMetaMask(networkKey = 'monadTestnet') {
    if (!window.ethereum) {
      console.error('MetaMask is not installed!');
      return false;
    }
    
    const network = NETWORKS[networkKey];
    if (!network) {
      console.error(`Network ${networkKey} not found in configuration`);
      return false;
    }
    
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${network.chainId.toString(16)}`,
            chainName: network.name,
            nativeCurrency: network.nativeCurrency,
            rpcUrls: [network.rpcUrl],
            blockExplorerUrls: [network.blockExplorer]
          }
        ]
      });
      return true;
    } catch (error) {
      console.error('Failed to add network to MetaMask:', error);
      return false;
    }
  }
  
  // Function to switch to Monad network in MetaMask
  async function switchToMonadNetwork(networkKey = 'monadTestnet') {
    if (!window.ethereum) {
      console.error('MetaMask is not installed!');
      return false;
    }
    
    const network = NETWORKS[networkKey];
    if (!network) {
      console.error(`Network ${networkKey} not found in configuration`);
      return false;
    }
    
    const chainIdHex = `0x${network.chainId.toString(16)}`;
    
    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }]
      });
      return true;
    } catch (error) {
      // If the network is not added yet, try to add it
      if (error.code === 4902) {
        return addMonadNetworkToMetaMask(networkKey);
      }
      console.error('Failed to switch network:', error);
      return false;
    }
  }