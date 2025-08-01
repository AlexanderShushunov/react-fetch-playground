import "./App.css";
import { useEffect, useState } from "react";
import { useProduct } from "./useProduct.ts";
import { Checkbox } from "./Checkbox.tsx";
import { Products } from "./Products.tsx";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMsg } from "./ErrorMsg";

export function App() {
    const [longAnswer, setLongAnswer] = useState<boolean>(false);
    const [networkError, setNetworkError] = useState<boolean>(false);
    const [serverError, setServerError] = useState<boolean>(false);

    const {
        errorType,
        isLoading,
        products,
        fetchProducts,
        abort,
    } = useProduct({
        longAnswer: longAnswer,
        networkError: networkError,
        serverError: serverError,
    });

    useEffect(() => {
        return () => {
            abort();
        };
    }, [abort])

    return (
        <>
            <h1>React Data Fetch Example</h1>
            <div className="controls">
                <Checkbox label="Long answer (5 sec)" value={longAnswer} onChange={setLongAnswer} />
                <Checkbox label="Network error" value={networkError} onChange={setNetworkError} />
                <Checkbox label="Server error" value={serverError} onChange={setServerError} />
                <div className="button-group">
                    <button onClick={fetchProducts} disabled={isLoading}>Fetch</button>
                    <button onClick={abort} disabled={!isLoading}>Abort</button>
                </div>
            </div>
            <ErrorMsg errorType={errorType} />
            {isLoading && <LoadingSpinner />}
            <Products products={products} />
        </>
    );
}
