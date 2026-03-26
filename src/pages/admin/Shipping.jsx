import { useState, useEffect } from 'react';
import { Truck, Package, Layers, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const initialForm = {
  productId: '',
  rackId: '',
  quantity: '',
};

export default function Shipping() {
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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      };
      await api.post('/shipping', payload);
      setLastSuccess({
        product: selectedProduct?.name,
        sku: selectedProduct?.sku,
        rack:
          racks.find((r) => r.id === formData.rackId)?.name ||
          racks.find((r) => r.id === formData.rackId)?.code,
        quantity: payload.quantity,
      });
      toast.success('Sevkiyat başarıyla tamamlandı! Stok ve hareket logu güncellendi.');
      setFormData(initialForm);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Sevkiyat işlemi başarısız.';
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
          <Truck className="h-6 w-6 text-orange-600" />
          Sevkiyat
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Depodan çıkış yapılacak ürünleri kaydet. Stok otomatik düşülür ve çıkış hareketi logu atılır.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-orange-50">
              <h2 className="text-sm font-semibold text-orange-800 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Sevkiyat Formu
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
                      className="block w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-white appearance-none disabled:bg-gray-50"
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
                      className="block w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-white appearance-none disabled:bg-gray-50"
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

              {/* Miktar */}
              <div className="max-w-xs">
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
                  placeholder="Örn: 50"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
                />
              </div>

              {/* Uyarı notu */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Sevkiyat işlemi geri alınamaz. Rafta yeterli stok yoksa işlem reddedilir.
                </span>
              </div>

              {/* Submit */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSubmitting || loadingData}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  <Truck className="h-4 w-4" />
                  {isSubmitting ? 'İşleniyor...' : 'Sevkiyatı Onayla'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sağ Panel */}
        <div className="space-y-4">
          {/* Son başarılı işlem */}
          {lastSuccess && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-orange-600" />
                <h3 className="text-sm font-semibold text-orange-800">Son İşlem</h3>
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
                <div className="flex justify-between border-t border-orange-200 pt-1.5 mt-1.5">
                  <span className="text-gray-500">Çıkan Miktar</span>
                  <span className="font-bold text-orange-700">−{lastSuccess.quantity}</span>
                </div>
              </div>
            </div>
          )}

          {/* Bilgi kutusu */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 space-y-2">
            <p className="font-semibold text-blue-800">Nasıl çalışır?</p>
            <ul className="space-y-1.5 text-xs text-blue-700 list-disc list-inside">
              <li>Seçilen raf üzerindeki stok <strong>azaltılır</strong></li>
              <li>Stok <strong>sıfıra düşerse</strong> satır otomatik silinir</li>
              <li>Her işlemde <strong>Stok Hareketi (Çıkış)</strong> logu atılır</li>
              <li>İşlem atomiktir — hata olursa hiçbir değişiklik kaydedilmez</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
