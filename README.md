# Arcane Vote - Enterprise Private Governance System

An anonymous voting system built with Fully Homomorphic Encryption (FHE) for enterprise governance, enabling employees to vote on strategic proposals or leadership positions while maintaining complete privacy and verifiability.

## Features

- **Anonymous Voting**: Votes are encrypted using FHE, ensuring voter anonymity
- **Homomorphic Aggregation**: Vote counts are aggregated without decryption
- **Authorized Decryption**: Only authorized personnel can decrypt final results
- **Secure & Verifiable**: Results are mathematically verifiable while maintaining privacy
- **Modern UI**: Clean, intuitive interface with Rainbow wallet integration

## Technology Stack

### Smart Contracts
- Solidity 0.8.27
- FHEVM (Zama's FHE library)
- Hardhat development environment

### Frontend
- React + TypeScript
- Vite
- Rainbow Kit (wallet connection)
- Tailwind CSS + shadcn/ui
- ethers.js v6

## Project Structure

```
arcane-vote/
├── contracts/          # Solidity smart contracts
├── test/              # Contract test suites
├── deploy/            # Deployment scripts
├── tasks/             # Hardhat tasks
├── frontend/          # React frontend application
└── types/             # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 7.0.0

### Installation

1. Install dependencies:
```bash
npm install
```

2. Compile contracts:
```bash
npm run compile
```

3. Run tests:
```bash
npm test
```

### Deployment

#### Local Network

1. Start local hardhat node:
```bash
npx hardhat node
```

2. Deploy contracts:
```bash
npm run deploy
```

#### Sepolia Testnet

1. Set up environment variables:
```bash
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set ETHERSCAN_API_KEY
```

2. Deploy to Sepolia:
```bash
npm run deploy:sepolia
```

3. Run Sepolia tests:
```bash
npm run test:sepolia
```

### Frontend Development

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

## Smart Contract

### PrivateVoting.sol

The main contract implementing the private voting system with the following key functions:

- `createPoll(title, description, options, duration)`: Create a new voting poll
- `vote(pollId, optionIndex, encryptedValue, proof)`: Cast an encrypted vote
- `closePoll(pollId)`: Close a poll
- `getEncryptedVoteCount(pollId, optionIndex)`: Get encrypted vote count (authorized only)
- `allowDecryptorAccess(pollId, optionIndex, decryptor)`: Grant decryption access

## Security

- All votes are encrypted using FHE
- Vote aggregation happens on encrypted data (homomorphic operations)
- Only authorized decryptors can view final results
- Voters cannot vote twice
- Results cannot be tampered with

## Testing

Run comprehensive test suite:
```bash
npm test
```

Test coverage:
```bash
npm run coverage
```

## License

BSD-3-Clause-Clear

## Support

For issues and questions, please open an issue on GitHub.

