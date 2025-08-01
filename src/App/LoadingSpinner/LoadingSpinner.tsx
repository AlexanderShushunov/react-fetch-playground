import type { FC } from "react";
import "./LoadingSpinner.css";

export const LoadingSpinner: FC = () => (
    <div className="spinner-container">
        <div className="spinner"></div>
        <span className="spinner-text">Loading...</span>
    </div>
);
