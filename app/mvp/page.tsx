import { Suspense } from "react";
import { MvpApp } from "@/mvp/MvpApp";

export default function MvpPage() {
    return (
        <Suspense fallback={<p style={{ padding: "1rem" }}>Loading mvp…</p>}>
            <MvpApp />
        </Suspense>
    );
}
