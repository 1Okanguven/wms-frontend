import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Columns, X, Map, ChevronDown, Search, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

export default function AisleList() {
  const [items, setItems] = useState([]);
  const [parents, setParents] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    zoneId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, parentsRes, warehouseRes] = await Promise.all([
        api.get('/aisle'),
        api.get('/zone'),
        api.get('/warehouse')
      ]);
      setItems(itemsRes.data);
      setParents(parentsRes.data);
      setWarehouses(warehouseRes.data);
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
      const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesWarehouse = !selectedWarehouseId || item.zone?.warehouse?.id === selectedWarehouseId;
      return matchesSearch && matchesWarehouse;
    });
  }, [items, searchQuery, selectedWarehouseId]);

  const handleDelete = async (id) => {
    if (!window.confirm('Bu koridoru silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/aisle/${id}`);
      toast.success('Koridor başarıyla silindi.');
      fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Koridor silinirken hata oluştu.');
    }
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === 'name') {
      value = value.toUpperCase().replace(/\s+/g, '-');
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.zoneId) return toast.error('Lütfen bir bölge seçiniz.');
    
    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name,
        zoneId: formData.zoneId
      };
      
      await api.post('/aisle', payload);
      toast.success('Koridor başarıyla eklendi.');
      setIsModalOpen(false);
      setFormData({ name: '', zoneId: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to create:', error);
      toast.error('Koridor eklenirken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Columns className="h-6 w-6 text-blue-600" />
          Koridorlar
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Yeni Koridor Ekle
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
            placeholder="Koridor adıyla ara..."
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

      {/* Table */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Koridor Adı</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bağlı Olduğu Bölge</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </td>
                </tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.zone?.name || '-'} - ({item.zone?.warehouse?.name || '-'})
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
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Columns className="h-10 w-10 text-gray-300 mb-2" />
                      <p>{searchQuery || selectedWarehouseId ? 'Aramanızla eşleşen koridor bulunamadı.' : 'Henüz hiçbir koridor eklenmemiş.'}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={() => setIsModalOpen(false)}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Modal Panel */}
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg leading-6 font-semibold text-gray-900 flex items-center gap-2" id="modal-title">
                    <Columns className="h-5 w-5 text-blue-600" />
                    Yeni Koridor Ekle
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors focus:outline-none"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  
                  {/* Bölge ve Koridor Adı (Grid) */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="zoneId" className="block text-sm font-medium text-gray-700 mb-1">
                        Bağlı Olduğu Bölge <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Map className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          name="zoneId"
                          id="zoneId"
                          required
                          value={formData.zoneId}
                          onChange={handleInputChange}
                          className="block w-full rounded-lg border-gray-300 pl-10 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border bg-white appearance-none"
                        >
                          <option value="" disabled>Bölge Seçiniz</option>
                          {parents.map((parent) => (
                            <option key={parent.id} value={String(parent.id)}>
                              {parent.name}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Koridor Adı <span className="text-red-500">*</span>
                      </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border"
                          placeholder="Örn: KORIDOR-01"
                        />
                        <p className="mt-1 text-[10px] text-gray-500 italic">
                          Sadece büyük harf ve rakam kullanın. Boşluklar otomatik olarak tireye (-) dönüşür. 
                          <span className="block mt-0.5 font-medium">Örn: KORIDOR-01, A-KORIDORU</span>
                        </p>
                    </div>
                  </div>

                  {/* Submit / İptal butonları */}
                  <div className="mt-6 sm:flex sm:flex-row-reverse border-t border-gray-100 pt-5">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 transition-colors"
                    >
                      {isSubmitting ? 'Ekleniyor...' : 'Kaydet'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                    >
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
