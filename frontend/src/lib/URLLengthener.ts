const EMOJI_CHARS = ['⌚', '⌛', '✨', '🌈', '🌊', '🌞', '🌟', '🌱', '🌲', '🌻', '🍆', '🍌', '🍎', '🍔', '🍕', '🍖', '🍣', '🍨', '🍪', '🍳', '🎀', '🎨', '🎮', '🎯', '🎸', '🎹', '🎾', '🏀', '🏆', '🐔', '🐞', '🐧', '🐬', '🐱', '🐶', '🐺', '👓', '👻', '👾', '💊', '💋', '💍', '💖', '💢', '💦', '💫', '💰', '🔑', '🔔', '🔥', '🔭', '😀', '😋', '😍', '😎', '😡', '🚀', '🚆', '🚚', '🚨', '🛁', '🤗', '🦀', '🦁']
const BASE64URL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

const B64_TO_EMOJI_MAP = new Map<string, string>();
const EMOJI_TO_B64_MAP = new Map<string, string>();

for (let i = 0; i < BASE64URL_CHARS.length; i++) {
    const b64Char = BASE64URL_CHARS[i];
    const emojiChar = EMOJI_CHARS[i];
    B64_TO_EMOJI_MAP.set(b64Char, emojiChar);
    EMOJI_TO_B64_MAP.set(emojiChar, b64Char);
}

export function encode(input: string): string {
    let base64url: string;
    const bytes = new TextEncoder().encode(input);
    const binString = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
    base64url = btoa(binString)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    return [...base64url].map(char => B64_TO_EMOJI_MAP.get(char) ?? "").join('');
}

export function decode(input: string): string | null {
    if (!input) {
        return null;
    }
    try {
        const emojis = [...input];
        const b64Chars: string[] = [];
        for (const emoji of emojis) {
            const b64Char = EMOJI_TO_B64_MAP.get(emoji);
            if (!b64Char) {
                return null;
            }
            b64Chars.push(b64Char);
        }
        const base64url = b64Chars.join('');
        let b64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) {
            b64 += '=';
        }
        const binaryString = atob(b64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    }
    catch {
        return null;
    }
}