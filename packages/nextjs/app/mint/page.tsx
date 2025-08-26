"use client";

import React, { ChangeEvent, useEffect, useState } from "react";
import { ethers } from "ethers";
import type { NextPage } from "next";
import { useAccount, useReadContract } from "wagmi";
import { useScaffoldContract, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  isVerified: boolean;
  isAgent: boolean;
  isOwner: boolean;
}

const Mint: NextPage = () => {
  const { address } = useAccount();
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [salt, setSalt] = useState<string>("");
  const [mintAmount, setMintAmount] = useState<string>("1000");
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Contract write hook
  const { data: trexFactoryData } = useScaffoldReadContract({
    contractName: "TREXFactory",
    functionName: "getToken",
    args: [salt],
  });

  const { data: tokenContract } = useScaffoldContract({
    contractName: "Token",
  });
  const { data: tokenName } = useReadContract({
    address: tokenAddress,
    abi: tokenContract?.abi,
    functionName: "name",
  });
  const { data: tokenSymbol } = useReadContract({
    address: tokenAddress,
    abi: tokenContract?.abi,
    functionName: "symbol",
  });
  const { data: tokenDecimals } = useReadContract({
    address: tokenAddress,
    abi: tokenContract?.abi,
    functionName: "decimals",
  });
  const { data: tokenBalance } = useReadContract({
    address: tokenAddress,
    abi: tokenContract?.abi,
    functionName: "balanceOf",
    args: [address],
  });
  const { data: isAgent } = useReadContract({
    address: tokenAddress,
    abi: tokenContract?.abi,
    functionName: "isAgent",
    args: [address],
  });
  const { data: tokenOwner } = useReadContract({
    address: tokenAddress,
    abi: tokenContract?.abi,
    functionName: "owner",
  });

  // Get Identity Registry address from token
  const { data: identityRegistryAddress } = useReadContract({
    functionName: "identityRegistry",
    abi: tokenContract?.abi,
    address: tokenAddress,
  });

  const { data: irContract } = useScaffoldContract({
    contractName: "IdentityRegistry",
  });

  const { data: isVerified } = useReadContract({
    functionName: "isVerified",
    abi: irContract?.abi,
    address: tokenAddress,
    args: [address],
  });

  // Contract write hooks
  const { writeContractAsync: registerIdentity, isMining: isRegistering } = useScaffoldWriteContract({
    contractName: "IdentityRegistry",
  });
  const { writeContractAsync: mint, isMining: isMinting } = useScaffoldWriteContract({
    contractName: "Token",
  });

  useEffect(() => {
    console.log({
      tokenAddress: tokenAddress,
      tokenName: tokenName,
      tokenSymbol: tokenSymbol,
      tokenDecimals: tokenDecimals,
    });
    // if (tokenAddress && tokenName && tokenSymbol && tokenDecimals !== undefined) {
    //   setTokenInfo({
    //     address: tokenAddress,
    //     name: tokenName || "",
    //     symbol: tokenSymbol || "",
    //     decimals: tokenDecimals || 0,
    //     balance: tokenBalance ? ethers.formatUnits(tokenBalance, tokenDecimals) : "0",
    //     isVerified: isVerified || false,
    //     isAgent: isAgent || false,
    //     isOwner: tokenOwner ? tokenOwner.toLowerCase() === address?.toLowerCase() : false,
    //   });
    // }
  }, [tokenAddress, tokenName, tokenSymbol, tokenDecimals, tokenBalance, isVerified, isAgent, tokenOwner, address]);

  // Salt 로 token address 찾기
  const handleGetToken = async () => {
    if (!salt.trim()) {
      alert("Please enter a salt");
      return;
    }

    try {
      setLoading(true);
      // This will trigger the TREXFactory.getToken read
      // The result will be in trexFactoryData
    } catch (error) {
      console.error("Error getting token:", error);
      alert("Error getting token address");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterIdentity = async () => {
    if (!address || !identityRegistryAddress) {
      alert("Please connect wallet and ensure token is loaded");
      return;
    }

    try {
      await registerIdentity({
        functionName: "registerIdentity",
        args: [
          address, // investor address
          "0x0000000000000000000000000000000000000000", // onchainID (zero address for now)
          0, // country code
        ],
      });
      alert("Identity registered successfully!");
    } catch (error) {
      console.error("Error registering identity:", error);
      alert("Error registering identity");
    }
  };

  const handleMint = async () => {
    if (!address || !mintAmount || !tokenInfo) {
      alert("Please connect wallet and enter mint amount");
      return;
    }

    try {
      const amount = ethers.parseUnits(mintAmount, tokenInfo.decimals);
      await mint({
        functionName: "mint",
        args: [address, amount],
      });
      alert("Tokens minted successfully!");
    } catch (error) {
      console.error("Error minting tokens:", error);
      alert("Error minting tokens");
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl mb-6">ERC-3643 Token Minting</h1>

      {/* Token Address Input */}
      <div className="bg-base-100 p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Load Token</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Token Address (Direct)</label>
            <input
              type="text"
              value={tokenAddress}
              onChange={e => setTokenAddress(e.target.value)}
              placeholder="0x..."
              className="w-full p-3 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Or Get from Salt</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={salt}
                onChange={e => setSalt(e.target.value)}
                placeholder="my-token-salt"
                className="flex-1 p-3 border rounded-lg"
              />
              <button
                onClick={handleGetToken}
                disabled={loading}
                className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Get Token"}
              </button>
            </div>
          </div>
        </div>

        {trexFactoryData && trexFactoryData !== "0x0000000000000000000000000000000000000000" && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            <p>Token found at: {trexFactoryData}</p>
            <button
              onClick={() => setTokenAddress(trexFactoryData)}
              className="mt-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Load This Token
            </button>
          </div>
        )}
      </div>

      {/* Token Information */}
      {tokenInfo && (
        <div className="bg-base-100 p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Token Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Name</label>
              <p className="text-lg font-semibold">{tokenInfo.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Symbol</label>
              <p className="text-lg font-semibold">{tokenInfo.symbol}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Decimals</label>
              <p className="text-lg font-semibold">{tokenInfo.decimals}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Your Balance</label>
              <p className="text-lg font-semibold">
                {tokenInfo.balance} {tokenInfo.symbol}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Address</label>
              <p className="text-sm font-mono break-all">{tokenInfo.address}</p>
            </div>
          </div>
        </div>
      )}

      {/* Status Information */}
      {tokenInfo && (
        <div className="bg-base-100 p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Status</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`p-4 rounded-lg ${
                tokenInfo.isOwner ? "bg-green-100 border border-green-400" : "bg-red-100 border border-red-400"
              }`}
            >
              <h3 className="font-semibold mb-2">Owner</h3>
              <p className={tokenInfo.isOwner ? "text-green-700" : "text-red-700"}>
                {tokenInfo.isOwner ? "✅ You are the owner" : "❌ You are not the owner"}
              </p>
            </div>

            <div
              className={`p-4 rounded-lg ${
                tokenInfo.isAgent ? "bg-green-100 border border-green-400" : "bg-red-100 border border-red-400"
              }`}
            >
              <h3 className="font-semibold mb-2">Token Agent</h3>
              <p className={tokenInfo.isAgent ? "text-green-700" : "text-red-700"}>
                {tokenInfo.isAgent ? "✅ You are a token agent" : "❌ You are not a token agent"}
              </p>
            </div>

            <div
              className={`p-4 rounded-lg ${
                tokenInfo.isVerified ? "bg-green-100 border border-green-400" : "bg-red-100 border border-red-400"
              }`}
            >
              <h3 className="font-semibold mb-2">Identity Verified</h3>
              <p className={tokenInfo.isVerified ? "text-green-700" : "text-red-700"}>
                {tokenInfo.isVerified ? "✅ Your identity is verified" : "❌ Your identity is not verified"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {tokenInfo && (
        <div className="bg-base-100 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>

          <div className="space-y-4">
            {/* Register Identity */}
            {!tokenInfo.isVerified && tokenInfo.isAgent && (
              <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
                <h3 className="font-semibold mb-2">Step 1: Register Identity</h3>
                <p className="text-sm text-gray-600 mb-3">
                  You need to register your identity before you can mint tokens.
                </p>
                <button
                  onClick={handleRegisterIdentity}
                  disabled={isRegistering}
                  className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
                >
                  {isRegistering ? "Registering..." : "Register Identity"}
                </button>
              </div>
            )}

            {/* Mint Tokens */}
            {tokenInfo.isVerified && tokenInfo.isAgent && (
              <div className="p-4 bg-blue-100 border border-blue-400 rounded-lg">
                <h3 className="font-semibold mb-2">Step 2: Mint Tokens</h3>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Amount to Mint</label>
                    <input
                      type="number"
                      value={mintAmount}
                      onChange={e => setMintAmount(e.target.value)}
                      placeholder="1000"
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <button
                    onClick={handleMint}
                    disabled={isMinting}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isMinting ? "Minting..." : `Mint ${tokenInfo.symbol}`}
                  </button>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {!tokenInfo.isAgent && (
              <div className="p-4 bg-red-100 border border-red-400 rounded-lg">
                <h3 className="font-semibold mb-2">⚠️ Action Required</h3>
                <p className="text-sm text-red-700">
                  You are not a token agent. You need to be added as a token agent to mint tokens. This should be done
                  during token deployment or by the token owner.
                </p>
              </div>
            )}

            {tokenInfo.isAgent && !tokenInfo.isVerified && (
              <div className="p-4 bg-orange-100 border border-orange-400 rounded-lg">
                <h3 className="font-semibold mb-2">⚠️ Identity Verification Required</h3>
                <p className="text-sm text-orange-700">
                  You are a token agent but your identity is not verified. Please register your identity first.
                </p>
              </div>
            )}

            {tokenInfo.isVerified && tokenInfo.isAgent && (
              <div className="p-4 bg-green-100 border border-green-400 rounded-lg">
                <h3 className="font-semibold mb-2">✅ Ready to Mint</h3>
                <p className="text-sm text-green-700">All requirements are met! You can now mint tokens.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Enter the token address or salt to load your deployed token</li>
          <li>Check your status (Owner, Agent, Identity Verification)</li>
          <li>If you're an agent but not verified, register your identity first</li>
          <li>Once verified and an agent, you can mint tokens</li>
          <li>Enter the amount and click "Mint" to create new tokens</li>
        </ol>
      </div>
    </div>
  );
};

export default Mint;
