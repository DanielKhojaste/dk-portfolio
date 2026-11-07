/** Splits copy like "apps that are [fast], look [sharp]" into words, marking the [bracketed] ones. */
export interface Word {
	text: string;
	highlight: boolean;
	/** Punctuation straight after a highlight ("," in "[fast],"): kept with the word, not highlighted. */
	tail: string;
}

export function splitHighlights(copy: string): Word[] {
	const words: Word[] = [];
	for (const part of copy.split(/(\[[^\]]*\])/)) {
		if (part.startsWith("[") && part.endsWith("]")) {
			const text = part.slice(1, -1).trim();
			if (text) words.push({ text, highlight: true, tail: "" });
			continue;
		}
		const tokens = part.split(/\s+/).filter(Boolean);
		tokens.forEach((token, i) => {
			const last = words[words.length - 1];
			if (i === 0 && last?.highlight && !/^\s/.test(part)) last.tail += token;
			else words.push({ text: token, highlight: false, tail: "" });
		});
	}
	return words;
}
