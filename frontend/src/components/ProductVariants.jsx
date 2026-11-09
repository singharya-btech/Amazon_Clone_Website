import React from "react";

const ProductVariants = ({ variants = [], selectedVariant, onSelectVariant }) => {
  if (!variants || variants.length === 0) return null;

  return (
    <div className="my-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
      <h4 className="text-sm font-semibold text-gray-800 mb-2">Available Options & Variants:</h4>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const isSelected = selectedVariant && selectedVariant.id === v.id;
          const isOutOfStock = v.stock <= 0;

          return (
            <button
              key={v.id}
              onClick={() => !isOutOfStock && onSelectVariant(v)}
              disabled={isOutOfStock}
              className={`px-3 py-1.5 text-xs rounded border transition-all flex flex-col items-start ${
                isOutOfStock
                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed line-through"
                  : isSelected
                  ? "bg-amber-50 border-[#f08804] text-[#131921] font-medium shadow-xs ring-1 ring-[#f08804]"
                  : "bg-white border-gray-300 text-gray-700 hover:border-gray-500"
              }`}
            >
              <span>{v.name}</span>
              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-500">
                {v.price_override && <span>${Number(v.price_override).toFixed(2)}</span>}
                <span className="font-mono text-[10px] text-gray-400">{v.sku}</span>
              </div>
            </button>
          );
        })}
      </div>
      {selectedVariant && (
        <div className="mt-2 text-xs text-gray-600 flex items-center gap-2">
          <span className="font-semibold text-gray-700">Selected SKU:</span>
          <span className="font-mono text-gray-800 bg-white px-1.5 py-0.5 border border-gray-200 rounded">
            {selectedVariant.sku}
          </span>
          <span className={`text-[11px] font-medium ${selectedVariant.stock <= 5 ? "text-amber-700" : "text-emerald-700"}`}>
            ({selectedVariant.stock} available)
          </span>
        </div>
      )}
    </div>
  );
};

export default ProductVariants;
