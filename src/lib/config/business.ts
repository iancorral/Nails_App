// Datos del negocio, centralizados para no repetir literales por el código.
// Se puede sobreescribir el nombre con NEXT_PUBLIC_BUSINESS_NAME sin tocar código.
export const BUSINESS_NAME =
  process.env.NEXT_PUBLIC_BUSINESS_NAME?.trim() || "Tangible Nails & Art Studio";
