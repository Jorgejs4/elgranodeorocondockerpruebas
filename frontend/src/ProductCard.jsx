const ProductCard = ({ product, isRecommended }) => {
  return (
    <div className={`relative group p-4 rounded-xl bg-[#1A1A1A] border ${isRecommended ? 'border-[#D4AF37]' : 'border-white/5'} transition-all duration-500 hover:scale-105`}>
      
      {isRecommended && (
        <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">
          Especial para ti
        </span>
      )}

      <div className="overflow-hidden rounded-lg bg-black/40 mb-4">
        <img 
          src={product.image_url || 'https://via.placeholder.com/300'} 
          alt={product.name}
          className="w-full h-48 object-cover mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-700"
        />
      </div>

      <h3 className="text-lg font-serif tracking-wide mb-1">{product.name}</h3>
      <p className="text-[#D4AF37] font-bold mb-4">{product.price}€</p>

      <button 
        onClick={() => trackInteraction(product.id, 'cart')}
        className="w-full py-2 bg-transparent border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-colors duration-300 uppercase text-xs tracking-widest font-semibold"
      >
        Añadir a la selección
      </button>
    </div>
  );
};