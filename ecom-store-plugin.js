const PID = pluginId;
if (typeof dashboardAPI !== 'undefined' && dashboardAPI.registerPage) {
    dashboardAPI.registerPage('store-manager', 'Store Manager', 'fa-shop', async (container) => {
        container.innerHTML = `
            <div class="flex gap-4 mb-6 border-b border-gray-200">
                <button id="tab-products" class="px-4 py-2 font-medium text-purple-600 border-b-2 border-purple-600">Products</button>
                <button id="tab-orders" class="px-4 py-2 font-medium text-gray-500 hover:text-gray-700">Orders</button>
                <button id="tab-design" class="px-4 py-2 font-medium text-gray-500 hover:text-gray-700">Design</button>
            </div>
            <div id="store-content"></div>
        `;

        const content = container.querySelector('#store-content');
        const tabs = ['products', 'orders', 'design'];

        function setActive(t) {
            tabs.forEach(x => {
                const btn = container.querySelector('#tab-' + x);
                if (x === t) btn.className = 'px-4 py-2 font-medium text-purple-600 border-b-2 border-purple-600';
                else btn.className = 'px-4 py-2 font-medium text-gray-500 hover:text-gray-700';
            });
            if (t === 'products') renderProducts();
            else if (t === 'orders') renderOrders();
            else if (t === 'design') renderDesign();
        }

        container.querySelector('#tab-products').onclick = () => setActive('products');
        container.querySelector('#tab-orders').onclick = () => setActive('orders');
        container.querySelector('#tab-design').onclick = () => setActive('design');

        async function renderProducts() {
            content.innerHTML = '<div class="text-center py-10"><i class="fa-solid fa-circle-notch fa-spin text-gray-400 text-2xl"></i></div>';
            try {
                const products = await dashboardAPI.getData(PID, 'products');

                content.innerHTML = `
                    <div class="flex justify-between mb-4">
                        <h3 class="text-lg font-bold">Products</h3>
                        <button id="btn-add-prod" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                            <i class="fa-solid fa-plus mr-2"></i>Add Product
                        </button>
                    </div>
                    <div class="overflow-x-auto bg-white rounded-lg border border-gray-200">
                        <table class="w-full text-left text-sm">
                            <thead class="bg-gray-50 text-gray-600 border-b">
                                <tr>
                                    <th class="p-3">Image</th>
                                    <th class="p-3">Name</th>
                                    <th class="p-3">Price</th>
                                    <th class="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                ${products.length ? products.map(p => `
                                    <tr class="hover:bg-gray-50 group">
                                        <td class="p-3"><img src="${p.data.image || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded object-cover bg-gray-100"></td>
                                        <td class="p-3 font-medium">${p.data.name}</td>
                                        <td class="p-3 text-green-600 font-bold">$${p.data.price}</td>
                                        <td class="p-3 text-right">
                                            <button onclick="window.deleteProduct('${p._id}')" class="text-red-400 hover:text-red-600"><i class="fa-solid fa-trash"></i></button>
                                        </td>
                                    </tr>
                                `).join('') : '<tr><td colspan="4" class="p-4 text-center text-gray-400">No products found.</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                `;

                container.querySelector('#btn-add-prod').onclick = () => openProductModal();

                window.deleteProduct = async (id) => {
                    if (confirm('Delete product?')) {
                        await dashboardAPI.deleteData(PID, 'products', id);
                        renderProducts();
                    }
                };

            } catch (e) {
                content.innerHTML = `<p class="text-red-500">Error: ${e.message}</p>`;
            }
        }

        async function renderOrders() {
            content.innerHTML = '<div class="text-center py-10"><i class="fa-solid fa-circle-notch fa-spin text-gray-400 text-2xl"></i></div>';
            try {
                const orders = await dashboardAPI.getData(PID, 'orders');

                content.innerHTML = `
                    <h3 class="text-lg font-bold mb-4">Orders</h3>
                    <div class="overflow-x-auto bg-white rounded-lg border border-gray-200">
                        <table class="w-full text-left text-sm">
                            <thead class="bg-gray-50 text-gray-600 border-b">
                                <tr>
                                    <th class="p-3">Date</th>
                                    <th class="p-3">Customer</th>
                                    <th class="p-3">Items</th>
                                    <th class="p-3">Total</th>
                                    <th class="p-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                ${orders.length ? orders.map(o => {
                    const date = new Date(o.data.date).toLocaleDateString();
                    return '<tr class="hover:bg-gray-50">' +
                        '<td class="p-3">' + date + '</td>' +
                        '<td class="p-3">' +
                        '<div class="font-medium">' + o.data.customer.name + '</div>' +
                        '<div class="text-xs text-gray-500">' + o.data.customer.email + '</div>' +
                        '<div class="text-xs text-gray-400 mt-1"><i class="fa-solid fa-phone mr-1"></i>' + (o.data.customer.phone || 'N/A') + '</div>' +
                        '<div class="text-xs text-gray-400"><i class="fa-solid fa-location-dot mr-1"></i>' + (o.data.customer.address || 'N/A') + '</div>' +
                        '</td>' +
                        '<td class="p-3">' + o.data.items.length + ' items</td>' +
                        '<td class="p-3 font-bold text-indigo-600">$' + o.data.total + '</td>' +
                        '<td class="p-3 text-right"><span class="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Received</span></td>' +
                        '</tr>';
                }).join('') : '<tr><td colspan="5" class="p-8 text-center text-gray-400">No orders found.</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                `;
            } catch (e) {
                content.innerHTML = `<p class="text-red-500">Error: ${e.message}</p>`;
            }
        }

        async function renderDesign() {
            content.innerHTML = '<div class="text-center py-10"><i class="fa-solid fa-circle-notch fa-spin text-gray-400 text-2xl"></i></div>';
            try {
                const settings = await dashboardAPI.getData(PID, 'store_settings');
                const pages = await dashboardAPI.getPages();
                const style = (settings && settings.find(s => s.data.id === 'global_styles')?.data) || {
                    cardBgColor: '#ffffff',
                    textColor: '#000000',
                    btnColor: '#3b82f6',
                    btnTextColor: '#ffffff',
                    borderRadius: '8px',
                    showOnAll: true,
                    enabledPages: []
                };

                content.innerHTML = `
                    <h3 class="text-lg font-bold mb-4">Store Design & Visibility</h3>
                    <div class="bg-white p-6 rounded-lg border border-gray-200 max-w-lg">
                        <div class="space-y-4">
                            <h4 class="font-bold text-sm border-b pb-1">Design Settings</h4>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Card Background</label>
                                    <div class="flex gap-2">
                                        <input type="color" id="inp-cardBg" value="${style.cardBgColor}" class="h-10 w-10 border rounded cursor-pointer">
                                        <input type="text" value="${style.cardBgColor}" class="flex-1 border rounded px-3 text-xs text-gray-600" readonly>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                                    <div class="flex gap-2">
                                        <input type="color" id="inp-text" value="${style.textColor}" class="h-10 w-10 border rounded cursor-pointer">
                                        <input type="text" value="${style.textColor}" class="flex-1 border rounded px-3 text-xs text-gray-600" readonly>
                                    </div>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Button Color</label>
                                    <div class="flex gap-2">
                                        <input type="color" id="inp-btn" value="${style.btnColor}" class="h-10 w-10 border rounded cursor-pointer">
                                        <input type="text" value="${style.btnColor}" class="flex-1 border rounded px-3 text-xs text-gray-600" readonly>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                                    <div class="flex gap-2">
                                        <input type="color" id="inp-btnText" value="${style.btnTextColor}" class="h-10 w-10 border rounded cursor-pointer">
                                        <input type="text" value="${style.btnTextColor}" class="flex-1 border rounded px-3 text-xs text-gray-600" readonly>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Border Radius</label>
                                <input type="text" id="inp-radius" value="${style.borderRadius}" class="w-full border rounded px-3 py-2 text-sm">
                            </div>

                            <h4 class="font-bold text-sm border-b pb-1 pt-4">Visibility Settings</h4>
                            <div class="flex items-center gap-2 bg-gray-50 p-3 rounded border">
                                <input type="checkbox" id="chk-showAll" ${style.showOnAll !== false ? 'checked' : ''} class="w-4 h-4">
                                <label for="chk-showAll" class="text-sm font-bold text-gray-700">Display Cart on all pages</label>
                            </div>
                            <div id="div-pages" class="${style.showOnAll !== false ? 'hidden' : ''} border rounded-lg p-4 bg-white space-y-3">
                                <label class="block text-sm font-bold text-gray-600 mb-2">Select Active Pages:</label>
                                <div class="max-h-40 overflow-y-auto space-y-2 pr-2">
                                    ${pages.map(p => {
                    const isChecked = Array.isArray(style.enabledPages) ? style.enabledPages.includes(p.slug) : false;
                    return `
                                            <label class="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer border border-transparent hover:border-gray-100 transition">
                                                <input type="checkbox" name="visible-page" value="${p.slug}" ${isChecked ? 'checked' : ''} class="w-4 h-4 rounded text-indigo-600">
                                                <div class="flex flex-col">
                                                    <span class="text-sm font-medium text-gray-800">${p.name}</span>
                                                    <span class="text-[10px] text-gray-400">/p/${p.slug}</span>
                                                </div>
                                            </label>
                                        `;
                }).join('')}
                                    ${pages.length === 0 ? '<p class="text-xs text-gray-400 italic">No pages created yet.</p>' : ''}
                                </div>
                            </div>

                            <div class="pt-4">
                                <button id="btn-save-design" class="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-bold shadow-sm transition transform hover:-translate-y-0.5">Save All Settings</button>
                            </div>
                        </div>
                    </div>
                `;

                const chkAll = container.querySelector('#chk-showAll');
                const divPages = container.querySelector('#div-pages');
                chkAll.onchange = () => divPages.classList.toggle('hidden', chkAll.checked);

                container.querySelector('#btn-save-design').onclick = async () => {
                    const btn = container.querySelector('#btn-save-design');
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Saving...';
                    btn.disabled = true;

                    try {
                        const selectedPages = Array.from(container.querySelectorAll('input[name="visible-page"]:checked')).map(cb => cb.value);
                        const newStyle = {
                            id: 'global_styles',
                            cardBgColor: container.querySelector('#inp-cardBg').value,
                            textColor: container.querySelector('#inp-text').value,
                            btnColor: container.querySelector('#inp-btn').value,
                            btnTextColor: container.querySelector('#inp-btnText').value,
                            borderRadius: container.querySelector('#inp-radius').value,
                            showOnAll: chkAll.checked,
                            enabledPages: chkAll.checked ? [] : selectedPages
                        };

                        // Re-fetch to ensure we have current IDs for deletion
                        const currentSettings = await dashboardAPI.getData(PID, 'store_settings');
                        const existingDocs = currentSettings.filter(s => s.data.id === 'global_styles');

                        for (const doc of existingDocs) {
                            await dashboardAPI.deleteData(PID, 'store_settings', doc._id);
                        }

                        await dashboardAPI.createData(PID, 'store_settings', newStyle);
                        alert('Settings saved! Please refresh your public site pages to see the changes.');
                    } catch (e) {
                        alert('Error saving: ' + e.message);
                    } finally {
                        btn.innerHTML = 'Save All Settings';
                        btn.disabled = false;
                    }
                };
            } catch (e) {
                content.innerHTML = `<p class="text-red-500">Error: ${e.message}</p>`;
            }
        }

        function openProductModal() {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg p-6 w-96 max-w-full shadow-xl">
                    <h3 class="text-lg font-bold mb-4">Add Product</h3>
                    <div class="space-y-3">
                        <input id="inp-name" type="text" placeholder="Product Name" class="w-full border p-2 rounded">
                        <input id="inp-price" type="number" placeholder="Price" class="w-full border p-2 rounded">
                        <div class="flex gap-2">
                             <input id="inp-img" type="text" placeholder="Image URL" class="flex-1 border p-2 rounded">
                             <button id="btn-select-img" class="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded"><i class="fa-solid fa-image"></i></button>
                        </div>
                        <img id="img-preview" src="" class="w-full h-32 object-cover rounded hidden">
                    </div>
                    <div class="mt-6 flex justify-end gap-3">
                        <button id="btn-cancel" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                        <button id="btn-save" class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Save</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('#btn-cancel').onclick = () => modal.remove();

            const inpImg = modal.querySelector('#inp-img');
            const imgPrev = modal.querySelector('#img-preview');

            modal.querySelector('#btn-select-img').onclick = () => {
                if (dashboardAPI.openMediaPicker) {
                    dashboardAPI.openMediaPicker((url) => {
                        inpImg.value = url;
                        imgPrev.src = url;
                        imgPrev.classList.remove('hidden');
                    });
                }
            };

            inpImg.onchange = () => {
                if (inpImg.value) {
                    imgPrev.src = inpImg.value;
                    imgPrev.classList.remove('hidden');
                }
            }

            modal.querySelector('#btn-save').onclick = async () => {
                const name = modal.querySelector('#inp-name').value;
                const price = modal.querySelector('#inp-price').value;
                const image = inpImg.value;
                if (!name || !price) return alert('Name and Price required');

                await dashboardAPI.createData(PID, 'products', { name, price, image });
                modal.remove();
                renderProducts();
            };
        }

        renderProducts();
    });
}

if (typeof builderAPI !== 'undefined') {
    builderAPI.registerComponent('product-grid', {
        icon: 'fa-shop text-green-600 bg-green-100',
        label: 'Product Grid',
        tagName: 'div',
        canDrop: true,
        defaultContent: '',
        defaultStyles: {
            padding: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '20px',
            width: '100%',
            minHeight: '100px'
        }
    });

    builderAPI.registerProperty({
        type: 'button',
        text: '🔄 Refresh Products',
        targetType: 'product-grid',
        onClick: async (e) => {
            const btn = document.activeElement;
            if (btn) btn.innerText = 'Loading...';
            try {
                const products = await dashboardAPI.getData(PID, 'products');
                const settings = await dashboardAPI.getData(PID, 'store_settings');
                const style = (settings && settings.find(s => s.data.id === 'global_styles')?.data) || {
                    cardBgColor: '#ffffff',
                    textColor: '#000000',
                    btnColor: '#3b82f6',
                    btnTextColor: '#ffffff',
                    borderRadius: '8px'
                };

                if (!products || products.length === 0) {
                    e.children = [];
                    e.content = '<div style="text-align:center; color:#888; padding:20px;">No products found in Store Manager.</div>';
                } else {
                    e.content = '';
                    e.children = products.map(p => ({
                        id: 'prod_' + p._id,
                        type: 'card',
                        tagName: 'div',
                        styles: {
                            border: '1px solid #eee',
                            borderRadius: style.borderRadius,
                            overflow: 'hidden',
                            backgroundColor: style.cardBgColor,
                            display: 'flex',
                            flexDirection: 'column'
                        },
                        children: [
                            {
                                type: 'image',
                                tagName: 'img',
                                src: p.data.image || 'https://via.placeholder.com/300x200',
                                styles: { width: '100%', height: '200px', objectFit: 'cover' }
                            },
                            {
                                type: 'card',
                                tagName: 'div',
                                styles: { padding: '15px', display: 'flex', flexDirection: 'column', gap: '5px' },
                                children: [
                                    {
                                        type: 'header',
                                        tagName: 'h3',
                                        content: p.data.name,
                                        styles: { margin: '0', fontSize: '18px', fontWeight: 'bold', color: style.textColor }
                                    },
                                    {
                                        type: 'paragraph',
                                        tagName: 'p',
                                        content: '$' + p.data.price,
                                        styles: { margin: '0', fontSize: '16px', color: '#10b981', fontWeight: '600' }
                                    },
                                    {
                                        type: 'button',
                                        tagName: 'button',
                                        content: 'Add to Cart',
                                        styles: {
                                            width: '100%',
                                            padding: '10px',
                                            backgroundColor: style.btnColor,
                                            color: style.btnTextColor,
                                            borderRadius: style.borderRadius,
                                            border: 'none',
                                            cursor: 'pointer',
                                            marginTop: '10px'
                                        },
                                        onclick: "window.Shop && window.Shop.addToCart({ id: '" + p._id + "', name: '" + p.data.name.replace(/'/g, "\\\\'") + "', price: " + p.data.price + ", image: '" + (p.data.image || '') + "' })"
                                    }
                                ]
                            }
                        ]
                    }));
                }
                builderAPI.refreshCanvas();
            } catch (err) {
                alert('Error fetching products: ' + err.message);
            } finally {
                if (btn) btn.innerText = '🔄 Refresh Products';
            }
        }
    });
}
