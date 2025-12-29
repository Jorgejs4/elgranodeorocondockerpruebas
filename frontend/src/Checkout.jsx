import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function Checkout() {
  const { state } = useLocation(); // Recibimos el carrito desde la navegación
  const cart = state?.cart || [];
  const navigate = useNavigate();

  // Estados para formularios
  const [shipping, setShipping] = useState({ address: '', city: '', country: '', zip_code: '' });
  const [payment, setPayment] = useState({ card_number: '', expiry: '', cvv: '', card_holder: '' });
  
  // Simulación de tarjetas guardadas
  const [savedCards, setSavedCards] = useState([
    { id: 1, last4: '4242', brand: 'Visa' }
  ]);
  const [useNewCard, setUseNewCard] = useState(false);

  // Calcular total
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePay = async (e) => {
    e.preventDefault();
    
    const orderData = {
      shipping,
      payment: useNewCard ? payment : { card_number: '****', ...savedCards[0] }, // Mock data
      items: cart.map(p => ({ id: p.id, quantity: p.quantity }))
    };

    try {
      const response = await fetch('http://localhost:8000/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        alert('¡Pago realizado con éxito! ☕');
        navigate('/'); // Volver al inicio
      } else {
        const error = await response.json();
        alert('Error: ' + error.detail);
      }
    } catch (err) {
      alert('Error de conexión con el servidor');
    }
  };

  return (
    <div className="container mx-auto p-4 flex gap-8">
      {/* IZQUIERDA: Formularios */}
      <div className="w-2/3 bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">🚚 Dirección de Envío</h2>
        <form className="grid grid-cols-2 gap-4 mb-8">
          <input className="border p-2 rounded col-span-2" placeholder="Dirección completa" 
            onChange={e => setShipping({...shipping, address: e.target.value})} />
          <input className="border p-2 rounded" placeholder="Ciudad" 
            onChange={e => setShipping({...shipping, city: e.target.value})} />
          <input className="border p-2 rounded" placeholder="Código Postal" 
            onChange={e => setShipping({...shipping, zip_code: e.target.value})} />
        </form>

        <h2 className="text-2xl font-bold mb-4">💳 Método de Pago</h2>
        
        {/* Selector de tarjetas */}
        <div className="mb-4">
          {!useNewCard && savedCards.map(card => (
            <div key={card.id} className="border p-3 rounded mb-2 bg-blue-50 border-blue-200 flex justify-between">
              <span>xxxx-xxxx-xxxx-{card.last4} ({card.brand})</span>
              <span className="text-green-600 font-bold">Seleccionada</span>
            </div>
          ))}
          
          <button 
            type="button"
            className="text-sm text-blue-600 underline"
            onClick={() => setUseNewCard(!useNewCard)}
          >
            {useNewCard ? "Usar tarjeta guardada" : "Añadir nueva tarjeta"}
          </button>
        </div>

        {/* Formulario Nueva Tarjeta */}
        {useNewCard && (
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
            <input className="border p-2 rounded col-span-2" placeholder="Número de Tarjeta" 
              onChange={e => setPayment({...payment, card_number: e.target.value})}/>
            <input className="border p-2 rounded" placeholder="MM/YY" 
              onChange={e => setPayment({...payment, expiry: e.target.value})}/>
            <input className="border p-2 rounded" placeholder="CVV" 
              onChange={e => setPayment({...payment, cvv: e.target.value})}/>
            <input className="border p-2 rounded col-span-2" placeholder="Titular de la tarjeta" 
              onChange={e => setPayment({...payment, card_holder: e.target.value})}/>
          </div>
        )}
      </div>

      {/* DERECHA: Resumen */}
      <div className="w-1/3 bg-gray-100 p-6 rounded h-fit">
        <h3 className="text-xl font-bold mb-4">Resumen del Pedido</h3>
        {cart.map(item => (
          <div key={item.id} className="flex justify-between mb-2 text-sm">
            <span>{item.name} (x{item.quantity})</span>
            <span>{(item.price * item.quantity).toFixed(2)}€</span>
          </div>
        ))}
        <div className="border-t border-gray-300 my-4"></div>
        <div className="flex justify-between font-bold text-xl mb-6">
          <span>Total:</span>
          <span>{total.toFixed(2)}€</span>
        </div>
        <button 
          onClick={handlePay}
          className="w-full bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700 transition"
        >
          PAGAR {total.toFixed(2)}€
        </button>
      </div>
    </div>
  );
}

export default Checkout;