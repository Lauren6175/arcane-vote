// Contract configuration
// Sepolia testnet: 0xf1D27321cF3916853fde8964eEB725Edad8B10CE
// Local: 0x8A791620dd6260079BF849Dc5567aDC3F2FdC318
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0xf1D27321cF3916853fde8964eEB725Edad8B10CE";

export const CONTRACT_ABI = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "authorizeDecryptor",
    inputs: [{ name: "decryptor", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "authorizedDecryptors",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "createPoll",
    inputs: [
      { name: "title", type: "string", internalType: "string" },
      { name: "description", type: "string", internalType: "string" },
      { name: "options", type: "string[]", internalType: "string[]" },
      { name: "duration", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "vote",
    inputs: [
      { name: "pollId", type: "uint256", internalType: "uint256" },
      { name: "optionIndex", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "closePoll",
    inputs: [{ name: "pollId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getPollInfo",
    inputs: [{ name: "pollId", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "title", type: "string", internalType: "string" },
      { name: "description", type: "string", internalType: "string" },
      { name: "startTime", type: "uint256", internalType: "uint256" },
      { name: "endTime", type: "uint256", internalType: "uint256" },
      { name: "isActive", type: "bool", internalType: "bool" },
      { name: "creator", type: "address", internalType: "address" },
      { name: "totalVoters", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPollOptions",
    inputs: [{ name: "pollId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "string[]", internalType: "string[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasVoted",
    inputs: [
      { name: "pollId", type: "uint256", internalType: "uint256" },
      { name: "voter", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "pollCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isAuthorizedDecryptor",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isDecrypted",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "requestDecryption",
    inputs: [{ name: "pollId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getVoteCount",
    inputs: [
      { name: "pollId", type: "uint256", internalType: "uint256" },
      { name: "optionIndex", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "PollCreated",
    inputs: [
      { name: "pollId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "title", type: "string", indexed: false, internalType: "string" },
      { name: "creator", type: "address", indexed: true, internalType: "address" },
      { name: "startTime", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "endTime", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "VoteCasted",
    inputs: [
      { name: "pollId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "voter", type: "address", indexed: true, internalType: "address" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PollClosed",
    inputs: [{ name: "pollId", type: "uint256", indexed: true, internalType: "uint256" }],
    anonymous: false,
  },
  {
    type: "event",
    name: "DecryptionRequested",
    inputs: [
      { name: "pollId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "requester", type: "address", indexed: true, internalType: "address" },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "PollNotActive",
    inputs: [],
  },
  {
    type: "error",
    name: "AlreadyVoted",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidOption",
    inputs: [],
  },
  {
    type: "error",
    name: "NotAuthorized",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidTimeRange",
    inputs: [],
  },
] as const;

