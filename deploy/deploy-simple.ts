import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedContract = await deploy("PrivateVotingSimple", {
    from: deployer,
    log: true,
  });

  console.log(`PrivateVotingSimple contract: `, deployedContract.address);
};
export default func;
func.id = "deploy_privateVotingSimple";
func.tags = ["PrivateVotingSimple"];

