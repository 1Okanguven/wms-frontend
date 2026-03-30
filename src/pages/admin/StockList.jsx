import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Box, X, Calendar, Hash, Layers, Package, MapPin, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

export default function StockList() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [racks, setRacks] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    productId: '',
    rackId: '',
    quantity: '',
    lotNumber: '',
    productionDate: '',
    expirationDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [inventoryRes, productRes, rackRes, warehouseRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/product'),
        api.get('/rack'),
        api.get('/warehouse')
      ]);
      setItems(inventoryRes.data);
      setWarehouses(warehouseRes.data);
      // Backend api structure wrapper for product can sometimes be nested inside data.
      setProducts(productRes.data.data || productRes.data);
      setRacks(rackRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Veriler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesWarehouse = !selectedWarehouseId || 
        item.rack?.aisle?.zone?.warehouse?.id === selectedWarehouseId;
      
      return matchesSearch && matchesWarehouse;
    });
  }, [items, searchQuery, selectedWarehouseId]);

  const handleDelete = async (id) => {
    if (!window.confirm('Bu stok kaydını tamamen silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/inventory/${id}`);
      toast.success('Stok kaydı silindi.');
      fetchData();
    } catch (error) {
      console.error('Failed to delete stock:', error);
      toast.error('Silinirken hata oluştu.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const nextData = { ...prev, [name]: value };
      
      // Reset only expirationDate when switching to a product without SKT tracking
      if (name === 'productId') {
        const selected = products.find(p => p.id === value);
        if (!selected?.hasExpiration) {
          nextData.expirationDate = '';
        }
      }
      
      return nextData;
    });
  };

  const selectedProduct = products.find(p => p.id === formData.productId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productId) return toast.error('Ürün seçimi zorunludur.');
    if (!formData.rackId) return toast.error('Lokasyon (Raf) seçimi zorunludur.');
    if (!formData.quantity || formData.quantity <= 0) return toast.error('Geçerli bir miktar giriniz.');

    try {
      setIsSubmitting(true);
      const payload = {
        productId: formData.productId,
        rackId: formData.rackId,
        quantity: parseInt(formData.quantity, 10),
        lotNumber: formData.lotNumber || null,
        productionDate: formData.productionDate || null,
        expirationDate: formData.expirationDate || null
      };

      await api.post('/inventory', payload);
      toast.success('Stok başarıyla eklendi / güncellendi.');
      setIsModalOpen(false);
      setFormData({
        productId: '',
        rackId: '',
        quantity: '',
        lotNumber: '',
        productionDate: '',
        expirationDate: ''
      });
      fetchData();
    } catch (error) {
      console.error('Failed to add stock:', error);
      toast.error('Stok eklenirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Box className="h-6 w-6 text-blue-600" />
          Anlık Stok Durumu
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Manuel Mal Kabul / Stok Ekle
        </button>
      </div>

      {/* Control Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="w-full md:w-72 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Ürün adı veya SKU ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
          />
        </div>

        {/* Warehouse Filter */}
        <div className="w-full md:w-64 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-4 w-4 text-gray-400" />
          </div>
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all appearance-none"
          >
            <option value="">Tüm Depolar</option>
            {warehouses.map(wh => (
              <option key={wh.id} value={wh.id}>
                {wh.branch?.name} - {wh.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="text-xs text-gray-500 md:ml-auto">
          Gösterilen: <span className="font-semibold text-gray-900">{filteredItems.length}</span> / {items.length} kayıt
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU / Ürün Adı</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Şube / Depo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasyon (Raf)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Miktar & Birim</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lot Numarası</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Üretim Tarihi</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKT</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </td>
                </tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{item.product?.name || '-'}</span>
                        <span className="text-xs text-gray-500 font-mono mt-0.5">{item.product?.sku || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {item.rack?.aisle?.zone?.warehouse?.branch?.name || '-'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.rack?.aisle?.zone?.warehouse?.name || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {item.rack?.name || item.rack?.code || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-semibold text-sm">
                        {item.quantity} {item.product?.unit || 'ADET'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                      {item.lotNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(item.productionDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(item.expirationDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full transition-colors inline-flex"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Box className="h-10 w-10 text-gray-300 mb-2" />
                      <p>{searchQuery || selectedWarehouseId ? 'Aramanızla eşleşen stok bulunamadı.' : 'Depoda ürün (stok) bulunamadı.'}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-100">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg leading-6 font-semibold text-gray-900 flex items-center gap-2">
                    <Box className="h-5 w-5 text-blue-600" />
                    Manuel Mal Kabul / Stok Ekle
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors focus:outline-none">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Row 1: Ürün ve Raf */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ürün <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          name="productId"
                          required
                          value={formData.productId}
                          onChange={handleInputChange}
                          className="block w-full rounded-lg border-gray-300 pl-10 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border bg-white appearance-none"
                        >
                          <option value="" disabled>Ürün Seçiniz</option>
                          {products.map((p) => (
                            <option key={p.id || p.sku} value={p.id}>
                              {p.sku} - {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Raf (Lokasyon) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Layers className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          name="rackId"
                          required
                          value={formData.rackId}
                          onChange={handleInputChange}
                          className="block w-full rounded-lg border-gray-300 pl-10 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border bg-white appearance-none"
                        >
                          <option value="" disabled>Raf Seçiniz</option>
                          {racks.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name || r.code}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Miktar ve Lot Numarası */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        onChange={handleInputChange}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border"
                        placeholder="Örn: 100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lot / Parti Numarası
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Hash className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="lotNumber"
                          value={formData.lotNumber}
                          onChange={handleInputChange}
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 pl-10 border"
                          placeholder="Opsiyonel"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Üretim Tarihi (her zaman) + SKT (sadece hasExpiration=true) */}
                  {formData.productId && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Üretim Tarihi
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Calendar className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="date"
                            name="productionDate"
                            value={formData.productionDate}
                            onChange={handleInputChange}
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 pl-10 border bg-white"
                          />
                        </div>
                      </div>

                      {selectedProduct?.hasExpiration && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Son Kullanma Tarihi (SKT) <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <Calendar className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="date"
                              name="expirationDate"
                              required
                              value={formData.expirationDate}
                              onChange={handleInputChange}
                              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 pl-10 border bg-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-6 sm:flex sm:flex-row-reverse border-t border-gray-100 pt-5">
                    <button type="submit" disabled={isSubmitting} className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 transition-colors">
                      {isSubmitting ? 'İşleniyor...' : 'Stoka Ekle'}
                    </button>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors">
                      İptal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
