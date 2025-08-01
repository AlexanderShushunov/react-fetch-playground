import type { FC } from "react";

export const NumInput: FC<{
    value: number,
    onChange: (value: number) => void
    label: string,
    min?: number,
    max?: number
    step?: number
}
> = ({
    value,
    onChange,
    label,
    min = 0,
    max = Infinity,
    step = 1,
}) => {
    return (
        <label>
            {label}&nbsp;
            <input
                type="number"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
            />
        </label>
    );
};
