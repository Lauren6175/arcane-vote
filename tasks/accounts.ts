import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("task:accounts", "Prints the list of accounts", async function (_taskArguments: TaskArguments, { ethers }) {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.getAddress());
  }
});

