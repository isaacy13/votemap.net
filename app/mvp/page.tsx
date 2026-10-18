import { Suspense } from "react";
import { App } from "@/mvp/App";

export default function MvpPage() {
    return (
        <Suspense fallback={<p style={{ padding: "1rem" }}>Loading mvp…</p>}>
            <App />
        </Suspense>
    );
}
