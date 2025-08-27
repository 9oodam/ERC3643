import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, execute } = hre.deployments;

  // OnchainID 배포
  const identity = await deploy("Identity", {
    from: deployer,
    args: [
      deployer, // initialManagementKey
      false, // _isLibrary
    ],
    log: true,
    autoMine: true,
  });

  // 구현체 컨트랙트들 배포
  const factory = await deploy("TREXFactory", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const token = await deploy("Token", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const ctr = await deploy("ClaimTopicsRegistry", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const ir = await deploy("IdentityRegistry", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const irs = await deploy("IdentityRegistryStorage", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const mc = await deploy("ModularCompliance", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const tir = await deploy("TrustedIssuersRegistry", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const authority = await deploy("TREXImplementationAuthority", {
    from: deployer,
    args: [token.address, ctr.address, ir.address, irs.address, tir.address, mc.address],
    log: true,
    autoMine: true,
  });

  // TREXFactory에 ImplementationAuthority 설정
  await execute(
    "TREXFactory",
    {
      from: deployer,
      log: true,
      autoMine: true,
    },
    "setImplementationAuthority",
    authority.address,
  );
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
  "TREXImplementationAuthority",
];
