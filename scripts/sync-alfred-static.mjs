import { readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const sourceRoot = process.argv[2];
if (!sourceRoot) throw new Error("Uso: node scripts/sync-alfred-static.mjs RUTA_FUENTE_ALFRED");

const readJson = async (relativePath) => JSON.parse(await readFile(join(sourceRoot, relativePath), "utf8"));
const [baseCatalog, supplementalCatalog] = await Promise.all([
  readJson("Descripcion de producyo/catalogo.json"),
  readJson("data/ak-models-catalog.json"),
]);

const merged = new Map();
for (const product of [...baseCatalog.products, ...supplementalCatalog.products]) {
  const existing = merged.get(product.id);
  if (!existing) {
    merged.set(product.id, structuredClone(product));
    continue;
  }
  const references = new Set(existing.variants.map((variant) => String(variant.reference || "").toUpperCase()));
  existing.variants.push(...product.variants.filter((variant) => !references.has(String(variant.reference || "").toUpperCase())));
}

const products = [...merged.values()].map((product) => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  collection: product.collection,
  category_label: product.category_label,
  gender: product.gender,
  size: product.size,
  description_es: product.description_es,
  variants: product.variants.map((variant) => ({
    color: variant.color,
    sap_reference: variant.sap_reference,
    reference: variant.reference,
    dimensions: variant.dimensions,
    materials: variant.materials,
    images: variant.images.map((image) => ({ local_path: image.local_path, view: image.view })),
  })),
}));

const output = {
  generated_at: new Date().toISOString(),
  summary: {
    products: products.length,
    variants: products.reduce((sum, product) => sum + product.variants.length, 0),
    images: products.reduce((sum, product) => sum + product.variants.reduce((subtotal, variant) => subtotal + variant.images.length, 0), 0),
  },
  products,
};

const destination = resolve("alfred-kerbs/catalog-data.json");
await writeFile(destination, `${JSON.stringify(output)}\n`, "utf8");
console.log(`${output.summary.products} modelos, ${output.summary.images} imágenes → ${destination}`);
