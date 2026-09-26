import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "MVP",
    description: "Stake USDC on an x.com post. One factory on Base.",
};

export default function MvpLayout({ children }: { children: React.ReactNode }) {
    return children;
}
