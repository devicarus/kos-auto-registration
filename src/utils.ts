/**
 * Formats a duration in seconds to a human-readable string.
 * @param seconds
 * @returns A string in the format "Xh Ym Zs". If a part is zero, it is omitted.
 */
const formatDuration = (seconds: number): string => {
    if (seconds < 0)
        throw new Error("Input value must be a non-negative number.");

    const parts: String[] = [];
    if (Math.floor(seconds / 3600) > 0)
        parts.push(`${Math.floor(seconds / 3600)}h`);

    if (Math.floor((seconds % 3600) / 60) > 0)
        parts.push(`${Math.floor((seconds % 3600) / 60)}m`);

    if (seconds % 60 > 0 || parts.length === 0)
        parts.push(`${seconds % 60}s`);

    return parts.join(" ");
}

export { formatDuration };