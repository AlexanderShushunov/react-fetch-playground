import { type ErrorType, useLoader } from "../useLoader";

export type Product = {
    id: number;
    title: string;
}

export function useProduct({
    longAnswer,
    networkError,
    serverError,
}: {
    networkError: boolean,
    serverError: boolean;
    longAnswer: boolean;
}): {
    errorType: ErrorType;
    isLoading: boolean;
    products: Product[];
    fetchProducts: () => Promise<void>,
    abort: () => void;
} {
    const domain = networkError ? "dummyjsn.com" : "dummyjson.com";
    const entity = serverError ? "blabla" : "products";
    const delay = longAnswer ? 5000 : 0;
    const url = `https://${domain}/${entity}?limit=10&select=title&delay=${delay}`;

    const {
        errorType,
        isLoading,
        value,
        load,
        abort,
    } = useLoader<{products: Product[]}>({url, initialValue: {products: []}})

    return {
        errorType,
        isLoading,
        products: value.products,
        fetchProducts: load,
        abort,
    };
}
