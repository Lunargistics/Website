import React from "react";
import { AsteroidDataFetcher } from "../../../components/AsteroidAPI";
import { fireEvent, render, screen, waitFor } from "../../../tests/utils/test-utils";

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

    expect(screen.getByText(/Asteroid Mining Data/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Fetch Asteroid Data/i })).toBeInTheDocument();
  });

  it("displays loading state when fetching data", async () => {
    render(<AsteroidDataFetcher />);

    const fetchButton = screen.getByRole("button", { name: /Fetch Asteroid Data/i });
    fireEvent.click(fetchButton);

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it("displays asteroid data after successful fetch", async () => {
    render(<AsteroidDataFetcher />);

    const fetchButton = screen.getByRole("button", { name: /Fetch Asteroid Data/i });
    fireEvent.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByText("16 Psyche")).toBeInTheDocument();
      expect(screen.getByText("433 Eros")).toBeInTheDocument();
    });
  });

  it("displays asteroid composition details", async () => {
    render(<AsteroidDataFetcher />);

    const fetchButton = screen.getByRole("button", { name: /Fetch Asteroid Data/i });
    fireEvent.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByText(/Iron: 45%/i)).toBeInTheDocument();
      expect(screen.getByText(/Nickel: 25%/i)).toBeInTheDocument();
    });
  });

  it("calls updateOracle when update button is clicked", async () => {
    mockWriteContractAsync.mockResolvedValue({ hash: "0x123" });

    render(<AsteroidDataFetcher />);

    const fetchButton = screen.getByRole("button", { name: /Fetch Asteroid Data/i });
    fireEvent.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByText("16 Psyche")).toBeInTheDocument();
    });

    const updateButton = screen.getAllByRole("button", { name: /Update Oracle/i })[0];
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(mockWriteContractAsync).toHaveBeenCalledWith({
        functionName: "updateAsteroidData",
        args: expect.any(Array),
      });
    });
  });

  it("handles oracle update error gracefully", async () => {
    mockWriteContractAsync.mockRejectedValue(new Error("Transaction failed"));

    render(<AsteroidDataFetcher />);

    const fetchButton = screen.getByRole("button", { name: /Fetch Asteroid Data/i });
    fireEvent.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByText("16 Psyche")).toBeInTheDocument();
    });

    const updateButton = screen.getAllByRole("button", { name: /Update Oracle/i })[0];
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(mockWriteContractAsync).toHaveBeenCalled();
    });
  });
});
