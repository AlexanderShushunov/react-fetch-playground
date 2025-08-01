import { useCallback, useRef, useState } from "react";
import { withRetry } from "../withRetry";
import { isAbortError } from "../isAbortError.ts";

export type ErrorType = "none" | "network" | "server" | "unknown";

export function useLoader<T>({
    url,
    initialValue,
}: {
    url: string;
    initialValue: T;
}): {
    errorType: ErrorType;
    isLoading: boolean;
    value: T;
    load: () => Promise<void>,
    abort: () => void;
} {
    const [value, setValue] = useState<T>(initialValue);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorType, setErrorType] = useState<ErrorType>("none");

    const abortControllerRef = useRef<AbortController | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setErrorType("none");
        const controller = new AbortController();
        abortControllerRef.current = controller;
        const { signal } = controller;

        const result = withRetry<T>(async () => {
            let response: Response;
            try {
                response = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    signal,
                });
            } catch (error) {
                if (isAbortError(error)) {
                    throw error;
                }
                throw new Error("network");
            }
            if (!response.ok) {
                throw new Error("server");
            }
            return await response.json();
        }, {
            signal,
            maxRetries: 10,
            delayStep: 200,
        })();

        result
            .then(value => setValue(value))
            .catch((error) => {
                if (isAbortError(error)) {
                    // do nothing, the operation was aborted
                } else if (error instanceof Error && error.message === "network") {
                    setErrorType("network");
                } else if (error instanceof Error && error.message === "server") {
                    setErrorType("server");
                } else {
                    setErrorType("unknown");
                }
            })
            .finally(() => {
                setIsLoading(false)
            });
    }, [url]);

    const abort = useCallback(() => {
        abortControllerRef.current?.abort();
    }, []);

    return {
        errorType,
        isLoading,
        load,
        abort,
        value,
    };
}
