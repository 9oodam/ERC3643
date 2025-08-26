"use client";

import React, { ChangeEvent, useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

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
    owner: "0x3710a38d7310F0036a6094cC8b9aBae95Fcf2B20",
    name: "TestToken",
    symbol: "TTK",
    decimals: "18",
    irs: "0xaC279D30f6a2468C0b2C34d7f517b6142684d561",
    ONCHAINID: "0xff3aD7ef7933d782F09dB4365E3644925B6dfc27",
    irAgents: "0x3710a38d7310F0036a6094cC8b9aBae95Fcf2B20",
    tokenAgents: "0x3710a38d7310F0036a6094cC8b9aBae95Fcf2B20",
    complianceModules: "",
    complianceSettings: "",
  });
  const [claimDetails, setClaimDetails] = useState<ClaimDetails>({
    claimTopics: "",
    issuers: "",
    issuerClaims: "",
  });
  const [salt, setSalt] = useState<string>("my-first-token");
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
      await deployTREXSuite({
        functionName: "deployTREXSuite",
        args: [salt, prepareTokenDetails(), prepareClaimDetails()],
      });
    } catch (error) {
      console.error("Deployment failed:", error);
      alert("Deployment failed. Check console for details.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl mb-4">Deploy New ERC-3643 Token</h2>
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
            {errors.owner && <p className="text-red-500 text-xs">{errors.owner}</p>}
          </div>
          <div title="Name of the token">
            <label className="block text-sm font-medium">Name (String):</label>
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
            <label className="block text-sm font-medium">Symbol (String):</label>
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
            <label className="block text-sm font-medium">Decimals (Uint8):</label>
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
