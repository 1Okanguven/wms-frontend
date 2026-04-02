import { useState, useEffect } from 'react';
import { X, Building2, Package, ShoppingCart, Trash2, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

export default function OrderModal({ isOpen, onClose, onSuccess }) {
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [availableProducts, setAvailableProducts] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchWarehouses();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setWarehouseId('');
    setCustomerName('');
    setOrderNote('');
    setSelectedItems([]);
    setAvailableProducts([]);
  };

  const fetchWarehouses = async () => {
    try {
      const res = await api.get('/warehouse');
      setWarehouses(res.data);
    } catch (error) {
      toast.error('Depolar yüklenirken hata oluştu.');
    }
  };

  const handleWarehouseSelect = async (id) => {
    setWarehouseId(id);
    setAvailableProducts([]);
    setSelectedItems([]);
    
    setLoading(true);
    try {
      const res = await api.get(`/inventory/warehouse/${id}`);
      const productsMap = {};
      res.data.forEach(item => {
        if (!productsMap[item.product.id]) {
          productsMap[item.product.id] = {
            ...item.product,
            totalStock: 0
          };
        }
        productsMap[item.product.id].totalStock += item.quantity;
      });
      setAvailableProducts(Object.values(productsMap).filter(p => p.totalStock > 0));
    } catch (error) {
      toast.error('Depo stokları alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  const addItem = (productId) => {
    const product = availableProducts.find(p => p.id === productId);
    if (!product) return;

    if (selectedItems.find(item => item.productId === productId)) {
      toast.error('Bu ürün zaten listede.');
      return;
    }

    setSelectedItems([...selectedItems, {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      quantity: 1,
      maxStock: product.totalStock
    }]);
  };

  const removeItem = (productId) => {
    setSelectedItems(selectedItems.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId, qty) => {
    const val = parseInt(qty);
    setSelectedItems(selectedItems.map(item => {
      if (item.productId === productId) {
        return { ...item, quantity: Math.min(Math.max(1, val), item.maxStock) };
      }
      return item;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!warehouseId) return toast.error('Lütfen bir depo seçiniz.');
    if (!customerName) return toast.error('Lütfen müşteri adını girin.');
    if (selectedItems.length === 0) return toast.error('Lütfen en az bir ürün ekleyin.');

    setIsSubmitting(true);
    try {
      const payload = {
        customerName,
        orderNote,
        warehouseId,
        items: selectedItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      await api.post('/order', payload);
      toast.success('Sipariş başarıyla oluşturuldu ve toplama listesi hazır!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Sipariş oluşturulurken hata.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-6 pt-6 pb-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-indigo-600" />
                Sipariş Simülatörü
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500 p-2 hover:bg-gray-100 rounded-full">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="space-y-6">

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Şube / Depo Seçimi</label>
                    <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-1">
                      {warehouses.map((wh) => (
                        <div
                          key={wh.id}
                          onClick={() => handleWarehouseSelect(wh.id)}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                            warehouseId === wh.id 
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                              : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-indigo-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Building2 className={`h-4 w-4 ${warehouseId === wh.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                            <span className="text-sm font-semibold">{wh.name}</span>
                          </div>
                          {warehouseId === wh.id && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                        </div>
                      ))}
                    </div>
                  </div>


                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Müşteri Bilgisi</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Müşteri Adı Soyadı"
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>


                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <MessageSquare className="h-3 w-3" />
                      Sipariş Notu (Opsiyonel)
                    </label>
                    <textarea
                      rows="3"
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      placeholder="Sipariş için özel talimatlar, kargo notu vb..."
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
                    />
                  </div>
                </div>


                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Ürün Listesi</label>
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
                  </div>
                  
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Package className="h-5 w-5 text-gray-300" />
                    </div>
                    <select
                      disabled={!warehouseId || loading}
                      className="block w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm outline-none appearance-none disabled:bg-gray-50 disabled:text-gray-400"
                      onChange={(e) => addItem(e.target.value)}
                      value=""
                    >
                      <option value="">{!warehouseId ? 'Önce depo seçiniz...' : 'Ürün ara ve ekle...'}</option>
                      {availableProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) - Stok: {p.totalStock}
                        </option>
                      ))}
                    </select>
                  </div>


                  <div className="max-h-[350px] overflow-y-auto border border-gray-100 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Ürün</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Adet</th>
                          <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selectedItems.length === 0 ? (
                          <tr>
                            <td colSpan="3" className="px-4 py-8 text-center text-sm text-gray-400 italic">
                              Henüz ürün eklenmedi.
                            </td>
                          </tr>
                        ) : (
                          selectedItems.map((item) => (
                            <tr key={item.productId}>
                              <td className="px-4 py-3">
                                <p className="text-sm font-semibold text-gray-800 leading-tight">{item.name}</p>
                                <p className="text-[10px] text-gray-400 font-mono">{item.sku}</p>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="1"
                                    max={item.maxStock}
                                    value={item.quantity}
                                    onChange={(e) => updateQuantity(item.productId, e.target.value)}
                                    className="w-12 border rounded p-1 text-sm font-medium"
                                  />
                                  <span className="text-[10px] text-gray-400">/{item.maxStock}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.productId)}
                                  className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="flex justify-end items-center pt-6 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSubmitting || selectedItems.length === 0 || !warehouseId}
                  className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 disabled:opacity-50 flex items-center gap-2 transition-all transform active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      İşleniyor...
                    </>
                  ) : (
                    'Siparişi Onayla ve Gönder'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
