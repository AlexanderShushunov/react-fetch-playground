import type { FC } from "react";
import type { Product } from "./useProduct.ts";

export const Products: FC<{
    products: Product[];
}> = ({ products }) => (
    <div>
        {products.map((product) => (
            <Product key={product.id} value={product} />
        ))}
    </div>
);

const Product: FC<{ value: Product; }> = ({ value }) => (
    <ul>
        <li>{value.title}</li>
    </ul>
);
