export const SIZES = ["M", "L", "XL", "XXL"] as const;
export type Size = (typeof SIZES)[number];

export function variantKey(productId: number, size: string) {
  return `${productId}:${size}`;
}
