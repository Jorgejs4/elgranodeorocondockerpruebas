import { useState, useEffect, useMemo } from 'react';

// --- CONFIGURACIÓN DE URL ---
// Esto detectará automáticamente si estás en local o en Render
const API_BASE_URL = 'https://grano-oro-api.onrender.com';

// --- COMPONENTE DE GRÁFICO PERSONALIZADO (SVG) ---
const SalesChart = ({ orders }) => {
  // 1. El Hook siempre debe ir antes de cualquier 'return' o 'if'
  const data = useMemo(() => {
    if (!Array.isArray(orders)) return []; // Si no hay pedidos, devolvemos array vacío
    
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayStr = d.toLocaleDateString('es-ES', { weekday: 'short' });
      
      const total = orders
        .filter(o => o.date && new Date(o.date).toDateString() === d.toDateString())
        .reduce((acc, curr) => acc + (curr.total || 0), 0);
      
      days.push({ day: dayStr, val: total });
    }
    return days;
  }, [orders]);

  // 2. AHORA SÍ hacemos el return de seguridad
  if (!Array.isArray(orders) || orders.length === 0) return null;

  const maxVal = Math.max(...data.map(d => d.val), 100);
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.val / maxVal) * 80;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full h-64 bg-zinc-900 rounded-2xl border border-zinc-800 p-6 relative overflow-hidden">
      <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Rendimiento Semanal</h3>
      <div className="absolute inset-0 top-12 px-6 pb-6">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`M0,100 ${points} 100,100`} fill="url(#gradient)" />
          <polyline points={points} fill="none" stroke="#f59e0b" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
        </svg>
        <div className="flex justify-between mt-2 text-xs text-zinc-500 font-mono">
           {data.map((d, i) => <span key={i}>{d.day}</span>)}
        </div>
      </div>
    </div>
  );
};

function App() {
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]); 
  const [orders, setOrders] = useState([]); // Eliminado el localStorage de orders para evitar conflictos
  const [view, setView] = useState("catalog"); 
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAuth, setShowAuth] = useState(false); 
  const [isCartOpen, setIsCartOpen] = useState(false); 
  const [isWishlistOpen, setIsWishlistOpen] = useState(false); 
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const [shipping, setShipping] = useState({ address: '', city: '', country: '', zip: '' });
  const [payment, setPayment] = useState({ card: '', expiry: '', cvv: '', holder: '' });
  const [savedCards] = useState([{ id: 1, last4: '4242', brand: 'Visa' }]);
  const [useNewCard, setUseNewCard] = useState(false);

  // --- CARGA DE DATOS ACTUALIZADA ---
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/products/?skip=0&limit=100`);
        const data = await res.json();
        
        let urlRec = `${API_BASE_URL}/recommendations/`;
        if (user?.id) urlRec += `?user_id=${user.id}`;
        const resRec = await fetch(urlRec);
        const recData = resRec.ok ? await resRec.json() : [];

        if (isMounted) {
            setProducts(Array.isArray(data) ? data : []);
            setRecommendations(Array.isArray(recData) ? recData : []);
        }
      } catch (err) { console.error("Error cargando productos:", err); }
    };
    loadData();
    return () => { isMounted = false; };
  }, [user]);

  useEffect(() => {
    if (user && user.role === 'admin' && view === 'admin') {
        fetch(`${API_BASE_URL}/check-low-stock`)
          .then(res => res.json())
          .then(d => { if(d.count > 0) console.log("Alerta Stock") })
          .catch(err => console.error(err));
    }
  }, [view, user]);

  useEffect(() => {
    if (user && user.role === 'admin' && view === 'admin') {
      const fetchOrders = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/admin/orders`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
          });
          const data = await res.json();
          // Validamos que 'data' sea un Array antes de guardarlo
          setOrders(Array.isArray(data) ? data : []);
        } catch (err) { 
          console.error("Error cargando pedidos:", err);
          setOrders([]); // Si hay error, ponemos lista vacía para que no se ponga negra la pantalla
        }
      };
      fetchOrders();
    }
  }, [user, view]);

  const handleProductClick = (product) => { setSelectedProduct(product); setView("product-detail"); window.scrollTo(0, 0); };
  const addToCart = (product) => {
    const exist = cart.find(x => x.id === product.id);
    if (exist) setCart(cart.map(x => x.id === product.id ? { ...exist, qty: exist.qty + 1 } : x));
    else setCart([...cart, { ...product, qty: 1 }]);
  };
  const removeFromCart = (product) => {
    const exist = cart.find(x => x.id === product.id);
    if (!exist) return;
    if (exist.qty === 1) setCart(cart.filter(x => x.id !== product.id));
    else setCart(cart.map(x => x.id === product.id ? { ...exist, qty: exist.qty - 1 } : x));
  };
  const toggleWishlist = (product) => {
      if (wishlist.find(x => x.id === product.id)) setWishlist(wishlist.filter(x => x.id !== product.id));
      else setWishlist([...wishlist, product]);
  };
  const moveToCartFromWishlist = (product) => { addToCart(product); setWishlist(wishlist.filter(x => x.id !== product.id)); };
  const buyNow = (product) => { 
    setCart([{ ...product, qty: 1 }]); 
    if (!user) { setShowAuth(true); } 
    else { setView("checkout"); setIsCartOpen(false); }
  };
  const handleGoToCheckout = () => {
      if (!user) { setIsCartOpen(false); setShowAuth(true); alert("🔒 Inicia sesión para continuar."); }
      else { setView("checkout"); setIsCartOpen(false); }
  };
  const handleDeleteProduct = async (id) => {
      if(window.confirm("¿Eliminar permanentemente?")) {
          try {
            const res = await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' });
            if (res.ok) setProducts(prev => prev.filter(p => p.id !== id));
          } catch (error) { console.error(error); }
      }
  };
  const handleCreateProduct = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const newProd = Object.fromEntries(formData.entries());
      newProd.price = parseFloat(newProd.price);
      newProd.stock = parseInt(newProd.stock); 
      try {
        const res = await fetch(`${API_BASE_URL}/products/`, { 
          method: 'POST', 
          headers: {'Content-Type': 'application/json'}, 
          body: JSON.stringify(newProd) 
        });
        if(res.ok) {
            const saved = await res.json();
            setProducts(prev => [...prev, saved]);
            e.target.reset();
            alert("Producto creado");
        }
      } catch (err) { console.error(err); }
  };

  const handleZipChange = (e) => {
      const val = e.target.value.replace(/\D/g, '').slice(0, 5);
      setShipping({...shipping, zip: val});
  };

  const handleExpiryChange = (e) => {
      let val = e.target.value.replace(/\D/g, '').slice(0, 4);
      if (val.length >= 2) {
          val = val.slice(0, 2) + '/' + val.slice(2);
      }
      setPayment({...payment, expiry: val});
  };

  const processPayment = async (e) => {
    e.preventDefault();
    if(cart.length === 0) return;

    try {
        const response = await fetch(`${API_BASE_URL}/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({
                user: user.email, // Enviamos el email como "user" para coincidir con tu backend original
                items: cart.map(item => ({ id: item.id, name: item.name, qty: item.qty, price: item.price })),
                total: cartTotal,
                address: `${shipping.address}, ${shipping.city}, ${shipping.zip}`
            })
        });

        if (!response.ok) throw new Error("Error al procesar el stock en el servidor");

        await response.json();
        
        alert(`🎉 ¡Pedido confirmado y stock actualizado!`);
        setCart([]);
        setView("catalog");
        window.scrollTo(0,0);
        
        // Recargar productos para ver el stock nuevo
        const resProd = await fetch(`${API_BASE_URL}/products/`);
        const updatedProds = await resProd.json();
        setProducts(updatedProds);

    } catch (err) {
        console.error(err);
        alert("Hubo un problema con la base de datos de stock.");
    }
  };

  const handleShipOrder = async (orderId) => {
    try {
        const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/ship`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${user.token}` 
            }
        });
        
        if (res.ok) {
            setOrders(prev => prev.filter(o => o.id !== orderId));
            alert("📦 Pedido marcado como enviado");
        }
    } catch (error) {
        console.error("Error al enviar pedido:", error);
    }
  };

  const calculateSales = (period) => {
      const now = new Date();
      if (!Array.isArray(orders)) return 0;
      return orders.filter(o => {
          if (!o.date) return false;
          const orderDate = new Date(o.date);
          if (period === 'day') return orderDate.toDateString() === now.toDateString();
          if (period === 'week') { const w = new Date(); w.setDate(w.getDate()-7); return orderDate > w; }
          if (period === 'month') return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
          if (period === 'year') return orderDate.getFullYear() === now.getFullYear();
          return false;
      }).reduce((acc, curr) => acc + (curr.total || 0), 0);
  };

  const filteredProducts = products
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter(p => category === "all" || p.category === category);
  
  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500 selection:text-black">
      {/* NAVBAR */}
      <nav className="fixed w-full top-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center cursor-pointer gap-2" onClick={() => { setView("catalog"); setSearch(""); }}>
              <h1 className="text-2xl font-serif font-bold bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">
                El Grano de Oro
              </h1>
            </div>
            <div className="flex items-center gap-4">
               {user && user.role === 'admin' && (
                 <button onClick={() => setView(view==='admin'?'catalog':'admin')} className="hidden md:block px-4 py-2 text-sm font-bold text-amber-500 border border-amber-500/50 rounded-full hover:bg-amber-500 hover:text-black transition-all">
                   {view === 'admin' ? 'Volver a Tienda' : '⚙️ Panel Admin'}
                 </button>
               )}
               <div className="relative cursor-pointer group p-2" onClick={() => setIsWishlistOpen(true)}>
                 <span className={`text-2xl transition ${wishlist.length > 0 ? 'text-amber-500' : 'text-zinc-300 group-hover:text-amber-400'}`}>♥</span>
                 {wishlist.length > 0 && <span className="absolute top-0 right-0 bg-zinc-100 text-black text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full">{wishlist.length}</span>}
               </div>
               <div className="relative cursor-pointer group p-2" onClick={() => setIsCartOpen(true)}>
                 <span className="text-2xl text-zinc-300 group-hover:text-amber-400 transition">🛒</span>
                 {cart.length > 0 && <span className="absolute top-0 right-0 bg-amber-600 text-white text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full animate-bounce">{cart.reduce((a,c)=>a+c.qty,0)}</span>}
               </div>
               {user ? (
                 <button onClick={() => {
                     setUser(null); 
                     localStorage.removeItem('user'); 
                     setView("catalog");
                 }} className="text-xs font-bold text-zinc-400 hover:text-amber-500 ml-4 uppercase tracking-wider transition border-l border-zinc-700 pl-4">CERRAR SESIÓN</button>
               ) : (
                 <button onClick={() => setShowAuth(true)} className="bg-amber-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-amber-500 transition shadow-lg">Entrar</button>
               )}
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-20 pb-12">
        {view === "product-detail" && selectedProduct && (
            <div className="max-w-7xl mx-auto px-4 mt-10 animate-fade-in">
                <button onClick={() => setView("catalog")} className="mb-6 text-zinc-400 hover:text-amber-500 flex items-center gap-2 font-bold uppercase tracking-widest text-xs">← Volver al catálogo</button>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl h-fit">
                        <img src={selectedProduct.image_url || "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800"} alt={selectedProduct.name} className="w-full h-full object-cover min-h-[400px]" />
                    </div>
                    <div className="flex flex-col gap-6">
                        <div>
                            <h2 className="text-4xl font-serif font-bold text-white mb-2">{selectedProduct.name}</h2>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20 font-bold uppercase tracking-wider">{selectedProduct.category}</span>
                                <div className="flex text-amber-400">★★★★☆ <span className="text-zinc-500 ml-1">(4.8)</span></div>
                            </div>
                        </div>
                        <div className="text-4xl font-light text-white border-b border-zinc-800 pb-6">{selectedProduct.price}€<span className="text-sm font-normal text-zinc-500 ml-2">IVA incluido</span></div>
                        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 space-y-4">
                            <div className="flex items-center gap-4"><span className="text-2xl bg-zinc-800 p-2 rounded-lg">🚚</span><div><p className="font-bold text-white">Entrega Estimada</p><p className="text-sm text-green-400">Llega pronto</p></div></div>
                            <div className="flex items-center gap-4"><span className="text-2xl bg-zinc-800 p-2 rounded-lg">🛡️</span><div><p className="font-bold text-white">Vendido por <span className="text-amber-500">CoffeeMasters Inc.</span></p><p className="text-sm text-zinc-400">98% valoraciones positivas</p></div></div>
                        </div>
                        <p className="text-zinc-300 leading-relaxed text-lg">{selectedProduct.description}</p>
                        <div className="flex gap-4 mt-4">
                            <button onClick={() => addToCart(selectedProduct)} className="flex-1 bg-zinc-800 text-white font-bold py-4 rounded-xl border border-zinc-700 hover:bg-zinc-700 hover:border-amber-500 transition">Añadir a la Cesta</button>
                            <button onClick={() => buyNow(selectedProduct)} className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-bold py-4 rounded-xl hover:opacity-90 shadow-lg transition">Comprar Ahora</button>
                            <button onClick={() => toggleWishlist(selectedProduct)} className={`w-16 flex items-center justify-center rounded-xl border transition ${wishlist.find(w=>w.id===selectedProduct.id) ? 'bg-amber-900/20 border-amber-500 text-amber-500' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'}`}><span className="text-2xl">♥</span></button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {view === "checkout" && (
          <div className="max-w-7xl mx-auto px-4 mt-10 animate-fade-in">
            <h2 className="text-3xl font-serif font-bold text-amber-500 mb-8 text-center">Finalizar Pedido</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <form id="checkout-form" onSubmit={processPayment} className="lg:col-span-2 space-y-8">
                    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">🚚 Dirección de Envío</h3>
                        <div className="space-y-4">
                            <input className="premium-input w-full" placeholder="Dirección completa" required onChange={e => setShipping({...shipping, address: e.target.value})} />
                            <div className="flex gap-4">
                                <input className="premium-input w-1/2" placeholder="Ciudad" required onChange={e => setShipping({...shipping, city: e.target.value})} />
                                <input className="premium-input w-1/2" placeholder="Código Postal (00000)" value={shipping.zip} maxLength="5" required onChange={handleZipChange} />
                            </div>
                            <input className="premium-input w-full" placeholder="País" required onChange={e => setShipping({...shipping, country: e.target.value})} />
                        </div>
                    </div>
                    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">💳 Método de Pago</h3>
                        {!useNewCard && savedCards.length > 0 && (
                            <div className="mb-6 space-y-2">
                                {savedCards.map(card => (
                                    <div key={card.id} className="flex justify-between items-center p-4 rounded-xl border border-amber-500/50 bg-amber-900/10 cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">💳</span>
                                            <span className="text-white font-mono">**** **** **** {card.last4}</span>
                                            <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">{card.brand}</span>
                                        </div>
                                        <span className="text-amber-500 font-bold text-sm">Seleccionada</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button type="button" onClick={() => setUseNewCard(!useNewCard)} className="text-amber-500 hover:text-amber-400 text-sm font-bold underline mb-4 block">
                            {useNewCard ? "← Usar tarjeta guardada" : "+ Añadir nueva tarjeta"}
                        </button>
                        {useNewCard && (
                            <div className="space-y-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800 animate-fade-in">
                                <input className="premium-input w-full" placeholder="Titular de la Tarjeta" required onChange={e => setPayment({...payment, holder: e.target.value})} />
                                <input className="premium-input w-full" placeholder="Número de Tarjeta (16 dígitos)" required maxLength="16" onChange={e => setPayment({...payment, card: e.target.value})} />
                                <div className="flex gap-4">
                                    <input className="premium-input w-1/2" placeholder="MM/YY" value={payment.expiry} maxLength="5" required onChange={handleExpiryChange} />
                                    <input className="premium-input w-1/2" placeholder="CVV" required maxLength="3" onChange={e => setPayment({...payment, cvv: e.target.value})} />
                                </div>
                            </div>
                        )}
                    </div>
                </form>
                <div className="lg:col-span-1">
                    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 sticky top-28 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-6 border-b border-zinc-800 pb-4">Resumen</h3>
                        <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between text-sm items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-amber-500 font-bold">{item.qty}x</span>
                                        <span className="text-zinc-300 truncate w-32">{item.name}</span>
                                    </div>
                                    <span className="text-white font-mono">{(item.price * item.qty).toFixed(2)}€</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-zinc-800 pt-4 mb-6">
                            <div className="flex justify-between items-end">
                                <span className="text-zinc-400">Total</span>
                                <span className="text-3xl font-serif font-bold text-amber-500">{cartTotal.toFixed(2)}€</span>
                            </div>
                        </div>
                        <div className="flex gap-3 flex-col">
                            <button type="submit" form="checkout-form" className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-bold py-4 rounded-xl hover:opacity-90 transition transform active:scale-95 shadow-lg">PAGAR AHORA</button>
                            <button onClick={() => setView("catalog")} className="w-full text-zinc-500 hover:text-white py-2 transition text-sm">Cancelar</button>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}

        {view === "admin" && (
          <div className="animate-fade-in max-w-7xl mx-auto px-4 mt-10">
            <h2 className="text-3xl font-serif font-bold text-white mb-8 border-b border-zinc-800 pb-4">Dashboard Admin</h2>
            
            {!Array.isArray(orders) || orders.length === 0 ? (
               <div className="bg-zinc-900 p-10 rounded-2xl border border-zinc-800 text-center">
                  <p className="text-zinc-500 italic">No hay pedidos en la base de datos.</p>
               </div>
            ) : (
               <>
                  <div className="grid lg:grid-cols-3 gap-8 mb-8">
                      <div className="lg:col-span-2">
                          <SalesChart orders={orders} />
                      </div>
                      <div className="grid grid-rows-3 gap-4">
                          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex flex-col justify-center">
                              <h4 className="text-zinc-400 text-sm font-bold uppercase tracking-wider mb-2">Ventas Hoy</h4>
                              <p className="text-3xl font-serif text-white">{calculateSales('day').toFixed(2)}€</p>
                          </div>
                          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex flex-col justify-center">
                              <h4 className="text-zinc-400 text-sm font-bold uppercase tracking-wider mb-2">Ventas Semana</h4>
                              <p className="text-3xl font-serif text-white">{calculateSales('week').toFixed(2)}€</p>
                          </div>
                          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex flex-col justify-center">
                              <h4 className="text-zinc-400 text-sm font-bold uppercase tracking-wider mb-2">Ventas Mes</h4>
                              <p className="text-3xl font-serif text-amber-500">{calculateSales('month').toFixed(2)}€</p>
                          </div>
                      </div>
                  </div>
                  
                  <div className="grid lg:grid-cols-2 gap-8">
                      <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                         <h3 className="text-xl font-bold mb-4 text-amber-500">Pedidos a Enviar</h3>
                         <div className="space-y-4">
                           {orders.filter(o => o.status === 'pending').map(order => (
                              <div key={order.id} className="p-4 bg-black/40 rounded-xl border border-zinc-800 flex justify-between items-center">
                                 <div>
                                    <p className="text-white font-bold">Pedido #{order.id}</p>
                                    <p className="text-sm text-zinc-400">{order.items_summary || order.items}</p>
                                    <p className="text-xs text-zinc-500 italic">{order.user_email || order.user} - {order.address}</p>
                                 </div>
                                 <button 
                                    onClick={() => handleShipOrder(order.id)}
                                    className="bg-amber-600 text-black px-4 py-2 rounded-lg font-bold hover:bg-amber-500 transition"
                                 >
                                    Completar
                                 </button>
                              </div>
                           ))}
                           {orders.filter(o => o.status === 'pending').length === 0 && <p className="text-zinc-500 text-sm">Todo enviado.</p>}
                         </div>
                      </div>
                      <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                         <h3 className="text-xl font-bold mb-4 text-white">Añadir Producto</h3>
                         <form onSubmit={handleCreateProduct} className="space-y-4">
                             <input name="name" className="premium-input w-full" placeholder="Nombre" required />
                             <input name="category" className="premium-input w-full" placeholder="Categoría" required />
                             <input name="price" type="number" step="0.01" className="premium-input w-full" placeholder="Precio (€)" required />
                             <input name="stock" type="number" className="premium-input w-full" placeholder="Stock Inicial" required />
                             <input name="image_url" className="premium-input w-full" placeholder="URL de Imagen" />
                             <button type="submit" className="w-full bg-zinc-800 text-white font-bold py-3 rounded-xl border border-zinc-700 hover:bg-zinc-700 transition">Añadir</button>
                         </form>
                      </div>
                  </div>
               </>
            )}
          </div>
        )}

        {view === "catalog" && (
          <>
            {search.length > 0 ? (
                <div className="max-w-7xl mx-auto px-4 mt-8 min-h-screen">
                    <div className="flex flex-col md:flex-row gap-4 mb-8 bg-zinc-900 p-4 rounded-2xl border border-zinc-800 shadow-lg">
                        <input className="premium-input flex-1" placeholder="🔍 Buscar..." value={search} onChange={e=>setSearch(e.target.value)} autoFocus />
                        <select className="premium-input" onChange={e=>setCategory(e.target.value)}><option value="all">Todas</option><option value="Café en Grano">Grano</option><option value="Café Molido">Molido</option><option value="Accesorios">Accesorios</option></select>
                    </div>
                    <h2 className="text-2xl font-serif text-white mb-6">Resultados para "{search}"</h2>
                    {filteredProducts.length === 0 ? <p className="text-zinc-500">Sin resultados.</p> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">{filteredProducts.map(p => <ProductCard key={p.id} product={p} onClick={() => handleProductClick(p)} onAdd={addToCart} onBuy={buyNow} isLiked={wishlist.find(w=>w.id===p.id)} onLike={toggleWishlist} isAdmin={user?.role === 'admin'} onDelete={handleDeleteProduct} />)}</div>}
                </div>
            ) : (
                <>
                    <div className="relative w-full h-[70vh] flex items-center justify-center overflow-hidden mb-16">
                        <img src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1600" alt="Hero" className="absolute inset-0 w-full h-full object-cover grayscale" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-zinc-950"></div>
                        <div className="relative z-10 text-center px-4 max-w-4xl">
                            <h2 className="text-5xl md:text-8xl font-serif font-black mb-6 tracking-tighter leading-none bg-gradient-to-b from-amber-100 via-amber-400 to-amber-700 bg-clip-text text-transparent animate-fade-in">PARA AMANTES DEL CAFÉ</h2>
                            <div className="flex items-center justify-center gap-4"><div className="h-[1px] w-12 md:w-24 bg-amber-600"></div><p className="text-amber-500 text-lg md:text-2xl font-light tracking-[0.5em] uppercase">EL GRANO DE ORO</p><div className="h-[1px] w-12 md:w-24 bg-amber-600"></div></div>
                        </div>
                    </div>
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex flex-col md:flex-row gap-4 mb-12 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                            <input className="premium-input flex-1" placeholder="🔍 Buscar..." value={search} onChange={e=>setSearch(e.target.value)} />
                            <select className="premium-input" onChange={e=>setCategory(e.target.value)}><option value="all">Todas</option><option value="Café en Grano">Grano</option><option value="Café Molido">Molido</option><option value="Accesorios">Accesorios</option></select>
                        </div>
                        
                        {recommendations.length > 0 && category === 'all' && (
                            <section className="mb-16">
                                <h2 className="text-2xl font-serif text-amber-500 mb-6 flex items-center gap-4 italic">
                                    {user ? "Recomendaciones para ti" : "Los cafés más populares"}
                                    <div className="h-px bg-amber-900/30 flex-1"></div>
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                    {recommendations.map(p => <ProductCard key={p.id} product={p} onClick={() => handleProductClick(p)} onAdd={addToCart} onBuy={buyNow} isLiked={wishlist.find(w=>w.id===p.id)} onLike={toggleWishlist} recommended={true} isAdmin={user?.role === 'admin'} onDelete={handleDeleteProduct} />)}
                                </div>
                            </section>
                        )}
                        
                        <section><h2 className="text-2xl font-serif text-amber-500 mb-6 flex items-center gap-4 italic">Nuestra colección completa <div className="h-px bg-zinc-800 flex-1"></div></h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">{filteredProducts.map(p => <ProductCard key={p.id} product={p} onClick={() => handleProductClick(p)} onAdd={addToCart} onBuy={buyNow} isLiked={wishlist.find(w=>w.id===p.id)} onLike={toggleWishlist} isAdmin={user?.role === 'admin'} onDelete={handleDeleteProduct} />)}</div></section>
                    </div>
                </>
            )}
          </>
        )}
      </main>

      {/* SIDEBARS */}
      <div className={`fixed inset-0 z-[60] ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-500`}>
          <div className="absolute inset-0 bg-black/60" onClick={()=>setIsCartOpen(false)}></div>
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-zinc-950 border-l border-zinc-800 p-8 flex flex-col">
            <h2 className="text-2xl font-serif text-amber-500 mb-8 flex justify-between">Tu Selección <button onClick={()=>setIsCartOpen(false)} className="text-zinc-500">✕</button></h2>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {cart.map(i => (
                    <div key={i.id} className="flex justify-between mb-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 items-center">
                        <div><h4 className="font-bold text-white max-w-[180px] truncate">{i.name}</h4><p className="text-amber-500 text-sm">{i.qty} x {i.price}€</p></div>
                        <div className="flex gap-2 bg-zinc-950 rounded-lg p-1 border border-zinc-800"><button onClick={()=>removeFromCart(i)} className="text-zinc-400 hover:text-white px-2">-</button><span className="text-white px-2">{i.qty}</span><button onClick={()=>addToCart(i)} className="text-zinc-400 hover:text-white px-2">+</button></div>
                    </div>
                ))}
            </div>
            {cart.length > 0 && <button onClick={handleGoToCheckout} className="w-full bg-amber-600 text-black font-bold py-4 rounded-xl mt-8 hover:bg-amber-500 transition shadow-lg">Finalizar Pedido ({cartTotal.toFixed(2)}€)</button>}
          </div>
      </div>

      <div className={`fixed inset-0 z-[60] ${isWishlistOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-500`}>
          <div className="absolute inset-0 bg-black/60" onClick={()=>setIsWishlistOpen(false)}></div>
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-zinc-950 border-l border-zinc-800 p-8 flex flex-col">
              <h2 className="text-2xl font-serif text-amber-500 mb-8 flex justify-between">Favoritos <button onClick={()=>setIsWishlistOpen(false)} className="text-zinc-500">✕</button></h2>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {wishlist.length === 0 && <p className="text-zinc-500 text-center">Aún no hay favoritos.</p>}
                {wishlist.map(i => (
                    <div key={i.id} className="flex gap-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 items-center">
                        <img src={i.image_url || "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=100"} alt={i.name} className="w-16 h-16 rounded-lg object-cover grayscale"/>
                        <div className="flex-1"><h4 className="font-bold text-sm text-white line-clamp-1">{i.name}</h4><p className="text-amber-500 text-sm">{i.price}€</p></div>
                        <button onClick={()=>moveToCartFromWishlist(i)} className="bg-amber-600 text-black px-3 py-1 rounded text-xs font-bold hover:bg-amber-500 transition">🛒</button>
                    </div>
                ))}
              </div>
          </div>
      </div>

      <style>{`.premium-input { background: #09090b; border: 1px solid #27272a; color: white; padding: 0.8rem 1.2rem; border-radius: 1rem; outline: none; transition: 0.3s; } .premium-input:focus { border-color: #f59e0b; } .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }`}</style>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={(u) => { setUser(u); setShowAuth(false); }} />}
    </div>
  );
}

// --- COMPONENTS ---
function ProductCard({ product, onClick, onAdd, onBuy, recommended, isLiked, onLike, isAdmin, onDelete }) {
    return (
        <div className={`group bg-zinc-900/40 rounded-3xl overflow-hidden border transition-all duration-500 hover:bg-zinc-900/80 ${recommended ? 'border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-zinc-800'}`}>
            <div className="relative h-72 overflow-hidden cursor-pointer" onClick={onClick}>
                <img src={product.image_url || "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400"} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" alt={product.name} />
                <button onClick={(e) => { e.stopPropagation(); onLike(product); }} className="absolute top-4 right-4 text-2xl drop-shadow-lg transition hover:scale-125 z-20">
                    {isLiked ? <span className="text-amber-500">♥</span> : <span className="text-zinc-300">♡</span>}
                </button>
                {isAdmin && (
                  <button onClick={(e) => { e.stopPropagation(); onDelete(product.id); }} className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-20 hover:bg-red-500 transition">
                     Borrar
                  </button>
                )}
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black p-6">
                    <div className="flex justify-between items-end">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1 truncate max-w-[150px]">{product.name}</h3>
                        <span className="text-zinc-400 text-xs uppercase tracking-wider">Stock: {product.stock}</span>
                      </div>
                      <span className="text-amber-400 font-bold text-lg">{product.price}€</span>
                    </div>
                </div>
            </div>
            <div className="p-6">
                <div className="flex gap-3">
                   <button onClick={(e)=>{ e.stopPropagation(); onAdd(product); }} disabled={product.stock <= 0} className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${product.stock > 0 ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800'}`}>
                     {product.stock > 0 ? 'Añadir' : 'Agotado'}
                   </button>
                   <button onClick={(e)=>{ e.stopPropagation(); onBuy(product); }} disabled={product.stock <= 0} className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${product.stock > 0 ? 'bg-amber-600 text-black hover:bg-amber-500' : 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800'}`}>Comprar</button>
                </div>
            </div>
        </div>
    )
}

function AuthModal({ onClose, onLogin }) {
    const [isReg, setIsReg] = useState(false); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState("");
    
    const submit = async (e) => {
        e.preventDefault(); setError("");
        try {
            if(isReg) {
                const res = await fetch(`${API_BASE_URL}/users/`, { 
                  method: 'POST', 
                  headers: {'Content-Type': 'application/json'}, 
                  body: JSON.stringify({email, password}) 
                });
                if(!res.ok) throw new Error("Error registrando usuario");
                alert("Cuenta creada."); setIsReg(false);
            } else {
                const form = new URLSearchParams(); 
                form.append('username', email); 
                form.append('password', password);
                
                const res = await fetch(`${API_BASE_URL}/token`, { 
                  method: 'POST', 
                  headers: {'Content-Type': 'application/x-www-form-urlencoded'}, 
                  body: form 
                });
                if(!res.ok) throw new Error("Credenciales inválidas");
                
                const data = await res.json();
                
                // Lee el rol real de la respuesta de la API (por defecto 'client' si no existe)
                const userRole = data.role || 'client'; 
                
                const loggedUser = { email: email, id: data.user_id, role: userRole, token: data.access_token };

                localStorage.setItem('user', JSON.stringify(loggedUser));

                onLogin(loggedUser);
            }
        } catch(err) { setError(err.message); }
    };
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
            <div className="relative bg-zinc-900 p-10 rounded-3xl border border-zinc-700 w-full max-w-md shadow-2xl">
                <h2 className="text-3xl font-serif text-amber-500 mb-6 text-center italic font-bold">{isReg?"Crear Cuenta":"Bienvenido"}</h2>
                {error && <p className="text-red-400 text-center mb-4 text-sm bg-red-900/20 p-3 rounded-lg border border-red-900/50">{error}</p>}
                <form onSubmit={submit} className="space-y-4">
                    <input className="premium-input w-full" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
                    <input className="premium-input w-full" type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} required />
                    <button className="w-full bg-amber-600 text-black font-bold py-4 rounded-xl mt-4 hover:bg-amber-500 transition shadow-lg">{isReg?"Registrar":"Acceder"}</button>
                </form>
                <div className="mt-6 text-center text-zinc-400 text-sm cursor-pointer hover:text-white transition" onClick={()=>setIsReg(!isReg)}>{isReg?"¿Ya tienes cuenta?":"¿Crear cuenta?"}</div>
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition text-xl">✕</button>
            </div>
        </div>
    )
}

export default App;