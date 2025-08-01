import { useCallback, useRef, useState } from "react";

export type Product = {
    id: number;
    title: string;
}

export type ErrorType = "none" | "network" | "server" | "unknown";

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
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorType, setErrorType] = useState<ErrorType>("none");

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
        setErrorType("none");
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                signal,
            });
            if (!response.ok) {
                setErrorType("server");
                return;
            }
            const data = await response.json();
            if (data.products) {
                setProducts(data.products);
            } else {
                setErrorType("server");
            }
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                return;
            }
            setErrorType(error instanceof TypeError ? "network" : "unknown");
        } finally {
            setIsLoading(false);
        }
    };

    const abort = useCallback(() => {
        abortControllerRef.current?.abort();
    }, []);

    return {
        errorType,
        isLoading,
        fetchProducts,
        abort,
        products,
    };
}
