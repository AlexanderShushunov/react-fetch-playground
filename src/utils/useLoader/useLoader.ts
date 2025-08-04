import { useCallback, useRef, useState } from "react";
import { withRetry } from "../withRetry";
import { isAbortError } from "../isAbortError.ts";

export type ErrorType = "none" | "network" | "server" | "unknown";

export function useLoader<T>({
    initialValue,
    maxRetries = 3,
    delayStep = 200,
}: {
    initialValue: T;
    maxRetries?: number;
    delayStep?: number;
}): {
    errorType: ErrorType;
    isLoading: boolean;
    value: T;
    load: (url: string) => Promise<void>;
    abort: () => void;
} {
    const [value, setValue] = useState<T>(initialValue);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorType, setErrorType] = useState<ErrorType>("none");

    const abortControllerRef = useRef<AbortController | null>(null);
    const currentRequestId = useRef(0);

    const abort = useCallback(() => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
    }, []);

    const load = useCallback(async (url: string): Promise<void> => {
        abort();
        currentRequestId.current++;
        const requestId = currentRequestId.current;
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
            maxRetries: maxRetries,
            delayStep: delayStep,
        })();

        return result
            .then(value => {
                if (requestId !== currentRequestId.current) {
                    return;
                }
                setValue(value);
            })
            .catch((error) => {
                if (requestId !== currentRequestId.current) {
                    return;
                }
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
                if (requestId !== currentRequestId.current) {
                    return;
                }
                setIsLoading(false);
                abortControllerRef.current = null;
            });
    }, [maxRetries, delayStep, abort]);

    return {
        errorType,
        isLoading,
        load,
        abort,
        value,
    };
}

