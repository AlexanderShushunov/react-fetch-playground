import type { FC } from "react";
import type { ErrorType } from "../useProduct.ts";
import "./ErrorMsg.css";

const errorMessages: Record<ErrorType, string> = {
    network: "Network Error: Unable to connect to the server",
    server: "Server Error: The server responded with an error",
    unknown: "Unknown Error: Something unexpected happened",
    none: "",
};
export const ErrorMsg: FC<{ errorType: ErrorType }> = ({ errorType }) => {
    if (errorType === "none") {
        return null;
    }

    return <span className="error">
        {errorMessages[errorType]}
    </span>;
};
