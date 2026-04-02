import { useState, useEffect } from 'react';
import { Truck, Package, Layers, CheckCircle, AlertTriangle, User, MapPin, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const initialForm = {
  productId: '',
  rackId: '',
  quantity: '',
  shipmentType: 'INTERNAL',
  destination: '',
  targetWarehouseId: '',
  customerName: '',
  deliveryAddress: '',
  shippingCompany: '',
  trackingNumber: '',
  referenceNumber: '',
};

export default function Shipping() {
  const [products, setProducts] = useState([]);
  const [allRacks, setAllRacks] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [shippableWarehouses, setShippableWarehouses] = useState([]);
  const [branches, setBranches] = useState([]);
  
  const [filteredRacks, setFilteredRacks] = useState([]);
  const [filteredTargetWarehouses, setFilteredTargetWarehouses] = useState([]);
  
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSuccess, setLastSuccess] = useState(null);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [productRes, rackRes, branchRes, invRes, whRes, shippableRes] = await Promise.all([
          api.get('/product'),
          api.get('/rack'),
          api.get('/branch'),
          api.get('/inventory'),
          api.get('/warehouse'),
          api.get('/warehouse/shippable'),
        ]);
        
        setProducts(productRes.data.data || productRes.data);
        setAllRacks(rackRes.data);
        setBranches(branchRes.data.data || branchRes.data);
        setInventories(invRes.data);
        setWarehouses(whRes.data);
        setShippableWarehouses(shippableRes.data);
        
      } catch (err) {
        console.error('Veriler yüklenemedi:', err);
        toast.error('Gerekli listeler yüklenemedi.');
      } finally {
        setLoadingData(false);
      }
    };
    fetchLists();
  }, []);

  useEffect(() => {
    if (!formData.productId) {
      setFilteredRacks([]);
      return;
    }
    const relevantInvs = inventories.filter(
      (inv) => inv.product.id === formData.productId && inv.quantity > 0
    );
    setFilteredRacks(relevantInvs);
    if (relevantInvs.length > 0 && !relevantInvs.find(inv => inv.rack.id === formData.rackId)) {
      setFormData(prev => ({ ...prev, rackId: '' }));
    }
  }, [formData.productId, inventories]);

  useEffect(() => {
    if (!formData.destination || formData.shipmentType !== 'INTERNAL') {
      setFilteredTargetWarehouses([]);
      return;
    }

    const sourceInventory = inventories.find(
      (inv) => inv.rack.id === formData.rackId
    );
    const sourceWarehouseId = sourceInventory?.rack?.aisle?.zone?.warehouse?.id;

    const relevantWarehouses = shippableWarehouses.filter(
      (wh) => wh.branch?.id === formData.destination && wh.id !== sourceWarehouseId
    );
    
    setFilteredTargetWarehouses(relevantWarehouses);
    if (relevantWarehouses.length > 0 && !relevantWarehouses.find(wh => wh.id === formData.targetWarehouseId)) {
      setFormData(prev => ({ ...prev, targetWarehouseId: '' }));
    }
  }, [formData.destination, formData.shipmentType, shippableWarehouses, formData.rackId, inventories]);

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

    if (formData.shipmentType === 'INTERNAL') {
      if (!formData.destination) return toast.error('Lütfen bir hedef şube seçin.');
      if (!formData.targetWarehouseId) return toast.error('Lütfen bir hedef depo seçin.');
    }
    
    if (formData.shipmentType === 'EXTERNAL' && (!formData.customerName || !formData.deliveryAddress)) {
      return toast.error('Lütfen müşteri adı ve teslimat adresini doldurun.');
    }

    try {
      setIsSubmitting(true);
      
      const targetBranch = branches.find(b => b.id === formData.destination);
      const targetWh = warehouses.find(w => w.id === formData.targetWarehouseId);

      const payload = {
        productId: formData.productId,
        rackId: formData.rackId,
        quantity: parseInt(formData.quantity, 10),
        shipmentType: formData.shipmentType,
        destination: formData.shipmentType === 'INTERNAL' 
          ? `${targetBranch?.name} / ${targetWh?.name}`
          : null,
        targetWarehouseId: formData.shipmentType === 'INTERNAL' ? formData.targetWarehouseId : null,
        customerName: formData.shipmentType === 'EXTERNAL' ? formData.customerName : null,
        deliveryAddress: formData.shipmentType === 'EXTERNAL' ? formData.deliveryAddress : null,
        shippingCompany: formData.shipmentType === 'EXTERNAL' ? formData.shippingCompany : null,
        trackingNumber: formData.shipmentType === 'EXTERNAL' ? formData.trackingNumber : null,
        ...(formData.referenceNumber.trim() && { referenceNumber: formData.referenceNumber.trim() }),
      };
      
      await api.post('/shipping', payload);
      
      setLastSuccess({
        product: selectedProduct?.name,
        sku: selectedProduct?.sku,
        rack:
          allRacks.find((r) => r.id === formData.rackId)?.name ||
          allRacks.find((r) => r.id === formData.rackId)?.code,
        quantity: payload.quantity,
        shipmentType: payload.shipmentType,
        destination: payload.destination || payload.customerName,
        referenceNumber: payload.referenceNumber || payload.trackingNumber,
      });
      toast.success('Sevkiyat başarıyla tamamlandı!');
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Truck className="h-6 w-6 text-orange-600" />
          Sevkiyat Yönetimi
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Depodan ürün çıkışını INTERNAL (Şube) veya EXTERNAL (Müşteri) olarak yönetin.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-orange-50">
              <h2 className="text-sm font-semibold text-orange-800 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Sevkiyat Formu
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-3 text-center uppercase tracking-wider">
                  Sevkiyat Türü
                </label>
                <div className="flex justify-center gap-8">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="shipmentType"
                      value="INTERNAL"
                      checked={formData.shipmentType === 'INTERNAL'}
                      onChange={handleChange}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                    />
                    <span className={`text-sm font-medium transition-colors ${formData.shipmentType === 'INTERNAL' ? 'text-orange-700' : 'text-gray-500 group-hover:text-gray-700'}`}>
                      İÇ TRANSFER (Şube)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="shipmentType"
                      value="EXTERNAL"
                      checked={formData.shipmentType === 'EXTERNAL'}
                      onChange={handleChange}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                    />
                    <span className={`text-sm font-medium transition-colors ${formData.shipmentType === 'EXTERNAL' ? 'text-orange-700' : 'text-gray-500 group-hover:text-gray-700'}`}>
                      MÜŞTERİ SEVKİYAT (Dış)
                    </span>
                  </label>
                </div>
              </div>

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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Raf (Stok Bulunan Lokasyonlar) <span className="text-red-500">*</span>
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
                      disabled={loadingData || !formData.productId}
                      className="block w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-white appearance-none disabled:bg-gray-50 font-medium"
                    >
                      <option value="" disabled>
                        {!formData.productId ? 'Önce Ürün Seçiniz' : loadingData ? 'Yükleniyor...' : 'Raf Seçiniz'}
                      </option>
                      {filteredRacks.map((inv) => (
                        <option key={inv.id} value={inv.rack.id}>
                          {inv.rack.name || inv.rack.code} (Mevcut: {inv.quantity} Adet)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

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

              <div className="pt-2">
                {formData.shipmentType === 'INTERNAL' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hedef Şube <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="destination"
                        required
                        value={formData.destination}
                        onChange={handleChange}
                        disabled={loadingData}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-white appearance-none font-medium"
                      >
                        <option value="" disabled>Şube Seçiniz</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hedef Depo <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="targetWarehouseId"
                        required
                        value={formData.targetWarehouseId}
                        onChange={handleChange}
                        disabled={loadingData || !formData.destination}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-white appearance-none font-medium disabled:bg-gray-50"
                      >
                        <option value="" disabled>
                          {!formData.destination ? 'Önce Şube Seçiniz' : 'Depo Seçiniz'}
                        </option>
                        {filteredTargetWarehouses.map(wh => (
                          <option key={wh.id} value={wh.id}>{wh.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Müşteri Adı / Soyadı <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="customerName"
                            required
                            value={formData.customerName}
                            onChange={handleChange}
                            placeholder="Örn: Ahmet Yılmaz"
                            className="block w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kargo Firması
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Truck className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="shippingCompany"
                            value={formData.shippingCompany}
                            onChange={handleChange}
                            placeholder="Örn: Aras Kargo"
                            className="block w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teslimat Adresi <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 pt-3 top-0">
                          <MapPin className="h-4 w-4 text-gray-400" />
                        </div>
                        <textarea
                          name="deliveryAddress"
                          required
                          rows="2"
                          value={formData.deliveryAddress}
                          onChange={handleChange}
                          placeholder="Tam adres bilgisi yazın..."
                          className="block w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kargo Takip No
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="trackingNumber"
                            value={formData.trackingNumber}
                            onChange={handleChange}
                            placeholder="Örn: TR-123456"
                            className="block w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Referans / Sipariş No
                        </label>
                        <input
                          type="text"
                          name="referenceNumber"
                          value={formData.referenceNumber}
                          onChange={handleChange}
                          placeholder="Örn: PO-998"
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Sevkiyat işlemi geri alınamaz. Rafta yeterli stok yoksa işlem reddedilir.
                </span>
              </div>

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

        <div className="space-y-4">
          {lastSuccess && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-orange-600" />
                <h3 className="text-sm font-semibold text-orange-800">Son İşlem</h3>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tür</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${lastSuccess.shipmentType === 'INTERNAL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {lastSuccess.shipmentType === 'INTERNAL' ? 'İÇ TRANSFER' : 'DIŞ SEVKİYAT'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ürün</span>
                  <span className="font-medium text-gray-900">{lastSuccess.product}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Hedef / Alıcı</span>
                  <span className="font-medium text-gray-900 text-right max-w-[60%] truncate" title={lastSuccess.destination}>{lastSuccess.destination}</span>
                </div>
                {lastSuccess.referenceNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ref / Takip No</span>
                    <span className="font-mono text-gray-700 text-xs">{lastSuccess.referenceNumber}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-orange-200 pt-1.5 mt-1.5">
                  <span className="text-gray-500">Çıkan Miktar</span>
                  <span className="font-bold text-orange-700">−{lastSuccess.quantity}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 space-y-2">
            <p className="font-semibold text-blue-800">Nasıl çalışır?</p>
            <ul className="space-y-1.5 text-xs text-blue-700 list-disc list-inside">
              <li><strong>INTERNAL</strong>: Şubeler arası stok transferi için kullanılır.</li>
              <li><strong>EXTERNAL</strong>: Doğrudan müşteriye yapılan çıkışlardır.</li>
              <li>Her iki türde de stok otomatik düşülür ve log atılır.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
