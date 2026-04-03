import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Package, X, Building2, Tags, ChevronDown, Search, Barcode, Hash } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ActionButton from '../../components/common/ActionButton';

const SKU_PREFIX_MAP = {
  'ELEKTRONIK': 'ELK',
  'GIDA': 'GDA',
  'MOBILYA': 'MOB',
  'GIYIM': 'GYM',
  'KOZMETIK': 'KOZ',
  'HIRDAVAT': 'HRD'
};

const generateSkuPrefix = (categoryName) => {
  if (!categoryName) return 'PRD';
  
  // 1. Metin Temizliği: Türkçe karakter çevrimi ve noktalama temizliği
  const charMap = {
    'ç': 'c', 'ğ': 'g', 'ı': 'i', 'İ': 'I', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ç': 'C', 'Ğ': 'G', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U'
  };
  
  let cleaned = categoryName
    .split('')
    .map(char => charMap[char] || char)
    .join('')
    .toUpperCase()
    .replace(/[,.&]/g, ' ')
    .trim();

  const words = cleaned.split(/\s+/).filter(w => w.length > 0);

  // Durum A: 3 veya Daha Fazla Kelime
  if (words.length >= 3) {
    return words.slice(0, 3).map(w => w[0]).join('');
  }

  // Durum B: 1 veya 2 Kelime
  const combined = words.join('');
  if (combined.length === 0) return 'PRD';

  let result = combined[0];
  let vowelCount = 'AEIOU'.includes(result) ? 1 : 0;

  for (let i = 1; i < combined.length && result.length < 3; i++) {
    const char = combined[i];
    const isVowel = 'AEIOU'.includes(char);

    if (!isVowel) {
      result += char;
    } else if (vowelCount < 1) { // Maksimum 1 sesli harf kuralı
      result += char;
      vowelCount++;
    }
  }

  // 3 karaktere tamamla
  while (result.length < 3) {
    result += 'X';
  }

  return result;
};

export default function InventoryList() {
  const { role } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    barcode: '',
    categoryId: '',
    companyId: '',
    unit: 'ADET',
    hasExpiration: false
  });
  const [barcodeError, setBarcodeError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes, companiesRes] = await Promise.all([
        api.get('/product'),
        api.get('/category'),
        api.get('/company')
      ]);
      setItems(productsRes.data.data || productsRes.data);
      setCategories(categoriesRes.data);
      setCompanies(companiesRes.data);
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
      const name = item.name || '';
      const sku = item.sku || '';
      const barcode = item.barcode || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
             barcode.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [items, searchQuery]);

  const handleEdit = (item) => {
    setEditItem(item);
    setBarcodeError('');
    setFormData({
      sku: item.sku || '',
      name: item.name || '',
      barcode: item.barcode || '',
      categoryId: item.category?.id || '',
      companyId: item.company?.id || '',
      unit: item.unit || 'ADET',
      hasExpiration: item.hasExpiration || false
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditItem(null);
    setBarcodeError('');
    setFormData({
      sku: '', name: '', barcode: '',
      categoryId: '', companyId: '', unit: 'ADET', hasExpiration: false
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/product/${id}`);
      toast.success('Ürün başarıyla silindi.');
      fetchData();
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Ürün silinirken hata oluştu.');
    }
  };

  const handleInputChange = (e) => {
    let { name, value, type, checked } = e.target;
    
    if (name === 'barcode') {
       value = value.replace(/\D/g, '').substring(0, 13);
       if (value && value.length !== 13) {
         setBarcodeError('Barkod tam olarak 13 haneli rakamlardan oluşmalıdır.');
       } else {
         setBarcodeError('');
       }
    }
    if (name === 'sku') value = value.toUpperCase().replace(/\s+/g, '-');

    setFormData(prev => {
      const nextData = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'categoryId' && !editItem) {
        const selectedCat = categories.find(c => c.id === value);
        if (selectedCat) {
          const prefix = generateSkuPrefix(selectedCat.name);
          const randomNum = Math.floor(1000 + Math.random() * 9000);
          nextData.sku = `${prefix}-${randomNum}`;
        }
      }
      return nextData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // EAN-13 Validation
    if (formData.barcode && formData.barcode.length !== 13) {
      setBarcodeError('Barkod tam olarak 13 haneli rakamlardan oluşmalıdır.');
      toast.error('Barkod hatası!');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editItem) {
        await api.patch(`/product/${editItem.id}`, formData);
        toast.success('Ürün güncellendi.');
      } else {
        await api.post('/product', formData);
        toast.success('Ürün eklendi.');
      }
      closeModal();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="h-8 w-8 text-emerald-600" />
          Ürün Katalogu
        </h1>
        {role !== 'WORKER' && (
                        <button
            onClick={() => {
              setBarcodeError('');
              setIsModalOpen(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg font-bold"
          >
            <Plus className="h-5 w-5" />
            Yeni Ürün Ekle
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="İsim, SKU veya Barkod ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
        <div className="text-xs text-gray-500">
          Toplam: <span className="font-semibold text-gray-900">{filteredItems.length}</span> kayıt
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Ürün Detayı</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Kategori / Firma</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Birim / Takip</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></td></tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{item.name}</span>
                        <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded w-fit mt-1">{item.sku}</span>
                        {item.barcode && <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Barcode className="h-3 w-3" /> {item.barcode}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900">{item.category?.name}</span>
                        <span className="text-[11px] text-gray-400">{item.company?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold">{item.unit}</span>
                        {item.hasExpiration && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold">SKT TAKİBİ</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right"><ActionButton onEdit={() => handleEdit(item)} onDelete={() => handleDelete(item.id)} /></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400">Ürün bulunamadı.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" onClick={closeModal}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-100">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Package className="h-5 w-5 text-emerald-600" /> {editItem ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h3>
                  <button onClick={closeModal} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-full"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Üst Firma</label>
                      <select name="companyId" required value={formData.companyId} onChange={handleInputChange} className="block w-full rounded-lg border-gray-300 py-2.5 text-sm border focus:ring-emerald-500">
                        <option value="" disabled>Seçiniz</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                      <select name="categoryId" required value={formData.categoryId} onChange={handleInputChange} className="block w-full rounded-lg border-gray-300 py-2.5 text-sm border focus:ring-emerald-500">
                        <option value="" disabled>Seçiniz</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">Ürün Adı <span className="text-red-500">*</span></label>
                      <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="block w-full rounded-lg border-gray-300 py-2.5 text-sm border focus:ring-emerald-500" placeholder="Örn: Akıllı Telefon" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Ürün Kodu)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-600 font-bold text-xs font-mono"><Hash className="h-3 w-3" /></div>
                        <input type="text" name="sku" required value={formData.sku} onChange={handleInputChange} className="block w-full rounded-lg border-gray-300 pl-8 py-2.5 text-sm border focus:ring-emerald-500 font-mono" placeholder="Örn: ELK-001" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Barkod (EAN-13)</label>
                      <input 
                        type="text" 
                        name="barcode" 
                        maxLength={13} 
                        value={formData.barcode} 
                        onChange={handleInputChange} 
                        className={`block w-full rounded-lg border-gray-300 py-2.5 text-sm border focus:ring-emerald-500 ${barcodeError ? 'border-red-500 ring-red-500' : ''}`} 
                        placeholder="869..." 
                      />
                      {barcodeError && <p className="mt-1 text-xs text-red-500 font-medium">{barcodeError}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ölçü Birimi</label>
                      <select name="unit" value={formData.unit} onChange={handleInputChange} className="block w-full rounded-lg border-gray-300 py-2.5 text-sm border focus:ring-emerald-500">
                        {['ADET', 'KG', 'KOLI', 'LITRE', 'PALET'].map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" name="hasExpiration" checked={formData.hasExpiration} onChange={handleInputChange} className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-emerald-900">SKT Takibi</span>
                        <span className="text-[10px] text-emerald-600">Giriş ve çıkışlarda son kullanma tarihi zorunlu tutulur.</span>
                      </div>
                    </label>
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                    <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">İptal</button>
                    <button type="submit" disabled={isSubmitting} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700 shadow-md transition-all">{isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}</button>
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
