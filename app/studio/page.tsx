import { getProducts, getCategoriesAsync, getBrandsAsync } from "@/lib/products"
import StudioClient from "./StudioClient"

export default async function StudioPage() {
  const [products, categories, brands] = await Promise.all([
    getProducts(),
    getCategoriesAsync(),
    getBrandsAsync(),
  ])

  return <StudioClient products={products} categories={categories} brands={brands} />
}
