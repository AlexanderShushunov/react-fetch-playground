import "./App.css";
import { useEffect, useState } from "react";
import { useProduct } from "./useProduct.ts";
import { Checkbox } from "./Checkbox.tsx";
import { Products } from "./Products.tsx";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMsg } from "./ErrorMsg";
import { NumInput } from "./NumInput.tsx";
import { wait } from "utils/wait";

export function App() {
    const [longAnswer, setLongAnswer] = useState(false);
    const [networkError, setNetworkError] = useState(false);
    const [serverError, setServerError] = useState(false);
    const [page, setPage] = useState(0);
    const [maxRetries, setMaxRetries] = useState(5);
    const [delayStep, setDelayStep] = useState(200);

    const {
        errorType,
        isLoading,
        products,
        fetchProducts,
        abort,
    } = useProduct({
        maxRetries,
        delayStep,
    });

    useEffect(() => {
        return () => {
            abort();
        };
    }, [abort])

    const race = async () => {
        // first page (not 0) should be shown.
        // but the 0-page request resolves after the 1-page request.
        fetchProducts({
            page: 0,
            longAnswer: true,
        })
        await wait(1000)
        fetchProducts({
            page: 1,
            longAnswer: false,
        });
    }

    const fetch = async () => {
        await fetchProducts({
            networkError,
            serverError,
            longAnswer,
            page,
        });
    };

    return (
        <>
            <h1>React Data Fetch Example</h1>
            <div className="controls">
                <Checkbox label="Long answer (5 sec)" value={longAnswer} onChange={setLongAnswer} />
                <Checkbox label="Network error" value={networkError} onChange={setNetworkError} />
                <Checkbox label="Server error" value={serverError} onChange={setServerError} />
                <NumInput value={page} onChange={setPage} label="Page" />
                <NumInput value={maxRetries} onChange={setMaxRetries} label="Max retries" min={2} />
                <NumInput value={delayStep} onChange={setDelayStep} label="Delay Step" min={100} step={100} />
                <div className="button-group">
                    <button onClick={fetch}>Fetch</button>
                    <button onClick={race}>Race</button>
                    <button onClick={abort} disabled={!isLoading}>Abort</button>
                </div>
            </div>
            <ErrorMsg errorType={errorType} />
            {isLoading && <LoadingSpinner />}
            <Products products={products} />
        </>
    );
}
