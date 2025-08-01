import type { FC } from "react";

export const Checkbox: FC<{
    label: string;
    value: boolean;
    onChange: (checked: boolean) => void;
}> = ({ label, value, onChange }) => {
    return (
        <label>
            <input
                type="checkbox"
                checked={value}
                onChange={e => onChange(e.target.checked)}
            />
            {label}
        </label>
    );
};
