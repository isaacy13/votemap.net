"use client";

import { useEffect, useRef } from "react";
import { Tweet } from "react-tweet";
import type { ParsedPost } from "./urls";

export function PostEmbed({ parsed }: { parsed: ParsedPost }) {
    if (parsed.network === "x") {
        return (
            <div className="embed">
                <Tweet id={parsed.tweetId} />
            </div>
        );
    }
    return <ThreadsEmbed permalink={parsed.permalink} />;
}

function ThreadsEmbed({ permalink }: { permalink: string }) {
    const ref = useRef<HTMLQuoteElement>(null);

    useEffect(() => {
        const id = "threads-embed-js";
        const existing = document.getElementById(id) as HTMLScriptElement | null;
        const load = () => {
            const w = window as unknown as { instgrm?: { Embeds?: { process: () => void } } };
            w.instgrm?.Embeds?.process();
        };
        if (existing) {
            load();
            return;
        }
        const s = document.createElement("script");
        s.id = id;
        s.async = true;
        s.src = "https://www.threads.com/embed.js";
        s.onload = load;
        document.body.appendChild(s);
    }, [permalink]);

    return (
        <div className="embed">
            <blockquote
                ref={ref}
                className="text-post-media"
                data-text-post-permalink={permalink}
                data-text-post-version="0"
            >
                <a href={permalink} target="_blank" rel="noreferrer">
                    View on Threads
                </a>
            </blockquote>
        </div>
    );
}
