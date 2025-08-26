import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, execute, get } = hre.deployments;

  await deploy("Identity", {
    from: deployer,
    args: [
      deployer, // initialManagementKey
      false, // _isLibrary
    ],
    log: true,
    autoMine: true,
  });

  const trexFactory = await deploy("TREXFactory", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  await deploy("Token", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  await deploy("ClaimTopicsRegistry", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const identityRegistry = await deploy("IdentityRegistry", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  await deploy("IdentityRegistryStorage", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  await deploy("ModularCompliance", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  await deploy("TrustedIssuersRegistry", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  await execute("IdentityRegistryStorage", { from: deployer, log: true }, "transferOwnership", trexFactory.address);
  await execute("ClaimTopicsRegistry", { from: deployer, log: true }, "transferOwnership", trexFactory.address);
  await execute("TrustedIssuersRegistry", { from: deployer, log: true }, "transferOwnership", trexFactory.address);
  await execute("ModularCompliance", { from: deployer, log: true }, "transferOwnership", trexFactory.address);
  await execute("IdentityRegistry", { from: deployer, log: true }, "transferOwnership", trexFactory.address);
  await execute("Token", { from: deployer, log: true }, "transferOwnership", trexFactory.address);
};

export default deployYourContract;

deployYourContract.tags = [
  "Identity",
  "TREXFactory",
  "Token",
  "ClaimTopicsRegistry",
  "IdentityRegistry",
  "IdentityRegistryStorage",
  "ModularCompliance",
  "TrustedIssuersRegistry",
];
