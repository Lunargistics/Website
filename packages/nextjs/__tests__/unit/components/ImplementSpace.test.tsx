import React from "react";
import { fireEvent, render, screen, waitFor } from "../../../tests/utils/test-utils";
import ImplementSpacePage from "~~/app/implement-space/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@privy-io/react-auth", () => ({
  usePrivy: () => ({ ready: true, authenticated: true, login: jest.fn() }),
}));

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ response: "Mission Overview\nLaunch Vehicle: Falcon 9\nPayload: CubeSat" }),
}) as any;

describe("Implement Space Page", () => {
  it("renders and can toggle Space Tracking and ICD Processor", () => {
    render(<ImplementSpacePage />);
    const trackingBtn = screen.getByRole("button", { name: /Space Tracking/i });
    fireEvent.click(trackingBtn);
    expect(screen.getByText(/Real-Time Space Tracking/i)).toBeInTheDocument();

    const icdBtn = screen.getByRole("button", { name: /ICD Processor/i });
    fireEvent.click(icdBtn);
    expect(icdBtn).toBeInTheDocument();
  });

  it("submits a prompt and shows assistant response", async () => {
    render(<ImplementSpacePage />);
    const input = screen.getByPlaceholderText(/Describe your space mission/i);
    fireEvent.change(input, { target: { value: "Test mission to LEO" } });
    const generateBtn = screen.getByRole("button", { name: /^Generate$/i });
    fireEvent.click(generateBtn);

    await waitFor(() => expect(screen.getAllByText(/Mission Overview/i).length).toBeGreaterThan(0));
  });
});
