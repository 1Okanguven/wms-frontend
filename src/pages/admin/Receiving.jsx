import { useState, useEffect, useCallback } from 'react';
import { PackageCheck, Package, Layers, Hash, Calendar, CheckCircle, ArrowRight, Truck, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const initialForm = {
  productId: '',
  rackId: '',
  quantity: '',
  lotNumber: '',
  productionDate: '',
  expirationDate: '',
  transferId: '',
  referenceNumber: '',
  targetWarehouseId: '',
};

export default function Receiving() {
  const [products, setProducts] = useState([]);
  const [racks, setRacks] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSuccess, setLastSuccess] = useState(null);
  const [isFromTransfer, setIsFromTransfer] = useState(false);

  const fetchLists = useCallback(async () => {
    try {
      setLoadingData(true);
      const [productRes, rackRes] = await Promise.all([
        api.get('/product'),
        api.get('/rack'),
      ]);
      setProducts(productRes.data.data || productRes.data);
      setRacks(rackRes.data);
    } catch (err) {
      console.error('Veriler yüklenemedi:', err);
      toast.error('Ürün veya raf listesi yüklenemedi.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  const fetchPendingTransfers = useCallback(async () => {
    try {
      setLoadingTransfers(true);
      const response = await api.get('/transfer/pending/all'); 
      setPendingTransfers(response.data);
    } catch (err) {
      console.error('Transferler yüklenemedi:', err);
    } finally {
      setLoadingTransfers(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
    fetchPendingTransfers();
  }, [fetchLists, fetchPendingTransfers]);

  const handleSelectTransfer = (transfer) => {
    const formatDateForInput = (dateStr) => {
      if (!dateStr) return '';

      if (typeof dateStr === 'string' && dateStr.includes('T')) {
        return dateStr.split('T')[0];
      }

      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (e) {
        return '';
      }
    };

    setFormData({
      productId: transfer.product?.id || '',
      rackId: '',
      quantity: transfer.quantity || '',
      lotNumber: transfer.lotNumber || '',
      productionDate: formatDateForInput(transfer.productionDate),
      expirationDate: formatDateForInput(transfer.expirationDate),
      transferId: transfer.id,
      referenceNumber: transfer.referenceNumber || '',
      targetWarehouseId: transfer.targetWarehouse?.id || '',
    });
    setIsFromTransfer(true);
    toast.success('Transfer bilgileri aktarıldı. Sadece hedef depodaki raflar listeleniyor.');
  };

  const resetTransferSelection = () => {
    setFormData(initialForm);
    setIsFromTransfer(false);
  };

  const handleCancelTransfer = async (id) => {
    if (!window.confirm('Bu transferi iptal etmek ve ürünleri kaynak rafa iade etmek istediğinizden emin misiniz?')) return;
    
    try {
      await api.patch(`/transfer/${id}/cancel`);
      toast.success('Transfer iptal edildi, ürünler kaynak rafa iade edildi.');
      fetchPendingTransfers();
    } catch (err) {
      const msg = err?.response?.data?.message || 'İptal işlemi başarısız.';
      toast.error(msg);
    }
  };

  const selectedProduct = products.find((p) => p.id === formData.productId);

  const filteredRacks = isFromTransfer && formData.targetWarehouseId
    ? racks.filter(r => {
        const warehouseId = r.aisle?.zone?.warehouse?.id || r.warehouseId;
        return warehouseId === formData.targetWarehouseId;
      })
    : racks;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'productId') {
        const prod = products.find((p) => p.id === value);
        if (!prod?.hasExpiration) next.expirationDate = '';
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productId) return toast.error('Lütfen bir ürün seçin.');
    if (!formData.rackId) return toast.error('Lütfen bir raf seçin.');
    if (!formData.quantity || Number(formData.quantity) <= 0)
      return toast.error('Geçerli bir miktar girin.');

    try {
      setIsSubmitting(true);
      const payload = {
        productId: formData.productId,
        rackId: formData.rackId,
        quantity: parseInt(formData.quantity, 10),
        lotNumber: formData.lotNumber || undefined,
        productionDate: formData.productionDate || undefined,
        expirationDate: formData.expirationDate || undefined,
        transferId: formData.transferId || undefined,
      };
      await api.post('/receiving', payload);
      
      const targetRack = racks.find(r => r.id === formData.rackId);
      setLastSuccess({
        product: selectedProduct?.name,
        sku: selectedProduct?.sku,
        rack: targetRack?.name || targetRack?.code,
        quantity: payload.quantity,
      });
      
      toast.success('Mal kabul başarıyla tamamlandı!');
      setFormData(initialForm);
      setIsFromTransfer(false);
      fetchPendingTransfers();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Mal kabul işlemi başarısız.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">

      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <PackageCheck className="h-6 w-6 text-emerald-600" />
          Mal Kabul
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Depoya gelen ürünleri sisteme kaydet. Stok otomatik güncellenir ve hareket logu atılır.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-emerald-50 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                <PackageCheck className="h-4 w-4" />
                {isFromTransfer ? 'İç Transfer Mal Kabulü' : 'Mal Kabul Formu'}
              </h2>
              {isFromTransfer && (
                <button 
                  onClick={resetTransferSelection}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  <XCircle className="h-3 w-3" />
                  İptal Et
                </button>
              )}
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ürün <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Package className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      name="productId"
                      required
                      value={formData.productId}
                      onChange={handleChange}
                      disabled={loadingData || isFromTransfer}
                      className="block w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white disabled:bg-gray-100"
                    >
                      <option value="" disabled>Ürün Seçiniz</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                      ))}
                    </select>
                  </div>
                  {isFromTransfer && <p className="mt-1 text-[10px] text-blue-600 italic">* Ürün seçimi kilitlendi.</p>}
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Raf (Lokasyon) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Layers className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      name="rackId"
                      required
                      value={formData.rackId}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white"
                    >
                      <option value="" disabled>Raf Seçiniz</option>
                      {filteredRacks.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name || r.code} {r.aisle?.zone?.warehouse?.name ? `(${r.aisle.zone.warehouse.name})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  {isFromTransfer && (
                    <p className="mt-1 text-[10px] text-amber-600 font-medium italic">
                      * Sadece hedef depodaki raflar gösteriliyor.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Miktar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={handleChange}
                    disabled={isFromTransfer}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:bg-gray-100"
                  />
                  {isFromTransfer && <p className="mt-1 text-[10px] text-blue-600 italic">* Miktar kilitlendi.</p>}
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lot / Parti</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Hash className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="lotNumber"
                      value={formData.lotNumber}
                      onChange={handleChange}
                      disabled={isFromTransfer}
                      className="block w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:bg-gray-100"
                    />
                  </div>
                  {isFromTransfer && <p className="mt-1 text-[10px] text-blue-600 italic">* Parti No kilitlendi.</p>}
                </div>
              </div>

              {formData.productId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Üretim Tarihi</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Calendar className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="productionDate"
                        value={formData.productionDate}
                        onChange={handleChange}
                        disabled={isFromTransfer}
                        className="block w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                  {selectedProduct?.hasExpiration && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SKT <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Calendar className="h-4 w-4 text-red-400" />
                        </div>
                        <input
                          type="date"
                          name="expirationDate"
                          required
                          value={formData.expirationDate}
                          onChange={handleChange}
                          disabled={isFromTransfer}
                          className="block w-full rounded-lg border border-red-200 pl-9 pr-3 py-2.5 text-sm shadow-sm focus:border-red-500 focus:ring-red-500 bg-white disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSubmitting || loadingData}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                >
                  <PackageCheck className="h-4 w-4" />
                  {isSubmitting ? 'İşleniyor...' : 'Mal Kabul Et'}
                </button>
              </div>
            </form>
          </div>


          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-amber-50 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Bekleyen İç Transferler (Yoldaki Mallar)
              </h2>
              <span className="text-xs font-bold text-amber-700">{pendingTransfers.length} TRANSFER</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Ürün / SKU</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Miktar</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase">Hedef Depo</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">İşlem</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingTransfers ? (
                    <tr><td colSpan="4" className="px-4 py-4 text-center text-xs text-gray-400">Yükleniyor...</td></tr>
                  ) : pendingTransfers.length === 0 ? (
                    <tr><td colSpan="4" className="px-4 py-10 text-center text-xs text-gray-400">Bekleyen transfer bulunmuyor.</td></tr>
                  ) : (
                    pendingTransfers.map((t) => (
                      <tr key={t.id} className="hover:bg-amber-50/50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">{t.product?.name}</span>
                            <span className="text-[10px] text-gray-500">{t.product?.sku}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-bold">{t.quantity}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                          {t.targetWarehouse?.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
                          <button
                            onClick={() => handleCancelTransfer(t.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 text-[10px] font-bold rounded transition-colors border border-red-100"
                            title="Transferi İptal Et"
                          >
                            <XCircle className="h-3 w-3" />
                            İptal
                          </button>
                          <button
                            onClick={() => handleSelectTransfer(t)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded transition-colors"
                          >
                            Kabul Et <ArrowRight className="h-3 w-3" />
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


          <div className="space-y-4">
            {lastSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-emerald-800">Son İşlem Başarılı</h3>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Ürün:</span><span className="font-medium text-gray-900">{lastSuccess.product}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Raf:</span><span className="font-medium text-gray-900">{lastSuccess.rack}</span></div>
                  <div className="flex justify-between border-t border-emerald-200 pt-1.5 mt-1.5"><span className="text-gray-500">Miktar:</span><span className="font-bold text-emerald-700">+{lastSuccess.quantity}</span></div>
                </div>
              </div>
            )}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 space-y-2">
              <p className="font-semibold text-blue-800">Bilgi</p>
              <ul className="space-y-1 text-[11px] list-disc list-inside">
                <li>Transfer seçiminde tüm ürün/tarih bilgileri korunur.</li>
                <li>Raf seçimi sadece hedef depo ile sınırlıdır.</li>
                <li>İşlem sonrası transfer kaydı otomatik olarak kapanır.</li>
              </ul>
            </div>
          </div>
      </div>
    </div>
  );
}
