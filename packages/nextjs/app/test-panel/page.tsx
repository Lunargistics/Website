import type { Metadata } from "next";
import TestPanel from "~~/components/SmartContractTestPanel";

export const metadata: Metadata = {
  title: "Smart Contract Test Panel",
  description: "Test panel for interacting with all smart contract functions",
};

export default function TestPanelPage() {
  return <TestPanel />;
}
