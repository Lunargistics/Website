"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChartBarIcon, CurrencyDollarIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";

export function AsteroidHero() {
  const router = useRouter();

  return (
    <div className="hero min-h-[60vh] bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10">
      <div className="hero-content text-center px-4">
        <div className="max-w-3xl">
          {/* Logo - visible on mobile, hidden on larger screens */}
          <div className="block sm:hidden mb-6">
            <Image src="/logo.png" alt="Lunargistics Logo" width={120} height={120} className="mx-auto" priority />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Asteroid Commodities Exchange
          </h1>
          <p className="text-lg sm:text-xl mb-8 text-base-content/80">
            Trade tokenized space resources from verified asteroids. Access the $700 quintillion space economy today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button className="btn btn-primary btn-lg" onClick={() => router.push("/asteroids")}>
              Start Trading
              <RocketLaunchIcon className="w-5 h-5 ml-2" />
            </button>
            <button className="btn btn-outline btn-lg">Learn More</button>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="card bg-base-200/50 backdrop-blur">
              <div className="card-body p-4">
                <CurrencyDollarIcon className="w-8 h-8 mx-auto text-primary mb-2" />
                <h3 className="font-bold text-sm">Instant Swaps</h3>
                <p className="text-xs text-base-content/70">Trade asteroid commodities with deep liquidity</p>
              </div>
            </div>

            <div className="card bg-base-200/50 backdrop-blur">
              <div className="card-body p-4">
                <ChartBarIcon className="w-8 h-8 mx-auto text-secondary mb-2" />
                <h3 className="font-bold text-sm">Futures Trading</h3>
                <p className="text-xs text-base-content/70">Long or short asteroid resources with leverage</p>
              </div>
            </div>

            <div className="card bg-base-200/50 backdrop-blur">
              <div className="card-body p-4">
                <RocketLaunchIcon className="w-8 h-8 mx-auto text-accent mb-2" />
                <h3 className="font-bold text-sm">Real Data</h3>
                <p className="text-xs text-base-content/70">Verified asteroid data from NASA & partners</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
