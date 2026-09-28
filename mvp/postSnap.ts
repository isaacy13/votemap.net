import { postPreview, type ParsedPost } from './urls'

/** Off-chain card preview — not a live iframe. */
export type PostSnap = {
    network: string
    handle: string | null
    name?: string
    text?: string
    mediaUrl?: string
    avatarUrl?: string
}

/** Known posts — avoids a live fetch for landing/issue tweets we already ship. */
export const BAKED_SNAPS: Record<string, PostSnap> = {
    '1954029843701805328': {
        network: 'X',
        handle: '@isaac_yeang',
        name: 'isaac',
        text: 'just thought up an interesting path for @vote_map to take\n\nelon realized it a while ago, but he’s too busy\n\ni want to make it happen',
    },
    '2024186960454021466': {
        network: 'X',
        handle: '@isaac_yeang',
        name: 'isaac',
        text: 'these billionaires are controlling the game of life\n\ni want in',
    },
    '2086102002241540162': {
        network: 'X',
        handle: '@isaac_yeang',
        name: 'isaac',
        text: "since the dawn of time, humans have craved fame, riches, and power\n\nif you see tech in a positive lens, it has democratized most of these things\n\ne.g:\nfame - social media\nriches - access to world-wide audience\npower - ? cancel culture?\n\nbut it hasn't quite democratized power, the last desire reserved for the rich\n\nwith @vote_map, that changes\n\ndemocratize everything",
    },
}

/** Narrow tweet JSON — `react-tweet` / syndication, not an embed. */
export function snapFromTweet(tweet: {
    text: string
    user: { name: string; screen_name: string; profile_image_url_https?: string }
    photos?: { url: string }[]
}): PostSnap {
    return {
        network: 'X',
        handle: `@${tweet.user.screen_name}`,
        name: tweet.user.name,
        text: tweet.text,
        avatarUrl: tweet.user.profile_image_url_https,
        mediaUrl: tweet.photos?.[0]?.url,
    }
}

export function snapFromUrl(url: string, parsed: ParsedPost | null): PostSnap {
    const preview = postPreview(url, parsed)
    const baked = parsed?.network === 'x' ? BAKED_SNAPS[parsed.postId] : undefined
    return {
        network: preview.network,
        handle: preview.handle,
        ...baked,
    }
}
