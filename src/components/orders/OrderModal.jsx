import { useState, useEffect } from 'react';
import { X, Building2, Package, ShoppingCart, Plus, Trash2, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

export default function OrderModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [availableProducts, setAvailableProducts] = useState([]); // Depodaki benzersiz ürünler
  const [customerName, setCustomerName] = useState('');
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
    setStep(1);
    setWarehouseId('');
    setCustomerName('');
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

  const handleWarehouseSubmit = async (e) => {
    e.preventDefault();
    if (!warehouseId) return toast.error('Lütfen önce bir depo seçiniz.');
    
    setLoading(true);
    try {
      // Depodaki tüm stokları çek
      const res = await api.get(`/inventory/warehouse/${warehouseId}`);
      
      // Stok bazlı benzersiz ürün listesi oluştur
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
      setStep(2);
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
    if (selectedItems.length === 0) return toast.error('Lütfen en az bir ürün ekleyin.');
    if (!customerName) return toast.error('Lütfen müşteri adını girin.');

    setIsSubmitting(true);
    try {
      const payload = {
        customerName,
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

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-6 pt-6 pb-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-indigo-600" />
                {step === 1 ? 'Şube/Depo Seçimi' : 'Sipariş Detayları'}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500 p-2 hover:bg-gray-100 rounded-full">
                <X className="h-6 w-6" />
              </button>
            </div>

            {step === 1 ? (
              <form onSubmit={handleWarehouseSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lütfen siparişin karşılanacağı şubeyi seçiniz:
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {warehouses.map((wh) => (
                      <div
                        key={wh.id}
                        onClick={() => setWarehouseId(wh.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                          warehouseId === wh.id 
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                            : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-indigo-200'
                        }`}
                      >
                        <Building2 className={`h-5 w-5 ${warehouseId === wh.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <span className="font-medium">{wh.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-8 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || !warehouseId}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all"
                  >
                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'İlerle'}
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Müşteri Adı */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Müşteri Bilgisi</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Müşteri Ad Soyad / Mağaza Kodu"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Ürün Ekleme */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Ürün Listesi</label>
                    <span className="text-xs text-gray-400 italic">Sadece bu depodaki stoklu ürünler listelenir.</span>
                  </div>
                  
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Package className="h-5 w-5 text-gray-300" />
                    </div>
                    <select
                      className="block w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm outline-none appearance-none"
                      onChange={(e) => addItem(e.target.value)}
                      value=""
                    >
                      <option value="">Ürün ara ve ekle...</option>
                      {availableProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) - Mevcut: {p.totalStock}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Kalemler Tablosu */}
                  <div className="max-h-[300px] overflow-y-auto border border-gray-100 rounded-xl">
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
                                <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                                <p className="text-[10px] text-gray-400 font-mono">{item.sku}</p>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="1"
                                    max={item.maxStock}
                                    value={item.quantity}
                                    onChange={(e) => updateQuantity(item.productId, e.target.value)}
                                    className="w-16 border rounded p-1 text-sm font-medium"
                                  />
                                  <span className="text-[10px] text-gray-400">/ {item.maxStock}</span>
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

                <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 px-4 py-2"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    Geri Dön
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || selectedItems.length === 0}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Siparişi Kaydet'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
