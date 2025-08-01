import { wait } from "../wait";
import { isAbortError } from "../isAbortError.ts";

export function withRetry<T>(
    action: () => Promise<T>,
    {
        signal,
        maxRetries = 3,
        delayStep = 200,
    }: {
        signal?: AbortSignal
        maxRetries?: number,
        delayStep?: number,
    } = {},
): () => Promise<T> {
    return async function () {
        if (signal?.aborted) {
            throw new DOMException("Operation aborted", "AbortError");
        }
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // assuming action is will be aborted if signal is aborted
                return await action();
            } catch (error) {
                if (isAbortError(error)) {
                    throw error;
                }
                if (signal?.aborted) {
                    throw new DOMException("Operation aborted", "AbortError");
                }
                if (attempt < maxRetries) {
                    await wait(delayStep * attempt, { signal });
                } else {
                    throw error;
                }
            }
        }
        throw new Error("unreachable code");
    };
}
