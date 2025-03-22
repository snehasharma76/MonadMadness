# MultiSig Wallet on Monad

A secure multi-signature wallet implementation deployed on the Monad testnet. This wallet requires a specified number of confirmations from authorized owners before executing transactions.

## Deployed Contracts

- **Network**: Monad Testnet (Chain ID: 10143)
- **Contract Address**: `0x49b31db6c3931DeAbDdbB3aA09105171Ca5758F2`
- **Block Explorer**: [Monad Testnet Explorer](https://testnet-explorer.monad.xyz/)

## Features

- Multiple owner management
- Configurable number of required confirmations
- Submit, confirm, and revoke transactions
- Execute transactions only after required confirmations
- View transaction history and status

## Setup

1. Clone the repository:
```bash
git clone <https://github.com/snehasharma76/MonadMadness.git>
cd multisig_monad

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Development
Compile contracts:
```bash
npx hardhat compile
```
Run tests:
```bash
npx hardhat test
```
Deploy:
```bash
npx hardhat run scripts/deploy.js --network monadTestnet
```

## Usage

1. Open the app at `http://localhost:3000`
2. Connect your MetaMask wallet
3. Add owners and set the required number of confirmations
4. Submit a transaction
5. Confirm or revoke the transaction
6. Execute the transaction

## Contract Interactions

- Submit a transaction: `submitTransaction(address to, uint256 value, bytes data)`
- Confirm a transaction: `confirmTransaction(uint256 txIndex)`
- Revoke a confirmation: `revokeConfirmation(uint256 txIndex)`
- Execute a transaction: `executeTransaction(uint256 txIndex)`

## Security

- Only authorized owners can submit, confirm, and revoke transactions
- Transactions require a specified number of confirmations before execution
- Transactions can be executed only after the required number of confirmations

## License

MIT License

## Contact

For support or inquiries, please contact [Your Name] (snehasharma76@gmail.com).

## Disclaimer

This is a demo application for educational purposes only. Use at your own risk.
```
