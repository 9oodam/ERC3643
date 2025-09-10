"use client";

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import type { NextPage } from "next";
import { useAccount, useReadContract, useWalletClient } from "wagmi";
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

const Load: NextPage = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  // token 정보
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [salt, setSalt] = useState<string>("");
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Identity 등록 관련
  const [registerAddress, setRegisterAddress] = useState<string>("");
  const [registerCountry, setRegisterCountry] = useState<string>("840"); // US 코드 예시
  const [identityAddress, setIdentityAddress] = useState<string>("");

  // mint 관련
  const [mintAmount, setMintAmount] = useState<string>("");
  const [mintTo, setMintTo] = useState<string>("");

  // Transfer 관련
  const [transferTo, setTransferTo] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("");

  // --------------------------------------------------------

  // Contract read hook
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
    address: identityRegistryAddress as `0x${string}`,
    args: [address],
  });

  useEffect(() => {
    console.log({
      tokenAddress: tokenAddress,
      tokenName: tokenName,
      tokenSymbol: tokenSymbol,
      tokenDecimals: tokenDecimals,
    });
    setTokenInfo({
      address: tokenAddress,
      name: tokenName || "",
      symbol: tokenSymbol || "",
      decimals: tokenDecimals || 0,
      balance: tokenBalance ? ethers.formatUnits(tokenBalance, tokenDecimals) : "0",
      isVerified: isVerified || false,
      isAgent: isAgent || false,
      isOwner: tokenOwner ? tokenOwner.toLowerCase() === address?.toLowerCase() : false,
    });
  }, [tokenAddress, tokenName, tokenSymbol, tokenDecimals, tokenBalance, isVerified, isAgent, tokenOwner, address]);

  const { data: tokenAddressBySalt } = useScaffoldReadContract({
    contractName: "TREXFactory",
    functionName: "getToken",
    args: [salt],
  });

  // --------------------------------------------------------

  // Salt 로 token address 찾기
  const handleGetToken = async () => {
    if (!salt.trim()) {
      alert("Please enter a salt");
      return;
    }

    try {
      setLoading(true);
      if (tokenAddressBySalt && tokenAddressBySalt !== "0x0000000000000000000000000000000000000000") {
        console.log("Token Address:", tokenAddressBySalt);
        alert(`Token found at: ${tokenAddressBySalt}`);
      } else {
        alert("No token found for this salt");
      }
    } catch (error) {
      console.error("Error getting token:", error);
      alert("Error getting token address");
    } finally {
      setLoading(false);
    }
  };

  // Identity 등록 함수
  const handleRegisterIdentity = async () => {
    if (!identityRegistryAddress || !registerAddress || !identityAddress || !walletClient) {
      alert("Please enter user address and identity address");
      return;
    }

    if (!tokenInfo?.isAgent) {
      alert("Only agents can register identities");
      return;
    }

    console.log(identityRegistryAddress);

    try {
      await walletClient.writeContract({
        address: identityRegistryAddress as `0x${string}`,
        abi: [
          {
            inputs: [
              { internalType: "address", name: "_userAddress", type: "address" },
              { internalType: "contract IIdentity", name: "_identity", type: "address" },
              { internalType: "uint16", name: "_country", type: "uint16" },
            ],
            name: "registerIdentity",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "registerIdentity",
        args: [registerAddress, identityAddress, parseInt(registerCountry)],
      });
      alert("Identity registered successfully!");
      setRegisterAddress("");
      setIdentityAddress("");
    } catch (error) {
      console.error("Error registering identity:", error);
      alert("Error registering identity. Make sure the identity contract exists.");
    }
  };

  // 토큰 발행
  const handleMint = async () => {
    if (!mintTo || !mintAmount || !walletClient || !tokenAddress) {
      alert("Please enter recipient address and amount");
      return;
    }

    if (!tokenInfo?.isAgent) {
      alert("Only agents can mint tokens");
      return;
    }

    try {
      const amount = ethers.parseUnits(mintAmount, tokenInfo.decimals);
      await walletClient?.writeContract({
        address: tokenAddress as `0x${string}`,
        functionName: "mint",
        abi: [
          {
            inputs: [
              {
                internalType: "address",
                name: "_to",
                type: "address",
              },
              {
                internalType: "uint256",
                name: "_amount",
                type: "uint256",
              },
            ],
            name: "mint",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        args: [mintTo, amount],
      });
      alert("Tokens minted successfully!");
      setMintAmount("");
      setMintTo("");
    } catch (error) {
      console.error("Error minting tokens:", error);
      alert("Error minting tokens. Make sure the recipient is verified.");
    }
  };

  // 토큰 전송 함수
  const handleTransfer = async () => {
    if (!transferTo || !transferAmount || !walletClient || !tokenAddress) {
      alert("Please enter recipient address and amount");
      return;
    }

    if (!tokenInfo?.isVerified) {
      alert("You must be verified to transfer tokens");
      return;
    }

    try {
      const amount = ethers.parseUnits(transferAmount, tokenInfo.decimals);
      await walletClient?.writeContract({
        address: tokenAddress as `0x${string}`,
        functionName: "transfer",
        abi: [
          {
            inputs: [
              {
                internalType: "address",
                name: "_to",
                type: "address",
              },
              {
                internalType: "uint256",
                name: "_amount",
                type: "uint256",
              },
            ],
            name: "transfer",
            outputs: [
              {
                internalType: "bool",
                name: "",
                type: "bool",
              },
            ],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        args: [transferTo, amount],
      });
      alert("Tokens transferred successfully!");
      setTransferAmount("");
      setTransferTo("");
    } catch (error) {
      console.error("Error transferring tokens:", error);
      alert("Error transferring tokens. Make sure the recipient is verified and you have sufficient balance.");
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
              onClick={() => {
                setTokenAddress(trexFactoryData);
              }}
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

      {/* Identity Registration */}
      {tokenInfo && tokenInfo.isAgent && (
        <div className="bg-base-100 p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Register Identity</h2>
          <p className="text-sm text-gray-600 mb-4">
            Register a new identity in the Identity Registry before minting tokens.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">User Address</label>
              <input
                type="text"
                value={registerAddress}
                onChange={e => setRegisterAddress(e.target.value)}
                placeholder="0x..."
                className="w-full p-3 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Identity Contract Address</label>
              <input
                type="text"
                value={identityAddress}
                onChange={e => setIdentityAddress(e.target.value)}
                placeholder="0x..."
                className="w-full p-3 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Country Code</label>
              <select
                value={registerCountry}
                onChange={e => setRegisterCountry(e.target.value)}
                className="w-full p-3 border rounded-lg"
              >
                <option value="840">US (840)</option>
                <option value="410">KR (410)</option>
                <option value="392">JP (392)</option>
                <option value="156">CN (156)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleRegisterIdentity}
            disabled={!registerAddress || !identityAddress}
            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
          >
            Register Identity"
          </button>
        </div>
      )}

      {/* Mint Tokens */}
      {tokenInfo && tokenInfo.isAgent && (
        <div className="bg-base-100 p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Mint Tokens</h2>
          <p className="text-sm text-gray-600 mb-4">As an agent, you can mint tokens to verified addresses.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Recipient Address</label>
              <input
                type="text"
                value={mintTo}
                onChange={e => setMintTo(e.target.value)}
                placeholder="0x..."
                className="w-full p-3 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <input
                type="number"
                value={mintAmount}
                onChange={e => setMintAmount(e.target.value)}
                placeholder="1000"
                className="w-full p-3 border rounded-lg"
              />
            </div>
          </div>

          <button
            onClick={handleMint}
            disabled={!mintTo || !mintAmount}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            {`Mint ${mintAmount || "0"} ${tokenInfo.symbol}`}
          </button>
        </div>
      )}

      {/* Transfer Tokens */}
      {tokenInfo && tokenInfo.isVerified && (
        <div className="bg-base-100 p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Transfer Tokens</h2>
          <p className="text-sm text-gray-600 mb-4">Transfer your tokens to other verified addresses.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Recipient Address</label>
              <input
                type="text"
                value={transferTo}
                onChange={e => setTransferTo(e.target.value)}
                placeholder="0x..."
                className="w-full p-3 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <input
                type="number"
                value={transferAmount}
                onChange={e => setTransferAmount(e.target.value)}
                placeholder="100"
                max={tokenInfo.balance}
                className="w-full p-3 border rounded-lg"
              />
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Available Balance: {tokenInfo.balance} {tokenInfo.symbol}
            </p>
          </div>

          <button
            onClick={handleTransfer}
            disabled={!transferTo || !transferAmount || parseFloat(transferAmount) > parseFloat(tokenInfo.balance)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {`Transfer ${transferAmount || "0"} ${tokenInfo.symbol}`}
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Enter the token address or salt to load your deployed token</li>
          <li>Check your status (Owner, Agent, Identity Verification)</li>
          <li>If you're an agent but not verified, register your identity first</li>
        </ol>
      </div>
    </div>
  );
};

export default Load;
