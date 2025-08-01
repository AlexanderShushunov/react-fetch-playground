import type { FC } from "react";
import type { Product } from "./useProduct.ts";

export const Products: FC<{
    products: Product[];
}> = ({ products }) => (
    <div>
        {products.length > 0 ? (
            <ul>
                {products.map((product) => (
                    <li key={product.id}>{product.title}</li>
                ))}
            </ul>
        ) : (
            <p>No products to display</p>
        )}
    </div>
);
