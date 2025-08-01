import { type ErrorType, useLoader } from "utils/useLoader";
import { useCallback } from "react";

export type Product = {
    id: number;
    title: string;
}

const pageSize = 10;

export function useProduct({
    maxRetries,
    delayStep,
}: {
    maxRetries?: number,
    delayStep?: number,
}): {
    errorType: ErrorType;
    isLoading: boolean;
    products: Product[];
    fetchProducts: (options?: {
        networkError?: boolean,
        serverError?: boolean;
        longAnswer?: boolean;
        page?: number;
    }) => Promise<void>,
    abort: () => void;
} {
    const {
        errorType,
        isLoading,
        value,
        load,
        abort,
    } = useLoader<{ products: Product[] }>({
        initialValue: { products: [] },
        maxRetries,
        delayStep,
    });

    const fetchProducts = useCallback(
        ({
            networkError = false,
            serverError = false,
            longAnswer = false,
            page = 0,
        }: {
            networkError?: boolean,
            serverError?: boolean;
            longAnswer?: boolean;
            page?: number;
        } = {}) => {
            const domain = networkError ? "dummyjsn.com" : "dummyjson.com";
            const entity = serverError ? "blabla" : "products";
            const delay = longAnswer ? 5000 : 0;
            const url = `https://${domain}/${entity}?limit=${pageSize}&skip=${page * pageSize}&select=title&delay=${delay}`;
            return load(url);
        }, [load]);

    return {
        errorType,
        isLoading,
        products: value.products,
        fetchProducts: fetchProducts,
        abort,
    };
}
