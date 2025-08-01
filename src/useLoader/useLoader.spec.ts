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

    it.only("should initialize with correct initial state", () => {
        const { result } = renderHook(() => useLoader({
            url: url,
            initialValue: initialValue,
        }));

        expect(result.current.value).toEqual(initialValue);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.errorType).toBe("none");
    });

    it.only("should successfully load data", async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(responseData),
        } as Response);

        const { result } = renderHook(() => useLoader({
            url: url,
            initialValue: initialValue,
        }));

        await act(async () => {
            await result.current.load();
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

    it.only("should handle network errors", async () => {
        mockedFetch.mockRejectedValueOnce(new Error("Network error"));

        const { result } = renderHook(() => useLoader({
            url: url,
            initialValue: initialValue,
        }));

        await act(async () => {
            await result.current.load();
        });

        expect(result.current.errorType).toBe("network");
        expect(result.current.isLoading).toBe(false);
        expect(result.current.value).toEqual(initialValue);
    });

    it.only("should handle server errors", async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
        } as Response);

        const { result } = renderHook(() => useLoader({
            url: url,
            initialValue: initialValue,
        }));

        await act(async () => {
            await result.current.load();
        });

        expect(result.current.errorType).toBe("server");
        expect(result.current.isLoading).toBe(false);
        expect(result.current.value).toEqual(initialValue);
    });

    it.only("should handle unknown errors", async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.reject("ups"),
        } as Response);

        const { result } = renderHook(() => useLoader({
            url: url,
            initialValue: initialValue,
        }));

        await act(async () => {
            await result.current.load();
        });

        expect(result.current.errorType).toBe("unknown");
        expect(result.current.isLoading).toBe(false);
        expect(result.current.value).toEqual(initialValue);
    });

    it.only("should set loading state correctly during load operation", async () => {
        let resolvePromise: (val: unknown) => void;
        const slowPromise = new Promise<unknown>(resolve => {
            resolvePromise = resolve;
        });

        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: () => slowPromise,
        } as Response);

        const { result } = renderHook(() => useLoader({
            url: url,
            initialValue: initialValue,
        }));

        let res: Promise<unknown>;
        act(() => {
            res = result.current.load();
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

    it.only("should reset error type when starting new load", async () => {
        mockedFetch.mockRejectedValueOnce(new Error("Network error"));

        const { result } = renderHook(() => useLoader({
            url: url,
            initialValue: initialValue,
        }));

        await act(async () => {
            await result.current.load();
        });

        expect(result.current.errorType).toBe("network");

        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(responseData),
        } as Response);

        await act(async () => {
            await result.current.load();
        });

        expect(result.current.errorType).toBe("none");
        expect(result.current.value).toEqual(responseData);
    });

    describe("abort", () => {
        it.only("should abort fetching when it is aborted", async () => {
            mockedFetch.mockRejectedValue(new DOMException("Operation aborted", "AbortError"));

            const { result } = renderHook(() => useLoader({
                url: url,
                initialValue: initialValue,
            }));

            await act(async () => {
                await result.current.load();
            });

            expect(result.current.errorType).toBe("none");
            expect(result.current.isLoading).toBe(false);
            expect(result.current.value).toEqual(initialValue);
        });

        it.only("should pass abort signal to fetch and withRetry", async () => {
            mockedFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(responseData),
            } as Response);

            const { result } = renderHook(() => useLoader({
                url: url,
                initialValue: initialValue,
            }));

            let res: Promise<unknown>;
            act(() => {
                res = result.current.load();
            });

            expect(mockedFetch.mock.calls[0][1]?.signal?.aborted).toBe(false);
            expect(withRetryMock.mock.calls[0][1]?.signal?.aborted).toBe(false);

            act(() => {
                result.current.abort();
            });

            expect(mockedFetch.mock.calls[0][1]?.signal?.aborted).toBe(true);
            expect(withRetryMock.mock.calls[0][1]?.signal?.aborted).toBe(true);

            await act(async () => {
                await res;
            });
        });

    });
});

