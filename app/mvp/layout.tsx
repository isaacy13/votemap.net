import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "MVP",
    description:
        "Stake USDC on an X or Threads post. One factory on Base. Testnet and mock click-through.",
};

export default function MvpLayout({ children }: { children: React.ReactNode }) {
    return children;
}
