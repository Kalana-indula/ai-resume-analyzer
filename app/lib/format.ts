export const formatSize = (bytes: number): string => {
    if (!Number.isFinite(bytes) || bytes <= 0) {
        return "0 KB";
    }

    const kilobyte = 1024;
    const megabyte = kilobyte * 1024;
    const gigabyte = megabyte * 1024;

    if (bytes >= gigabyte) {
        return `${(bytes / gigabyte).toFixed(2)} GB`;
    }

    if (bytes >= megabyte) {
        return `${(bytes / megabyte).toFixed(2)} MB`;
    }

    return `${(bytes / kilobyte).toFixed(2)} KB`;
};