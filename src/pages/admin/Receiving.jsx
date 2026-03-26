import { useState, useEffect } from 'react';
import { PackageCheck, Package, Layers, Hash, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const initialForm = {
  productId: '',
  rackId: '',
  quantity: '',
  lotNumber: '',
  productionDate: '',
  expirationDate: '',
};

export default function Receiving() {
  const [products, setProducts] = useState([]);
  const [racks, setRacks] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSuccess, setLastSuccess] = useState(null);

  useEffect(() => {
    const fetchLists = async () => {
      try {
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
    };
    fetchLists();
  }, []);

  const selectedProduct = products.find((p) => p.id === formData.productId);

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
      };
      await api.post('/receiving', payload);
      setLastSuccess({
        product: selectedProduct?.name,
        sku: selectedProduct?.sku,
        rack: racks.find((r) => r.id === formData.rackId)?.name || racks.find((r) => r.id === formData.rackId)?.code,
        quantity: payload.quantity,
      });
      toast.success('Mal kabul başarıyla tamamlandı! Stok ve hareket logu güncellendi.');
      setFormData(initialForm);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Mal kabul işlemi başarısız.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
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
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-emerald-50">
              <h2 className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                <PackageCheck className="h-4 w-4" />
                Mal Kabul Formu
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Ürün ve Raf */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ürün */}
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
                      disabled={loadingData}
                      className="block w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white appearance-none disabled:bg-gray-50"
                    >
                      <option value="" disabled>
                        {loadingData ? 'Yükleniyor...' : 'Ürün Seçiniz'}
                      </option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} — {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Raf */}
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
                      disabled={loadingData}
                      className="block w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white appearance-none disabled:bg-gray-50"
                    >
                      <option value="" disabled>
                        {loadingData ? 'Yükleniyor...' : 'Raf Seçiniz'}
                      </option>
                      {racks.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name || r.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Miktar ve Lot */}
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
                    placeholder="Örn: 100"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lot / Parti Numarası
                    <span className="ml-1 text-xs text-gray-400">(opsiyonel)</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Hash className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="lotNumber"
                      value={formData.lotNumber}
                      onChange={handleChange}
                      placeholder="LOT-2026-001"
                      className="block w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Tarihler — sadece ürün seçildiyse göster */}
              {formData.productId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Üretim Tarihi — her zaman */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Üretim Tarihi
                      <span className="ml-1 text-xs text-gray-400">(opsiyonel)</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Calendar className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="productionDate"
                        value={formData.productionDate}
                        onChange={handleChange}
                        className="block w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                  </div>

                  {/* SKT — sadece hasExpiration === true */}
                  {selectedProduct?.hasExpiration && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Son Kullanma Tarihi (SKT){' '}
                        <span className="text-red-500">*</span>
                      </label>
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
                          className="block w-full rounded-lg border border-red-200 pl-9 pr-3 py-2.5 text-sm shadow-sm focus:border-red-500 focus:ring-red-500 bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSubmitting || loadingData}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  <PackageCheck className="h-4 w-4" />
                  {isSubmitting ? 'İşleniyor...' : 'Mal Kabul Et'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sağ Panel — Son İşlem & Bilgi */}
        <div className="space-y-4">
          {/* Son başarılı işlem */}
          {lastSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-semibold text-emerald-800">Son İşlem</h3>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Ürün</span>
                  <span className="font-medium text-gray-900">{lastSuccess.product}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">SKU</span>
                  <span className="font-mono text-gray-700 text-xs">{lastSuccess.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Raf</span>
                  <span className="font-medium text-gray-900">{lastSuccess.rack}</span>
                </div>
                <div className="flex justify-between border-t border-emerald-200 pt-1.5 mt-1.5">
                  <span className="text-gray-500">Eklenen Miktar</span>
                  <span className="font-bold text-emerald-700">+{lastSuccess.quantity}</span>
                </div>
              </div>
            </div>
          )}

          {/* Bilgi kutusu */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 space-y-2">
            <p className="font-semibold text-blue-800">Nasıl çalışır?</p>
            <ul className="space-y-1.5 text-xs text-blue-700 list-disc list-inside">
              <li>Aynı ürün + raf + lot kombinasyonu varsa miktar <strong>eklenir</strong></li>
              <li>Yoksa <strong>yeni stok satırı</strong> oluşturulur</li>
              <li>Her işlemde otomatik olarak <strong>Stok Hareketi (Giriş)</strong> logu atılır</li>
              <li>İşlem atomiktir — hata olursa hiçbir değişiklik kaydedilmez</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
