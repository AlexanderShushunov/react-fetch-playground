export function wait(ms: number, { signal }: { signal?: AbortSignal } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
        let timeoutId = 0;
        const onAbort = () => {
            clearTimeout(timeoutId);
            reject(new DOMException("Operation aborted", "AbortError"));
        };
        if (signal?.aborted) {
            onAbort();
            return;
        }
        timeoutId = window.setTimeout(() => {
            signal?.removeEventListener("abort", onAbort);
            resolve();
        }, ms);

        signal?.addEventListener("abort", onAbort, { once: true });
    });
}
