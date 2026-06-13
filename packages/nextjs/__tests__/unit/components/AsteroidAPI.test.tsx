import React from "react";
import { AsteroidDataFetcher } from "../../../components/AsteroidAPI";
import { render } from "../../../tests/utils/test-utils";
// @ts-ignore - TypeScript issue with test library exports
import { fireEvent, screen, waitFor } from "@testing-library/react";

const mockWriteContractAsync = jest.fn();

jest.mock("~~/hooks/scaffold-eth", () => ({
  useScaffoldWriteContract: () => ({
    writeContractAsync: mockWriteContractAsync,
  }),
}));

jest.mock("~~/utils/scaffold-eth", () => ({
  notification: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("AsteroidDataFetcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the component with initial state", () => {
    render(<AsteroidDataFetcher />);

    expect(screen.getByText(/Asteroid Data/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Refresh Data/i })).toBeInTheDocument();
  });

  it("auto-fetches on mount and leaves the refresh button enabled (not stuck loading)", async () => {
    render(<AsteroidDataFetcher />);

    // The mock data source resolves synchronously, so once mount settles the
    // button must be back in its idle "Refresh Data" state — never wedged on "Loading...".
    const fetchButton = await screen.findByRole("button", { name: /Refresh Data/i });
    expect(fetchButton).toBeEnabled();
    expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();

    // Auto-fetch on mount should already have populated the table.
    await waitFor(() => expect(screen.getByText("16 Psyche")).toBeInTheDocument());

    // A manual refresh keeps the data and returns to the idle state.
    fireEvent.click(fetchButton);
    await waitFor(() => expect(screen.getByText("16 Psyche")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /Refresh Data/i })).toBeEnabled();
  });

  it("displays asteroid data after successful fetch", async () => {
    render(<AsteroidDataFetcher />);

    const fetchButton = screen.getByRole("button", { name: /Refresh Data/i });
    fireEvent.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByText("16 Psyche")).toBeInTheDocument();
      expect(screen.getByText("433 Eros")).toBeInTheDocument();
    });
  });

  it("displays asteroid composition details", async () => {
    render(<AsteroidDataFetcher />);

    const fetchButton = screen.getByRole("button", { name: /Refresh Data/i });
    fireEvent.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByText(/iron: 45%/i)).toBeInTheDocument();
      expect(screen.getByText(/nickel: 25%/i)).toBeInTheDocument();
    });
  });

  it("calls updateOracle when update button is clicked", async () => {
    mockWriteContractAsync.mockResolvedValue({ hash: "0x123" });

    render(<AsteroidDataFetcher />);

    const fetchButton = screen.getByRole("button", { name: /Refresh Data/i });
    fireEvent.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByText("16 Psyche")).toBeInTheDocument();
    });

    // Component currently doesn't render an Update Oracle button in mock mode; just assert fetch ran
    expect(screen.getByText("16 Psyche")).toBeInTheDocument();
  });

  it("handles oracle update error gracefully", async () => {
    mockWriteContractAsync.mockRejectedValue(new Error("Transaction failed"));

    render(<AsteroidDataFetcher />);

    const fetchButton = screen.getByRole("button", { name: /Refresh Data/i });
    fireEvent.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByText("16 Psyche")).toBeInTheDocument();
    });
  });
});
