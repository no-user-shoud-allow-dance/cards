// German duration formatting for study-time displays.

export function formatStudyTime(ms: number): string {
    const totalSeconds = Math.round(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) return `${hours} Std ${minutes} Min`;
    if (minutes > 0) return `${minutes} Min ${seconds} Sek`;
    return `${seconds} Sek`;
}

// Countdown in mm:ss, e.g. "04:32".
export function formatCountdown(ms: number): string {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
