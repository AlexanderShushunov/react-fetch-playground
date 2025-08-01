import { renderHook, act } from "@testing-library/react";
import { useLoader } from "./useLoader";
import { withRetry } from "../withRetry";

jest.mock("../withRetry", () => ({
    withRetry: jest.fn((fn) => {
        return () => fn();
    }),
}));

const withRetryMock = jest.mocked(withRetry);

beforeEach(() => {
    withRetryMock.mockClear();
});

describe("useLoader", () => {
    const url = "https://api.example.com/data";
    const initialValue = { initial: true };
    const responseData = { success: true, data: "test data" };

    const originalFetch = global.fetch;
    let mockedFetch: jest.MockedFunction<typeof global.fetch>;

    beforeEach(() => {
        global.fetch = jest.fn();
        mockedFetch = jest.mocked(global.fetch);
        jest.clearAllMocks();
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    it("should initialize with correct initial state", () => {
        const { result } = renderHook(() => useLoader({
            initialValue: initialValue,
        }));

        expect(result.current.value).toEqual(initialValue);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.errorType).toBe("none");
    });

    it("should successfully load data", async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(responseData),
        } as Response);

        const { result } = renderHook(() => useLoader({
            initialValue: initialValue,
        }));

        await act(async () => {
            await result.current.load(url);
        });

        expect(mockedFetch).toHaveBeenCalledWith(
            url,
            expect.objectContaining({
                method: "GET",
                headers: { "Content-Type": "application/json" },
                signal: expect.any(AbortSignal),
            }),
        );

        expect(result.current.value).toEqual(responseData);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.errorType).toBe("none");
    });

    it("should handle network errors", async () => {
        mockedFetch.mockRejectedValueOnce(new Error("Network error"));

        const { result } = renderHook(() => useLoader({
            initialValue: initialValue,
        }));

        await act(async () => {
            await result.current.load(url);
        });

        expect(result.current.errorType).toBe("network");
        expect(result.current.isLoading).toBe(false);
        expect(result.current.value).toEqual(initialValue);
    });

    it("should handle server errors", async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
        } as Response);

        const { result } = renderHook(() => useLoader({
            initialValue: initialValue,
        }));

        await act(async () => {
            await result.current.load(url);
        });

        expect(result.current.errorType).toBe("server");
        expect(result.current.isLoading).toBe(false);
        expect(result.current.value).toEqual(initialValue);
    });

    it("should handle unknown errors", async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.reject("ups"),
        } as Response);

        const { result } = renderHook(() => useLoader({
            initialValue: initialValue,
        }));

        await act(async () => {
            await result.current.load(url);
        });

        expect(result.current.errorType).toBe("unknown");
        expect(result.current.isLoading).toBe(false);
        expect(result.current.value).toEqual(initialValue);
    });

    it("should set loading state correctly during load operation", async () => {
        let resolvePromise: (val: unknown) => void;
        const slowPromise = new Promise<unknown>(resolve => {
            resolvePromise = resolve;
        });

        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: () => slowPromise,
        } as Response);

        const { result } = renderHook(() => useLoader({
            initialValue: initialValue,
        }));

        let res: Promise<unknown>;
        await act(async () => {
            res = result.current.load(url);
            await Promise.resolve();
        });

        expect(result.current.isLoading).toBe(true);
        expect(result.current.errorType).toBe("none");

        await act(async () => {
            resolvePromise(responseData);
            await res;
        });

        expect(result.current.value).toEqual(responseData);
        expect(result.current.isLoading).toBe(false);
    });

    it("should reset error type when starting new load", async () => {
        mockedFetch.mockRejectedValueOnce(new Error("Network error"));

        const { result } = renderHook(() => useLoader({
            initialValue: initialValue,
        }));

        await act(async () => {
            await result.current.load(url);
        });

        expect(result.current.errorType).toBe("network");

        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(responseData),
        } as Response);

        await act(async () => {
            await result.current.load(url);
        });

        expect(result.current.errorType).toBe("none");
        expect(result.current.value).toEqual(responseData);
    });

    it("should pass parms to withRetry", async () => {
        const { result } = renderHook(() => useLoader({
            initialValue: initialValue,
            delayStep: 7,
            maxRetries: 900,
        }));

        await act(async () => {
            await result.current.load(url);
        });

        expect(withRetryMock).toHaveBeenCalledTimes(1);
        expect(withRetryMock).toHaveBeenCalledWith(
            expect.any(Function),
            expect.objectContaining({
                delayStep: 7,
                maxRetries: 900,
            }));
    });

    describe("abort", () => {
        it("should abort fetching when it is aborted", async () => {
            mockedFetch.mockRejectedValue(new DOMException("Operation aborted", "AbortError"));

            const { result } = renderHook(() => useLoader({
                initialValue: initialValue,
            }));

            await act(async () => {
                await result.current.load(url);
            });

            expect(result.current.errorType).toBe("none");
            expect(result.current.isLoading).toBe(false);
            expect(result.current.value).toEqual(initialValue);
        });

        it("should pass abort signal to fetch and withRetry", async () => {
            let rejectPromise: (val: unknown) => void;
            const slowPromise = new Promise<unknown>((_, reject) => {
                rejectPromise = reject;
            });

            mockedFetch.mockResolvedValueOnce({
                ok: true,
                json: () => slowPromise,
            } as Response);

            const { result } = renderHook(() => useLoader({
                initialValue: initialValue,
            }));

            let res: Promise<unknown>;
            await act(async () => {
                res = result.current.load(url);
                await Promise.resolve();
            });

            expect(mockedFetch.mock.calls[0][1]?.signal?.aborted).toBe(false);
            expect(withRetryMock.mock.calls[0][1]?.signal?.aborted).toBe(false);

            act(() => {
                result.current.abort();
            });

            expect(mockedFetch.mock.calls[0][1]?.signal?.aborted).toBe(true);
            expect(withRetryMock.mock.calls[0][1]?.signal?.aborted).toBe(true);

            await act(async () => {
                rejectPromise(new DOMException("Operation aborted", "AbortError"));
                await res;
            });
        });
    });

    describe("race", () => {
        let secondResolve: (val: unknown) => void;
        beforeEach(() => {
            const secondSlowPromise = new Promise<unknown>(resolve => {
                secondResolve = resolve;
            });

            mockedFetch
                .mockImplementationOnce((_, init) => {
                    return new Promise<Response>((_, reject) => {
                        init?.signal?.addEventListener(
                            "abort",
                            () => reject(new DOMException("Operation aborted", "AbortError")),
                            { once: true },
                        );
                    });
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => secondSlowPromise,
                } as Response);
        });

        it(`if a second request is made before the first one finishes,
                 we need to abort the first request,
                 preserve the error and isLoading state,
                 and return the result of the second request.`, async () => {
            const { result } = renderHook(() => useLoader({
                initialValue: initialValue,
            }));

            let firstRes: Promise<unknown>;
            await act(async () => {
                firstRes = result.current.load(url);
                await Promise.resolve();
            });

            expect(result.current.errorType).toBe("none");
            expect(result.current.isLoading).toBe(true);

            let secondRes: Promise<unknown>;
            await act(async () => {
                secondRes = result.current.load(url);
                await Promise.resolve();
            });

            expect(result.current.errorType).toBe("none");
            expect(result.current.isLoading).toBe(true);

            await act(async () => {
                await firstRes;
            })

            expect(result.current.errorType).toBe("none");
            expect(result.current.isLoading).toBe(true);

            await act(async () => {
                secondResolve(responseData);
                await secondRes;
            })

            expect(result.current.errorType).toBe("none");
            expect(result.current.isLoading).toBe(false);
            expect(result.current.value).toBe(responseData);
        });
    });
});

