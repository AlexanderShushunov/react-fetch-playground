import { wait } from "./wait.ts";

jest.useFakeTimers();

afterEach(async () => {
    await jest.runAllTimersAsync();
})

describe("wait", () => {
    it("should resolve after specified time", async () => {
        let resolved = false;

        wait(1000).then(() => {
            resolved = true;
        });

        expect(resolved).toBe(false);

        await jest.advanceTimersByTimeAsync(999);

        expect(resolved).toBe(false);

        await jest.advanceTimersByTimeAsync(1);

        expect(resolved).toBe(true);
    });

    it("should throw AbortError if signal is already triggered", async () => {
        const controller = new AbortController();
        const { signal } = controller;
        controller.abort();
        const res = wait(1000, { signal });

        await expect(res).rejects.toThrow("Operation aborted");
        await expect(res).rejects.toHaveProperty("name", "AbortError");
    });

    it("should throw AbortError if aborted during wait", async () => {
        const controller = new AbortController();
        const { signal } = controller;
        const res = wait(2000, { signal });

        jest.advanceTimersByTime(500);
        controller.abort();

        await expect(res).rejects.toThrow("Operation aborted");
        await expect(res).rejects.toHaveProperty("name", "AbortError");
    });

    it("should work without an AbortSignal", async () => {
        const promise = wait(500);

        jest.advanceTimersByTime(500);

        await expect(promise).resolves.toBeUndefined();
    });
});
