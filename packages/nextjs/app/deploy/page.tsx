"use client";

import React, { ChangeEvent, useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface TokenDetails {
  owner: string;
  name: string;
  symbol: string;
  decimals: string;
  irs: string;
  ONCHAINID: string;
  irAgents: string;
  tokenAgents: string;
  complianceModules: string;
  complianceSettings: string;
}

interface ClaimDetails {
  claimTopics: string;
  issuers: string;
  issuerClaims: string;
}

interface Errors {
  [key: string]: string;
}

const Deploy: NextPage = () => {
  const { address } = useAccount();
  const [tokenDetails, setTokenDetails] = useState<TokenDetails>({
    owner: "",
    name: "",
    symbol: "",
    decimals: "",
    irs: "",
    ONCHAINID: "",
    irAgents: "",
    tokenAgents: "",
    complianceModules: "",
    complianceSettings: "",
  });
  const [claimDetails, setClaimDetails] = useState<ClaimDetails>({
    claimTopics: "",
    issuers: "",
    issuerClaims: "",
  });
  const [salt, setSalt] = useState<string>("salt1");
  const [errors, setErrors] = useState<Errors>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("claim_")) {
      const claimField = name.replace("claim_", "");
      setClaimDetails(prevDetails => ({
        ...prevDetails,
        [claimField]: value,
      }));
    } else {
      setTokenDetails(prevDetails => ({
        ...prevDetails,
        [name]: value,
      }));
    }
    validateField(name, value);
  };

  const validateField = (name: string, value: string) => {
    let error = "";
    if (name === "owner") {
      const isAddress = /^0x[a-fA-F0-9]{40}$/.test(value);
      if (!isAddress) {
        error = "Invalid Ethereum address format";
      } else if (value === "0x0000000000000000000000000000000000000000") {
        error = "Address cannot be the zero address";
      }
    }
    if (name === "name") {
      if (!value.trim()) {
        error = "Name is required.";
      } else if (value.length > 100) {
        error = "Name is too long.";
      } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(value)) {
        error =
          "Name contains invalid characters. Only alphanumeric characters, spaces, hyphens, and underscores are allowed.";
      }
    }

    if (name === "salt") {
      if (!value.trim()) {
        error = "Salt is required for CREATE2 deployment.";
      }
    }

    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: error,
    }));
  };

  const prepareTokenDetails = () => {
    const irAgentsArray = tokenDetails.irAgents
      .split(",")
      .filter(Boolean)
      .map(agent => agent.trim());

    const tokenAgentsArray = tokenDetails.tokenAgents
      .split(",")
      .filter(Boolean)
      .map(agent => agent.trim());

    const complianceModulesArray = tokenDetails.complianceModules
      .split(",")
      .filter(Boolean)
      .map(module => module.trim());

    const complianceSettingsArray = tokenDetails.complianceSettings
      .split(",")
      .filter(Boolean)
      .map(setting => setting.trim() as `0x${string}`);

    return {
      owner: tokenDetails.owner || address || "0x0000000000000000000000000000000000000000",
      name: tokenDetails.name,
      symbol: tokenDetails.symbol,
      decimals: parseInt(tokenDetails.decimals) || 18,
      irs: tokenDetails.irs || "0x0000000000000000000000000000000000000000",
      ONCHAINID: tokenDetails.ONCHAINID || "0x0000000000000000000000000000000000000000",
      irAgents: irAgentsArray,
      tokenAgents: tokenAgentsArray,
      complianceModules: complianceModulesArray,
      complianceSettings: complianceSettingsArray,
    };
  };

  const prepareClaimDetails = () => {
    const claimTopicsArray = claimDetails.claimTopics
      .split(",")
      .filter(Boolean)
      .map(topic => BigInt(topic.trim()));

    const issuersArray = claimDetails.issuers
      .split(",")
      .filter(Boolean)
      .map(issuer => issuer.trim());

    const issuerClaimsArray = claimDetails.issuerClaims
      .split(",")
      .filter(Boolean)
      .map(claims =>
        claims
          .trim()
          .split("|")
          .map(claim => BigInt(claim.trim())),
      );

    // 배열 길이 검증
    if (issuersArray.length !== issuerClaimsArray.length) {
      throw new Error("Number of issuers must match number of issuer claims arrays");
    }

    if (claimTopicsArray.length > 5) {
      throw new Error("Maximum 5 claim topics allowed");
    }

    if (issuersArray.length > 5) {
      throw new Error("Maximum 5 trusted issuers allowed");
    }

    return {
      claimTopics: claimTopicsArray,
      issuers: issuersArray,
      issuerClaims: issuerClaimsArray,
    };
  };

  // Contract write hook
  const { writeContractAsync: deployTREXSuite, isMining } = useScaffoldWriteContract({
    contractName: "TREXFactory",
  });

  // Contract read hook for owner
  const { data: contractOwner } = useScaffoldReadContract({
    contractName: "TREXFactory",
    functionName: "owner",
  });

  const handleDeploy = async () => {
    if (Object.values(errors).some(error => error)) {
      alert("Please fix the errors before deploying.");
      return;
    }

    if (!salt.trim()) {
      alert("Please enter a salt for the deployment.");
      return;
    }

    if (!tokenDetails.name.trim() || !tokenDetails.symbol.trim()) {
      alert("Token name and symbol are required.");
      return;
    }

    try {
      const tokenDetailsPrepared = prepareTokenDetails();
      const claimDetailsPrepared = prepareClaimDetails();
      console.log("Token Details:", tokenDetailsPrepared);
      console.log("Claim Details:", claimDetailsPrepared);

      await deployTREXSuite({
        functionName: "deployTREXSuite",
        args: [salt, tokenDetailsPrepared, claimDetailsPrepared],
      });
    } catch (error) {
      console.error("Deployment failed:", error);
      alert("Deployment failed. Check console for details.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl mb-4">Deploy New ERC-3643 Token (owner: {contractOwner})</h2>
      <form className="space-y-4">
        {/* Salt Input */}
        <div title="Salt for CREATE2 deployment">
          <label className="block text-sm font-medium">
            Salt (String) <span className="text-red-500">*</span>:
          </label>
          <input
            type="text"
            name="salt"
            value={salt}
            onChange={e => {
              setSalt(e.target.value);
              validateField("salt", e.target.value);
            }}
            className="mt-1 p-2 w-full border rounded-md"
            placeholder="my-token-salt"
            required
          />
          {errors.salt && <p className="text-red-500 text-xs">{errors.salt}</p>}
        </div>

        {/* Token Details Section */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4">Token Details</h3>

          <div title="Address of the owner of all contracts">
            <label className="block text-sm font-medium">
              Owner (Address) <span className="text-red-500">*</span>:
            </label>
            <input
              type="text"
              name="owner"
              value={tokenDetails.owner}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded-md"
              placeholder="0x1234...5678"
              required
            />
            <p className="text-xs text-gray-600 mt-1">
              모든 컨트랙트(Token, IdentityRegistry, Compliance 등)의 소유자 주소. 이 주소는 컨트랙트 설정을 변경하고
              관리할 수 있는 권한을 가짐.
            </p>
            {errors.owner && <p className="text-red-500 text-xs">{errors.owner}</p>}
          </div>
          <div title="Name of the token">
            <label className="block text-sm font-medium">
              Name (String) <span className="text-red-500">*</span>:
            </label>
            <input
              type="text"
              name="name"
              value={tokenDetails.name}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded-md"
              placeholder="TokenName"
              maxLength={100} // Assuming a max length of 100 for token name
              required
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
          </div>
          <div title="Symbol / ticker of the token">
            <label className="block text-sm font-medium">
              Symbol (String) <span className="text-red-500">*</span>:
            </label>
            <input
              type="text"
              name="symbol"
              value={tokenDetails.symbol}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded-md"
              placeholder="TKN"
              required
            />
            {errors.symbol && <p className="text-red-500 text-xs">{errors.symbol}</p>}
          </div>
          <div title="Decimals of the token (can be between 0 and 18)">
            <label className="block text-sm font-medium">
              Decimals (Uint8) <span className="text-red-500">*</span>:
            </label>
            <input
              type="number"
              name="decimals"
              value={tokenDetails.decimals}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded-md"
              placeholder="18"
              required
            />
            {errors.decimals && <p className="text-red-500 text-xs">{errors.decimals}</p>}
          </div>
          <div title="Identity registry storage address. Set it to ZERO address if you want to deploy a new storage. If an address is provided, please ensure that the factory is set as owner of the contract">
            <label className="block text-sm font-medium">IRS (Address):</label>
            <input
              type="text"
              name="irs"
              value={tokenDetails.irs}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded-md"
              placeholder="0x1234...5678"
            />
            <p className="text-xs text-gray-600 mt-1">Identity Registry Storage 컨트랙트의 주소.</p>
            {errors.irs && <p className="text-red-500 text-xs">{errors.irs}</p>}
          </div>
          <div title="ONCHAINID of the token">
            <label className="block text-sm font-medium">ONCHAINID (Address):</label>
            <input
              type="text"
              name="ONCHAINID"
              value={tokenDetails.ONCHAINID}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded-md"
              placeholder="0x1234...5678"
            />
            <p className="text-xs text-gray-600 mt-1">
              토큰 발행자의 OnchainID 컨트랙트 주소. 발행자의 신원 데이터를 저장.
            </p>
            {errors.ONCHAINID && <p className="text-red-500 text-xs">{errors.ONCHAINID}</p>}
          </div>
          <div title="List of agents of the identity registry (can be set to an AgentManager contract)">
            <label className="block text-sm font-medium">IR Agents (Address[] - comma separated):</label>
            <textarea
              name="irAgents"
              value={tokenDetails.irAgents}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded-md"
              placeholder="0x1234...5678,0x1234...5678"
            ></textarea>
            <p className="text-xs text-gray-600 mt-1">
              Identity Registry의 에이전트 주소들 (최대 5개). 이 주소들은 사용자 신원을 등록하고 관리할 수 있음. (ex.
              KYC 검증 회사, 규제 기관, 토큰 발행자의 주소들)
            </p>
          </div>
          <div title="List of agents of the token">
            <label className="block text-sm font-medium">Token Agents (Address[] - comma separated):</label>
            <textarea
              name="tokenAgents"
              value={tokenDetails.tokenAgents}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded-md"
              placeholder="0x1234...5678,0x1234...5678"
            ></textarea>
            <p className="text-xs text-gray-600 mt-1">
              토큰의 에이전트 주소들 (최대 5개). 이 주소들은 토큰 발행, 소각, 동결 등의 관리 기능을 수행할 수 있음. (ex.
              토큰 발행자, 관리자, 규제 기관의 주소들)
            </p>
          </div>
          <div title="Modules to bind to the compliance">
            <label className="block text-sm font-medium">Compliance Modules (Address[] - comma separated):</label>
            <textarea
              name="complianceModules"
              value={tokenDetails.complianceModules}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded-md"
              placeholder="0x1234...5678,0x1234...5678"
            ></textarea>
            <p className="text-xs text-gray-600 mt-1">
              토큰에 바인딩할 Compliance 모듈들의 주소 (최대 25개). 각 모듈은 특정 규제 요구사항을 처리. (ex. KYC 모듈,
              AML 모듈, 지리적 제한 모듈, 보유량 제한 모듈 등)
            </p>
          </div>
          <div title="Settings calls for compliance modules">
            <label className="block text-sm font-medium">Compliance Settings (Bytes[] - comma separated):</label>
            <textarea
              name="complianceSettings"
              value={tokenDetails.complianceSettings}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded-md"
              placeholder="0x1234...5678,0x1234...5678"
            ></textarea>
            <p className="text-xs text-gray-600 mt-1">
              Compliance 모듈들의 설정을 위한 함수 호출 데이터.
              <br />• <strong>형식:</strong> 각 모듈의 설정 함수 호출을 0x로 시작하는 hex 문자열로 입력
              <br />• <strong>예시:</strong> "0x12345678,0xabcdef12" (각각 다른 모듈의 설정 함수)
              <br />• <strong>주의:</strong> Compliance Modules 배열의 순서와 일치해야 함.
            </p>
          </div>
        </div>

        {/* Claim Details Section */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4">Claim Details</h3>

          <div title="Claim topics required (comma separated numbers)">
            <label className="block text-sm font-medium">Claim Topics (Uint256[] - comma separated):</label>
            <textarea
              name="claim_claimTopics"
              value={claimDetails.claimTopics}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded-md"
              placeholder="1,2,3"
            ></textarea>
            <p className="text-xs text-gray-600 mt-1">
              토큰이 요구하는 claim topic들의 목록 (최대 5개). (ex. 1=KYC, 2=AML, 3=국적 등)
            </p>
            {errors.claim_claimTopics && <p className="text-red-500 text-xs">{errors.claim_claimTopics}</p>}
          </div>

          <div title="Trusted issuers addresses (comma separated)">
            <label className="block text-sm font-medium">Issuers (Address[] - comma separated):</label>
            <textarea
              name="claim_issuers"
              value={claimDetails.issuers}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded-md"
              placeholder="0x1234...5678,0x1234...5678"
            ></textarea>
            <p className="text-xs text-gray-600 mt-1">
              신뢰할 수 있는 claim 발급자들의 주소 목록 (최대 5개). 이 주소들은 특정 claim topic에 대한 claim을 발급할
              권한을 가짐. (ex. KYC 검증 회사, 규제 기관의 주소 등)
            </p>
            {errors.claim_issuers && <p className="text-red-500 text-xs">{errors.claim_issuers}</p>}
          </div>

          <div title="Claims that issuers are allowed to emit (format: topic1|topic2,topic3|topic4)">
            <label className="block text-sm font-medium">
              Issuer Claims (Uint256[][] - format: topic1|topic2,topic3|topic4):
            </label>
            <textarea
              name="claim_issuerClaims"
              value={claimDetails.issuerClaims}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded-md"
              placeholder="1|2,3|4"
            ></textarea>
            <p className="text-xs text-gray-600 mt-1">
              각 issuer가 발급할 수 있는 claim topic들의 목록.
              <br />• <strong>형식:</strong> 각 issuer의 claim topic들을 |로 구분하고, issuer들 사이는 쉼표로
              구분합니다.
              <br />• <strong>예시:</strong> "1|2,3|4"는 첫 번째 issuer는 topic 1과 2를, 두 번째 issuer는 topic 3과 4를
              발급할 수 있음을 의미.
            </p>
            {errors.claim_issuerClaims && <p className="text-red-500 text-xs">{errors.claim_issuerClaims}</p>}
          </div>
        </div>

        {/* Deploy Button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleDeploy}
            disabled={
              isMining ||
              Object.values(errors).some(error => error) ||
              !salt.trim() ||
              !tokenDetails.name.trim() ||
              !tokenDetails.symbol.trim()
            }
            className={`w-full p-3 rounded-md font-medium ${
              isMining ||
              Object.values(errors).some(error => error) ||
              !salt.trim() ||
              !tokenDetails.name.trim() ||
              !tokenDetails.symbol.trim()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white`}
          >
            {isMining ? "Deploying..." : "Deploy ERC-3643 Token"}
          </button>
        </div>

        {/* Status Messages */}
        {isMining && (
          <div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
            <p>Deploying your ERC-3643 token... Please wait and do not close this page.</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default Deploy;
