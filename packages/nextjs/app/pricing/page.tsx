"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckIcon } from "@heroicons/react/24/solid";

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

const PricingPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const saasPlans = [
    {
      name: "Free",
      price: 0,
      period: "month",
      features: ["100 credits on signup", "Basic support", "Community access", "Standard processing speed"],
      notIncluded: ["Priority support", "Advanced analytics", "API access", "Custom integrations"],
      cta: "Get Started",
    },
    {
      name: "Pro",
      price: 29,
      period: "month",
      popular: true,
      features: [
        "100 credits per month",
        "Priority support",
        "Advanced analytics",
        "API access",
        "Faster processing speed",
        "Export capabilities",
      ],
      notIncluded: ["Custom integrations", "Dedicated account manager"],
      cta: "Start Free Trial",
    },
    {
      name: "Business",
      price: 99,
      period: "month",
      features: [
        "500 credits per month",
        "Priority support",
        "Advanced analytics",
        "API access",
        "Fastest processing speed",
        "Export capabilities",
        "Custom integrations",
        "Dedicated account manager",
        "SLA guarantee",
      ],
      notIncluded: [],
      cta: "Contact Sales",
    },
  ];

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch("/api/credits/packages");
      if (response.ok) {
        const data = await response.json();
        setCreditPackages(data.packages);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    if (!session) {
      router.push("/login?callbackUrl=" + encodeURIComponent("/pricing"));
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
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-base-content/70">
            Choose the plan that fits your needs. Pay as you go or save with monthly plans.
          </p>
        </div>

        {/* Credit Packages */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Credit Packages</h2>
          <p className="text-center text-base-content/70 mb-8">
            One-time purchase. Credits never expire. Use them at your own pace.
          </p>
          {loading ? (
            <div className="flex justify-center">
              <div className="loading loading-spinner loading-lg"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {creditPackages.map(pkg => (
                <div
                  key={pkg.id}
                  className={`card bg-base-200 shadow-xl relative ${pkg.popular ? "ring-2 ring-primary" : ""}`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="badge badge-primary badge-lg">Most Popular</span>
                    </div>
                  )}
                  <div className="card-body pt-8">
                    <h3 className="text-xl font-bold">{pkg.name}</h3>
                    {pkg.savings > 0 && <span className="badge badge-success">{pkg.savings}% Extra Credits Free!</span>}
                    <div className="my-4">
                      <p className="text-4xl font-bold">${(pkg.price / 100).toFixed(2)}</p>
                      <div className="space-y-1">
                        <p className="text-base-content/70">{pkg.credits.toLocaleString()} base credits</p>
                        {pkg.bonusCredits > 0 && (
                          <p className="text-success">+ {pkg.bonusCredits.toLocaleString()} bonus credits</p>
                        )}
                        <p className="text-sm font-medium text-primary">
                          {pkg.totalCredits.toLocaleString()} total credits
                        </p>
                        <p className="text-sm text-base-content/50">${pkg.pricePerCredit} per credit</p>
                      </div>
                    </div>
                    <p className="text-sm text-base-content/60 mb-4">{pkg.description}</p>
                    <button
                      className="btn btn-primary w-full"
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={purchasing === pkg.id}
                    >
                      {purchasing === pkg.id ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Processing...
                        </>
                      ) : (
                        "Buy Now"
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SaaS Plans */}
        <div>
          <h2 className="text-3xl font-bold text-center mb-12">Monthly Plans</h2>
          <p className="text-center text-base-content/70 mb-8">
            Predictable monthly billing. Cancel anytime. Includes monthly credit allowance.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {saasPlans.map(plan => (
              <div
                key={plan.name}
                className={`card bg-base-200 shadow-xl ${plan.popular ? "ring-2 ring-primary scale-105" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="badge badge-primary badge-lg">Recommended</span>
                  </div>
                )}
                <div className="card-body pt-10">
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <div className="my-6">
                    <p className="text-5xl font-bold">
                      ${plan.price}
                      <span className="text-lg text-base-content/70">/{plan.period}</span>
                    </p>
                  </div>
                  <ul className="space-y-3 mb-8 flex-grow">
                    {plan.features.map(feature => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckIcon className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                    {plan.notIncluded.map(feature => (
                      <li key={feature} className="flex items-start gap-2 opacity-50">
                        <span className="w-5 h-5 mt-0.5 flex-shrink-0 text-center">✕</span>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`btn w-full ${plan.popular ? "btn-primary" : "btn-outline btn-primary"}`}
                    onClick={() => {
                      if (plan.name === "Business") {
                        window.location.href = "mailto:sales@lunargistics.com";
                      } else {
                        router.push("/dashboard");
                      }
                    }}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Credit Costs */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">API Credit Costs</h2>
          <p className="text-center text-base-content/70 mb-8">
            Understanding how credits are consumed across our platform
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card bg-base-200 p-6">
              <h3 className="font-bold text-lg mb-3">Basic Operations</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span>Mission CRUD Operations</span>
                  <span className="badge badge-neutral">1 credit</span>
                </li>
                <li className="flex justify-between">
                  <span>Orbital Calculations</span>
                  <span className="badge badge-neutral">3 credits</span>
                </li>
                <li className="flex justify-between">
                  <span>Mission Creation</span>
                  <span className="badge badge-neutral">5 credits</span>
                </li>
              </ul>
            </div>
            <div className="card bg-base-200 p-6">
              <h3 className="font-bold text-lg mb-3">Advanced Features</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span>Document Generation</span>
                  <span className="badge badge-warning">5 credits</span>
                </li>
                <li className="flex justify-between">
                  <span>ICD Generation</span>
                  <span className="badge badge-warning">8 credits</span>
                </li>
                <li className="flex justify-between">
                  <span>Advanced Orekit</span>
                  <span className="badge badge-warning">10 credits</span>
                </li>
              </ul>
            </div>
            <div className="card bg-base-200 p-6">
              <h3 className="font-bold text-lg mb-3">Premium Services</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span>Driver Generation</span>
                  <span className="badge badge-error">12 credits</span>
                </li>
                <li className="flex justify-between">
                  <span>Constellation Analysis</span>
                  <span className="badge badge-error">15 credits</span>
                </li>
                <li className="flex justify-between">
                  <span>AI Mission Planning</span>
                  <span className="badge badge-error">20 credits</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="collapse collapse-plus bg-base-200">
              <input type="radio" name="faq-accordion" defaultChecked />
              <div className="collapse-title text-xl font-medium">What are credits used for?</div>
              <div className="collapse-content">
                <p>
                  Credits are used to access our services. Each action consumes a certain number of credits based on
                  complexity and resource usage. You can view your credit balance in your dashboard.
                </p>
              </div>
            </div>
            <div className="collapse collapse-plus bg-base-200">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-xl font-medium">Do credits expire?</div>
              <div className="collapse-content">
                <p>
                  Purchased credits never expire and can be used at any time. Monthly plan credits refresh each billing
                  cycle and don&apos;t roll over to the next month.
                </p>
              </div>
            </div>
            <div className="collapse collapse-plus bg-base-200">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-xl font-medium">Can I change my plan anytime?</div>
              <div className="collapse-content">
                <p>
                  Yes! You can upgrade, downgrade, or cancel your monthly plan at any time. Changes take effect at the
                  next billing cycle. Purchased credit packages are non-refundable.
                </p>
              </div>
            </div>
            <div className="collapse collapse-plus bg-base-200">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-xl font-medium">What payment methods do you accept?</div>
              <div className="collapse-content">
                <p>
                  We accept all major credit cards, debit cards, and cryptocurrency payments through our secure payment
                  processing partners.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
