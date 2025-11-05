import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { PrivateVoting } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

describe("PrivateVotingSepolia", function () {
  let signers: Signers;
  let privateVotingContract: PrivateVoting;
  let privateVotingContractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const PrivateVotingDeployment = await deployments.get("PrivateVoting");
      privateVotingContractAddress = PrivateVotingDeployment.address;
      privateVotingContract = await ethers.getContractAt("PrivateVoting", PrivateVotingDeployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0], bob: ethSigners[1] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("should create poll and cast encrypted votes on Sepolia", async function () {
    steps = 12;

    this.timeout(5 * 60000); // 5 minutes

    progress("Creating a new poll...");
    const createTx = await privateVotingContract
      .connect(signers.alice)
      .createPoll("Sepolia Test Poll", "Testing on Sepolia", ["Option A", "Option B"], 7 * 24 * 60 * 60);
    await createTx.wait();

    progress("Getting poll count...");
    const pollCount = await privateVotingContract.pollCount();
    const pollId = Number(pollCount) - 1;
    progress(`Poll created with ID: ${pollId}`);

    progress("Getting poll info...");
    const pollInfo = await privateVotingContract.getPollInfo(pollId);
    expect(pollInfo.title).to.eq("Sepolia Test Poll");
    progress(`Poll title: ${pollInfo.title}`);

    progress("Encrypting vote from Alice (Option 0)...");
    const encryptedVoteAlice = await fhevm
      .createEncryptedInput(privateVotingContractAddress, signers.alice.address)
      .add32(1)
      .encrypt();

    progress(
      `Casting vote from Alice - Poll=${pollId}, Handle=${ethers.hexlify(encryptedVoteAlice.handles[0])}...`,
    );
    const voteTxAlice = await privateVotingContract
      .connect(signers.alice)
      .vote(pollId, 0, encryptedVoteAlice.handles[0], encryptedVoteAlice.inputProof);
    await voteTxAlice.wait();
    progress("Alice voted successfully");

    progress("Encrypting vote from Bob (Option 1)...");
    const encryptedVoteBob = await fhevm
      .createEncryptedInput(privateVotingContractAddress, signers.bob.address)
      .add32(1)
      .encrypt();

    progress(`Casting vote from Bob - Poll=${pollId}, Handle=${ethers.hexlify(encryptedVoteBob.handles[0])}...`);
    const voteTxBob = await privateVotingContract
      .connect(signers.bob)
      .vote(pollId, 1, encryptedVoteBob.handles[0], encryptedVoteBob.inputProof);
    await voteTxBob.wait();
    progress("Bob voted successfully");

    progress("Granting decryption access...");
    await privateVotingContract.connect(signers.alice).allowDecryptorAccess(pollId, 0, signers.alice.address);
    await privateVotingContract.connect(signers.alice).allowDecryptorAccess(pollId, 1, signers.alice.address);

    progress("Getting encrypted vote counts...");
    const encryptedCount0 = await privateVotingContract.connect(signers.alice).getEncryptedVoteCount(pollId, 0);
    const encryptedCount1 = await privateVotingContract.connect(signers.alice).getEncryptedVoteCount(pollId, 1);

    progress(`Decrypting vote count for Option 0...`);
    const clearCount0 = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCount0,
      privateVotingContractAddress,
      signers.alice,
    );
    progress(`Option 0 votes: ${clearCount0}`);

    progress(`Decrypting vote count for Option 1...`);
    const clearCount1 = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCount1,
      privateVotingContractAddress,
      signers.alice,
    );
    progress(`Option 1 votes: ${clearCount1}`);

    expect(clearCount0).to.eq(1);
    expect(clearCount1).to.eq(1);
  });
});

