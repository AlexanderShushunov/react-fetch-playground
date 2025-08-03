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
    maxRetries?: number,
    delayStep?: number,
}): {
    errorType: ErrorType;
    isLoading: boolean;
    value: T;
    load: (url: string) => Promise<void>,
    abort: () => void;
} {
    const [value, setValue] = useState<T>(initialValue);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorType, setErrorType] = useState<ErrorType>("none");

    const abortControllerRef = useRef<AbortController | null>(null);
    const prevOperationRef = useRef<Promise<void> | null>(null);
    const isRaceRef = useRef<boolean>(false);

    const abort = useCallback(() => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
    }, []);

    const abortPrevAndWait = useCallback(async () => {
        if (abortControllerRef.current) {
            isRaceRef.current = true;
            abort();
            try {
                await prevOperationRef.current;
            } catch {
                // do nothing
            }
            isRaceRef.current = false;
        }
    }, [abort]);

    const load = useCallback(async (url: string): Promise<void> => {
        await abortPrevAndWait();
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

        prevOperationRef.current = result
            .then(value => {
                setValue(value);
            })
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
                if (isRaceRef.current) {
                    return;
                }
                setIsLoading(false);
                abortControllerRef.current = null;
            });

        return prevOperationRef.current;
    }, [maxRetries, delayStep, abortPrevAndWait]);

    return {
        errorType,
        isLoading,
        load,
        abort,
        value,
    };
}
