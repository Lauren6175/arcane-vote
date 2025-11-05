import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("task:deployPrivateVoting", "Deploy PrivateVoting contract").setAction(async function (
  _taskArguments: TaskArguments,
  { ethers },
) {
  const signers = await ethers.getSigners();
  const privateVotingFactory = await ethers.getContractFactory("PrivateVoting");
  const privateVoting = await privateVotingFactory.connect(signers[0]).deploy();
  await privateVoting.waitForDeployment();
  console.log("PrivateVoting deployed to: ", await privateVoting.getAddress());
});

