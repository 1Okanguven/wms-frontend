import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Building2, X, Globe, Mail, Phone, Search, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import ActionButton from '../../components/common/ActionButton';

export default function CompanyList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  

  const [searchQuery, setSearchQuery] = useState('');
  

  const [formData, setFormData] = useState({
    name: '',
    taxNumber: '',
    taxOffice: '',
    email: '',
    phone: '',
    website: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/company');
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
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
      const itemName = item.name || '';
      const taxNumber = item.taxNumber || '';
      return itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
             taxNumber.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [items, searchQuery]);

  const handleEdit = (item) => {
    setEditItem(item);
    setFormData({
      name: item.name || '',
      taxNumber: item.taxNumber || '',
      taxOffice: item.taxOffice || '',
      email: item.email || '',
      phone: item.phone || '',
      website: item.website || '',
      address: item.address || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditItem(null);
    setFormData({ 
      name: '', taxNumber: '', taxOffice: '', 
      email: '', phone: '', website: '', address: '' 
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu firmayı silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/company/${id}`);
      toast.success('Firma başarıyla silindi.');
      fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Firma silinirken hata oluştu.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = { ...formData };

      if (editItem) {
        await api.patch(`/company/${editItem.id}`, payload);
        toast.success('Firma başarıyla güncellendi.');
      } else {
        await api.post('/company', payload);
        toast.success('Firma başarıyla eklendi.');
      }
      closeModal();
      fetchData();
    } catch (error) {
      console.error('Failed to save company:', error);
      toast.error(error.response?.data?.message || 'Firma kaydedilirken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="h-8 w-8 text-emerald-600" />
          Firma Yönetimi
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg font-semibold"
        >
          <Plus className="h-5 w-5" />
          Yeni Firma Ekle
        </button>
      </div>


      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Firma adı veya vergi no ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
        
        <div className="text-xs text-gray-500">
          Gösterilen: <span className="font-semibold text-gray-900">{filteredItems.length}</span> / {items.length} kayıt
        </div>
      </div>


      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Firma Bilgisi</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vergi Bilgileri</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">İletişim</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  </td>
                </tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{item.name}</div>
                          <div className="text-[10px] text-gray-500 italic">ID: #{item.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{item.taxNumber || '-'}</span>
                        <span className="text-[10px] text-gray-400 uppercase">{item.taxOffice || '-'} VD</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex flex-col gap-1">
                        {item.email && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Mail className="h-3 w-3 text-emerald-500" />
                            {item.email}
                          </div>
                        )}
                        {item.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Phone className="h-3 w-3 text-emerald-500" />
                            {item.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <ActionButton 
                        onEdit={() => handleEdit(item)}
                        onDelete={() => handleDelete(item.id)}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Building2 className="h-10 w-10 mb-2 opacity-20" />
                      <p>Kayıt bulunamadı.</p>
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
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" 
              aria-hidden="true"
              onClick={closeModal}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg leading-6 font-semibold text-gray-900 flex items-center gap-2" id="modal-title">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                    {editItem ? 'Firmayı Düzenle' : 'Yeni Firma Ekle'}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-500 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors focus:outline-none"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Firma Resmi Adı <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 border"
                      placeholder="Örn: Antigravity Lojistik A.Ş."
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="taxNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Vergi No
                      </label>
                      <input
                        type="text"
                        name="taxNumber"
                        id="taxNumber"
                        value={formData.taxNumber}
                        onChange={handleInputChange}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 border"
                        placeholder="10 Haneli"
                      />
                    </div>
                    <div>
                      <label htmlFor="taxOffice" className="block text-sm font-medium text-gray-700 mb-1">
                        Vergi Dairesi
                      </label>
                      <input
                        type="text"
                        name="taxOffice"
                        id="taxOffice"
                        value={formData.taxOffice}
                        onChange={handleInputChange}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 border"
                        placeholder="Örn: Maslak"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        E-Posta
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Mail className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="block w-full rounded-lg border-gray-300 pl-10 py-2.5 text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
                          placeholder="firma@example.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Telefon
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Phone className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="phone"
                          id="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="block w-full rounded-lg border-gray-300 pl-10 py-2.5 text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
                          placeholder="0212..."
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                      Web Sitesi
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Globe className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="website"
                        id="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="block w-full rounded-lg border-gray-300 pl-10 py-2.5 text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Merkez Adresi
                    </label>
                    <textarea
                      name="address"
                      id="address"
                      rows="3"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 border"
                      placeholder="Firma resmi adresi..."
                    ></textarea>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-8">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-transparent shadow-sm px-6 py-2.5 bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none disabled:opacity-50 transition-all font-semibold shadow-emerald-200"
                    >
                      {isSubmitting ? 'Kaydediliyor...' : (editItem ? 'Güncelle' : 'Kaydet')}
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
