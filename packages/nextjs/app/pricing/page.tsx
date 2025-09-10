"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRightIcon, BoltIcon, CheckIcon, CreditCardIcon, StarIcon } from "@heroicons/react/24/outline";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  bonusCredits: number;
  totalCredits: number;
  price: number;
  pricePerCredit: string;
  description: string;
  popular: boolean;
  savings: number;
}

const features = [
  "High-precision orbital mechanics calculations",
  "Advanced mission planning tools",
  "3D visualization and analysis",
  "Document generation (PDR, CDR, FRR)",
  "ICD and driver generation",
  "Constellation analysis",
  "AI-powered mission optimization",
  "Real-time API access",
  "Priority support",
];

const apiEndpoints = [
  { name: "Mission Operations", cost: 1, description: "Basic mission CRUD operations" },
  { name: "Mission Creation", cost: 5, description: "Create new missions with validation" },
  { name: "Orbital Calculations", cost: 3, description: "Propagation and analysis" },
  { name: "Advanced Orekit", cost: 10, description: "High-fidelity orbital mechanics" },
  { name: "Constellation Analysis", cost: 15, description: "Multi-satellite optimization" },
  { name: "Document Generation", cost: 5, description: "Professional reports (PDR/CDR/FRR)" },
  { name: "AI Mission Planning", cost: 20, description: "Venice AI-powered planning" },
  { name: "ICD Generation", cost: 8, description: "Interface control documents" },
  { name: "Driver Generation", cost: 12, description: "Multi-language driver code" },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch("/api/credits/packages");
      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    if (!session) {
      window.location.href = "/login?callbackUrl=" + encodeURIComponent("/pricing");
      return;
    }

    try {
      setPurchasing(packageId);

      const response = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageId,
          returnUrl: `${window.location.origin}/dashboard?tab=credits&success=true`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error purchasing credits:", error);
      alert("Failed to start purchase. Please try again.");
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Mission Planning Credits</h1>
          <p className="text-xl text-purple-200 max-w-3xl mx-auto">
            Pay-as-you-use credits for professional space mission planning. No monthly subscriptions, just purchase what
            you need.
          </p>
        </div>

        {/* Credit Packages */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Choose Your Package</h2>

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {packages.map(pkg => (
                <div
                  key={pkg.id}
                  className={`relative bg-white/10 backdrop-blur-lg rounded-xl p-6 border-2 transition-all duration-300 hover:scale-105 ${
                    pkg.popular
                      ? "border-purple-500 ring-4 ring-purple-500/20 shadow-2xl"
                      : "border-white/20 hover:border-purple-400"
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1">
                        <StarIcon className="h-4 w-4" />
                        Most Popular
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>

                    <div className="mb-6">
                      <span className="text-4xl font-bold text-white">${(pkg.price / 100).toFixed(0)}</span>
                      <span className="text-purple-200 text-lg">.{(pkg.price % 100).toString().padStart(2, "0")}</span>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-purple-200">Base Credits:</span>
                        <span className="text-white font-medium">{pkg.credits.toLocaleString()}</span>
                      </div>

                      {pkg.bonusCredits > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-purple-200">Bonus Credits:</span>
                          <span className="text-green-400 font-medium">+{pkg.bonusCredits.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center border-t border-white/20 pt-3">
                        <span className="text-purple-200 font-medium">Total Credits:</span>
                        <span className="text-white font-bold text-lg">{pkg.totalCredits.toLocaleString()}</span>
                      </div>

                      <div className="text-center">
                        <span className="text-purple-300 text-sm">${pkg.pricePerCredit} per credit</span>
                      </div>
                    </div>

                    {pkg.savings > 0 && (
                      <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-2 mb-4">
                        <span className="text-green-400 text-sm font-bold">{pkg.savings}% Extra Credits Free!</span>
                      </div>
                    )}

                    <p className="text-purple-200 text-sm mb-6">{pkg.description}</p>

                    <button
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={purchasing === pkg.id}
                      className={`w-full py-3 px-6 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                        pkg.popular
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                          : "bg-white/10 hover:bg-white/20 text-white border-2 border-white/20 hover:border-purple-400"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {purchasing === pkg.id ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCardIcon className="h-5 w-5" />
                          Purchase Credits
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Costs Breakdown */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">API Credit Costs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apiEndpoints.map(endpoint => (
              <div key={endpoint.name} className="bg-white/5 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-semibold">{endpoint.name}</h3>
                  <div className="flex items-center gap-1">
                    <BoltIcon className="h-4 w-4 text-purple-400" />
                    <span className="text-purple-300 font-bold">{endpoint.cost}</span>
                  </div>
                </div>
                <p className="text-purple-200 text-sm">{endpoint.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">What&apos;s Included</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span className="text-purple-200">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          {!session ? (
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">Ready to Start Planning Missions?</h3>
              <p className="text-purple-200 mb-6">Sign up today and get 100 free credits to explore our platform.</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200"
              >
                Get Started Free
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">Welcome back!</h3>
              <p className="text-purple-200 mb-6">Manage your credits and view your usage in the dashboard.</p>
              <Link
                href="/dashboard?tab=credits"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200"
              >
                Go to Dashboard
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
