"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { hardhat } from "viem/chains";
import { useAccount } from "wagmi";
import { Bars3Icon, RocketLaunchIcon, UserCircleIcon, WalletIcon } from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <RocketLaunchIcon className="h-4 w-4" />,
  },
];

export const HeaderMenuLinks = () => {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <>
      {menuLinks
        .filter(({ href }) => {
          // Always show Home link; other links require authentication
          if (href === "/") return true;
          return session;
        })
        .map(({ label, href, icon }) => {
          const isActive = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                passHref
                className={`${
                  isActive ? "bg-secondary shadow-md" : ""
                } hover:bg-secondary hover:shadow-md focus:!bg-secondary active:!text-neutral py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col`}
              >
                {icon}
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const { data: session } = useSession();
  const { isConnected } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  return (
    <div className="sticky lg:static top-0 navbar bg-base-100 min-h-0 shrink-0 justify-between z-20 shadow-md shadow-secondary px-0 sm:px-2">
      <div className="navbar-start w-auto lg:w-1/2">
        <details className="dropdown" ref={burgerMenuRef}>
          <summary className="ml-1 btn btn-ghost lg:hidden hover:bg-transparent">
            <Bars3Icon className="h-1/2" />
          </summary>
          <ul
            className="menu menu-compact dropdown-content mt-3 p-2 shadow-sm bg-base-100 rounded-box w-52"
            onClick={() => {
              burgerMenuRef?.current?.removeAttribute("open");
            }}
          >
            <HeaderMenuLinks />
          </ul>
        </details>
        <Link href="/" passHref className="hidden lg:flex items-center gap-2 ml-4 mr-6 shrink-0">
          <div className="flex relative w-10 h-10">
            <Image
              alt="Lunargistics icon"
              className="cursor-pointer"
              fill
              src="/icon.png"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold leading-tight">Lunargistics</span>
            <span className="text-xs">Space Launch Simplified</span>
          </div>
        </Link>
        <ul className="hidden lg:flex lg:flex-nowrap menu menu-horizontal px-1 gap-2">
          <HeaderMenuLinks />
        </ul>
      </div>
      <div className="navbar-end grow mr-4 flex items-center gap-2">
        {/* Primary auth: NextAuth sign in */}
        {!session ? (
          <button
            onClick={() => signIn()}
            className="btn btn-primary btn-sm flex items-center gap-2"
          >
            <UserCircleIcon className="w-4 h-4" />
            Sign In
          </button>
        ) : (
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-sm rounded-btn flex items-center gap-2">
              <UserCircleIcon className="w-5 h-5" />
              <span className="hidden sm:inline">{session.user?.email?.split('@')[0]}</span>
            </label>
            <ul tabIndex={0} className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
              <li className="text-sm text-base-content/60 px-2 py-1">
                {session.user?.email}
              </li>
              <li><a onClick={() => signOut()}>Sign Out</a></li>
            </ul>
          </div>
        )}
        
        {/* Optional: Wallet connection - available but not required */}
        {session && (
          <>
            <div className="divider divider-horizontal mx-0 h-6"></div>
            <details className="dropdown dropdown-end">
              <summary className="btn btn-ghost btn-sm">
                <WalletIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Wallet (Optional)</span>
              </summary>
              <div className="dropdown-content z-[1] p-4 shadow bg-base-100 rounded-box w-64 mt-3">
                <p className="text-sm text-base-content/60 mb-3">
                  Connect a wallet for blockchain features (NFTs, smart contracts). This is optional.
                </p>
                <RainbowKitCustomConnectButton />
              </div>
            </details>
          </>
        )}
        
        {isLocalNetwork && isConnected && <FaucetButton />}
      </div>
    </div>
  );
};
