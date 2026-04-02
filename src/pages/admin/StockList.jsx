import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Box, X, Calendar, Hash, Layers, Package, MapPin, Search, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

export default function StockList() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [racks, setRacks] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  
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
      if (name === 'productId') {
        const selected = products.find(p => p.id === value);
        if (!selected?.hasExpiration) nextData.expirationDate = '';
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
      toast.success('Stok başarıyla eklendi.');
      setIsModalOpen(false);
      setFormData({ productId: '', rackId: '', quantity: '', lotNumber: '', productionDate: '', expirationDate: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Stok eklenirken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    } catch (e) { return dateString; }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Box className="h-8 w-8 text-emerald-600" />
          Anlık Stok Durumu
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg font-semibold"
        >
          <Plus className="h-5 w-5" />
          Manuel Stok Ekle
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Ürün adı veya SKU ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
          />
        </div>

        <div className="w-full md:w-64 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <MapPin className="h-4 w-4" />
          </div>
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none bg-white cursor-pointer"
          >
            <option value="">Tüm Depolar</option>
            {warehouses.map(wh => (<option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><ChevronDown className="h-4 w-4 text-gray-400" /></div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Ürün</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Şube / Depo</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Lokasyon</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase text-center">Miktar</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Detaylar (Lot/SKT)</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></td></tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap border-l-4 border-emerald-500/0 hover:border-emerald-500 transition-all">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{item.product?.name}</span>
                        <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded w-fit">{item.product?.sku}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[11px] text-gray-600 uppercase">
                      <div className="font-semibold text-gray-700">{item.rack?.aisle?.zone?.warehouse?.branch?.name}</div>
                      <div className="text-gray-400">{item.rack?.aisle?.zone?.warehouse?.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 bg-emerald-100/50 px-2 py-1 rounded w-fit">
                        <MapPin className="h-3 w-3" />
                        {item.rack?.locationCode || item.rack?.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-900 font-bold text-sm">
                        {item.quantity} <span className="text-[10px] text-gray-400 uppercase">{item.product?.unit}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[10px]">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex gap-2">
                           <span className="text-gray-400 italic">Lot:</span> <span className="font-mono font-bold">{item.lotNumber || '-'}</span>
                        </div>
                        <div className="flex gap-2">
                           <span className="text-gray-400 italic">SKT:</span> <span className={`${item.expirationDate && new Date(item.expirationDate) < new Date() ? 'text-red-500 font-bold' : 'text-gray-600'}`}>{formatDate(item.expirationDate)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all"><Trash2 className="h-5 w-5" /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">Stok kaydı bulunamadı.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full border border-gray-100">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Box className="h-5 w-5 text-emerald-600" /> Manuel Stok Ekle</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-full"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ürün <span className="text-red-500">*</span></label>
                      <select name="productId" required value={formData.productId} onChange={handleInputChange} className="block w-full rounded-lg border-gray-300 py-2.5 text-sm border focus:ring-emerald-500">
                        <option value="" disabled>Ürün Seçiniz</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Raf <span className="text-red-500">*</span></label>
                      <select name="rackId" required value={formData.rackId} onChange={handleInputChange} className="block w-full rounded-lg border-gray-300 py-2.5 text-sm border focus:ring-emerald-500">
                        <option value="" disabled>Raf Seçiniz</option>
                        {racks.map(r => <option key={r.id} value={r.id}>{r.locationCode || r.code}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">Miktar <span className="text-red-500">*</span></label>
                      <input type="number" name="quantity" required min="1" value={formData.quantity} onChange={handleInputChange} className="block w-full rounded-lg border-gray-300 py-2.5 text-sm border focus:ring-emerald-500 text-center text-lg font-bold" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lot No</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Hash className="h-3 w-3" /></div>
                        <input type="text" name="lotNumber" value={formData.lotNumber} onChange={handleInputChange} className="block w-full rounded-lg border-gray-300 pl-8 py-2.5 text-sm border focus:ring-emerald-500" placeholder="Opsiyonel" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Üretim Tarihi</label>
                      <input type="date" name="productionDate" value={formData.productionDate} onChange={handleInputChange} className="block w-full rounded-lg border-gray-300 py-2.5 text-sm border focus:ring-emerald-500" />
                    </div>
                    {selectedProduct?.hasExpiration && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 font-bold text-emerald-700">SKT <span className="text-red-500">*</span></label>
                        <input type="date" name="expirationDate" required value={formData.expirationDate} onChange={handleInputChange} className="block w-full rounded-lg border-emerald-500 py-2.5 text-sm border focus:ring-emerald-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">İptal</button>
                    <button type="submit" disabled={isSubmitting} className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-emerald-700 transition-all">{isSubmitting ? 'İşleniyor...' : 'Stoka Ekle'}</button>
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
