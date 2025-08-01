import { useCallback, useRef, useState } from "react";

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
    isError: boolean;
    isLoading: boolean;
    products: Product[];
    fetchProducts: () => Promise<void>,
    abort: () => void;
} {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isError, setIsError] = useState<boolean>(false);

    const domain = networkError ? "dummyjsn.com" : "dummyjson.com";
    const entity = serverError ? "blabla" : "products";
    const delay = longAnswer ? 5000 : 0;
    const url = `https://${domain}/${entity}?limit=10&select=title&delay=${delay}`;
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchProducts = async () => {
        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        const signal = abortController.signal;

        setIsLoading(true);
        setIsError(false);
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                signal,
            });
            if (!response.ok) {
                setIsError(true);
                return;
            }
            const data = await response.json();
            if (data.products) {
                setProducts(data.products);
            } else {
                setIsError(true);
            }
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                return;
            }
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const abort = useCallback(() => {
        abortControllerRef.current?.abort();
    }, []);

    return {
        isError: isError,
        isLoading: isLoading,
        fetchProducts: fetchProducts,
        abort: abort,
        products,
    };
}
