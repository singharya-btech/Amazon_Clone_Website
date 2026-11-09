import React, { useState } from "react";

const ProductImageGallery = ({ mainImage, galleryImages = [], title = "Product" }) => {
  // Combine main image with additional gallery images
  const allImages = [
    ...(mainImage ? [{ image_url: mainImage, alt_text: title, id: 'main' }] : []),
    ...galleryImages
  ];

  const [activeImage, setActiveImage] = useState(
    allImages.length > 0 ? allImages[0].image_url : mainImage
  );

  if (allImages.length === 0 && !mainImage) {
    return (
      <div className="w-full h-80 bg-gray-100 flex items-center justify-center rounded text-gray-400">
        No image available
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4 items-start">
      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto max-h-96 py-1">
          {allImages.map((img, index) => (
            <button
              key={img.id || index}
              onClick={() => setActiveImage(img.image_url)}
              className={`w-16 h-16 border-2 rounded overflow-hidden p-1 flex-shrink-0 transition-all ${
                activeImage === img.image_url
                  ? "border-[#f08804] shadow-sm"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <img
                src={img.image_url}
                alt={img.alt_text || `Thumbnail ${index + 1}`}
                className="w-full h-full object-contain"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Image Display with hover zoom effect */}
      <div className="flex-1 w-full bg-white border border-gray-100 rounded-lg p-4 flex items-center justify-center min-h-[350px] relative overflow-hidden group">
        <img
          src={activeImage}
          alt={title}
          className="max-h-[380px] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>
    </div>
  );
};

export default ProductImageGallery;
