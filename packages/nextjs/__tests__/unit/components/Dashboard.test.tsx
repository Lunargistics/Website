import React from "react";
import { fireEvent, render, screen } from "../../../tests/utils/test-utils";
import DashboardPage from "~~/app/dashboard/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@privy-io/react-auth", () => ({
  usePrivy: () => ({ ready: true, authenticated: true, login: jest.fn() }),
}));

jest.mock("~~/components/dashboard/SpaceEngineerDashboard", () => ({
  __esModule: true,
  default: () => <div>Space Engineer Dashboard</div>,
}));

jest.mock("~~/components/Profile", () => ({ __esModule: true, default: () => <div>Profile</div> }));
jest.mock("~~/components/SocialFeed", () => ({ __esModule: true, default: () => <div>Social Feed</div> }));

jest.mock("~~/components/dashboard/MissionPlanningDashboard", () => ({
  __esModule: true,
  MissionPlanningDashboard: () => <div>Mission Planning</div>,
}));

describe("Dashboard Tabs", () => {
  it("renders default overview tab", async () => {
    render(<DashboardPage />);
    // The overview content is a next/dynamic({ ssr: false }) component, so it
    // resolves asynchronously — query with findByText rather than synchronously.
    expect(await screen.findByText(/Space Engineer Dashboard/i)).toBeInTheDocument();
  });

  it("renders Social Feed and Profile tabs", () => {
    render(<DashboardPage />);
    fireEvent.click(screen.getByText("Social Feed"));
    expect(screen.getByText(/Social Feed/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Profile"));
    expect(screen.getByText(/Profile/i)).toBeInTheDocument();
  });
});
