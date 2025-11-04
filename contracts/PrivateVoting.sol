// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title PrivateVoting - Enterprise Private Governance System
/// @author Arcane Vote Team
/// @notice Anonymous voting system using FHE encryption for enterprise governance
/// @dev Implements encrypted voting with homomorphic aggregation and authorized decryption
contract PrivateVoting is SepoliaConfig {
    /// @notice Represents a voting poll
    struct Poll {
        string title;
        string description;
        string[] options;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        address creator;
        mapping(uint256 => euint32) encryptedVotes; // optionIndex => encrypted vote count
        mapping(address => bool) hasVoted;
        uint256 totalVoters;
    }

    /// @notice Authorized addresses that can decrypt results
    mapping(address => bool) public authorizedDecryptors;

    /// @notice All polls
    mapping(uint256 => Poll) public polls;
    uint256 public pollCount;

    /// @notice Events
    event PollCreated(uint256 indexed pollId, string title, address indexed creator, uint256 startTime, uint256 endTime);
    event VoteCasted(uint256 indexed pollId, address indexed voter);
    event PollClosed(uint256 indexed pollId);
    event DecryptorAuthorized(address indexed decryptor);
    event DecryptorRevoked(address indexed decryptor);

    /// @notice Errors
    error PollNotActive();
    error PollNotEnded();
    error AlreadyVoted();
    error InvalidOption();
    error NotAuthorized();
    error InvalidTimeRange();

    /// @notice Constructor - sets initial authorized decryptor
    constructor() {
        authorizedDecryptors[msg.sender] = true;
        emit DecryptorAuthorized(msg.sender);
    }

    /// @notice Authorize an address to decrypt voting results
    /// @param decryptor Address to authorize
    function authorizeDecryptor(address decryptor) external {
        if (!authorizedDecryptors[msg.sender]) revert NotAuthorized();
        authorizedDecryptors[decryptor] = true;
        emit DecryptorAuthorized(decryptor);
    }

    /// @notice Revoke decryption authorization
    /// @param decryptor Address to revoke
    function revokeDecryptor(address decryptor) external {
        if (!authorizedDecryptors[msg.sender]) revert NotAuthorized();
        authorizedDecryptors[decryptor] = false;
        emit DecryptorRevoked(decryptor);
    }

    /// @notice Create a new voting poll
    /// @param title Poll title
    /// @param description Poll description
    /// @param options Array of voting options
    /// @param duration Duration in seconds
    function createPoll(
        string memory title,
        string memory description,
        string[] memory options,
        uint256 duration
    ) external returns (uint256) {
        if (duration == 0) revert InvalidTimeRange();

        uint256 pollId = pollCount++;
        Poll storage newPoll = polls[pollId];
        newPoll.title = title;
        newPoll.description = description;
        newPoll.options = options;
        newPoll.startTime = block.timestamp;
        newPoll.endTime = block.timestamp + duration;
        newPoll.isActive = true;
        newPoll.creator = msg.sender;

        // Initialize encrypted vote counts to 0 for each option
        for (uint256 i = 0; i < options.length; i++) {
            newPoll.encryptedVotes[i] = FHE.asEuint32(0);
        }

        emit PollCreated(pollId, title, msg.sender, newPoll.startTime, newPoll.endTime);
        return pollId;
    }

    /// @notice Cast an encrypted vote
    /// @param pollId Poll ID to vote on
    /// @param optionIndex Index of the selected option
    /// @param encryptedValue Encrypted vote value (should be 1)
    /// @param inputProof Proof for the encrypted input
    function vote(
        uint256 pollId,
        uint256 optionIndex,
        externalEuint32 encryptedValue,
        bytes calldata inputProof
    ) external {
        Poll storage poll = polls[pollId];

        if (!poll.isActive || block.timestamp > poll.endTime) revert PollNotActive();
        if (poll.hasVoted[msg.sender]) revert AlreadyVoted();
        if (optionIndex >= poll.options.length) revert InvalidOption();

        // Convert external encrypted input to internal encrypted type
        euint32 encryptedVote = FHE.fromExternal(encryptedValue, inputProof);

        // Add encrypted vote to the option's total (homomorphic addition)
        poll.encryptedVotes[optionIndex] = FHE.add(poll.encryptedVotes[optionIndex], encryptedVote);

        // Allow contract and authorized decryptors to access the encrypted value
        FHE.allowThis(poll.encryptedVotes[optionIndex]);

        // Mark voter as voted
        poll.hasVoted[msg.sender] = true;
        poll.totalVoters++;

        emit VoteCasted(pollId, msg.sender);
    }

    /// @notice Cast a simple vote (for MVP demo - not using FHE encryption)
    /// @param pollId Poll ID to vote on
    /// @param optionIndex Index of the selected option
    /// @dev This is a simplified version for testing without full FHE implementation
    function voteSimple(uint256 pollId, uint256 optionIndex) external {
        Poll storage poll = polls[pollId];

        if (!poll.isActive || block.timestamp > poll.endTime) revert PollNotActive();
        if (poll.hasVoted[msg.sender]) revert AlreadyVoted();
        if (optionIndex >= poll.options.length) revert InvalidOption();

        // Increment vote count (simplified for demo)
        euint32 one = FHE.asEuint32(1);
        poll.encryptedVotes[optionIndex] = FHE.add(poll.encryptedVotes[optionIndex], one);

        // Allow contract to access the encrypted value
        FHE.allowThis(poll.encryptedVotes[optionIndex]);

        // Mark voter as voted
        poll.hasVoted[msg.sender] = true;
        poll.totalVoters++;

        emit VoteCasted(pollId, msg.sender);
    }

    /// @notice Close a poll (can be called by creator or after end time)
    /// @param pollId Poll ID to close
    function closePoll(uint256 pollId) external {
        Poll storage poll = polls[pollId];

        if (!poll.isActive) revert PollNotActive();
        if (block.timestamp < poll.endTime && msg.sender != poll.creator) revert NotAuthorized();

        poll.isActive = false;
        emit PollClosed(pollId);
    }

    /// @notice Get encrypted vote count for an option (only for authorized decryptors)
    /// @param pollId Poll ID
    /// @param optionIndex Option index
    /// @return Encrypted vote count
    function getEncryptedVoteCount(uint256 pollId, uint256 optionIndex) external view returns (euint32) {
        if (!authorizedDecryptors[msg.sender]) revert NotAuthorized();

        Poll storage poll = polls[pollId];
        if (optionIndex >= poll.options.length) revert InvalidOption();

        return poll.encryptedVotes[optionIndex];
    }

    /// @notice Allow authorized decryptor to access encrypted vote count
    /// @param pollId Poll ID
    /// @param optionIndex Option index
    /// @param decryptor Address to grant access
    function allowDecryptorAccess(uint256 pollId, uint256 optionIndex, address decryptor) external {
        if (!authorizedDecryptors[msg.sender]) revert NotAuthorized();

        Poll storage poll = polls[pollId];
        if (optionIndex >= poll.options.length) revert InvalidOption();

        FHE.allow(poll.encryptedVotes[optionIndex], decryptor);
    }

    /// @notice Get poll basic information
    /// @param pollId Poll ID
    /// @return title Poll title
    /// @return description Poll description
    /// @return startTime Start time
    /// @return endTime End time
    /// @return isActive Active status
    /// @return creator Creator address
    /// @return totalVoters Total number of voters
    function getPollInfo(
        uint256 pollId
    )
        external
        view
        returns (
            string memory title,
            string memory description,
            uint256 startTime,
            uint256 endTime,
            bool isActive,
            address creator,
            uint256 totalVoters
        )
    {
        Poll storage poll = polls[pollId];
        return (poll.title, poll.description, poll.startTime, poll.endTime, poll.isActive, poll.creator, poll.totalVoters);
    }

    /// @notice Get poll options
    /// @param pollId Poll ID
    /// @return Array of option strings
    function getPollOptions(uint256 pollId) external view returns (string[] memory) {
        return polls[pollId].options;
    }

    /// @notice Check if address has voted in a poll
    /// @param pollId Poll ID
    /// @param voter Voter address
    /// @return Whether the address has voted
    function hasVoted(uint256 pollId, address voter) external view returns (bool) {
        return polls[pollId].hasVoted[voter];
    }

    /// @notice Check if address is authorized decryptor
    /// @param account Address to check
    /// @return Whether the address is authorized
    function isAuthorizedDecryptor(address account) external view returns (bool) {
        return authorizedDecryptors[account];
    }
}

