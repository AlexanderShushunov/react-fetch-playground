import "./App.css";
import { useEffect, useState } from "react";
import { useProduct } from "./useProduct.ts";
import { Checkbox } from "./Checkbox.tsx";
import { Products } from "./Products.tsx";

function App() {
    const [longAnswer, setLongAnswer] = useState<boolean>(false);
    const [networkError, setNetworkError] = useState<boolean>(false);
    const [serverError, setServerError] = useState<boolean>(false);

    const {
        isError,
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
                <button onClick={fetchProducts}>Fetch</button>
                <button onClick={abort} disabled={!isLoading}>Abort</button>
            </div>
            {isError && <span className="error">Error</span>}
            {isLoading && <span className="loading">...loading</span>}
            <Products products={products} />
        </>
    );
}

export default App;
