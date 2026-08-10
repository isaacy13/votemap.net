'use client'

import { useMemo } from 'react'
import {
    EmbeddedTweet,
    TweetNotFound,
    TweetSkeleton,
    useTweet,
} from 'react-tweet'
import type { Tweet } from 'react-tweet/api'

/**
 * Full note-tweet bodies. The free syndication API truncates long posts and only
 * returns a `note_tweet` id — which is why react-tweet shows "Show more".
 * Baking the full text in lets us expand embeds with no API key.
 */
const EXPANDED_NOTE_TEXT: Record<string, string> = {
    '2086102002241540162':
        "since the dawn of time, humans have craved fame, riches, and power\n\nif you see tech in a positive lens, it has democratized most of these things\n\ne.g:\nfame - social media\nriches - access to world-wide audience\npower - ? cancel culture?\n\nbut it hasn't quite democratized power, the last desire reserved for the rich\n\nwith @vote_map, that changes\n\ndemocratize everything",
}

function unicodeLength(text: string) {
    return Array.from(text).length
}

/** Build mention entities so @handles stay linked after we replace truncated text. */
function mentionEntitiesFromText(text: string) {
    const mentions: NonNullable<Tweet['entities']>['user_mentions'] = []
    const re = /@(\w+)/g
    let match: RegExpExecArray | null
    while ((match = re.exec(text)) !== null) {
        const screenName = match[1]
        mentions.push({
            id_str: '0',
            name: screenName,
            screen_name: screenName,
            indices: [match.index, match.index + match[0].length],
        })
    }
    return mentions
}

function expandNoteTweet(tweet: Tweet): Tweet {
    const fullText = EXPANDED_NOTE_TEXT[tweet.id_str]
    if (!fullText || !tweet.note_tweet) return tweet

    return {
        ...tweet,
        text: fullText,
        display_text_range: [0, unicodeLength(fullText)],
        note_tweet: undefined,
        entities: {
            hashtags: [],
            urls: [],
            symbols: [],
            media: [],
            user_mentions: mentionEntitiesFromText(fullText),
        },
    }
}

/** react-tweet client embed that auto-expands known long/note tweets (no "Show more"). */
export function ExpandedTweet({ id }: { id: string }) {
    const { data, error, isLoading } = useTweet(id)

    const tweet = useMemo(() => (data ? expandNoteTweet(data) : data), [data])

    if (isLoading) return <TweetSkeleton />
    if (error || !tweet) return <TweetNotFound />
    return <EmbeddedTweet tweet={tweet} />
}
