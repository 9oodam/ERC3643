"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { BugAntIcon, KeyIcon, ListBulletIcon, MagnifyingGlassIcon, WalletIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">Scaffold-ETH 2</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>
        </div>

        <div className="grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col md:flex-row">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <KeyIcon className="h-8 w-8 fill-secondary" />
              <p className="flex flex-col gap-2">
                Go To Alchemy
                <a href="https://dashboard.alchemy.com/" target="_blank" rel="noopener noreferrer" className="link">
                  Alchemy API key 받기
                </a>
              </p>
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <MagnifyingGlassIcon className="h-8 w-8 fill-secondary" />
              <p className="flex flex-col gap-2">
                Go To ChainList
                <a
                  href="https://chainlist.org/?search=creditcoin&testnets=true"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link"
                >
                  Metamask에 Creditcoin 추가하기
                </a>
              </p>
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <MagnifyingGlassIcon className="h-8 w-8 fill-secondary" />
              <p className="flex flex-col gap-2">
                Go To Get Faucet
                <a
                  href="https://chainlist.org/?search=creditcoin&testnets=true"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link"
                >
                  CreditCoin Testnet Token 받기
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
