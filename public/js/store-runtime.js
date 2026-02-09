
window.Shop = {
    cart: [],
    siteId: null,

    init: async function (config) {
        this.siteId = config.siteId;
        this.pageSlug = config.pageSlug;
        this.loadCart();

        // Fetch Settings and Check Visibility
        try {
            const res = await fetch('/api/store/settings/' + this.siteId);
            const settings = await res.json();

            if (settings.disabled) return; // Plugin uninstalled or disabled

            const enabled = settings.enabledPages;
            const isAllowed = settings.showOnAll !== false ||
                (Array.isArray(enabled) ? enabled.includes(this.pageSlug) :
                    (enabled && typeof enabled === 'string' && enabled.split(',').map(s => s.trim()).includes(this.pageSlug)));

            console.log('Shop Visibility Check:', {
                page: this.pageSlug,
                isAllowed,
                showOnAll: settings.showOnAll,
                enabledPages: enabled
            });

            if (isAllowed) {
                this.renderFloatingCart();
            }
        } catch (e) {
            console.error('Failed to load shop settings', e);
            // Default: do nothing (don't show cart) if status cannot be verified
        }
    },

    loadCart: function () {
        const stored = localStorage.getItem('shop_cart_' + this.siteId);
        if (stored) this.cart = JSON.parse(stored);
    },

    saveCart: function () {
        localStorage.setItem('shop_cart_' + this.siteId, JSON.stringify(this.cart));
        this.updateCartCount();
    },

    addToCart: function (product) {
        const existing = this.cart.find(p => p.id === product.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            this.cart.push({ ...product, quantity: 1 });
        }
        this.saveCart();
        this.showToast('Added to cart!');
        this.openCart(); // Optional: open cart on add
    },

    removeFromCart: function (id) {
        this.cart = this.cart.filter(p => p.id !== id);
        this.saveCart();
        this.renderCartModal(); // Re-render if open
    },

    updateQuantity: function (id, delta) {
        const item = this.cart.find(p => p.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) this.removeFromCart(id);
            else this.saveCart();
        }
        this.renderCartModal();
    },

    getTotal: function () {
        return this.cart.reduce((sum, p) => sum + (p.price * p.quantity), 0).toFixed(2);
    },

    renderFloatingCart: function () {
        if (document.getElementById('shop-floating-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'shop-floating-btn';
        btn.className = 'fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition z-50 flex items-center justify-center';
        btn.innerHTML = `<i class="fa-solid fa-cart-shopping text-xl"></i><span id="cart-count" class="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">0</span>`;
        btn.onclick = () => this.openCart();

        document.body.appendChild(btn);
        this.updateCartCount();
    },

    updateCartCount: function () {
        const count = this.cart.reduce((sum, p) => sum + p.quantity, 0);
        const badge = document.getElementById('cart-count');
        if (badge) {
            badge.innerText = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    },

    openCart: function () {
        this.renderCartModal(true);
    },

    renderCartModal: function (show = false) {
        let modal = document.getElementById('shop-cart-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'shop-cart-modal';
            modal.className = 'fixed inset-0 bg-black/50 z-50 hidden flex justify-end';
            document.body.appendChild(modal);

            modal.onclick = (e) => {
                if (e.target === modal) modal.classList.add('hidden');
            };
        }

        if (show) modal.classList.remove('hidden');

        const itemsHtml = this.cart.length ? this.cart.map(p => `
            <div class="flex items-center gap-4 border-b py-4">
                <img src="${p.image || 'https://via.placeholder.com/50'}" class="w-16 h-16 object-cover rounded">
                <div class="flex-1">
                    <h4 class="font-bold text-sm">${p.name}</h4>
                    <p class="text-indigo-600 font-bold">$${p.price}</p>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="Shop.updateQuantity('${p.id}', -1)" class="w-6 h-6 bg-gray-100 rounded hover:bg-gray-200">-</button>
                    <span class="text-sm font-medium w-4 text-center">${p.quantity}</span>
                    <button onclick="Shop.updateQuantity('${p.id}', 1)" class="w-6 h-6 bg-gray-100 rounded hover:bg-gray-200">+</button>
                </div>
                <button onclick="Shop.removeFromCart('${p.id}')" class="text-gray-400 hover:text-red-500 ml-2"><i class="fa-solid fa-trash"></i></button>
            </div>
        `).join('') : '<div class="text-center py-10 text-gray-500">Your cart is empty</div>';

        modal.innerHTML = `
            <div class="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-in-right">
                <div class="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 class="font-bold text-lg"><i class="fa-solid fa-cart-shopping mr-2"></i>Cart</h2>
                    <button onclick="document.getElementById('shop-cart-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-times"></i></button>
                </div>
                
                <div class="flex-1 overflow-y-auto p-4">
                    ${itemsHtml}
                </div>

                ${this.cart.length ? `
                <div class="p-4 border-t bg-gray-50">
                    <div class="flex justify-between mb-4 text-lg font-bold">
                        <span>Total:</span>
                        <span>$${this.getTotal()}</span>
                    </div>
                    <button onclick="Shop.checkout()" class="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-lg">Checkout</button>
                </div>
                ` : ''}
            </div>
            <style>
                @keyframes slide-in-right {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
            </style>
        `;
    },

    checkout: function () {
        const modal = document.getElementById('shop-cart-modal');
        // Render Checkout Form
        modal.innerHTML = `
            <div class="bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
                <div class="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 class="font-bold text-lg"><i class="fa-solid fa-credit-card mr-2"></i>Checkout</h2>
                    <button onclick="Shop.openCart()" class="text-gray-500 hover:text-gray-700 text-sm">Back to Cart</button>
                </div>
                
                <div class="flex-1 overflow-y-auto p-6 space-y-4">
                    <div class="bg-indigo-50 p-4 rounded-lg mb-4">
                        <div class="flex justify-between font-bold text-indigo-800">
                            <span>Total Amount</span>
                            <span>$${this.getTotal()}</span>
                        </div>
                    </div>

                    <form id="checkout-form" onsubmit="event.preventDefault(); Shop.submitOrder();">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input type="text" id="cust-name" required class="w-full border rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input type="email" id="cust-email" required class="w-full border rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                            </div>
                             <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input type="tel" id="cust-phone" required class="w-full border rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
                                <textarea id="cust-address" required rows="3" class="w-full border rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
                            </div>
                        </div>
                        
                        <div class="mt-8">
                            <button type="submit" id="btn-place-order" class="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 shadow-lg">Place Order</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    submitOrder: async function () {
        const btn = document.getElementById('btn-place-order');
        btn.innerText = 'Processing...';
        btn.disabled = true;

        const orderData = {
            customer: {
                name: document.getElementById('cust-name').value,
                email: document.getElementById('cust-email').value,
                phone: document.getElementById('cust-phone').value,
                address: document.getElementById('cust-address').value
            },
            items: this.cart,
            total: this.getTotal(),
            date: new Date()
        };

        try {
            const res = await fetch('/api/store/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    siteId: this.siteId,
                    orderData: orderData
                })
            });

            if (!res.ok) throw new Error('Order failed');

            // Success
            this.cart = [];
            this.saveCart();
            document.getElementById('shop-cart-modal').innerHTML = `
                <div class="bg-white w-full max-w-md h-full shadow-2xl flex flex-col items-center justify-center p-8 text-center animate-slide-in-right">
                    <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <i class="fa-solid fa-check text-4xl text-green-600"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">Order Placed!</h2>
                    <p class="text-gray-500 mb-8">Thank you for your purchase. We will contact you shortly.</p>
                    <button onclick="document.getElementById('shop-cart-modal').classList.add('hidden')" class="bg-gray-800 text-white px-6 py-2 rounded hover:bg-black transition">Continue Shopping</button>
                </div>
            `;
            this.updateCartCount();

        } catch (e) {
            alert('Failed to place order. Please try again.');
            btn.innerText = 'Place Order';
            btn.disabled = false;
        }
    },

    showToast: function (msg) {
        const t = document.createElement('div');
        t.innerText = msg;
        t.className = 'fixed bottom-24 right-6 bg-gray-800 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in-up';
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2000);
    }
};

// Add styles
const shopStyle = document.createElement('style');
shopStyle.textContent = `
    @keyframes fade-in-up {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up { animation: fade-in-up 0.3s ease-out; }
`;
document.head.appendChild(shopStyle);
