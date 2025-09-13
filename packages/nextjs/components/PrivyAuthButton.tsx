"use client";

import React from "react";
import { usePrivy } from "@privy-io/react-auth";
import { UserCircleIcon, WalletIcon } from "@heroicons/react/24/outline";
import { usePrivyAuth } from "~~/hooks/usePrivyAuth";

export const PrivyAuthButton = () => {
  const { ready, authenticated, login } = usePrivy();
  const { displayName, primaryAddress, logout, isLoading, hasEmbeddedWallet, exportWallet } = usePrivyAuth();

  if (!ready || isLoading) {
    return <button className="btn btn-sm btn-ghost loading">Loading...</button>;
  }

  if (!authenticated) {
    return (
      <button
        onClick={() => {
          try {
            login();
          } catch (e) {
            console.error("Privy login unavailable", e);
          }
        }}
        className="btn btn-sm btn-primary gap-2"
      >
        <UserCircleIcon className="h-4 w-4" />
        Sign In
      </button>
    );
  }

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn btn-sm btn-ghost gap-2">
        {primaryAddress ? (
          <>
            <WalletIcon className="h-4 w-4" />
            <span className="hidden md:inline">
              {primaryAddress.slice(0, 6)}...{primaryAddress.slice(-4)}
            </span>
          </>
        ) : (
          <>
            <UserCircleIcon className="h-4 w-4" />
            <span className="hidden md:inline">{displayName || "User"}</span>
          </>
        )}
      </label>
      <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 mt-2">
        <li className="px-3 py-2 text-sm opacity-70">{displayName || "Connected"}</li>
        {primaryAddress && (
          <li className="px-3 py-1 text-xs opacity-50 font-mono">
            {primaryAddress.slice(0, 10)}...{primaryAddress.slice(-8)}
          </li>
        )}
        <div className="divider my-1"></div>

        {hasEmbeddedWallet && (
          <li>
            <button onClick={exportWallet}>
              <WalletIcon className="h-4 w-4" />
              Export Wallet
            </button>
          </li>
        )}

        <li>
          <button onClick={logout} className="text-error">
            Sign Out
          </button>
        </li>
      </ul>
    </div>
  );
};
