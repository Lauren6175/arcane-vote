import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { PrivateVoting, PrivateVoting__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("PrivateVoting")) as PrivateVoting__factory;
  const privateVotingContract = (await factory.deploy()) as PrivateVoting;
  const privateVotingContractAddress = await privateVotingContract.getAddress();

  return { privateVotingContract, privateVotingContractAddress };
}

describe("PrivateVoting", function () {
  let signers: Signers;
  let privateVotingContract: PrivateVoting;
  let privateVotingContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2], charlie: ethSigners[3] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ privateVotingContract, privateVotingContractAddress } = await deployFixture());
  });

  describe("Deployment", function () {
    it("should set deployer as authorized decryptor", async function () {
      const isAuthorized = await privateVotingContract.isAuthorizedDecryptor(signers.deployer.address);
      expect(isAuthorized).to.be.true;
    });

    it("should initialize pollCount to 0", async function () {
      const pollCount = await privateVotingContract.pollCount();
      expect(pollCount).to.eq(0);
    });
  });

  describe("Authorization Management", function () {
    it("should allow authorized decryptor to authorize new decryptor", async function () {
      await privateVotingContract.connect(signers.deployer).authorizeDecryptor(signers.alice.address);

      const isAuthorized = await privateVotingContract.isAuthorizedDecryptor(signers.alice.address);
      expect(isAuthorized).to.be.true;
    });

    it("should allow authorized decryptor to revoke decryptor", async function () {
      await privateVotingContract.connect(signers.deployer).authorizeDecryptor(signers.alice.address);
      await privateVotingContract.connect(signers.deployer).revokeDecryptor(signers.alice.address);

      const isAuthorized = await privateVotingContract.isAuthorizedDecryptor(signers.alice.address);
      expect(isAuthorized).to.be.false;
    });

    it("should revert when unauthorized user tries to authorize", async function () {
      await expect(
        privateVotingContract.connect(signers.alice).authorizeDecryptor(signers.bob.address),
      ).to.be.revertedWithCustomError(privateVotingContract, "NotAuthorized");
    });
  });

  describe("Poll Creation", function () {
    it("should create a new poll with correct data", async function () {
      const title = "Board Member Election";
      const description = "Vote for the new board member";
      const options = ["Candidate A", "Candidate B", "Candidate C"];
      const duration = 7 * 24 * 60 * 60; // 7 days

      const tx = await privateVotingContract
        .connect(signers.alice)
        .createPoll(title, description, options, duration);
      await tx.wait();

      const pollCount = await privateVotingContract.pollCount();
      expect(pollCount).to.eq(1);

      const pollInfo = await privateVotingContract.getPollInfo(0);
      expect(pollInfo.title).to.eq(title);
      expect(pollInfo.description).to.eq(description);
      expect(pollInfo.isActive).to.be.true;
      expect(pollInfo.creator).to.eq(signers.alice.address);
      expect(pollInfo.totalVoters).to.eq(0);

      const pollOptions = await privateVotingContract.getPollOptions(0);
      expect(pollOptions).to.deep.eq(options);
    });

    it("should revert when duration is 0", async function () {
      await expect(
        privateVotingContract.connect(signers.alice).createPoll("Test", "Test", ["A", "B"], 0),
      ).to.be.revertedWithCustomError(privateVotingContract, "InvalidTimeRange");
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      // Create a poll
      const tx = await privateVotingContract
        .connect(signers.alice)
        .createPoll("Test Poll", "Test Description", ["Option 1", "Option 2"], 24 * 60 * 60);
      await tx.wait();
    });

    it("should allow voting with encrypted value", async function () {
      // Encrypt vote value (1 = one vote)
      const encryptedVote = await fhevm
        .createEncryptedInput(privateVotingContractAddress, signers.bob.address)
        .add32(1)
        .encrypt();

      const tx = await privateVotingContract
        .connect(signers.bob)
        .vote(0, 0, encryptedVote.handles[0], encryptedVote.inputProof);
      await tx.wait();

      const hasVoted = await privateVotingContract.hasVoted(0, signers.bob.address);
      expect(hasVoted).to.be.true;

      const pollInfo = await privateVotingContract.getPollInfo(0);
      expect(pollInfo.totalVoters).to.eq(1);
    });

    it("should aggregate multiple votes correctly", async function () {
      // Alice votes for option 0
      const encryptedVoteAlice = await fhevm
        .createEncryptedInput(privateVotingContractAddress, signers.alice.address)
        .add32(1)
        .encrypt();

      await privateVotingContract
        .connect(signers.alice)
        .vote(0, 0, encryptedVoteAlice.handles[0], encryptedVoteAlice.inputProof);

      // Bob votes for option 0
      const encryptedVoteBob = await fhevm
        .createEncryptedInput(privateVotingContractAddress, signers.bob.address)
        .add32(1)
        .encrypt();

      await privateVotingContract
        .connect(signers.bob)
        .vote(0, 0, encryptedVoteBob.handles[0], encryptedVoteBob.inputProof);

      // Charlie votes for option 1
      const encryptedVoteCharlie = await fhevm
        .createEncryptedInput(privateVotingContractAddress, signers.charlie.address)
        .add32(1)
        .encrypt();

      await privateVotingContract
        .connect(signers.charlie)
        .vote(0, 1, encryptedVoteCharlie.handles[0], encryptedVoteCharlie.inputProof);

      // Grant decryption access
      await privateVotingContract
        .connect(signers.deployer)
        .allowDecryptorAccess(0, 0, signers.deployer.address);
      await privateVotingContract
        .connect(signers.deployer)
        .allowDecryptorAccess(0, 1, signers.deployer.address);

      // Get encrypted vote counts
      const encryptedCountOption0 = await privateVotingContract
        .connect(signers.deployer)
        .getEncryptedVoteCount(0, 0);
      const encryptedCountOption1 = await privateVotingContract
        .connect(signers.deployer)
        .getEncryptedVoteCount(0, 1);

      // Decrypt and verify
      const clearCountOption0 = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedCountOption0,
        privateVotingContractAddress,
        signers.deployer,
      );
      const clearCountOption1 = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedCountOption1,
        privateVotingContractAddress,
        signers.deployer,
      );

      expect(clearCountOption0).to.eq(2); // Alice and Bob voted for option 0
      expect(clearCountOption1).to.eq(1); // Charlie voted for option 1
    });

    it("should revert when user tries to vote twice", async function () {
      const encryptedVote = await fhevm
        .createEncryptedInput(privateVotingContractAddress, signers.bob.address)
        .add32(1)
        .encrypt();

      await privateVotingContract
        .connect(signers.bob)
        .vote(0, 0, encryptedVote.handles[0], encryptedVote.inputProof);

      await expect(
        privateVotingContract.connect(signers.bob).vote(0, 0, encryptedVote.handles[0], encryptedVote.inputProof),
      ).to.be.revertedWithCustomError(privateVotingContract, "AlreadyVoted");
    });

    it("should revert when voting for invalid option", async function () {
      const encryptedVote = await fhevm
        .createEncryptedInput(privateVotingContractAddress, signers.bob.address)
        .add32(1)
        .encrypt();

      await expect(
        privateVotingContract.connect(signers.bob).vote(0, 99, encryptedVote.handles[0], encryptedVote.inputProof),
      ).to.be.revertedWithCustomError(privateVotingContract, "InvalidOption");
    });
  });

  describe("Poll Closing", function () {
    beforeEach(async function () {
      const tx = await privateVotingContract
        .connect(signers.alice)
        .createPoll("Test Poll", "Test Description", ["Option 1", "Option 2"], 24 * 60 * 60);
      await tx.wait();
    });

    it("should allow creator to close poll", async function () {
      await privateVotingContract.connect(signers.alice).closePoll(0);

      const pollInfo = await privateVotingContract.getPollInfo(0);
      expect(pollInfo.isActive).to.be.false;
    });

    it("should revert when non-creator tries to close active poll before end time", async function () {
      await expect(privateVotingContract.connect(signers.bob).closePoll(0)).to.be.revertedWithCustomError(
        privateVotingContract,
        "NotAuthorized",
      );
    });
  });

  describe("Decryption Access", function () {
    beforeEach(async function () {
      const tx = await privateVotingContract
        .connect(signers.alice)
        .createPoll("Test Poll", "Test Description", ["Option 1", "Option 2"], 24 * 60 * 60);
      await tx.wait();
    });

    it("should revert when unauthorized user tries to get encrypted vote count", async function () {
      await expect(
        privateVotingContract.connect(signers.alice).getEncryptedVoteCount(0, 0),
      ).to.be.revertedWithCustomError(privateVotingContract, "NotAuthorized");
    });

    it("should allow authorized decryptor to get encrypted vote count", async function () {
      const encryptedCount = await privateVotingContract.connect(signers.deployer).getEncryptedVoteCount(0, 0);
      expect(encryptedCount).to.not.eq(ethers.ZeroHash);
    });
  });
});

