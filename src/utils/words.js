import words from "an-array-of-english-words";

export const WORDS = words
    .map((word) => word.toLowerCase())
    .filter((word) => /^[a-z]+$/.test(word));

export const WORDS_BY_LENGTH = {
    4: WORDS.filter((word) => word.length === 4),
    5: WORDS.filter((word) => word.length === 5),
    6: WORDS.filter((word) => word.length === 6),
};

export function getRandomWord(length) {
    const wordsForLength = WORDS_BY_LENGTH[length];

    if (!wordsForLength || wordsForLength.length === 0) {
        throw new Error(`No words found for length ${length}`);
    }

    const randomIndex = Math.floor(Math.random() * wordsForLength.length);

    return wordsForLength[randomIndex];
}