import { useState, useEffect, useMemo } from 'react';
import { Activity, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Package, Search } from 'lucide-react';
import api from '../../services/api';

const MOVEMENT_CONFIG = {
  IN: {
    label: 'Giriş',
    className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    icon: <ArrowDownCircle className="h-3.5 w-3.5" />,
  },
  OUT: {
    label: 'Çıkış',
    className: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    icon: <ArrowUpCircle className="h-3.5 w-3.5" />,
  },
  SHIPMENT: {
    label: 'Sevkiyat',
    className: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
    icon: <ArrowUpCircle className="h-3.5 w-3.5" />,
  },
  TRANSFER: {
    label: 'Transfer',
    className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    icon: <ArrowLeftRight className="h-3.5 w-3.5" />,
  },
};

function MovementBadge({ type }) {
  const config = MOVEMENT_CONFIG[type] || {
    label: type,
    className: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200',
    icon: null,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

function formatDateTime(dateString) {
  if (!dateString) return '-';
  try {

    const dateObj = new Date(new Date(dateString).getTime() + 3 * 60 * 60 * 1000);
    return new Intl.DateTimeFormat('tr-TR', { 
      dateStyle: 'short', 
      timeStyle: 'short' 
    }).format(dateObj);
  } catch {
    return dateString;
  }
}

export default function StockMovementList() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/movement');
        setMovements(res.data);
      } catch (err) {
        console.error('Stok hareketleri yüklenemedi:', err);
        setError('Stok hareketleri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    fetchMovements();
  }, []);

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const searchLower = searchQuery.toLowerCase();
      const productName = m.product?.name?.toLowerCase() || '';
      const productSku = m.product?.sku?.toLowerCase() || '';
      const destination = m.destination?.toLowerCase() || '';
      const customerName = m.customerName?.toLowerCase() || '';
      const refNo = m.referenceNumber?.toLowerCase() || '';

      return productName.includes(searchLower) || 
             productSku.includes(searchLower) || 
             destination.includes(searchLower) ||
             customerName.includes(searchLower) ||
             refNo.includes(searchLower);
    });
  }, [movements, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in">

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            Stok Hareketleri
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Tüm giriş, çıkış ve transfer işlemlerinin değişmez kaydı.
          </p>
        </div>
        

        <div className="w-full md:w-72 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Ürün, SKU veya Ref No ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
          />
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium whitespace-nowrap">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Salt Okunur
        </div>
      </div>


      {!loading && !error && movements.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(MOVEMENT_CONFIG).map(([type, config]) => {
            const count = movements.filter(m => m.type === type).length;
            return (
              <div key={type} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${config.className}`}>
                    {config.icon}
                    {config.label}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">işlem</p>
              </div>
            );
          })}
        </div>
      )}


      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih / Saat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlem Tipi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ürün
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kaynak Raf
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hedef Raf
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hedef / Alıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referans No
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Miktar
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-red-500">
                      <svg className="h-10 w-10 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-sm text-gray-600">{error}</p>
                    </div>
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Activity className="h-10 w-10 text-gray-300" />
                      <p className="text-sm">{searchQuery ? 'Aramanızla eşleşen kayıt bulunamadı.' : 'Henüz stok hareketi kaydı bulunmuyor.'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                      {formatDateTime(movement.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <MovementBadge type={movement.type} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {movement.product?.name || '-'}
                          </span>
                          {movement.product?.sku && (
                            <span className="text-xs text-gray-500 font-mono mt-0.5">
                              {movement.product.sku}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {movement.sourceRack?.name || movement.sourceRack?.code || (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {movement.destinationRack?.name || movement.destinationRack?.code || (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex flex-col gap-1">
                        {movement.shipmentType && (
                          <span className={`inline-flex w-fit px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            movement.shipmentType === 'INTERNAL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {movement.shipmentType === 'INTERNAL' ? 'Şube' : 'Müşteri'}
                          </span>
                        )}
                        <span className="font-medium text-gray-900">
                          {movement.shipmentType === 'EXTERNAL' ? movement.customerName : movement.destination}
                        </span>
                        {movement.shipmentType === 'EXTERNAL' && movement.deliveryAddress && (
                          <span className="text-[10px] text-gray-400 truncate max-w-[150px]" title={movement.deliveryAddress}>
                            {movement.deliveryAddress}
                          </span>
                        )}
                        {!movement.shipmentType && !movement.destination && <span className="text-gray-300">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      <div className="flex flex-col">
                        <span>{movement.referenceNumber || <span className="text-gray-300">—</span>}</span>
                        {movement.trackingNumber && (
                          <span className="text-[10px] text-blue-600 font-sans mt-0.5">
                            Kargo: {movement.shippingCompany || ''} {movement.trackingNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-semibold ${
                        movement.type === 'IN'
                          ? 'bg-emerald-50 text-emerald-700'
                          : movement.type === 'TRANSFER'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {movement.type === 'IN' ? '+' : movement.type === 'TRANSFER' ? '↔' : '-'}
                        {movement.quantity}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && !error && movements.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            Toplam <span className="font-semibold text-gray-700">{filteredMovements.length}</span> işlem kaydı {searchQuery && '(filtrelenmiş)'}
          </div>
        )}
      </div>
    </div>
  );
}
