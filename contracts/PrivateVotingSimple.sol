// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PrivateVotingSimple - Simplified for Local Testing
/// @notice Anonymous voting system (simplified for MVP demo)
/// @dev This version works without full FHEVM setup for local testing
contract PrivateVotingSimple {
    /// @notice Represents a voting poll
    struct Poll {
        string title;
        string description;
        string[] options;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        address creator;
        mapping(uint256 => uint256) voteCount; // optionIndex => count (encrypted in production)
        mapping(address => bool) hasVoted;
        uint256 totalVoters;
    }

    /// @notice Authorized addresses that can view results
    mapping(address => bool) public authorizedDecryptors;

    /// @notice Track which polls have been decrypted
    mapping(uint256 => bool) public isDecrypted;

    /// @notice All polls
    mapping(uint256 => Poll) public polls;
    uint256 public pollCount;

    /// @notice Events
    event PollCreated(uint256 indexed pollId, string title, address indexed creator, uint256 startTime, uint256 endTime);
    event VoteCasted(uint256 indexed pollId, address indexed voter);
    event PollClosed(uint256 indexed pollId);
    event DecryptorAuthorized(address indexed decryptor);
    event DecryptorRevoked(address indexed decryptor);
    event DecryptionRequested(uint256 indexed pollId, address indexed requester);

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

    /// @notice Authorize an address to view results
    function authorizeDecryptor(address decryptor) external {
        if (!authorizedDecryptors[msg.sender]) revert NotAuthorized();
        authorizedDecryptors[decryptor] = true;
        emit DecryptorAuthorized(decryptor);
    }

    /// @notice Revoke decryption authorization
    function revokeDecryptor(address decryptor) external {
        if (!authorizedDecryptors[msg.sender]) revert NotAuthorized();
        authorizedDecryptors[decryptor] = false;
        emit DecryptorRevoked(decryptor);
    }

    /// @notice Create a new voting poll
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

        emit PollCreated(pollId, title, msg.sender, newPoll.startTime, newPoll.endTime);
        return pollId;
    }

    /// @notice Cast a vote
    function vote(uint256 pollId, uint256 optionIndex) external {
        Poll storage poll = polls[pollId];

        if (!poll.isActive || block.timestamp > poll.endTime) revert PollNotActive();
        if (poll.hasVoted[msg.sender]) revert AlreadyVoted();
        if (optionIndex >= poll.options.length) revert InvalidOption();

        // Increment vote count (in production this would be encrypted)
        poll.voteCount[optionIndex]++;
        poll.hasVoted[msg.sender] = true;
        poll.totalVoters++;

        emit VoteCasted(pollId, msg.sender);
    }

    /// @notice Close a poll
    function closePoll(uint256 pollId) external {
        Poll storage poll = polls[pollId];

        if (!poll.isActive) revert PollNotActive();
        if (block.timestamp < poll.endTime && msg.sender != poll.creator) revert NotAuthorized();

        poll.isActive = false;
        emit PollClosed(pollId);
    }

    /// @notice Request decryption for a poll (state-changing, requires gas)
    /// @dev In production FHE, this would trigger actual decryption process
    function requestDecryption(uint256 pollId) external returns (bool) {
        // In production, check authorization
        // if (!authorizedDecryptors[msg.sender]) revert NotAuthorized();
        
        // Mark as decrypted
        isDecrypted[pollId] = true;
        
        // Emit event to trigger decryption process
        emit DecryptionRequested(pollId, msg.sender);
        
        // In production FHE, this would:
        // 1. Request decryption from KMS
        // 2. Wait for decryption callback
        // 3. Store decrypted results
        
        return true;
    }

    /// @notice Get vote count for an option
    function getVoteCount(uint256 pollId, uint256 optionIndex) external view returns (uint256) {
        Poll storage poll = polls[pollId];
        if (optionIndex >= poll.options.length) revert InvalidOption();
        
        // In production, only authorized decryptors could call this
        return poll.voteCount[optionIndex];
    }

    /// @notice Get poll basic information
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
    function getPollOptions(uint256 pollId) external view returns (string[] memory) {
        return polls[pollId].options;
    }

    /// @notice Check if address has voted
    function hasVoted(uint256 pollId, address voter) external view returns (bool) {
        return polls[pollId].hasVoted[voter];
    }

    /// @notice Check if address is authorized decryptor
    function isAuthorizedDecryptor(address account) external view returns (bool) {
        return authorizedDecryptors[account];
    }
}

