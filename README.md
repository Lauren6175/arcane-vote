# Arcane Vote - Enterprise Private Governance System

An anonymous voting system built with Fully Homomorphic Encryption (FHE) for enterprise governance, enabling employees to vote on strategic proposals or leadership positions while maintaining complete privacy and verifiability.

## 🚀 Live Demo

**Deployed Application**: [https://arcane-vote.vercel.app/](https://arcane-vote.vercel.app/)

📹 **Demo Video**: [Watch the demo](./arcane-vote.mp4)

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

## 🔐 Core Smart Contract

### PrivateVoting.sol

The main contract implements fully encrypted voting using Zama's FHEVM:

```solidity
contract PrivateVoting is SepoliaConfig {
    struct Poll {
        address creator;
        string question;
        string[] options;
        euint32[] voteCounts;    // Encrypted vote counts
        uint256 startTime;
        uint256 endTime;
        bool active;
    }
    
    mapping(uint256 => Poll) public polls;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    
    // Create a new encrypted poll
    function createPoll(
        string memory question,
        string[] memory options,
        uint256 duration
    ) external returns (uint256 pollId);
    
    // Submit encrypted vote
    function vote(
        uint256 pollId,
        bytes32 encryptedVoteHandle,
        bytes calldata encryptedVoteProof
    ) external;
    
    // Get encrypted result (only for authorized decryptors)
    function getEncryptedVoteCount(
        uint256 pollId,
        uint256 optionIndex
    ) external view returns (euint32);
}
```

**Key Privacy Features:**
- ✅ Vote counts remain encrypted throughout voting period
- ✅ Individual votes are never revealed
- ✅ Homomorphic addition of encrypted votes
- ✅ Results only accessible to authorized decryptors

## 🔒 Encryption & Decryption Flow

### Client-Side Encryption

Before submitting a vote, the frontend encrypts the user's choice:

```typescript
// 1. Initialize FHEVM instance
const fhevmInstance = await createInstance({
  chainId: sepoliaChainId,
  publicKey: await contract.getFhevmPublicKey()
});

// 2. Encrypt the vote option
const encryptedInput = await fhevmInstance.createEncryptedInput(
  contractAddress,
  userAddress
);
encryptedInput.add32(1); // Vote for option 1
const encryptedVote = await encryptedInput.encrypt();

// 3. Submit encrypted vote to contract
await contract.vote(
  pollId,
  encryptedVote.handles[0],    // Encrypted handle
  encryptedVote.inputProof      // Zero-knowledge proof
);
```

### On-Chain Homomorphic Operations

The smart contract performs operations on encrypted data without decryption:

```solidity
// Import encrypted vote from user
euint32 encryptedVote = TFHE.asEuint32(encryptedVoteHandle, encryptedVoteProof);

// Validate vote is within valid range
ebool isValid = TFHE.le(encryptedVote, TFHE.asEuint32(1));

// Homomorphically add to vote count
poll.voteCounts[optionIndex] = TFHE.add(
    poll.voteCounts[optionIndex],
    TFHE.select(isValid, encryptedVote, TFHE.asEuint32(0))
);
```

### Authorized Decryption

Only authorized decryptors can view results:

```solidity
function allowDecryptorAccess(
    uint256 pollId,
    uint256 optionIndex,
    address decryptor
) external {
    require(msg.sender == polls[pollId].creator, "Not authorized");
    
    // Grant decryption permission
    TFHE.allow(polls[pollId].voteCounts[optionIndex], decryptor);
}

function getEncryptedVoteCount(
    uint256 pollId,
    uint256 optionIndex
) external view returns (euint32) {
    require(hasDecryptionAccess(pollId, optionIndex, msg.sender), "No access");
    return polls[pollId].voteCounts[optionIndex];
}
```

### Privacy Guarantees

| Data | During Voting | After Poll Closes |
|------|--------------|-------------------|
| **Individual Votes** | ✅ Encrypted (`euint32`) | ✅ Never revealed |
| **Vote Counts** | ✅ Encrypted (`euint32`) | ✅ Encrypted (only authorized can decrypt) |
| **Voter Participation** | ⚠️ Public (address recorded) | ⚠️ Public |
| **Homomorphic Operations** | ✅ Add/Compare without decryption | N/A |

### Key Homomorphic Operations

```solidity
// 1. Encrypted comparison
ebool isEqual = TFHE.eq(encryptedVote, TFHE.asEuint32(optionIndex));

// 2. Encrypted addition
euint32 newCount = TFHE.add(currentCount, increment);

// 3. Conditional selection
euint32 result = TFHE.select(condition, valueIfTrue, valueIfFalse);

// 4. Less-than comparison
ebool isLessThan = TFHE.le(encryptedVote, maxValue);
```

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

