import { withRetry } from "./withRetry";

jest.useFakeTimers();

describe("withRetry", () => {
    it("should execute action successfully on first attempt", async () => {
        const mockAction = jest.fn().mockResolvedValue("success");
        const retryableAction = withRetry(mockAction, { maxRetries: 3 });

        const result = retryableAction();

        await expect(result).resolves.toBe("success");
        expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure and succeed eventually", async () => {
        const mockAction = jest.fn()
            .mockRejectedValueOnce(new Error("Attempt 1 failed"))
            .mockRejectedValueOnce(new Error("Attempt 2 failed"))
            .mockResolvedValueOnce("success");

        const retryableAction = withRetry(mockAction, { maxRetries: 3, delayStep: 100 });

        const resultPromise = retryableAction();
        expect(mockAction).toHaveBeenCalledTimes(1);

        await jest.advanceTimersByTimeAsync(100);
        expect(mockAction).toHaveBeenCalledTimes(2);

        await jest.advanceTimersByTimeAsync(200);
        expect(mockAction).toHaveBeenCalledTimes(3);

        await expect(resultPromise).resolves.toBe("success");
    });

    it("should throw after reaching maxRetries", async () => {
        const testError = new Error("Test error");
        const mockAction = jest.fn().mockRejectedValue(testError);

        const retryableAction = withRetry(mockAction, { maxRetries: 3, delayStep: 50 });

        const result = retryableAction().catch(
            (error) => {
                expect(error).toBe(testError);
            },
        );

        expect(mockAction).toHaveBeenCalledTimes(1);

        await jest.advanceTimersByTimeAsync(50);
        expect(mockAction).toHaveBeenCalledTimes(2);

        await jest.advanceTimersByTimeAsync(100);
        expect(mockAction).toHaveBeenCalledTimes(3);

        await result;
    });

    it("should abort immediately if signal is already aborted", async () => {
        const mockAction = jest.fn().mockResolvedValue("success");
        const controller = new AbortController();
        controller.abort();

        const retryableAction = withRetry(mockAction, {
            signal: controller.signal,
            maxRetries: 3,
        });

        const resultPromise = retryableAction();

        await expect(resultPromise).rejects.toThrow("Operation aborted");
        await expect(resultPromise).rejects.toHaveProperty("name", "AbortError");
        expect(mockAction).toHaveBeenCalledTimes(0);
    });

    it("should abort during retry delay", async () => {
        const mockAction = jest.fn().mockRejectedValue(new Error("Test error"));
        const controller = new AbortController();

        const retryableAction = withRetry(mockAction, {
            signal: controller.signal,
            maxRetries: 3,
            delayStep: 200,
        });

        const resultPromise = retryableAction();

        expect(mockAction).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(100);
        controller.abort();

        await expect(resultPromise).rejects.toThrow("Operation aborted");
        await expect(resultPromise).rejects.toHaveProperty("name", "AbortError");

        // Second attempt should not happen
        await jest.advanceTimersByTimeAsync(300);
        expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it("should pass through AbortError from action", async () => {
        const abortError = new DOMException("Action aborted", "AbortError");
        const mockAction = jest.fn().mockRejectedValue(abortError);

        const retryableAction = withRetry(mockAction, { maxRetries: 3 });

        await expect(retryableAction()).rejects.toThrow("Action aborted");
        expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it("should respect custom retry count", async () => {
        const error = new Error("Test error");
        const mockAction = jest.fn().mockRejectedValue(error);

        const retryableAction = withRetry(mockAction, { maxRetries: 7, delayStep: 50 });

        const resultPromise = retryableAction().catch(
            (error) => {
                expect(error).toEqual(error);
            },
        );

        await jest.advanceTimersByTimeAsync(100500);

        expect(mockAction).toHaveBeenCalledTimes(7);
        await resultPromise;
    });

    it("should use growing delay between retries", async () => {
        const mockAction = jest.fn()
            .mockRejectedValueOnce(new Error("Attempt 1 failed"))
            .mockRejectedValueOnce(new Error("Attempt 2 failed"))
            .mockResolvedValueOnce("success");

        const delayStep = 100;
        const retryableAction = withRetry(mockAction, {
            maxRetries: 3,
            delayStep,
        });

        const resultPromise = retryableAction();

        expect(mockAction).toHaveBeenCalledTimes(1);

        await jest.advanceTimersByTimeAsync(delayStep);
        expect(mockAction).toHaveBeenCalledTimes(2);

        await jest.advanceTimersByTimeAsync(delayStep * 2);
        expect(mockAction).toHaveBeenCalledTimes(3);

        await expect(resultPromise).resolves.toBe("success");
    });
});

