"use client";

import { Tweet } from "react-tweet";
import type { ParsedPost } from "./urls";

export function PostEmbed({ parsed }: { parsed: ParsedPost }) {
    return (
        <div className="embed">
            <Tweet id={parsed.tweetId} />
        </div>
    );
}
