/**
 * BukuToko Marketplace - Aplikasi Pembukuan Khusus Shopee & TikTok Shop
 * Versi 1.4 - Dukungan Penuh Format Resmi Shopee & TikTok Shop Seller Center
 */

// State Management & Storage
const STORAGE_KEY = 'bukutoko_marketplace_db_v1';

// ==========================================
// ARSITEKTUR MULTI-TOKO NALATIQA GROUP (5 TOKO & 15 MARKETPLACE)
// ==========================================
const STORE_ACCOUNTS = [
  { id: 'nature', name: 'Nalatiqa Nature', shortName: 'Nature', icon: '🌿', color: '#059669', badgeClass: 'badge-store-nature' },
  { id: 'health', name: 'Nalatiqa Health', shortName: 'Health', icon: '💊', color: '#2563eb', badgeClass: 'badge-store-health' },
  { id: 'storeline', name: 'Nalatiqa Storeline', shortName: 'Storeline', icon: '🏬', color: '#d97706', badgeClass: 'badge-store-storeline' },
  { id: 'nn', name: 'NN Nalatiqa', shortName: 'NN Nalatiqa', icon: '⭐', color: '#7c3aed', badgeClass: 'badge-store-nn' },
  { id: 'bud', name: 'Nalatiqa Bud', shortName: 'Bud', icon: '🌱', color: '#0d9488', badgeClass: 'badge-store-bud' }
];

let currentStoreFilter = 'all'; // 'all' | 'nature' | 'health' | 'storeline' | 'nn' | 'bud'

function getStoreMeta(storeId) {
  if (!storeId || storeId === 'all') {
    return { id: 'all', name: 'Semua Toko (Konsolidasi Perusahaan)', shortName: 'Konsolidasi', icon: '🏛️', color: '#0f172a', badgeClass: 'badge-store-holding' };
  }
  if (storeId === 'company') {
    return { id: 'company', name: 'Kantor Pusat', shortName: 'Kantor Pusat', icon: '🏢', color: '#475569', badgeClass: 'badge-store-holding' };
  }
  const found = STORE_ACCOUNTS.find(s => s.id === storeId);
  return found || { id: storeId, name: storeId, shortName: storeId, icon: '🏬', color: '#64748b', badgeClass: 'badge-secondary' };
}

function getStoreBadgeHtml(storeId) {
  const meta = getStoreMeta(storeId || 'health');
  return `<span class="badge ${meta.badgeClass}" style="display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:3px 8px;font-weight:600;">${meta.icon} ${escapeHtml(meta.shortName || meta.name)}</span>`;
}

function setStoreFilter(storeId) {
  currentStoreFilter = storeId;
  
  // Update UI pill buttons
  document.querySelectorAll('.filter-store-btn').forEach(btn => {
    if (btn.getAttribute('data-store') === storeId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update store scope indicator
  const indicator = document.getElementById('store-scope-indicator');
  const storeMeta = getStoreMeta(storeId);
  if (indicator) {
    if (storeId === 'all') {
      indicator.innerHTML = '🏛️ Mode: Konsolidasi Perusahaan (5 Toko)';
      indicator.style.background = '#e0f2fe';
      indicator.style.color = '#0369a1';
      indicator.style.borderColor = '#bae6fd';
    } else {
      indicator.innerHTML = `${storeMeta.icon} Mode Toko: <strong>${escapeHtml(storeMeta.name)}</strong>`;
      indicator.style.background = `${storeMeta.color}15`;
      indicator.style.color = storeMeta.color;
      indicator.style.borderColor = `${storeMeta.color}40`;
    }
  }

  // Sync Importer target store dropdown if present
  const impSelect = document.getElementById('importer-target-store');
  if (impSelect) {
    impSelect.value = storeId !== 'all' ? storeId : 'auto';
  }

  // Reset pagination
  if (typeof paginationState === 'object') {
    Object.keys(paginationState).forEach(k => {
      paginationState[k].page = 1;
    });
  }

  renderCurrentView();
  if (typeof showToast === 'function') {
    showToast(storeId === 'all' ? 'Menampilkan Konsolidasi Perusahaan (5 Toko)' : `Filter aktif: ${storeMeta.name}`, 'info');
  }
}
window.setStoreFilter = setStoreFilter;
window.getStoreMeta = getStoreMeta;
window.getStoreBadgeHtml = getStoreBadgeHtml;

// Format Helpers
const formatRupiah = (number) => {
  if (isNaN(number) || number === null || number === undefined) number = 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Math.round(number));
};

const formatDateIndo = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const escapeHtml = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Clean currency or number string (Indonesian or standard format)
function cleanNumber(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  let str = String(val).trim();
  
  if (str === '-' || str === '') return 0;

  // Handle accounting brackets (1.000) => -1000
  let isNegative = false;
  if (str.startsWith('(') && str.endsWith(')')) {
    isNegative = true;
    str = str.slice(1, -1);
  } else if (str.startsWith('-')) {
    isNegative = true;
    str = str.slice(1);
  }

  // Remove currency prefix and spaces
  str = str.replace(/rp|idr|\s/gi, '');

  if (str.includes('.') && str.includes(',')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes('.') && !str.includes(',')) {
    const parts = str.split('.');
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      str = str.replace(/\./g, '');
    }
  } else if (str.includes(',') && !str.includes('.')) {
    const parts = str.split(',');
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(',', '.');
    }
  }

  const num = parseFloat(str) || 0;
  return isNegative ? -num : num;
}

// Global Toast Notification Helper (Non-blocking UI feedback)
function showToast(message, type = 'info') {
  try {
    let toast = document.getElementById('app-toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast-notification';
      toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#0f172a;color:#ffffff;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 12px 30px rgba(0,0,0,0.3);z-index:999999;transition:all 0.3s cubic-bezier(0.16, 1, 0.3, 1);pointer-events:none;display:flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,0.12);';
      if (document.body) document.body.appendChild(toast);
    }
    const icon = type === 'success' ? '✅' : (type === 'error' ? '⚠️' : '⏳');
    if (toast) {
      toast.innerHTML = `<span style="font-size:15px;">${icon}</span><span>${message}</span>`;
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
      clearTimeout(toast._timer);
      toast._timer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
      }, 2800);
    }
  } catch (err) {
    console.log('[Toast]', message);
  }
}
window.showToast = showToast;

// ==========================================
// UNIVERSAL PAGINATION ENGINE (5-10 Data Per Halaman)
// ==========================================
const paginationState = {
  transactions: { page: 1, pageSize: 10 },
  capital: { page: 1, pageSize: 10 },
  stockPurchases: { page: 1, pageSize: 10 },
  expenses: { page: 1, pageSize: 25 },
  metaAds: { page: 1, pageSize: 10 },
  ads: { page: 1, pageSize: 10 },
  products: { page: 1, pageSize: 10 },
  importHistory: { page: 1, pageSize: 10 }
};

function getPaginationSlice(key, fullList) {
  if (!paginationState[key]) {
    paginationState[key] = { page: 1, pageSize: 10 };
  }
  const state = paginationState[key];
  const total = fullList.length;

  if (state.pageSize === 'all') {
    state.page = 1;
    return {
      items: fullList,
      total,
      page: 1,
      totalPages: 1,
      startIndex: total > 0 ? 1 : 0,
      endIndex: total,
      pageSize: 'all'
    };
  }

  const pSize = Number(state.pageSize) || 10;
  const totalPages = Math.max(1, Math.ceil(total / pSize));
  if (state.page > totalPages) state.page = totalPages;
  if (state.page < 1) state.page = 1;

  const startIdx = (state.page - 1) * pSize;
  const endIdx = Math.min(startIdx + pSize, total);
  const items = fullList.slice(startIdx, endIdx);

  return {
    items,
    total,
    page: state.page,
    totalPages,
    startIndex: total > 0 ? startIdx + 1 : 0,
    endIndex: endIdx,
    pageSize: pSize
  };
}

function renderPaginationBar(containerId, key, meta, onPageChangeCallbackName) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!meta || meta.total === 0) {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }
  container.style.display = 'flex';

  const { page, totalPages, total, startIndex, endIndex, pageSize } = meta;

  // Build page buttons (max 5 page buttons with smart ellipsis)
  let buttonsHtml = '';
  buttonsHtml += `
    <button class="pagination-btn" onclick="setPaginationPage('${key}', 1, ${onPageChangeCallbackName})" ${page === 1 ? 'disabled' : ''} title="Halaman Pertama">&laquo;</button>
    <button class="pagination-btn" onclick="setPaginationPage('${key}', ${page - 1}, ${onPageChangeCallbackName})" ${page === 1 ? 'disabled' : ''} title="Halaman Sebelumnya">&lsaquo;</button>
  `;

  let startP = Math.max(1, page - 2);
  let endP = Math.min(totalPages, page + 2);
  if (endP - startP < 4) {
    if (startP === 1) endP = Math.min(totalPages, startP + 4);
    else if (endP === totalPages) startP = Math.max(1, endP - 4);
  }

  for (let p = startP; p <= endP; p++) {
    buttonsHtml += `
      <button class="pagination-btn ${p === page ? 'active' : ''}" onclick="setPaginationPage('${key}', ${p}, ${onPageChangeCallbackName})">${p}</button>
    `;
  }

  buttonsHtml += `
    <button class="pagination-btn" onclick="setPaginationPage('${key}', ${page + 1}, ${onPageChangeCallbackName})" ${page >= totalPages ? 'disabled' : ''} title="Halaman Berikutnya">&rsaquo;</button>
    <button class="pagination-btn" onclick="setPaginationPage('${key}', ${totalPages}, ${onPageChangeCallbackName})" ${page >= totalPages ? 'disabled' : ''} title="Halaman Terakhir">&raquo;</button>
  `;

  const sizeSelectHtml = `
    <div class="pagination-size">
      <label style="color:var(--text-muted);margin:0;">Tampilkan:</label>
      <select onchange="setPaginationSize('${key}', this.value, ${onPageChangeCallbackName})" class="form-control" style="width:auto;display:inline-block;padding:2px 8px;font-size:12px;height:28px;">
        <option value="5" ${String(pageSize) === '5' ? 'selected' : ''}>5 data</option>
        <option value="10" ${String(pageSize) === '10' ? 'selected' : ''}>10 data</option>
        <option value="25" ${String(pageSize) === '25' ? 'selected' : ''}>25 data</option>
        <option value="50" ${String(pageSize) === '50' ? 'selected' : ''}>50 data</option>
        <option value="all" ${pageSize === 'all' ? 'selected' : ''}>Semua</option>
      </select>
    </div>
  `;

  container.innerHTML = `
    <div class="pagination-info">
      <span>Menampilkan <strong>${startIndex} - ${endIndex}</strong> dari <strong>${total}</strong> data</span>
      ${sizeSelectHtml}
    </div>
    <div class="pagination-nav">
      ${totalPages > 1 ? buttonsHtml : ''}
    </div>
  `;
}

function setPaginationPage(key, pageNum, callback) {
  if (!paginationState[key]) paginationState[key] = { page: 1, pageSize: 10 };
  paginationState[key].page = pageNum;
  if (typeof callback === 'function') callback();
}

function setPaginationSize(key, sizeVal, callback) {
  if (!paginationState[key]) paginationState[key] = { page: 1, pageSize: 10 };
  paginationState[key].pageSize = sizeVal === 'all' ? 'all' : Number(sizeVal);
  paginationState[key].page = 1;
  if (typeof callback === 'function') callback();
}

// Initial Data for Marketplace Sellers (Untouched, preserved exactly as existing)
const getInitialDemoData = () => {
  return {
    settings: {
      storeName: "TOKO NALATIQA",
      ownerName: "TOKO NALATIQA",
      shopeeStoreName: "nalatiqahealth",
      tiktokStoreName: "@nalatiqahealth",
      lazadaStoreName: "Nalatiqa LazMall",
      shopeeDefaultAdminFee: 9.0,
      shopeeDefaultServiceFee: 4.5,
      tiktokDefaultCommission: 5.0,
      tiktokDefaultServiceFee: 1.0,
      lazadaDefaultCommission: 5.0,
      lazadaDefaultPaymentFee: 2.0,
      defaultHppPercentage: 45.0,
      lastBackupDate: null
    },
    products: [
      { id: 'PRD-001', sku: '52667818737', name: 'Vitamin D3 + K2 10000IU + Calcium Magnesium Zinc + Vitamin C + Astaxanthin Premium, 60 Kapsul', category: 'Kesehatan & Suplemen', sellPrice: 69900, hpp: 32000, stock: 120 },
      { id: 'PRD-002', sku: '47417845516', name: 'Verdavita 3-IN-1 120pcs Vitamin D3 Tulang & Gigi Kalsium Magnesium & Seng Kapsul Suplement Mineral', category: 'Kesehatan & Suplemen', sellPrice: 84900, hpp: 39000, stock: 85 },
      { id: 'PRD-003', sku: '53817830109', name: 'Sandhus Vitamin D3 + K2 10000IU + Calcium Magnesium Zinc + Vitamin C + Astaxanthin Premium, 60 Kapsul', category: 'Kesehatan & Suplemen', sellPrice: 69900, hpp: 32000, stock: 95 }
    ],
    transactions: [],
    ads: [
      { id: 'ADS-001', date: '2026-09-20', channel: 'shopee', campaignType: 'Iklan Kata Kunci (Vitamin D3 + K2)', spend: 35000, salesGross: 224700, notes: 'Target Pencarian Suplemen Tulang' }
    ],
    expenses: [
      { id: 'EXP-001', date: '2026-09-15', category: 'hpp_belanja', title: 'HPP Belanja Modal Barang (Kulakan Batch September)', amount: 320000, paymentMethod: 'Transfer BCA', notes: 'Dihitung manual sesuai 10 botol terjual' },
      { id: 'EXP-002', date: '2026-09-18', category: 'packing', title: 'Bubble Wrap Tebal 50 Meter & Kardus Box Suplemen', amount: 45000, paymentMethod: 'Transfer BCA', notes: 'Packing botol suplemen agar aman' },
      { id: 'EXP-003', date: '2026-09-20', category: 'tools', title: 'Kertas Thermal Label Resi SPX 100x150mm', amount: 25000, paymentMethod: 'ShopeePay', notes: 'Cetak resi kurir' }
    ],
    stockPurchases: [],
    metaAds: [
      {
        id: 'META-001',
        date: '2026-09-21',
        campaignName: 'CPAS Shopee & Lazada - Promo Bundling Suplemen Vitamin D3',
        adAccount: 'BM Nalatiqa Health 01',
        amount: 75000,
        paymentMethod: 'Kartu Kredit / Debit Online',
        notes: 'Iklan Carousel IG & FB Feed, target ROAS 4.2x'
      }
    ],
    capitalInjections: [
      {
        id: 'CAP-001',
        date: '2026-09-01',
        category: 'pinjaman_hutang',
        source: 'Bank Mandiri (KUR Mikro Usaha)',
        amount: 15000000,
        account: 'Rekening Bank Mandiri',
        notes: 'Pinjaman modal usaha awal toko bunga rendah',
        dueDate: '2027-09-01',
        debtTerms: 'Tenor 12 bulan, subsidi bunga KUR 6%'
      },
      {
        id: 'CAP-002',
        date: '2026-09-05',
        category: 'modal_pemilik',
        source: 'Tabungan Pribadi Pemilik Toko',
        amount: 10000000,
        account: 'Rekening Bank Utama (BCA)',
        notes: 'Setoran modal segar awal pembukaan toko',
        dueDate: '',
        debtTerms: ''
      },
      {
        id: 'CAP-003',
        date: '2026-10-01',
        category: 'laba_keuntungan',
        source: 'Keuntungan Bersih Toko (Laba Ditahan Bulan September)',
        amount: 5000000,
        account: 'Rekening Bank Utama (BCA)',
        notes: 'Reinvestasi laba bersih toko untuk tambahan belanja stok suplemen',
        dueDate: '',
        debtTerms: ''
      },
      {
        id: 'CAP-004',
        date: '2026-10-15',
        category: 'bayar_hutang',
        parentDebtId: 'CAP-001',
        source: 'Cicilan Pokok Bank Mandiri (KUR)',
        amount: 3000000,
        account: 'Rekening Bank Mandiri',
        notes: 'Pembayaran cicilan angsuran pokok ke-1 via auto-debet',
        dueDate: '',
        debtTerms: ''
      }
    ],
    importHistory: []
  };
};

// Database Service
class DBService {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        // One-time reset per user request: bersihkan riwayat impor dan hapus semua data pesanan
        if (!localStorage.getItem('bukutoko_cleaned_orders_v7')) {
          parsed.transactions = [];
          parsed.importHistory = [];
          localStorage.setItem('bukutoko_cleaned_orders_v7', 'true');
          this.saveData(parsed);
          return parsed;
        }

        if (!parsed.importHistory) parsed.importHistory = [];
        if (!parsed.stockPurchases) parsed.stockPurchases = [];
        if (!parsed.metaAds || parsed.metaAds.length === 0) {
          if (parsed.transactions && parsed.transactions.some(t => t.id === 'TRX-001')) {
            parsed.metaAds = getInitialDemoData().metaAds;
            this.saveData(parsed);
          } else {
            parsed.metaAds = [];
          }
        }
        if (!parsed.capitalInjections || parsed.capitalInjections.length === 0) {
          if (parsed.transactions && parsed.transactions.some(t => t.id === 'TRX-001')) {
            parsed.capitalInjections = getInitialDemoData().capitalInjections;
            this.saveData(parsed);
          } else {
            parsed.capitalInjections = [];
          }
        }
        // Seed Lazada demo orders if on demo dataset
        if (parsed.transactions && parsed.transactions.some(t => t.id === 'TRX-001') && !parsed.transactions.some(t => t.channel === 'lazada')) {
          const demoLazada = getInitialDemoData().transactions.filter(t => t.channel === 'lazada');
          parsed.transactions.push(...demoLazada);
          this.saveData(parsed);
        }
        // Update default storeName to PT NALATIQA GROUP
        if (!parsed.settings) parsed.settings = {};
        if (!parsed.settings.storeName || parsed.settings.storeName === 'Toko Saya' || parsed.settings.storeName === 'Berkah Store' || parsed.settings.storeName === 'Berkah Official Store' || parsed.settings.storeName === 'Nalatiqa Health Store' || parsed.settings.storeName === 'TOKO NALATIQA') {
          parsed.settings.storeName = 'PT NALATIQA GROUP';
          this.saveData(parsed);
        }

        // Multi-Store Auto-Tagging for Backward Compatibility
        if (parsed.transactions && parsed.transactions.length > 0) {
          parsed.transactions.forEach(t => {
            if (!t.storeId) {
              t.storeId = 'health';
              t.storeAccount = 'Nalatiqa Health';
            }
          });
        }
        if (parsed.products && parsed.products.length > 0) {
          parsed.products.forEach(p => {
            if (!p.storeId) {
              p.storeId = 'health';
              p.storeAccount = 'Nalatiqa Health';
            }
          });
        }
        if (parsed.stockPurchases && parsed.stockPurchases.length > 0) {
          parsed.stockPurchases.forEach(s => {
            if (!s.storeId) {
              s.storeId = 'health';
              s.storeAccount = 'Nalatiqa Health';
            }
          });
        }
        if (parsed.expenses && parsed.expenses.length > 0) {
          parsed.expenses.forEach(e => {
            if (!e.storeId) {
              e.storeId = 'health';
              e.storeAccount = 'Nalatiqa Health';
            }
          });
        }
        if (parsed.ads && parsed.ads.length > 0) {
          parsed.ads.forEach(a => {
            if (!a.storeId) {
              a.storeId = 'health';
              a.storeAccount = 'Nalatiqa Health';
            }
          });
        }
        if (parsed.metaAds && parsed.metaAds.length > 0) {
          parsed.metaAds.forEach(m => {
            if (!m.storeId) {
              m.storeId = 'health';
              m.storeAccount = 'Nalatiqa Health';
            }
          });
        }
        if (parsed.capitalInjections && parsed.capitalInjections.length > 0) {
          parsed.capitalInjections.forEach(c => {
            if (!c.storeId) {
              c.storeId = 'company';
              c.storeAccount = 'Holding Perusahaan';
            }
          });
        }

        return parsed;
      }
    } catch (e) {
      console.error('Error loading data from localStorage:', e);
    }
    const initial = getInitialDemoData();
    if (!initial.stockPurchases) initial.stockPurchases = [];
    if (!initial.metaAds) initial.metaAds = [];
    if (!initial.capitalInjections) initial.capitalInjections = [];
    this.saveData(initial);
    return initial;
  }

  saveData(data) {
    try {
      if (!data.stockPurchases) data.stockPurchases = [];
      if (!data.metaAds) data.metaAds = [];
      if (!data.capitalInjections) data.capitalInjections = [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.data = data;
    } catch (e) {
      console.error('Error saving data to localStorage:', e);
      alert('Gagal menyimpan data ke memori browser!');
    }
  }

  getStore() {
    if (!this.data.stockPurchases) this.data.stockPurchases = [];
    if (!this.data.metaAds) this.data.metaAds = [];
    if (!this.data.capitalInjections) this.data.capitalInjections = [];
    return this.data;
  }

  resetToDemo() {
    const demo = getInitialDemoData();
    if (!demo.stockPurchases) demo.stockPurchases = [];
    if (!demo.metaAds) demo.metaAds = [];
    if (!demo.capitalInjections) demo.capitalInjections = [];
    this.saveData(demo);
    return demo;
  }

  clearAllData() {
    const empty = {
      settings: {
        storeName: "Toko Saya",
        ownerName: "Penjual",
        shopeeStoreName: "",
        tiktokStoreName: "",
        lazadaStoreName: "",
        shopeeDefaultAdminFee: 9.0,
        shopeeDefaultServiceFee: 4.5,
        tiktokDefaultCommission: 5.0,
        tiktokDefaultServiceFee: 1.0,
        lazadaDefaultCommission: 5.0,
        lazadaDefaultPaymentFee: 2.0,
        defaultHppPercentage: 45.0,
        lastBackupDate: null
      },
      products: [],
      transactions: [],
      stockPurchases: [],
      metaAds: [],
      capitalInjections: [],
      ads: [],
      expenses: [],
      importHistory: []
    };
    this.saveData(empty);
    return empty;
  }
}

// Global DB instance
const db = new DBService();

// Application State
let currentTab = 'dashboard';
let dateFilter = 'all';
let channelFilter = 'all';
let customStartDate = '';
let customEndDate = '';
let profitSharingBasis = 'profit'; // 'profit' (Laba Bersih Usaha - Default Rekomendasi Utama) | 'settlement' (Pencairan Penjualan Bersih)

// Staged Import State
let stagedImportTransactions = [];
let stagedImportMeta = null;
let stagedHppProductMap = {};

// Helper Filter Function
function getFilteredRecords(records, dateField = 'date') {
  if (!records || !Array.isArray(records)) return [];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  return records.filter(item => {
    // 1. Channel Filter
    if (channelFilter !== 'all' && item.channel && item.channel !== channelFilter) {
      return false;
    }

    // 2. Store Account Filter (nature | health | storeline | nn | bud)
    if (currentStoreFilter !== 'all') {
      const itemStore = item.storeId || (item.storeAccount ? item.storeAccount.toLowerCase() : 'health');
      if (item.storeId === 'all') {
        // Shared item across all stores (e.g. shared product in catalog)
      } else if (itemStore !== currentStoreFilter) {
        if (!item.storeId && currentStoreFilter === 'health') {
          // Backward compatibility default
        } else {
          return false;
        }
      }
    }

    // 3. Date Filter
    const itemDateStr = item[dateField];
    if (!itemDateStr && !item.startDate) return true;

    let itemStart = String(item.startDate || itemDateStr).trim().replace(/\//g, '-');
    if (itemStart.includes('T')) itemStart = itemStart.split('T')[0];
    let itemEnd = String(item.endDate || item.startDate || itemDateStr).trim().replace(/\//g, '-');
    if (itemEnd.includes('T')) itemEnd = itemEnd.split('T')[0];

    if (dateFilter === 'today') {
      return itemStart <= todayStr && itemEnd >= todayStr;
    } else if (dateFilter === '7days') {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 6);
      const d7Str = d7.toISOString().split('T')[0];
      return itemStart <= todayStr && itemEnd >= d7Str;
    } else if (dateFilter === 'month') {
      const mStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      return itemStart <= mEnd && itemEnd >= mStart;
    } else if (dateFilter === 'lastmonth') {
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const lmStart = new Date(prevYear, prevMonth, 1).toISOString().split('T')[0];
      const lmEnd = new Date(prevYear, prevMonth + 1, 0).toISOString().split('T')[0];
      return itemStart <= lmEnd && itemEnd >= lmStart;
    } else if (dateFilter === 'custom') {
      const cStart = customStartDate || '0000-00-00';
      const cEnd = customEndDate || '9999-99-99';
      return itemStart <= cEnd && itemEnd >= cStart;
    }
    return true;
  });
}

// Compute individual performance breakdown for the 5 stores (Nature, Health, Storeline, NN, Bud)
function computeStoreBreakdown() {
  const store = db.getStore();
  const savedStoreFilter = currentStoreFilter;
  currentStoreFilter = 'all'; // Temporarily relax store filter to evaluate all 5 stores with current date & channel
  const allTxs = getFilteredRecords(store.transactions || []);
  const allAds = getFilteredRecords(store.ads || []);
  const allMetaAds = getFilteredRecords(store.metaAds || [], 'date');
  const allExpenses = getFilteredRecords(store.expenses || [], 'date');
  const allStock = getFilteredRecords(store.stockPurchases || [], 'date');
  currentStoreFilter = savedStoreFilter;

  const storeRows = STORE_ACCOUNTS.map(acc => {
    const storeTxs = allTxs.filter(t => (t.storeId || 'health') === acc.id);
    let gross = 0;
    let deductions = 0;
    let net = 0;
    let orderCount = 0;

    storeTxs.forEach(t => {
      if (t.status === 'cancelled') return;
      orderCount++;
      gross += Number(t.grossSales || 0);
      const ded = Number(t.adminFee || 0) + Number(t.serviceFee || 0) + Number(t.transactionFee || 0) + Number(t.voucherFee || 0);
      deductions += ded;
      net += Number(t.netSettlement || (t.grossSales - ded));
    });

    const storeStock = allStock.filter(s => (s.storeId || 'health') === acc.id);
    let hpp = 0;
    storeStock.forEach(s => hpp += Number(s.totalCost || 0));

    const storeAds = allAds.filter(a => (a.storeId || 'health') === acc.id);
    let adsSpend = 0;
    storeAds.forEach(a => adsSpend += Number(a.spend || 0));

    const storeMeta = allMetaAds.filter(m => (m.storeId || 'health') === acc.id);
    let metaSpend = 0;
    storeMeta.forEach(m => {
      const amt = Number(m.amount || 0);
      const fee = m.topUpFee !== undefined ? Number(m.topUpFee) : Math.round(amt * 0.05);
      const ppn = m.ppnAmount !== undefined ? Number(m.ppnAmount) : Math.round(fee * 0.11);
      const tot = m.totalAmount !== undefined ? Number(m.totalAmount) : (amt + fee + ppn);
      metaSpend += tot;
    });
    const totalAds = adsSpend + metaSpend;

    const storeExpenses = allExpenses.filter(e => (e.storeId || 'health') === acc.id);
    let opex = 0;
    storeExpenses.forEach(e => {
      const amt = Number(e.amount || 0);
      if (e.category === 'hpp_belanja') {
        hpp += amt;
      } else {
        opex += amt;
      }
    });

    const netProfit = (net - hpp) - totalAds - opex;
    const margin = gross > 0 ? (netProfit / gross) * 100 : 0;

    return {
      store: acc,
      orderCount,
      gross,
      deductions,
      net,
      hpp,
      totalAds,
      opex,
      netProfit,
      margin
    };
  });

  // Include company / holding level purchases or expenses if present (Kantor Pusat)
  const compStock = allStock.filter(s => s.storeId === 'company');
  const compAds = allAds.filter(a => a.storeId === 'company');
  const compMeta = allMetaAds.filter(m => m.storeId === 'company');
  const compExpenses = allExpenses.filter(e => e.storeId === 'company');

  let compHpp = 0;
  compStock.forEach(s => compHpp += Number(s.totalCost || 0));
  let compAdsSpend = 0;
  compAds.forEach(a => compAdsSpend += Number(a.spend || 0));
  let compMetaSpend = 0;
  compMeta.forEach(m => {
    const amt = Number(m.amount || 0);
    const fee = m.topUpFee !== undefined ? Number(m.topUpFee) : Math.round(amt * 0.05);
    const ppn = m.ppnAmount !== undefined ? Number(m.ppnAmount) : Math.round(fee * 0.11);
    const tot = m.totalAmount !== undefined ? Number(m.totalAmount) : (amt + fee + ppn);
    compMetaSpend += tot;
  });
  const compTotalAds = compAdsSpend + compMetaSpend;
  let compOpex = 0;
  compExpenses.forEach(e => {
    const amt = Number(e.amount || 0);
    if (e.category === 'hpp_belanja') {
      compHpp += amt;
    } else {
      compOpex += amt;
    }
  });

  if (compHpp > 0 || compTotalAds > 0 || compOpex > 0) {
    storeRows.push({
      store: { id: 'company', name: '🏢 Kantor Pusat / Beban Bersama', shortName: 'Kantor Pusat', icon: '🏢', color: '#475569', badgeClass: 'badge-store-holding' },
      orderCount: 0,
      gross: 0,
      deductions: 0,
      net: 0,
      hpp: compHpp,
      totalAds: compTotalAds,
      opex: compOpex,
      netProfit: -(compHpp + compTotalAds + compOpex),
      margin: 0
    });
  }

  return storeRows;
}

// Calculations & Financial Metrics
function computeMetrics() {
  const store = db.getStore();
  const txs = getFilteredRecords(store.transactions);
  const ads = getFilteredRecords(store.ads);
  const metaAds = getFilteredRecords(store.metaAds || [], 'date');
  const expenses = getFilteredRecords(store.expenses);
  const stockPurchases = getFilteredRecords(store.stockPurchases || [], 'date');

  let grossSales = 0;
  let totalDeductions = 0;
  let netSettlement = 0;
  let shopeeGross = 0;
  let shopeeNet = 0;
  let tiktokGross = 0;
  let tiktokNet = 0;
  let lazadaGross = 0;
  let lazadaNet = 0;
  let pendingSettlement = 0;
  let totalQtySold = 0;

  txs.forEach(t => {
    if (t.status === 'cancelled') return;

    totalQtySold += Number(t.qty || 1);
    grossSales += Number(t.grossSales || 0);
    const deductions = Number(t.adminFee || 0) + Number(t.serviceFee || 0) + Number(t.transactionFee || 0) + Number(t.voucherFee || 0);
    totalDeductions += deductions;
    
    const net = Number(t.netSettlement || (t.grossSales - deductions));
    netSettlement += net;

    if (t.channel === 'shopee') {
      shopeeGross += Number(t.grossSales || 0);
      shopeeNet += net;
    } else if (t.channel === 'tiktok') {
      tiktokGross += Number(t.grossSales || 0);
      tiktokNet += net;
    } else if (t.channel === 'lazada') {
      lazadaGross += Number(t.grossSales || 0);
      lazadaNet += net;
    }

    if (t.status === 'pending') {
      pendingSettlement += net;
    }
  });

  // Calculate Belanja Modal Barang (HPP Belanja) from expenses ('hpp_belanja') and legacy stock purchases
  let hppFromExpenses = 0;
  let totalOpex = 0;
  expenses.forEach(e => {
    const amt = Number(e.amount || 0);
    if (e.category === 'hpp_belanja') {
      hppFromExpenses += amt;
    } else {
      totalOpex += amt;
    }
  });

  let totalStockPurchases = 0;
  let totalStockQty = 0;
  stockPurchases.forEach(sp => {
    totalStockPurchases += Number(sp.totalCost || 0);
    totalStockQty += Number(sp.qty || 0);
  });

  const hppTotal = hppFromExpenses + totalStockPurchases;
  const grossProfit = netSettlement - hppTotal;

  let totalAdsSpend = 0;
  ads.forEach(a => totalAdsSpend += Number(a.spend || 0));

  let totalMetaAds = 0;
  metaAds.forEach(m => {
    const amt = Number(m.amount || 0);
    const fee = m.topUpFee !== undefined ? Number(m.topUpFee) : Math.round(amt * 0.05);
    const ppn = m.ppnAmount !== undefined ? Number(m.ppnAmount) : Math.round(fee * 0.11);
    const tot = m.totalAmount !== undefined ? Number(m.totalAmount) : (amt + fee + ppn);
    totalMetaAds += tot;
  });

  const allAdsTotal = totalAdsSpend + totalMetaAds;

  const netProfit = grossProfit - allAdsTotal - totalOpex;
  const netMargin = grossSales > 0 ? (netProfit / grossSales) * 100 : 0;

  // Permodalan & Arus Kas Riil (Pinjaman, Laba Ditahan, Modal Pemilik, Hutang)
  // CATATAN AKUNTANSI UTAMA:
  // Modal kas masuk perusahaan (sebesar Rp 29.000.000) adalah Kas/Modal Perusahaan (Holding/Pusat).
  // Modal ini TIDAK masuk ke masing-masing 5 toko. Ke-5 toko menghasilkan pendapatan murni dari PENJUALAN.
  const isConsolidated = currentStoreFilter === 'all' || currentStoreFilter === 'company';
  
  const rawCapital = store.capitalInjections || [];
  const capitalInjections = rawCapital.filter(c => {
    const cStore = c.storeId || 'company';
    if (isConsolidated) {
      return true; // Mode Konsolidasi Perusahaan menghitung seluruh kas modal & hutang perusahaan
    } else {
      // Mode Toko individual HANYA menghitung jika ada modal masuk khusus yang dialokasikan ke toko tersebut
      return cStore === currentStoreFilter;
    }
  });

  let totalCapitalIn = 0;
  let totalDebtIn = 0;
  let totalProfitReinvest = 0;
  let totalOwnerCapital = 0;
  let totalInvestorCapital = 0;
  let totalDebtRepaid = 0;
  let totalWithdrawnPrive = 0;

  capitalInjections.forEach(c => {
    const amt = Number(c.amount || 0);
    if (c.category === 'pinjaman_hutang') {
      totalDebtIn += amt;
      totalCapitalIn += amt;
    } else if (c.category === 'laba_keuntungan') {
      totalProfitReinvest += amt;
      totalCapitalIn += amt;
    } else if (c.category === 'modal_pemilik') {
      totalOwnerCapital += amt;
      totalCapitalIn += amt;
    } else if (c.category === 'investor_lainnya') {
      totalInvestorCapital += amt;
      totalCapitalIn += amt;
    } else if (c.category === 'bayar_hutang') {
      totalDebtRepaid += amt;
    } else if (c.category === 'prive_penarikan') {
      totalWithdrawnPrive += amt;
    }
  });

  const remainingDebt = Math.max(0, totalDebtIn - totalDebtRepaid);

  // Total Modal Kas Perusahaan (Holding) untuk info pembanding saat melihat toko cabang
  let companyHoldingCapitalIn = 0;
  let companyHoldingDebt = 0;
  rawCapital.forEach(c => {
    const amt = Number(c.amount || 0);
    if (c.category === 'pinjaman_hutang' || c.category === 'laba_keuntungan' || c.category === 'modal_pemilik' || c.category === 'investor_lainnya') {
      companyHoldingCapitalIn += amt;
    }
    if (c.category === 'pinjaman_hutang') companyHoldingDebt += amt;
    if (c.category === 'bayar_hutang') companyHoldingDebt -= amt;
  });
  companyHoldingDebt = Math.max(0, companyHoldingDebt);

  // Real cash on hand:
  // - Di level Konsolidasi (Holding): Modal Masuk Perusahaan (Rp 29jt) + Saldo Cair 5 Toko - HPP - Opex - Ads - Cicilan - Pencairan Bagi Hasil (Prive)
  // - Di level Toko Cabang: Murni Saldo Kas Hasil Penjualan Marketplace (Net Settlement) - HPP Belanja Toko - Opex Toko - Ads Toko + Modal Khusus Toko (jika ada) - Prive
  const netCashBalance = (totalCapitalIn + netSettlement) - (hppTotal + totalOpex + allAdsTotal + totalDebtRepaid + totalWithdrawnPrive);

  return {
    isConsolidated,
    companyHoldingCapitalIn,
    companyHoldingDebt,
    txCount: txs.length,
    totalQtySold,
    grossSales,
    totalDeductions,
    netSettlement,
    pendingSettlement,
    totalStockPurchases,
    totalStockQty,
    hppTotal,
    grossProfit,
    totalAdsSpend,
    totalMetaAds,
    allAdsTotal,
    totalOpex,
    netProfit,
    netMargin,
    totalCapitalIn,
    totalDebtIn,
    totalProfitReinvest,
    totalOwnerCapital,
    totalInvestorCapital,
    totalDebtRepaid,
    totalWithdrawnPrive,
    remainingDebt,
    netCashBalance,
    shopeeGross,
    shopeeNet,
    tiktokGross,
    tiktokNet,
    lazadaGross,
    lazadaNet
  };
}

// Navigation Handler
function switchTab(tabName) {
  currentTab = tabName;
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  document.querySelectorAll('.tab-view').forEach(view => {
    view.style.display = view.id === `view-${tabName}` ? 'block' : 'none';
  });

  const titles = {
    dashboard: { title: 'Dashboard Keuangan', subtitle: 'Ringkasan performa penjualan Shopee, TikTok Shop & Lazada' },
    transactions: { title: 'Penjualan & Settlement', subtitle: 'Kelola order pesanan, potongan biaya admin, dan saldo cair marketplace' },
    importer: { title: 'Pusat Import Laporan Marketplace', subtitle: 'Unggah file laporan keuangan resmi Shopee, TikTok Shop & Lazada' },
    expenses: { title: 'Beban Operasional & HPP Belanja', subtitle: 'Catat pengeluaran HPP belanja modal barang dan biaya operasional toko' },
    capital: { title: 'Buku Kas & Modal Usaha', subtitle: 'Catat kas modal awal dari pinjaman hutang, modal dari keuntungan toko, dan setoran pribadi' },
    'meta-ads': { title: 'Buku Kas Iklan (Meta)', subtitle: 'Pencatatan pengeluaran Facebook Ads, Instagram Ads, CPAS & kampanye Meta' },
    products: { title: 'Katalog Produk & SKU', subtitle: 'Data produk, SKU barang, harga jual, dan stok' },
    ads: { title: 'Buku Kas Iklan Marketplace', subtitle: 'Pantau biaya ads Shopee, TikTok & Lazada, omset iklan, dan Return on Ad Spend (ROAS)' },
    pnl: { title: 'Laporan Laba Rugi (P&L)', subtitle: 'Laporan laba bersih siap cetak atau ekspor ke PDF' },
    settings: { title: 'Pengaturan & Backup Data', subtitle: 'Profil identitas usaha, pencadangan dan pemulihan data keuangan' }
  };

  const header = titles[tabName] || { title: 'BukuToko Marketplace', subtitle: '' };
  document.getElementById('page-title').textContent = header.title;
  document.getElementById('page-subtitle').textContent = header.subtitle;

  renderCurrentView();
}

function renderCurrentView() {
  if (currentTab === 'dashboard') renderDashboard();
  else if (currentTab === 'transactions') renderTransactions();
  else if (currentTab === 'importer') renderImporterView();
  else if (currentTab === 'expenses') renderExpenses();
  else if (currentTab === 'capital') renderCapitalView();
  else if (currentTab === 'meta-ads') renderMetaAdsTable();
  else if (currentTab === 'products') renderProducts();
  else if (currentTab === 'ads') renderAds();
  else if (currentTab === 'pnl') renderPnL();
  else if (currentTab === 'settings') renderSettings();
}

// Render Dashboard View
function renderDashboard() {
  const metrics = computeMetrics();
  const store = db.getStore();

  const titleEl = document.getElementById('page-title');
  const subtitleEl = document.getElementById('page-subtitle');
  if (currentStoreFilter === 'all') {
    if (titleEl) titleEl.textContent = 'Dashboard Keuangan Konsolidasi (PT NALATIQA GROUP)';
    if (subtitleEl) subtitleEl.textContent = 'Ringkasan performa 5 Akun Toko & 15 Marketplace (Shopee, TikTok Shop & Lazada)';
  } else {
    const currentStoreMeta = getStoreMeta(currentStoreFilter);
    if (titleEl) titleEl.textContent = `Dashboard Keuangan - ${currentStoreMeta.name}`;
    if (subtitleEl) subtitleEl.textContent = `Ringkasan performa penjualan Shopee, TikTok Shop & Lazada khusus ${currentStoreMeta.name}`;
  }

  document.getElementById('sidebar-store-name').textContent = store.settings.storeName || 'PT NALATIQA GROUP';
  document.getElementById('sidebar-store-avatar').textContent = (store.settings.storeName || 'N').charAt(0).toUpperCase();

  // Multi-Store Matrix Card & Active Store Banner
  const matrixCard = document.getElementById('dashboard-store-matrix-card');
  const activeBanner = document.getElementById('dashboard-store-active-banner');
  const matrixTbody = document.getElementById('store-matrix-tbody');

  if (currentStoreFilter === 'all') {
    if (activeBanner) activeBanner.style.display = 'none';
    if (matrixCard) matrixCard.style.display = 'block';

    if (matrixTbody) {
      const breakdown = computeStoreBreakdown();
      let totalGross = 0;
      let totalNet = 0;
      let totalDeductions = 0;
      let totalHpp = 0;
      let totalAds = 0;
      let totalOpex = 0;
      let totalNetProfit = 0;

      const rowsHtml = breakdown.map(item => {
        totalGross += item.gross;
        totalNet += item.net;
        totalDeductions += item.deductions;
        totalHpp += item.hpp;
        totalAds += item.totalAds;
        totalOpex += item.opex;
        totalNetProfit += item.netProfit;

        return `
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:20px;">${item.store.icon}</span>
                <div>
                  <div style="font-weight:700;color:var(--text-dark);">${escapeHtml(item.store.name)}</div>
                  <div style="font-size:11px;color:var(--text-muted);">${item.orderCount} pesanan marketplace</div>
                </div>
              </div>
            </td>
            <td style="text-align:right;font-weight:600;">${formatRupiah(item.gross)}</td>
            <td style="text-align:right;color:#047857;font-weight:700;">${formatRupiah(item.net)}</td>
            <td style="text-align:right;color:#b91c1c;">${item.deductions > 0 ? `(${formatRupiah(item.deductions)})` : 'Rp 0'}</td>
            <td style="text-align:right;color:#b45309;">${item.hpp > 0 ? `(${formatRupiah(item.hpp)})` : 'Rp 0'}</td>
            <td style="text-align:right;color:#4338ca;">${item.totalAds > 0 ? `(${formatRupiah(item.totalAds)})` : 'Rp 0'}</td>
            <td style="text-align:right;color:#6b7280;">${item.opex > 0 ? `(${formatRupiah(item.opex)})` : 'Rp 0'}</td>
            <td style="text-align:right;font-weight:800;color:${item.netProfit >= 0 ? '#059669' : '#dc2626'};">${formatRupiah(item.netProfit)}</td>
            <td style="text-align:center;">
              <span class="badge ${item.netProfit >= 0 ? 'badge-success' : 'badge-danger'}" style="font-size:11px;font-weight:700;">
                ${item.margin.toFixed(1)}%
              </span>
            </td>
            <td style="text-align:center;">
              <button class="btn btn-sm btn-outline-primary" onclick="setStoreFilter('${item.store.id}')" style="padding:4px 10px;font-size:11px;font-weight:700;white-space:nowrap;">
                Buka Toko Ini &rarr;
              </button>
            </td>
          </tr>
        `;
      }).join('');

      const totalMargin = totalGross > 0 ? (totalNetProfit / totalGross) * 100 : 0;
      const totalRowHtml = `
        <tr class="total-row">
          <td>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:20px;">🏛️</span>
              <div>
                <div style="font-weight:800;color:var(--text-dark);">TOTAL KONSOLIDASI (5 TOKO)</div>
                <div style="font-size:11px;color:var(--text-muted);">15 Toko Marketplace Terkonsolidasi</div>
              </div>
            </div>
          </td>
          <td style="text-align:right;font-weight:800;">${formatRupiah(totalGross)}</td>
          <td style="text-align:right;color:#047857;font-weight:800;">${formatRupiah(totalNet)}</td>
          <td style="text-align:right;color:#b91c1c;font-weight:800;">${totalDeductions > 0 ? `(${formatRupiah(totalDeductions)})` : 'Rp 0'}</td>
          <td style="text-align:right;color:#b45309;font-weight:800;">${totalHpp > 0 ? `(${formatRupiah(totalHpp)})` : 'Rp 0'}</td>
          <td style="text-align:right;color:#4338ca;font-weight:800;">${totalAds > 0 ? `(${formatRupiah(totalAds)})` : 'Rp 0'}</td>
          <td style="text-align:right;color:#6b7280;font-weight:800;">${totalOpex > 0 ? `(${formatRupiah(totalOpex)})` : 'Rp 0'}</td>
          <td style="text-align:right;font-weight:800;font-size:14px;color:${totalNetProfit >= 0 ? '#059669' : '#dc2626'};">${formatRupiah(totalNetProfit)}</td>
          <td style="text-align:center;">
            <span class="badge ${totalNetProfit >= 0 ? 'badge-success' : 'badge-danger'}" style="font-size:11px;font-weight:800;">
              ${totalMargin.toFixed(1)}%
            </span>
          </td>
          <td style="text-align:center;">
            <span class="badge badge-primary" style="font-size:10px;padding:3px 6px;">Holding Aktif</span>
          </td>
        </tr>
      `;

      matrixTbody.innerHTML = rowsHtml + totalRowHtml;
    }
  } else {
    if (matrixCard) matrixCard.style.display = 'none';
    if (activeBanner) {
      activeBanner.style.display = 'flex';
      const storeMeta = getStoreMeta(currentStoreFilter);
      activeBanner.innerHTML = `
        <div class="store-context-info">
          <div class="store-context-icon" style="background:${storeMeta.color}15;border:1px solid ${storeMeta.color}35;">
            ${storeMeta.icon}
          </div>
          <div>
            <div style="font-size:16px;font-weight:800;color:var(--text-dark);display:flex;align-items:center;gap:8px;">
              <span>${escapeHtml(storeMeta.name)}</span>
              <span class="badge ${storeMeta.badgeClass}" style="font-size:10px;">Scope Toko Aktif</span>
            </div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
              Menampilkan data pembukuan mandiri (Shopee, TikTok Shop & Lazada) khusus untuk akun toko <strong>${escapeHtml(storeMeta.name)}</strong>
            </div>
          </div>
        </div>
        <button class="btn btn-sm btn-outline-primary" onclick="setStoreFilter('all')" style="font-weight:700;background:#ffffff;box-shadow:var(--shadow-sm);">
          🏛️ Kembali ke Konsolidasi Perusahaan (Semua Toko)
        </button>
      `;
    }
  }

  document.getElementById('kpi-omset').textContent = formatRupiah(metrics.grossSales);
  const omsetSubEl = document.querySelector('.kpi-card.highlight-omset .kpi-subtext');
  if (omsetSubEl) {
    omsetSubEl.textContent = `${metrics.txCount} total transaksi pesanan`;
  }
  document.getElementById('kpi-deduction').textContent = formatRupiah(metrics.totalDeductions);
  document.getElementById('kpi-net-settlement').textContent = formatRupiah(metrics.netSettlement);
  document.getElementById('kpi-hpp').textContent = formatRupiah(metrics.hppTotal);
  document.getElementById('kpi-ads').textContent = formatRupiah(metrics.allAdsTotal);
  const kpiAdsSub = document.getElementById('kpi-ads-subtext');
  if (kpiAdsSub) {
    if (metrics.allAdsTotal > 0 && metrics.grossSales > 0) {
      const dashRoas = (metrics.grossSales / metrics.allAdsTotal).toFixed(2);
      const dashAcos = ((metrics.allAdsTotal / metrics.grossSales) * 100).toFixed(1);
      kpiAdsSub.innerHTML = `<strong style="color:var(--success);">${dashRoas}x ROAS</strong> &bull; ACOS ${dashAcos}%`;
    } else {
      kpiAdsSub.textContent = 'Shopee, TikTok & Meta Ads';
    }
  }
  document.getElementById('kpi-opex').textContent = formatRupiah(metrics.totalOpex);
  
  const elProfit = document.getElementById('kpi-profit');
  elProfit.textContent = formatRupiah(metrics.netProfit);
  elProfit.style.color = metrics.netProfit >= 0 ? 'var(--success)' : 'var(--danger)';

  const elMargin = document.getElementById('kpi-margin');
  elMargin.textContent = `${metrics.netMargin.toFixed(1)}% margin bersih`;
  elMargin.className = `kpi-subtext ${metrics.netProfit >= 0 ? 'positive' : 'negative'}`;

  document.getElementById('banner-shopee-gross').textContent = formatRupiah(metrics.shopeeGross);
  document.getElementById('banner-shopee-net').textContent = `Cair: ${formatRupiah(metrics.shopeeNet)}`;
  document.getElementById('banner-tiktok-gross').textContent = formatRupiah(metrics.tiktokGross);
  document.getElementById('banner-tiktok-net').textContent = `Cair: ${formatRupiah(metrics.tiktokNet)}`;

  const bLazadaG = document.getElementById('banner-lazada-gross');
  if (bLazadaG) bLazadaG.textContent = formatRupiah(metrics.lazadaGross);
  const bLazadaN = document.getElementById('banner-lazada-net');
  if (bLazadaN) bLazadaN.textContent = `Cair: ${formatRupiah(metrics.lazadaNet)}`;

  // Update Kas & Permodalan Banner on Dashboard
  const elDashCashTitle = document.getElementById('dash-cash-title');
  const elDashCashSublabel = document.getElementById('dash-cash-sublabel');
  const elDashDetails = document.getElementById('dash-capital-details');
  const elDashCash = document.getElementById('dash-cash-balance');

  // Compute 25% Reinvest Total from active profit sharing allocation
  const isSettlement = profitSharingBasis === 'settlement';
  const rawBase = isSettlement ? Number(metrics.netSettlement || 0) : Number(metrics.netProfit || 0);
  const baseAmount = Math.max(0, Math.round(rawBase));
  const quarterAmount = Math.round(baseAmount / 4);
  const withdrawnTotal = quarterAmount * 3;
  const autoReinvest25 = Math.max(0, baseAmount - withdrawnTotal);
  const displayProfitReinvest = (metrics.totalProfitReinvest && metrics.totalProfitReinvest > 0)
    ? metrics.totalProfitReinvest
    : autoReinvest25;

  if (currentStoreFilter === 'all') {
    if (elDashCashTitle) elDashCashTitle.textContent = '🏢 POSISI KAS & PERMODALAN KONSOLIDASI PERUSAHAAN (HOLDING)';
    if (elDashCashSublabel) elDashCashSublabel.textContent = 'Total Kas Konsolidasi Perusahaan (Modal Kas Masuk + Saldo Cair 5 Toko)';
    if (elDashCash) elDashCash.textContent = formatRupiah(metrics.netCashBalance);
    if (elDashDetails) {
      elDashDetails.innerHTML = `
        <div>Modal Kas Perusahaan: <strong id="dash-capital-in" style="color: #047857;">${formatRupiah(metrics.totalCapitalIn)}</strong></div>
        <div>Sisa Hutang: <strong id="dash-capital-debt" style="color: #b91c1c;">${formatRupiah(metrics.remainingDebt)}</strong></div>
        <div>Laba Diputar (25%): <strong id="dash-capital-profit" style="color: #059669;">${formatRupiah(displayProfitReinvest)}</strong></div>
        <button class="btn btn-sm btn-outline-primary" onclick="switchTab('capital')" style="padding: 4px 12px; font-weight: 600; background: #ffffff;">
          Buku Kas & Modal &rarr;
        </button>
      `;
    }
  } else {
    const storeMeta = getStoreMeta(currentStoreFilter);
    if (elDashCashTitle) elDashCashTitle.textContent = `💰 ARUS KAS BERSIH HASIL PENJUALAN (${storeMeta.name.toUpperCase()})`;
    if (elDashCashSublabel) elDashCashSublabel.textContent = `Saldo Kas Murni dari Pendapatan Penjualan Marketplace Toko Ini`;
    if (elDashCash) elDashCash.textContent = formatRupiah(metrics.netCashBalance);
    if (elDashDetails) {
      elDashDetails.innerHTML = `
        <div style="background: #e0f2fe; color: #0284c7; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 11px; display: flex; align-items: center; gap: 6px;">
          <span>🏢 Modal Kas Rp 29.000.000 Terpusat di Kas Perusahaan (Bukan Modal Toko Cabang)</span>
        </div>
        <div>Pencairan Penjualan: <strong style="color: #047857;">${formatRupiah(metrics.netSettlement)}</strong></div>
        <div>Laba Diputar (25%): <strong style="color: #059669;">${formatRupiah(displayProfitReinvest)}</strong></div>
        <button class="btn btn-sm btn-outline-primary" onclick="setStoreFilter('all')" style="padding: 4px 12px; font-weight: 600; background: #ffffff;">
          Lihat Kas Perusahaan &rarr;
        </button>
      `;
    }
  }

  renderTrendChart();
  renderDonutChart(metrics);
  renderRecentTransactions();
  renderProfitSharingWidget(metrics);
}

// ==========================================
// BAGI HASIL 4 PILAR (EQUAL 25% SPLIT)
// 1. Romie (25% Dicairkan)
// 2. Akrom (25% Dicairkan)
// 3. Tio (25% Dicairkan)
// 4. Laba Diputar (25% Modal Berputar)
// ==========================================
function setProfitSharingBasis(basis) {
  if (basis !== 'settlement' && basis !== 'profit') return;
  profitSharingBasis = basis;

  const btnSettlement = document.getElementById('btn-basis-settlement');
  const btnProfit = document.getElementById('btn-basis-profit');
  if (btnSettlement && btnProfit) {
    if (basis === 'settlement') {
      btnSettlement.style.background = 'var(--primary)';
      btnSettlement.style.color = '#ffffff';
      btnSettlement.style.fontWeight = '700';
      btnProfit.style.background = 'transparent';
      btnProfit.style.color = 'var(--text-muted)';
      btnProfit.style.fontWeight = '600';
    } else {
      btnProfit.style.background = 'var(--primary)';
      btnProfit.style.color = '#ffffff';
      btnProfit.style.fontWeight = '700';
      btnSettlement.style.background = 'transparent';
      btnSettlement.style.color = 'var(--text-muted)';
      btnSettlement.style.fontWeight = '600';
    }
  }

  renderProfitSharingWidget();
  const pnlView = document.getElementById('view-pnl');
  if (pnlView && pnlView.style.display !== 'none') {
    renderPnL();
  }
}
window.setProfitSharingBasis = setProfitSharingBasis;

function renderProfitSharingWidget(metrics = null) {
  if (!metrics) {
    metrics = computeMetrics();
  }

  const btnSettlement = document.getElementById('btn-basis-settlement');
  const btnProfit = document.getElementById('btn-basis-profit');
  if (btnSettlement && btnProfit) {
    if (profitSharingBasis === 'settlement') {
      btnSettlement.style.background = 'var(--primary)';
      btnSettlement.style.color = '#ffffff';
      btnSettlement.style.fontWeight = '700';
      btnProfit.style.background = 'transparent';
      btnProfit.style.color = 'var(--text-muted)';
      btnProfit.style.fontWeight = '600';
    } else {
      btnProfit.style.background = 'var(--primary)';
      btnProfit.style.color = '#ffffff';
      btnProfit.style.fontWeight = '700';
      btnSettlement.style.background = 'transparent';
      btnSettlement.style.color = 'var(--text-muted)';
      btnSettlement.style.fontWeight = '600';
    }
  }

  const isSettlement = profitSharingBasis === 'settlement';
  const rawBase = isSettlement ? Number(metrics.netSettlement || 0) : Number(metrics.netProfit || 0);
  const baseAmount = Math.max(0, Math.round(rawBase));
  const quarterAmount = Math.round(baseAmount / 4);
  const withdrawnTotal = quarterAmount * 3;
  const reinvestTotal = Math.max(0, baseAmount - withdrawnTotal);

  const lblEl = document.getElementById('share-base-label');
  if (lblEl) {
    lblEl.textContent = isSettlement 
      ? 'TOTAL PENDAPATAN PENJUALAN BERSIH YANG DIBAGI' 
      : 'TOTAL LABA BERSIH USAHA YANG DIBAGI (NET PROFIT)';
  }

  const descEl = document.getElementById('share-base-desc');
  if (descEl) {
    if (isSettlement) {
      descEl.textContent = 'Dana pencairan bersih dari marketplace Shopee, TikTok Shop & Lazada';
    } else {
      descEl.textContent = (metrics.netProfit > 0)
        ? 'Keuntungan murni usaha setelah dikurangi modal belanja barang (HPP), Iklan & Operasional'
        : 'Belum membukukan laba bersih pada periode ini (Hak bagi hasil Rp 0 untuk melindungi modal kas)';
    }
  }

  const totalBaseEl = document.getElementById('share-total-base');
  if (totalBaseEl) totalBaseEl.textContent = formatRupiah(baseAmount);

  const totalWithdrawnEl = document.getElementById('share-total-withdrawn');
  if (totalWithdrawnEl) totalWithdrawnEl.textContent = formatRupiah(withdrawnTotal);

  const totalReinvestEl = document.getElementById('share-total-reinvest');
  if (totalReinvestEl) totalReinvestEl.textContent = formatRupiah(reinvestTotal);

  const elRomie = document.getElementById('share-amount-romie');
  if (elRomie) elRomie.textContent = formatRupiah(quarterAmount);

  const elAkrom = document.getElementById('share-amount-akrom');
  if (elAkrom) elAkrom.textContent = formatRupiah(quarterAmount);

  const elTio = document.getElementById('share-amount-tio');
  if (elTio) elTio.textContent = formatRupiah(quarterAmount);

  const elReinvest = document.getElementById('share-amount-reinvest');
  if (elReinvest) elReinvest.textContent = formatRupiah(reinvestTotal);
}
window.renderProfitSharingWidget = renderProfitSharingWidget;

// Pure SVG Trend Chart
function renderTrendChart() {
  const container = document.getElementById('trend-chart-container');
  if (!container) return;

  const store = db.getStore();
  const txs = getFilteredRecords(store.transactions);

  const dateMap = {};
  txs.forEach(t => {
    if (!t.date) return;
    if (!dateMap[t.date]) {
      dateMap[t.date] = { gross: 0, net: 0, hpp: 0 };
    }
    dateMap[t.date].gross += Number(t.grossSales || 0);
    dateMap[t.date].net += Number(t.netSettlement || 0);
    dateMap[t.date].hpp += Number(t.hppTotal || 0);
  });

  const sortedDates = Object.keys(dateMap).sort();
  if (sortedDates.length === 0) {
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;color:var(--text-muted);font-size:13px;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
        <span style="margin-top:8px;">Belum ada data transaksi pada periode ini</span>
      </div>
    `;
    return;
  }

  const width = container.clientWidth || 600;
  const height = 260;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  let maxVal = 0;
  sortedDates.forEach(d => {
    if (dateMap[d].gross > maxVal) maxVal = dateMap[d].gross;
  });
  if (maxVal === 0) maxVal = 100000;
  maxVal = Math.ceil(maxVal * 1.15);

  const getX = (index) => {
    if (sortedDates.length === 1) return padding.left + chartW / 2;
    return padding.left + (index / (sortedDates.length - 1)) * chartW;
  };

  const getY = (val) => padding.top + chartH - (val / maxVal) * chartH;

  let grossPoints = sortedDates.map((d, i) => `${getX(i)},${getY(dateMap[d].gross)}`).join(' ');
  let netPoints = sortedDates.map((d, i) => `${getX(i)},${getY(dateMap[d].net)}`).join(' ');

  const firstX = getX(0);
  const lastX = getX(sortedDates.length - 1);
  const bottomY = getY(0);
  const grossAreaPoints = `${firstX},${bottomY} ` + grossPoints + ` ${lastX},${bottomY}`;

  let gridLines = '';
  const steps = 4;
  for (let s = 0; s <= steps; s++) {
    const val = (maxVal / steps) * s;
    const y = getY(val);
    gridLines += `
      <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e2e8f0" stroke-dasharray="3,3" />
      <text x="${padding.left - 8}" y="${y + 4}" font-size="10" fill="#94a3b8" text-anchor="end">${(val / 1000).toFixed(0)}k</text>
    `;
  }

  let xLabels = '';
  const labelInterval = Math.max(1, Math.floor(sortedDates.length / 6));
  sortedDates.forEach((d, i) => {
    if (i % labelInterval === 0 || i === sortedDates.length - 1) {
      const x = getX(i);
      xLabels += `<text x="${x}" y="${height - 10}" font-size="10" fill="#94a3b8" text-anchor="middle">${d.slice(5)}</text>`;
    }
  });

  let dots = '';
  sortedDates.forEach((d, i) => {
    const gx = getX(i);
    const gy = getY(dateMap[d].gross);
    const ny = getY(dateMap[d].net);
    dots += `
      <circle cx="${gx}" cy="${gy}" r="4" fill="#2563eb" stroke="#ffffff" stroke-width="2" />
      <circle cx="${gx}" cy="${ny}" r="4" fill="#10b981" stroke="#ffffff" stroke-width="2" />
    `;
  });

  container.innerHTML = `
    <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible;">
      <defs>
        <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2563eb" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="#2563eb" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      ${gridLines}
      <polygon points="${grossAreaPoints}" fill="url(#grossGrad)" />
      <polyline points="${grossPoints}" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <polyline points="${netPoints}" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      ${dots}
      ${xLabels}
    </svg>
  `;
}

// Pure SVG Donut Chart
function renderDonutChart(metrics) {
  const container = document.getElementById('donut-chart-container');
  if (!container) return;

  const total = metrics.grossSales;
  if (!total || total <= 0) {
    container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:12px;">Belum ada omset penjualan</div>`;
    return;
  }

  const slices = [
    { label: 'Laba Bersih', value: Math.max(0, metrics.netProfit), color: '#10b981' },
    { label: 'HPP (Modal Belanja)', value: metrics.hppTotal, color: '#64748b' },
    { label: 'Potongan Marketplace', value: metrics.totalDeductions, color: '#f59e0b' },
    { label: 'Biaya Iklan (Marketplace & Meta)', value: (metrics.allAdsTotal || metrics.totalAdsSpend), color: '#ec4899' },
    { label: 'Biaya Operasional', value: metrics.totalOpex, color: '#ef4444' }
  ].filter(s => s.value > 0);

  const totalSliceVal = slices.reduce((sum, s) => sum + s.value, 0);
  const size = 180;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  let circlesSvg = '';

  slices.forEach(slice => {
    const fraction = slice.value / totalSliceVal;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += fraction * circumference;

    circlesSvg += `
      <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none"
              stroke="${slice.color}" stroke-width="${strokeWidth}"
              stroke-dasharray="${strokeDasharray}" stroke-dashoffset="${strokeDashoffset}"
              transform="rotate(-90 ${size / 2} ${size / 2})" />
    `;
  });

  let legendHtml = slices.map(s => `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;font-size:11px;">
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="width:10px;height:10px;border-radius:2px;background:${s.color};display:inline-block;"></span>
        <span style="color:var(--text-muted);">${s.label}</span>
      </div>
      <span style="font-weight:700;color:var(--text-main);">${((s.value / totalSliceVal) * 100).toFixed(1)}%</span>
    </div>
  `).join('');

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:20px;width:100%;justify-content:center;">
      <div style="position:relative;width:${size}px;height:${size}px;flex-shrink:0;">
        <svg width="${size}" height="${size}">
          <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="#f1f5f9" stroke-width="${strokeWidth}" />
          ${circlesSvg}
        </svg>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
          <span style="font-size:10px;color:var(--text-muted);text-transform:uppercase;font-weight:600;">Margin</span>
          <span style="font-size:18px;font-weight:800;color:var(--text-main);">${metrics.netMargin.toFixed(0)}%</span>
        </div>
      </div>
      <div style="flex:1;min-width:140px;">
        ${legendHtml}
      </div>
    </div>
  `;
}

// Render Recent Transactions on Dashboard
function renderRecentTransactions() {
  const tbody = document.getElementById('dashboard-recent-tx-tbody');
  if (!tbody) return;

  const store = db.getStore();
  const sorted = getFilteredRecords(store.transactions || []).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:24px;">Belum ada data transaksi</td></tr>`;
    return;
  }

  tbody.innerHTML = sorted.map(t => {
    const channelBadge = t.channel === 'shopee'
      ? `<span class="badge badge-shopee">Shopee</span>`
      : (t.channel === 'lazada'
          ? `<span class="badge badge-lazada">Lazada</span>`
          : `<span class="badge badge-tiktok">TikTok Shop</span>`);

    const statusBadge = t.status === 'settled' 
      ? `<span class="badge badge-success">Sudah Cair</span>`
      : (t.status === 'pending' ? `<span class="badge badge-warning">Dalam Pengiriman</span>` : `<span class="badge badge-danger">Retur/Batal</span>`);

    return `
      <tr>
        <td><strong>${t.orderId}</strong><div style="font-size:11px;color:var(--text-muted);">${formatDateIndo(t.date)}</div></td>
        <td>${getStoreBadgeHtml(t.storeId)}</td>
        <td>${channelBadge}</td>
        <td><div style="max-width:240px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${t.productName}">${t.productName || t.sku || '-'}</div></td>
        <td style="font-weight:600;">${formatRupiah(t.grossSales)}</td>
        <td style="color:var(--success);font-weight:700;">${formatRupiah(t.netSettlement)}</td>
        <td>${statusBadge}</td>
      </tr>
    `;
  }).join('');
}

// Transactions View
function renderTransactions() {
  const tbody = document.getElementById('transactions-tbody');
  if (!tbody) return;

  const store = db.getStore();

  // Auto-heal any existing transactions with 'N/A' or '#N/A' or missing product names or missing qty
  let hasHealed = false;
  if (store.transactions && store.transactions.length > 0) {
    store.transactions.forEach(t => {
      // 1. Auto-heal missing or invalid qty
      if (!t.qty || t.qty <= 0) {
        if (t.notes && t.notes.includes('*')) {
          const match = t.notes.match(/\*\s*(\d+)/);
          t.qty = match ? parseInt(match[1], 10) : 1;
        } else {
          t.qty = 1;
        }
        hasHealed = true;
      }

      // 2. Auto-heal missing product name
      const p = String(t.productName || '').trim().toLowerCase();
      if (p === 'n/a' || p === '#n/a' || p === 'nan' || p === '' || p === '/' || p === '-' || p === 'null' || p === 'undefined' || p === 'produk tiktok shop') {
        if (t.channel === 'tiktok') {
          if (t.grossSales >= 105000 && t.grossSales <= 125000) {
            t.productName = 'Nalatiqa Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami';
            hasHealed = true;
          } else if (t.grossSales >= 60000 && t.grossSales <= 75000) {
            t.productName = 'HALO SEHAT HERBAL TENGGOROKAN GEL NALATIQA 20G';
            hasHealed = true;
          } else if (t.grossSales >= 130000 && t.grossSales <= 145000) {
            t.productName = 'HALO SEHAT HERBAL TENGGOROKAN GEL NALATIQA (Paket 2 Pcs)';
            hasHealed = true;
          } else {
            t.productName = 'Nalatiqa Spiny Bitter Gourd Capsule Herbal';
            hasHealed = true;
          }
        }
      }
    });
    if (hasHealed) {
      db.saveData(store);
    }
  }

  const searchVal = (document.getElementById('tx-search')?.value || '').toLowerCase();
  const statusVal = document.getElementById('tx-status-filter')?.value || 'all';

  let list = getFilteredRecords(store.transactions);

  if (searchVal) {
    list = list.filter(t => 
      (t.orderId && t.orderId.toLowerCase().includes(searchVal)) ||
      (t.buyerName && t.buyerName.toLowerCase().includes(searchVal)) ||
      (t.productName && t.productName.toLowerCase().includes(searchVal)) ||
      (t.sku && t.sku.toLowerCase().includes(searchVal))
    );
  }

  if (statusVal !== 'all') {
    list = list.filter(t => t.status === statusVal);
  }

  list.sort((a, b) => new Date(b.date) - new Date(a.date));

  const selectAllBox = document.getElementById('select-all-tx');
  if (selectAllBox) {
    selectAllBox.checked = false;
    selectAllBox.indeterminate = false;
  }
  updateBulkDeleteButtonState();

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:32px;color:var(--text-muted);">Tidak ada transaksi yang cocok</td></tr>`;
    renderPaginationBar('transactions-pagination', 'transactions', { total: 0 }, 'renderTransactions');
    return;
  }

  const paged = getPaginationSlice('transactions', list);
  renderPaginationBar('transactions-pagination', 'transactions', paged, 'renderTransactions');

  tbody.innerHTML = paged.items.map(t => {
    const channelBadge = t.channel === 'shopee'
      ? `<span class="badge badge-shopee">Shopee</span>`
      : (t.channel === 'lazada'
          ? `<span class="badge badge-lazada">Lazada</span>`
          : `<span class="badge badge-tiktok">TikTok Shop</span>`);

    const statusBadge = t.status === 'settled'
      ? `<span class="badge badge-success">Sudah Cair</span>`
      : (t.status === 'pending' ? `<span class="badge badge-warning">Tertunda/Kirim</span>` : `<span class="badge badge-danger">Batal/Retur</span>`);

    const totalDeductions = (Number(t.adminFee || 0) + Number(t.serviceFee || 0) + Number(t.transactionFee || 0) + Number(t.voucherFee || 0));

    return `
      <tr>
        <td style="text-align:center;">
          <input type="checkbox" class="tx-checkbox" value="${t.id}" onchange="handleTransactionCheckboxChange()" style="cursor:pointer;width:16px;height:16px;accent-color:var(--primary);">
        </td>
        <td>
          <div style="font-weight:700;">${t.orderId}</div>
          <div style="font-size:11px;color:var(--text-muted);">${formatDateIndo(t.date)}</div>
        </td>
        <td>${getStoreBadgeHtml(t.storeId)}</td>
        <td>${channelBadge}</td>
        <td>
          <div style="font-weight:600;max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${t.productName}">${t.productName || '-'}</div>
          <div style="font-size:11px;color:var(--text-muted);">${t.buyerName ? 'Pembeli: ' + t.buyerName + ' &bull; ' : ''}${t.paymentMethod || 'COD / Saldo'}</div>
        </td>
        <td style="font-weight:600;">${formatRupiah(t.grossSales)}</td>
        <td style="color:var(--danger);font-size:12px;">-${formatRupiah(totalDeductions)}</td>
        <td style="font-weight:700;color:var(--success);">${formatRupiah(t.netSettlement)}</td>
        <td>${statusBadge}</td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-secondary btn-sm" onclick="editTransaction('${t.id}')">Detail</button>
            <button class="btn btn-danger btn-sm" onclick="deleteTransaction('${t.id}')">Hapus</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Bulk Selection & Mass Delete for Transactions
function toggleSelectAllTransactions(master) {
  const checkboxes = document.querySelectorAll('.tx-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = master.checked;
  });
  updateBulkDeleteButtonState();
}

function handleTransactionCheckboxChange() {
  const checkboxes = document.querySelectorAll('.tx-checkbox');
  const checked = document.querySelectorAll('.tx-checkbox:checked');
  const master = document.getElementById('select-all-tx');
  if (master) {
    master.checked = checkboxes.length > 0 && checkboxes.length === checked.length;
    master.indeterminate = checked.length > 0 && checked.length < checkboxes.length;
  }
  updateBulkDeleteButtonState();
}

function updateBulkDeleteButtonState() {
  const checked = document.querySelectorAll('.tx-checkbox:checked');
  const btn = document.getElementById('btn-bulk-delete-tx');
  const countSpan = document.getElementById('selected-tx-count');
  if (btn) {
    if (checked.length > 0) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      btn.style.display = 'inline-flex';
      btn.style.backgroundColor = 'var(--danger)';
      btn.style.color = '#ffffff';
      if (countSpan) countSpan.textContent = checked.length;
    } else {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
      btn.style.display = 'inline-flex';
      btn.style.backgroundColor = '';
      btn.style.color = '';
      if (countSpan) countSpan.textContent = '0';
    }
  }
}

function bulkDeleteSelectedTransactions() {
  const checked = document.querySelectorAll('.tx-checkbox:checked');
  const count = checked.length;
  if (count === 0) {
    alert('Pilih minimal satu pesanan untuk dihapus.');
    return;
  }

  if (confirm(`Apakah Anda yakin ingin menghapus ${count} pesanan yang dipilih?\n\nTindakan ini akan menghapus data terpilih dari pembukuan dan memperbarui seluruh laporan keuangan.`)) {
    const selectedIds = new Set(Array.from(checked).map(cb => cb.value));
    const store = db.getStore();
    store.transactions = store.transactions.filter(t => !selectedIds.has(t.id));
    db.saveData(store);

    showToast(`${count} pesanan berhasil dihapus!`, 'success');
    renderCurrentView();
  }
}

// =========================================================================
// PRIORITIZED MODULE: ADVANCED MARKETPLACE IMPORTER (SHOPEE & TIKTOK)
// =========================================================================

function renderImporterView() {
  renderImportHistory();
}

function renderImportHistory() {
  const tbody = document.getElementById('importer-history-tbody');
  const countBadge = document.getElementById('import-history-count-badge');
  if (!tbody) return;

  const store = db.getStore();
  const history = store.importHistory || [];

  if (countBadge) {
    countBadge.textContent = `${history.length} File Terdaftar`;
    countBadge.className = history.length > 0 ? 'badge badge-primary' : 'badge badge-info';
  }

  if (history.length === 0) {
    renderPaginationBar('importer-history-pagination', 'importHistory', { total: 0 }, 'renderImportHistory');
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 36px 20px; color: var(--text-muted);">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.5;">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <div style="font-weight: 600; color: var(--text-dark);">Belum ada riwayat impor file</div>
            <div style="font-size: 0.85rem;">Unggah file laporan marketplace (Shopee, TikTok Shop, atau Lazada) pada kotak di atas untuk mulai memasukkan data ke pembukuan.</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const paged = getPaginationSlice('importHistory', history);
  renderPaginationBar('importer-history-pagination', 'importHistory', paged, 'renderImportHistory');

  tbody.innerHTML = paged.items.map(h => {
    const badge = h.channel === 'shopee'
      ? `<span class="badge badge-shopee">Shopee</span>`
      : (h.channel === 'lazada'
          ? `<span class="badge badge-lazada">Lazada</span>`
          : `<span class="badge badge-tiktok">TikTok Shop</span>`);

    return `
      <tr>
        <td>${formatDateIndo(h.date)}</td>
        <td>${badge}</td>
        <td><code style="font-size: 0.82rem; padding: 2px 6px; background: var(--bg-main); border-radius: 4px;">${h.filename}</code></td>
        <td style="font-weight:700;">${h.rowCount} Pesanan</td>
        <td>${formatRupiah(h.totalGross)}</td>
        <td style="color:var(--success);font-weight:700;">${formatRupiah(h.totalNet)}</td>
        <td style="text-align: center;">
          <button class="btn btn-sm btn-outline-danger" onclick="deleteImportHistoryItem('${h.id}')" title="Hapus catatan file ini" style="padding: 3px 8px; font-size: 0.75rem;">
            Hapus
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function clearImportHistory(confirmPrompt = true) {
  if (confirmPrompt) {
    const ok = confirm('Apakah Anda yakin ingin membersihkan seluruh daftar riwayat file yang pernah diimpor?');
    if (!ok) return;
  }
  const store = db.getStore();
  store.importHistory = [];
  db.saveData(store);
  renderImportHistory();
  showToast('Riwayat file impor berhasil dibersihkan!', 'success');
}

function deleteImportHistoryItem(id) {
  const store = db.getStore();
  if (!store.importHistory) return;
  store.importHistory = store.importHistory.filter(h => h.id !== id);
  db.saveData(store);
  renderImportHistory();
  showToast('Catatan riwayat file berhasil dihapus.', 'info');
}

function clearAllTransactions(confirmPrompt = true) {
  if (confirmPrompt) {
    const ok = confirm('PERHATIAN: Apakah Anda yakin ingin MENGHAPUS SEMUA DATA PESANAN / TRANSAKSI & RIWAYAT IMPOR dari pembukuan?\n\nSemua transaksi penjualan Shopee, TikTok Shop, dan Lazada serta riwayat file akan dikosongkan.');
    if (!ok) return;
  }
  const store = db.getStore();
  store.transactions = [];
  store.importHistory = [];
  db.saveData(store);

  renderTransactions();
  renderCurrentView();
  if (typeof renderImportHistory === 'function') renderImportHistory();
  if (typeof updateBulkDeleteButtonState === 'function') updateBulkDeleteButtonState();
  if (typeof showToast === 'function') showToast('Seluruh data pesanan & riwayat berhasil dikosongkan!', 'success');
}

// Switch Marketplace Importer Tabs (Shopee / TikTok / Lazada / All)
function switchImporterMarketplace(channel) {
  const tabs = document.querySelectorAll('#importer-marketplace-tabs .filter-chip');
  tabs.forEach(t => t.classList.remove('active'));

  const activeTab = document.getElementById(`tab-import-${channel}`);
  if (activeTab) activeTab.classList.add('active');

  const cardShopee = document.getElementById('card-import-shopee');
  const cardTikTok = document.getElementById('card-import-tiktok');
  const cardLazada = document.getElementById('card-import-lazada');

  if (channel === 'shopee') {
    if (cardShopee) cardShopee.style.display = 'block';
    if (cardTikTok) cardTikTok.style.display = 'none';
    if (cardLazada) cardLazada.style.display = 'none';
  } else if (channel === 'tiktok') {
    if (cardShopee) cardShopee.style.display = 'none';
    if (cardTikTok) cardTikTok.style.display = 'block';
    if (cardLazada) cardLazada.style.display = 'none';
  } else if (channel === 'lazada') {
    if (cardShopee) cardShopee.style.display = 'none';
    if (cardTikTok) cardTikTok.style.display = 'none';
    if (cardLazada) cardLazada.style.display = 'block';
  } else {
    // Show all 3
    if (cardShopee) cardShopee.style.display = 'block';
    if (cardTikTok) cardTikTok.style.display = 'block';
    if (cardLazada) cardLazada.style.display = 'block';
  }
}

function openImporterForChannel(channel) {
  switchTab('importer');
  if (channel) {
    switchImporterMarketplace(channel);
  }
}

// Drag & Drop Handlers for all dedicated dropzones
function setupDropzoneEvents() {
  const dropzones = [
    { id: 'csv-dropzone', channel: null },
    { id: 'dropzone-shopee', channel: 'shopee' },
    { id: 'dropzone-tiktok', channel: 'tiktok' },
    { id: 'dropzone-lazada', channel: 'lazada' }
  ];

  dropzones.forEach(dzInfo => {
    const dz = document.getElementById(dzInfo.id);
    if (!dz) return;

    ['dragenter', 'dragover'].forEach(eventName => {
      dz.addEventListener(eventName, (e) => {
        e.preventDefault();
        dz.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dz.addEventListener(eventName, (e) => {
        e.preventDefault();
        dz.classList.remove('dragover');
      }, false);
    });

    dz.addEventListener('drop', (e) => {
      e.preventDefault();
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        if (files.length === 1) {
          handleCsvFileObject(files[0], dzInfo.channel);
        } else {
          handleMultipleFiles(files, dzInfo.channel);
        }
      }
    });
  });
}

function handleCsvUpload(event) {
  const files = event.target.files;
  if (files && files.length > 0) {
    if (files.length === 1) {
      handleCsvFileObject(files[0]);
    } else {
      handleMultipleFiles(files);
    }
  }
}

function handleMarketplaceSpecificUpload(event, forcedChannel) {
  const files = event.target.files;
  if (files && files.length > 0) {
    if (files.length === 1) {
      handleCsvFileObject(files[0], forcedChannel);
    } else {
      handleMultipleFiles(files, forcedChannel);
    }
  }
}

async function handleMultipleFiles(fileList, forcedChannel = null) {
  const files = Array.from(fileList);
  if (files.length === 0) return;
  if (files.length === 1) {
    handleCsvFileObject(files[0], forcedChannel);
    return;
  }

  showToast(`Membaca ${files.length} file laporan...`, 'info');

  const fileContents = [];
  for (const f of files) {
    const fname = f.name.toLowerCase();
    let text = '';
    try {
      if (fname.endsWith('.xlsx') || fname.endsWith('.xls') || fname.endsWith('.xlsb')) {
        text = await convertXlsxToCsv(f);
      } else {
        text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsText(f);
        });
      }
      if (text && text.trim().length > 10) {
        fileContents.push({ file: f, name: f.name, text });
      }
    } catch (err) {
      console.warn('Failed reading file:', f.name, err);
    }
  }

  // Separate "Semua Pesanan" vs financial files (Income)
  const orderSyncFiles = [];
  const financialFiles = [];

  for (const item of fileContents) {
    const lines = splitCsvRecords(item.text);
    if (isTikTokAllOrdersFile(lines, item.name)) {
      orderSyncFiles.push(item);
    } else {
      financialFiles.push(item);
    }
  }

  // 1. Process Order Sync Files first (silent = true)
  for (const item of orderSyncFiles) {
    const lines = splitCsvRecords(item.text);
    processTikTokAllOrdersSync(lines, item.name, true);
  }

  // 2. Process Financial (Income) files
  for (const item of financialFiles) {
    parseMarketplaceCsvFile(item.text, item.name, forcedChannel);
  }

  if (orderSyncFiles.length > 0 && financialFiles.length === 0) {
    showToast(`Berhasil menyinkronkan data pesanan dari ${orderSyncFiles.length} file!`, 'success');
  }
}

async function handleCsvFileObject(file, forcedChannel = null) {
  const fname = file.name.toLowerCase();
  if (fname.endsWith('.xlsx') || fname.endsWith('.xls') || fname.endsWith('.xlsb')) {
    try {
      if (typeof showToast === 'function') showToast(`Membaca file Excel (${file.name})...`, 'info');
      const csvText = await convertXlsxToCsv(file);
      if (csvText && csvText.trim().length > 10) {
        parseMarketplaceCsvFile(csvText, file.name, forcedChannel);
        if (typeof showToast === 'function') showToast(`File Excel ${file.name} berhasil dimuat!`, 'success');
        return;
      } else {
        throw new Error('Data dalam sheet file Excel kosong atau tidak terbaca');
      }
    } catch (err) {
      console.warn('XLSX direct read failed:', err);
      alert('Gagal membaca file Excel: ' + (err.message || 'Format tidak terbaca') + '.\n\nTips: Silakan buka file di Excel/WPS lalu pilih Menu File > Simpan Sebagai (Save As) > CSV (.csv) untuk hasil instan.');
      return;
    }
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    parseMarketplaceCsvFile(text, file.name, forcedChannel);
  };
  reader.readAsText(file);
}

// Helper to safely get ArrayBuffer across all browsers & webviews
async function getFileArrayBuffer(file) {
  if (typeof file.arrayBuffer === 'function') {
    try {
      return await file.arrayBuffer();
    } catch (e) {}
  }
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsArrayBuffer(file);
  });
}

// Helper: Recalculate sheet range from all actual cell keys (vital for TikTok/WPS exports with bogus dimension ref)
function fixSheetRange(ws) {
  if (!ws) return;
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
  const keys = Object.keys(ws);
  for (let k = 0; k < keys.length; k++) {
    const key = keys[k];
    if (!key || key.charCodeAt(0) === 33) continue; // skip '!ref', '!margins', etc.
    let col = 0, row = 0;
    let i = 0;
    for (; i < key.length; i++) {
      const code = key.charCodeAt(i);
      if (code >= 65 && code <= 90) {
        col = col * 26 + (code - 64);
      } else {
        break;
      }
    }
    col = Math.max(0, col - 1);
    row = parseInt(key.substring(i), 10) - 1;
    if (isNaN(row)) continue;

    if (row < minR) minR = row;
    if (row > maxR) maxR = row;
    if (col < minC) minC = col;
    if (col > maxC) maxC = col;
  }
  if (minR !== Infinity && maxR !== -Infinity && minC !== Infinity && maxC !== -Infinity) {
    if (typeof XLSX !== 'undefined' && XLSX.utils && XLSX.utils.encode_range) {
      ws['!ref'] = XLSX.utils.encode_range({ s: { r: minR, c: minC }, e: { r: maxR, c: maxC } });
    }
  }
}

// Helper: Intelligently select the true transaction/orders sheet across Shopee, TikTok, Lazada, etc.
function findBestTransactionSheetName(workbook) {
  if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) return null;
  if (workbook.SheetNames.length === 1) {
    const s = workbook.Sheets[workbook.SheetNames[0]];
    if (s) fixSheetRange(s);
    return workbook.SheetNames[0];
  }

  let bestSheetName = workbook.SheetNames[0];
  let highestScore = -Infinity;

  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    fixSheetRange(sheet);

    const lowerName = name.toLowerCase().trim();
    let score = 0;

    // Strict penalties for non-order sheets (definitions, glossary, withdrawals, summaries)
    if (
      lowerName.includes('penjelasan') || 
      lowerName.includes('explanation') || 
      lowerName.includes('glosarium') || 
      lowerName.includes('glossary') || 
      lowerName.includes('riwayat penarikan') || 
      lowerName.includes('withdrawal') || 
      lowerName.includes('ringkasan') || 
      lowerName.includes('overview') || 
      lowerName.includes('summary') || 
      lowerName.includes('bantuan') || 
      lowerName.includes('panduan') || 
      lowerName.includes('instruksi') || 
      lowerName.includes('catatan') || 
      lowerName.includes('terms') || 
      lowerName.includes('syarat') ||
      lowerName.includes('seller fee')
    ) {
      score -= 50000;
    }

    // High bonuses for order detail sheets
    if (
      lowerName.includes('detail pesanan') || 
      lowerName.includes('order detail') || 
      lowerName.includes('orders') || 
      lowerName.includes('detail order') || 
      lowerName.includes('daftar pesanan') || 
      lowerName.includes('rincian pesanan') || 
      lowerName.includes('orderskulist') || 
      lowerName.includes('item details') || 
      lowerName.includes('transaksi') || 
      lowerName.includes('transaction') || 
      lowerName.includes('penjualan')
    ) {
      score += 30000;
    } else if (
      lowerName.includes('order') || 
      lowerName.includes('pesanan') || 
      lowerName.includes('sales') || 
      lowerName.includes('penghasilan') || 
      lowerName.includes('settlement')
    ) {
      score += 15000;
    }

    // Inspect content (first 5 rows) for definitive order headers
    let rowCount = 0;
    if (sheet['!ref']) {
      try {
        const range = XLSX.utils.decode_range(sheet['!ref']);
        rowCount = range.e.r - range.s.r + 1;
        
        let headerContent = '';
        for (let R = range.s.r; R <= Math.min(range.s.r + 5, range.e.r); R++) {
          for (let C = range.s.c; C <= Math.min(range.s.c + 25, range.e.c); C++) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = sheet[cellAddress];
            if (cell && cell.v !== undefined) {
              headerContent += ' ' + String(cell.v).toLowerCase();
            }
          }
        }

        if (
          headerContent.includes('id pesanan') || 
          headerContent.includes('order id') || 
          headerContent.includes('nomor pesanan') || 
          headerContent.includes('order item id') || 
          headerContent.includes('id pesanan/penyesuaian') || 
          headerContent.includes('no. pesanan') || 
          headerContent.includes('no pesanan') || 
          headerContent.includes('statement number')
        ) {
          score += 25000;
        }

        if (
          headerContent.includes('jumlah penyelesaian') || 
          headerContent.includes('total settlement') || 
          headerContent.includes('subtotal') || 
          headerContent.includes('biaya komisi') || 
          headerContent.includes('nama produk') || 
          headerContent.includes('product name') || 
          headerContent.includes('total penghasilan') ||
          headerContent.includes('item price credit')
        ) {
          score += 15000;
        }

        if (headerContent.includes('penjelasan tentang biaya') || headerContent.includes('fee explanation')) {
          score -= 50000;
        }
      } catch (errRange) {}
    }

    // Tie-breaker: actual data row count (capped to 1,000)
    score += Math.min(rowCount, 1000);

    if (score > highestScore) {
      highestScore = score;
      bestSheetName = name;
    }
  }

  return bestSheetName;
}

// High-Performance Universal Excel Parser (Powered by SheetJS with native stream fallback)
async function convertXlsxToCsv(file) {
  const arrayBuffer = await getFileArrayBuffer(file);

  // 1. Primary Engine: SheetJS (XLSX) - 100% robust for all Excel files (.xlsx, .xls, .xlsb)
  if (typeof XLSX !== 'undefined') {
    try {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      for (const name of workbook.SheetNames) {
        if (workbook.Sheets[name]) fixSheetRange(workbook.Sheets[name]);
      }

      // Shopee Multi-Sheet Support: If workbook has 'Penghasilan' sheet, combine 'Summary'/'Ringkasan' + 'Penghasilan'
      const penghasilanSheetName = workbook.SheetNames.find(n => {
        const l = n.toLowerCase().trim();
        return l === 'penghasilan' || l.includes('penghasilan');
      });
      if (penghasilanSheetName && workbook.Sheets[penghasilanSheetName]) {
        const pSheet = workbook.Sheets[penghasilanSheetName];
        fixSheetRange(pSheet);
        
        let combinedCsv = '';
        const summarySheetName = workbook.SheetNames.find(n => {
          const l = n.toLowerCase().trim();
          return l === 'summary' || l === 'ringkasan' || l.includes('summary') || l.includes('ringkasan');
        });
        if (summarySheetName && workbook.Sheets[summarySheetName]) {
          fixSheetRange(workbook.Sheets[summarySheetName]);
          const sumCsv = XLSX.utils.sheet_to_csv(workbook.Sheets[summarySheetName]);
          if (sumCsv && sumCsv.trim()) {
            combinedCsv += sumCsv.trim() + '\n\n';
          }
        }
        
        const orderCsv = XLSX.utils.sheet_to_csv(pSheet);
        combinedCsv += orderCsv;
        if (combinedCsv && combinedCsv.trim().length > 10) {
          return combinedCsv;
        }
      }

      // TikTok Multi-Sheet Support: If workbook has 'Detail pesanan' sheet, combine 'Detail pesanan' + 'Laporan' (summary)
      const tiktokDetailSheetName = workbook.SheetNames.find(n => {
        const l = n.toLowerCase().trim();
        return l === 'detail pesanan' || l.includes('detail pesanan');
      });
      if (tiktokDetailSheetName && workbook.Sheets[tiktokDetailSheetName]) {
        const dSheet = workbook.Sheets[tiktokDetailSheetName];
        fixSheetRange(dSheet);
        let combinedCsv = XLSX.utils.sheet_to_csv(dSheet);

        const tiktokSummarySheetName = workbook.SheetNames.find(n => {
          const l = n.toLowerCase().trim();
          return l === 'laporan' || l === 'ringkasan' || l.includes('laporan');
        });
        if (tiktokSummarySheetName && workbook.Sheets[tiktokSummarySheetName]) {
          fixSheetRange(workbook.Sheets[tiktokSummarySheetName]);
          const sumCsv = XLSX.utils.sheet_to_csv(workbook.Sheets[tiktokSummarySheetName]);
          if (sumCsv && sumCsv.trim()) {
            combinedCsv += '\n\n' + sumCsv.trim();
          }
        }
        if (combinedCsv && combinedCsv.trim().length > 10) {
          return combinedCsv;
        }
      }

      const targetSheetName = findBestTransactionSheetName(workbook) || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[targetSheetName];
      if (worksheet) {
        fixSheetRange(worksheet);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        if (csv && csv.trim().length > 10) {
          return csv;
        }
      }
    } catch (sheetJsErr) {
      console.warn('SheetJS read encountered an error, falling back to built-in parser:', sheetJsErr);
    }
  }

  // 2. Fallback Engine: Built-in Zip/XML parser with proper stream piping
  const view = new DataView(arrayBuffer);
  const bytes = new Uint8Array(arrayBuffer);

  // Cari End of Central Directory Record (EOCD)
  let eocdOffset = -1;
  for (let i = arrayBuffer.byteLength - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) throw new Error('Format file Excel/ZIP tidak valid');

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const cdOffset = view.getUint32(eocdOffset + 16, true);

  const entries = {};
  let cur = cdOffset;
  for (let i = 0; i < totalEntries; i++) {
    const sig = view.getUint32(cur, true);
    if (sig !== 0x02014b50) break;

    const compMethod = view.getUint16(cur + 10, true);
    const compSize = view.getUint32(cur + 20, true);
    const fnLen = view.getUint16(cur + 28, true);
    const extraLen = view.getUint16(cur + 30, true);
    const commentLen = view.getUint16(cur + 32, true);
    const localHeaderOffset = view.getUint32(cur + 42, true);

    const fnBytes = bytes.subarray(cur + 46, cur + 46 + fnLen);
    const filename = new TextDecoder('utf-8').decode(fnBytes);

    const localFnLen = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
    const dataOffset = localHeaderOffset + 30 + localFnLen + localExtraLen;

    entries[filename] = {
      compMethod,
      compSize,
      dataOffset,
      bytes: bytes.subarray(dataOffset, dataOffset + compSize)
    };

    cur += 46 + fnLen + extraLen + commentLen;
  }

  async function decompress(entry) {
    if (!entry) return null;
    if (entry.compMethod === 0) {
      return new TextDecoder('utf-8').decode(entry.bytes);
    }
    if (entry.compMethod === 8) {
      try {
        if (typeof DecompressionStream !== 'undefined') {
          const resp = new Response(entry.bytes);
          const decompressed = resp.body.pipeThrough(new DecompressionStream('deflate-raw'));
          const buffer = await new Response(decompressed).arrayBuffer();
          return new TextDecoder('utf-8').decode(buffer);
        }
      } catch (err1) {
        try {
          const resp = new Response(entry.bytes);
          const decompressed = resp.body.pipeThrough(new DecompressionStream('deflate'));
          const buffer = await new Response(decompressed).arrayBuffer();
          return new TextDecoder('utf-8').decode(buffer);
        } catch (err2) {
          console.warn('Decompression failed:', err2);
          return null;
        }
      }
    }
    return null;
  }

  // Parse Shared Strings
  const sharedStrings = [];
  const sstEntry = entries['xl/sharedStrings.xml'];
  if (sstEntry) {
    const sstXmlText = await decompress(sstEntry);
    if (sstXmlText) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(sstXmlText, 'text/xml');
      const siNodes = xmlDoc.getElementsByTagName('si');
      for (let i = 0; i < siNodes.length; i++) {
        const tNodes = siNodes[i].getElementsByTagName('t');
        let str = '';
        for (let j = 0; j < tNodes.length; j++) {
          str += tNodes[j].textContent || '';
        }
        sharedStrings.push(str);
      }
    }
  }

  // Cari sheet target yang berisi data transaksi
  let targetSheetName = 'xl/worksheets/sheet1.xml';
  const availableSheets = Object.keys(entries).filter(k => k.startsWith('xl/worksheets/sheet'));
  if (availableSheets.length > 0) {
    // Cari sheet dengan ukuran terbesar atau nama sheet1
    targetSheetName = availableSheets[0];
    let maxLen = 0;
    for (let s of availableSheets) {
      if (entries[s].compSize > maxLen) {
        maxLen = entries[s].compSize;
        targetSheetName = s;
      }
    }
  }

  const sheetEntry = entries[targetSheetName];
  if (!sheetEntry) throw new Error('Sheet data tidak ditemukan di file Excel');

  const sheetXmlText = await decompress(sheetEntry);
  if (!sheetXmlText) throw new Error('Gagal mengekstrak sheet data dari file Excel');

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(sheetXmlText, 'text/xml');
  const rowNodes = xmlDoc.getElementsByTagName('row');

  const csvLines = [];
  for (let r = 0; r < rowNodes.length; r++) {
    const row = rowNodes[r];
    const cellNodes = row.getElementsByTagName('c');
    const cells = [];

    for (let c = 0; c < cellNodes.length; c++) {
      const cell = cellNodes[c];
      const cellRef = cell.getAttribute('r') || '';
      const cellType = cell.getAttribute('t') || '';
      
      let val = '';
      const isNode = cell.getElementsByTagName('is')[0];
      if (isNode) {
        val = isNode.textContent || '';
      } else {
        const vNode = cell.getElementsByTagName('v')[0];
        val = vNode ? vNode.textContent || '' : '';
      }

      if (cellType === 's') {
        const idx = parseInt(val, 10);
        val = sharedStrings[idx] !== undefined ? sharedStrings[idx] : val;
      }

      const colLetters = cellRef.replace(/[0-9]/g, '');
      let colIdx = 0;
      for (let l = 0; l < colLetters.length; l++) {
        colIdx = colIdx * 26 + (colLetters.charCodeAt(l) - 64);
      }
      colIdx = Math.max(0, colIdx - 1);

      while (cells.length < colIdx) {
        cells.push('');
      }
      cells[colIdx] = val;
    }

    const formattedRow = cells.map(v => {
      const s = String(v === undefined || v === null ? '' : v);
      if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    }).join(',');

    csvLines.push(formattedRow);
  }

  return csvLines.join('\n');
}

// Helper: Parse DD Mon YYYY / DD-MM-YYYY / YYYY-MM-DD to ISO date YYYY-MM-DD
function parseLazadaDate(str) {
  if (!str) return new Date().toISOString().split('T')[0];
  str = String(str).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  const monthMap = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', mei: '05',
    jun: '06', jul: '07', aug: '08', agu: '08', agt: '08', sep: '09',
    oct: '10', okt: '10', nov: '11', dec: '12', des: '12'
  };
  const parts = str.split(/[\s-]+/);
  if (parts.length >= 3) {
    const day = parts[0].padStart(2, '0');
    const monKey = parts[1].toLowerCase().substring(0, 3);
    const year = parts[2];
    if (monthMap[monKey] && /^\d{4}$/.test(year) && /^\d{1,2}$/.test(day)) {
      return `${year}-${monthMap[monKey]}-${day}`;
    }
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

// Helper: Parse Shopee DD/MM/YYYY or YYYY-MM-DD date to ISO date YYYY-MM-DD
function parseShopeeDate(str) {
  if (!str) return new Date().toISOString().split('T')[0];
  str = String(str).trim();
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

// Quote-aware CSV line splitter (prevents breaking rows on newlines inside quotes)
function splitCsvRecords(csvText) {
  const records = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < csvText.length; i++) {
    const c = csvText[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      cur += c;
    } else if ((c === '\n' || c === '\r') && !inQuotes) {
      if (c === '\r' && csvText[i + 1] === '\n') {
        i++;
      }
      if (cur.trim().length > 0) {
        records.push(cur);
      }
      cur = '';
    } else {
      cur += c;
    }
  }
  if (cur.trim().length > 0) {
    records.push(cur);
  }
  return records;
}

// Helper: Check if file is a TikTok All Orders / Order Details export
function isTikTokAllOrdersFile(lines, filename) {
  if (!lines || lines.length < 2) return false;
  const sample = lines.slice(0, 5).join('\n').toLowerCase();
  
  const hasOrderId = sample.includes('order id') || sample.includes('id pesanan');
  const hasProductName = sample.includes('product name') || sample.includes('nama produk');
  
  const isSettlement = sample.includes('jumlah penyelesaian pembayaran') || 
                       sample.includes('subtotal setelah diskon penjual') || 
                       sample.includes('total settlement amount') ||
                       sample.includes('biaya komisi platform') ||
                       sample.includes('statement number') ||
                       sample.includes('nama biaya');
                       
  const hasOrderFeatures = sample.includes('seller sku') || 
                          sample.includes('variation') || 
                          sample.includes('variasi') ||
                          sample.includes('fulfillment type') || 
                          sample.includes('delivery option') ||
                          sample.includes('tracking id') ||
                          sample.includes('creator handle') ||
                          sample.includes('shipping provider name') ||
                          sample.includes('sku unit original price') ||
                          filename.toLowerCase().includes('pesanan') ||
                          filename.toLowerCase().includes('order');
                          
  return hasOrderId && hasProductName && !isSettlement && hasOrderFeatures;
}

// Helper to look up synchronized product name by Order ID or SKU ID
function findTikTokProductInMap(orderId, skuId, map) {
  if (!map) return null;

  // 1. Exact string match
  if (orderId && map.byExactOrder && map.byExactOrder[orderId]) {
    return map.byExactOrder[orderId];
  }

  // 2. Numeric distance match (< 2000 for float64 rounding on 18-digit ID)
  if (orderId && map.numericOrders && map.numericOrders.length > 0) {
    const targetNum = Number(orderId);
    if (!isNaN(targetNum) && targetNum > 1e14) {
      const found = map.numericOrders.find(item => Math.abs(item.num - targetNum) < 2000);
      if (found) return found;
    }
  }

  // 3. Prefix match (first 14 digits)
  if (orderId && map.byPrefix) {
    const digits = String(orderId).replace(/\D/g, '').substring(0, 14);
    if (digits && digits.length >= 10 && map.byPrefix[digits]) {
      return map.byPrefix[digits];
    }
  }

  // 4. Exact SKU match
  if (skuId && map.bySku && map.bySku[skuId]) {
    return { productName: map.bySku[skuId], variation: '', qty: 1 };
  }

  // 5. Numeric SKU match
  if (skuId && map.numericSkus && map.numericSkus.length > 0) {
    const targetSkuNum = Number(skuId);
    if (!isNaN(targetSkuNum) && targetSkuNum > 1e14) {
      const foundSku = map.numericSkus.find(item => Math.abs(item.num - targetSkuNum) < 2000);
      if (foundSku) return { productName: foundSku.productName, variation: '', qty: 1 };
    }
  }

  return null;
}

// Process TikTok All Orders file to synchronize product names
function processTikTokAllOrdersSync(lines, filename, silent = false) {
  const sampleLine = lines.length > 2 ? lines[1] : lines[0];
  let delimiter = ',';
  if ((sampleLine.match(/;/g) || []).length > (sampleLine.match(/,/g) || []).length) {
    delimiter = ';';
  } else if ((sampleLine.match(/\t/g) || []).length > 2) {
    delimiter = '\t';
  }

  const parseLine = (line) => {
    const result = [];
    let insideQuote = false;
    let entry = '';
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (insideQuote && line[i + 1] === '"') {
          entry += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (c === delimiter && !insideQuote) {
        result.push(entry.trim().replace(/^"|"$/g, '').trim());
        entry = '';
      } else {
        entry += c;
      }
    }
    result.push(entry.trim().replace(/^"|"$/g, '').trim());
    return result;
  };

  let headerRowIdx = -1;
  let headers = [];
  for (let r = 0; r < Math.min(5, lines.length); r++) {
    const cols = parseLine(lines[r]).map(h => h.trim().toLowerCase());
    if ((cols.includes('order id') || cols.includes('id pesanan')) && (cols.includes('product name') || cols.includes('nama produk'))) {
      headerRowIdx = r;
      headers = cols;
      break;
    }
  }

  if (headerRowIdx === -1) {
    if (!silent) alert('Gagal mendeteksi kolom Order ID dan Product Name pada file pesanan.');
    return null;
  }

  const orderIdx = headers.findIndex(h => h === 'order id' || h === 'id pesanan');
  const prodIdx = headers.findIndex(h => h === 'product name' || h === 'nama produk');
  const skuIdx = headers.findIndex(h => h === 'sku id' || h === 'id sku' || h === 'seller sku');
  const varIdx = headers.findIndex(h => h === 'variation' || h === 'variasi');
  const qtyIdx = headers.findIndex(h => h === 'quantity' || h === 'jumlah');
  const buyerIdx = headers.findIndex(h => h === 'recipient' || h === 'buyer username' || h === 'nama pembeli');
  const courierIdx = headers.findIndex(h => h === 'shipping provider name' || h === 'kurir');
  const payIdx = headers.findIndex(h => h === 'payment method' || h === 'metode pembayaran');

  const store = db.getStore();
  if (!store.tiktokProductMap) {
    store.tiktokProductMap = {
      byExactOrder: {},
      numericOrders: [],
      byPrefix: {},
      bySku: {},
      numericSkus: []
    };
  }

  let mappedCount = 0;
  for (let i = headerRowIdx + 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine.trim() || rawLine.startsWith('Platform unique order ID') || rawLine.startsWith(',,,,')) continue;

    const cols = parseLine(rawLine);
    if (cols.length <= Math.max(orderIdx, prodIdx)) continue;

    const rawOrderId = cols[orderIdx].trim();
    const productName = cols[prodIdx].trim();
    if (!rawOrderId || !productName) continue;

    const variation = varIdx >= 0 ? cols[varIdx].trim() : '';
    const qty = qtyIdx >= 0 ? (parseInt(cols[qtyIdx]) || 1) : 1;
    const sku = skuIdx >= 0 ? cols[skuIdx].trim() : '';
    const buyerName = buyerIdx >= 0 ? cols[buyerIdx].trim() : '';
    const courier = courierIdx >= 0 ? cols[courierIdx].trim() : '';
    const paymentMethod = payIdx >= 0 ? cols[payIdx].trim() : '';

    const entry = {
      productName,
      variation,
      qty,
      sku,
      buyerName,
      courier,
      paymentMethod
    };

    store.tiktokProductMap.byExactOrder[rawOrderId] = entry;

    const numOrder = Number(rawOrderId);
    if (!isNaN(numOrder) && numOrder > 1e14) {
      store.tiktokProductMap.numericOrders.push({ num: numOrder, ...entry });
    }

    const prefix = rawOrderId.replace(/\D/g, '').substring(0, 14);
    if (prefix && prefix.length >= 10) {
      store.tiktokProductMap.byPrefix[prefix] = entry;
    }

    if (sku) {
      store.tiktokProductMap.bySku[sku] = productName;
      const numSku = Number(sku);
      if (!isNaN(numSku) && numSku > 1e14) {
        store.tiktokProductMap.numericSkus.push({ num: numSku, productName });
      }
    }

    mappedCount++;
  }

  // Deduplicate numeric orders
  const uniqueNumericOrders = [];
  const seenOrderNums = new Set();
  for (const item of store.tiktokProductMap.numericOrders) {
    if (!seenOrderNums.has(item.num)) {
      seenOrderNums.add(item.num);
      uniqueNumericOrders.push(item);
    }
  }
  store.tiktokProductMap.numericOrders = uniqueNumericOrders;

  db.saveData(store);

  // Auto-update existing TikTok transactions in the database
  let updatedCount = 0;
  if (store.transactions && store.transactions.length > 0) {
    store.transactions.forEach(t => {
      if (t.channel === 'tiktok') {
        const matched = findTikTokProductInMap(t.orderId, t.sku, store.tiktokProductMap);
        if (matched) {
          let modified = false;
          if (matched.productName && (!t.productName || t.productName === 'Produk TikTok Shop' || t.productName.startsWith('Item SKU:') || t.productName === '/')) {
            t.productName = matched.productName + (matched.variation && matched.variation !== 'Default' ? ` (${matched.variation})` : '');
            modified = true;
          }
          if (matched.buyerName && (!t.buyerName || t.buyerName === 'Pelanggan TikTok')) {
            t.buyerName = matched.buyerName;
            modified = true;
          }
          if (matched.paymentMethod && (!t.paymentMethod || t.paymentMethod === 'TikTok / Online')) {
            t.paymentMethod = matched.paymentMethod;
            modified = true;
          }
          if (matched.courier && (!t.courier || t.courier === 'J&T / Ninja')) {
            t.courier = matched.courier;
            modified = true;
          }
          if (matched.qty && (!t.qty || t.qty === 1 || t.qty !== matched.qty)) {
            t.qty = matched.qty;
            modified = true;
          }
          if (modified) updatedCount++;
        }
      }
    });

    if (updatedCount > 0) {
      db.saveData(store);
      if (typeof renderDashboard === 'function') renderDashboard();
      if (typeof renderSalesTable === 'function') renderSalesTable();
    }
  }

  // Also update preview if open
  if (stagedImportTransactions && stagedImportTransactions.length > 0) {
    stagedImportTransactions.forEach(t => {
      if (t.channel === 'tiktok') {
        const matched = findTikTokProductInMap(t.orderId, t.sku, store.tiktokProductMap);
        if (matched) {
          if (matched.productName && (!t.productName || t.productName === 'Produk TikTok Shop' || t.productName.startsWith('Item SKU:') || t.productName === '/')) {
            t.productName = matched.productName + (matched.variation && matched.variation !== 'Default' ? ` (${matched.variation})` : '');
          }
          if (matched.buyerName) t.buyerName = matched.buyerName;
          if (matched.paymentMethod) t.paymentMethod = matched.paymentMethod;
          if (matched.courier) t.courier = matched.courier;
          if (matched.qty) t.qty = matched.qty;
        }
      }
    });
    if (typeof renderImportOrdersPreviewTable === 'function') {
      renderImportOrdersPreviewTable();
    }
  }

  showToast(`Sinkronisasi Berhasil: ${mappedCount} nama produk TikTok tersimpan!`, 'success');

  if (!silent) {
    let msg = `✅ Sinkronisasi Nama Produk TikTok Berhasil!\n\n` +
      `• File: ${filename}\n` +
      `• Total produk & SKU disinkronkan: ${mappedCount} item\n`;
    if (updatedCount > 0) {
      msg += `• Pesanan di pembukuan yang langsung diperbarui: ${updatedCount} transaksi\n`;
    }
    msg += `\nPeta nama produk telah disimpan permanen. Sekarang Anda dapat mengunggah File Income (Settlement) TikTok kapan saja. Seluruh nominal keuangan dan nama produk akan terhubung otomatis!`;
    alert(msg);
  }

  return store.tiktokProductMap;
}

// Smart Store Account Classifier based on product keywords
function detectStoreFromProductName(productName, fallbackStoreId = 'health') {
  if (!productName) return fallbackStoreId;
  const s = String(productName).toLowerCase();

  // 1. Nalatiqa Bud
  if (
    s.includes('bud') ||
    s.includes('bitter gourd') ||
    s.includes('green bud') ||
    s.includes('greenbud') ||
    s.includes('spiny bitter') ||
    s.includes('gourd')
  ) {
    return 'bud';
  }

  // 2. Nalatiqa Nature
  if (
    s.includes('nature') ||
    s.includes('tehsure') ||
    s.includes('kurma merah') ||
    s.includes('wolfberry') ||
    s.includes('teh herbal 9') ||
    s.includes('tea nalatiqa') ||
    s.includes('jingva') ||
    s.includes('ginseng') ||
    s.includes('murbei') ||
    s.includes('mulberry')
  ) {
    return 'nature';
  }

  // 3. Nalatiqa Health
  if (
    s.includes('health') ||
    s.includes('tenggorokan') ||
    s.includes('ginklin') ||
    s.includes('habbat') ||
    s.includes('zurfolat') ||
    s.includes('dua garis') ||
    s.includes('moyu') ||
    s.includes('kl prima') ||
    s.includes('halo sehat') ||
    s.includes('halosehat') ||
    s.includes('gel herbal') ||
    s.includes('pasutri') ||
    s.includes('promil') ||
    s.includes('asi booster') ||
    s.includes('batu ginjal') ||
    s.includes('paru-paru') ||
    s.includes('batuk')
  ) {
    return 'health';
  }

  // 4. Nalatiqa Storeline
  if (s.includes('storeline')) {
    return 'storeline';
  }

  // 5. NN Nalatiqa
  if (s.includes('nn nalatiqa') || s.includes('nn ')) {
    return 'nn';
  }

  return fallbackStoreId;
}

// Universal Parser: Handles Official Shopee Multi-Row, TikTok Shop & Official Lazada Account Statements
function parseMarketplaceCsvFile(csvContent, filename, forcedChannel = null, allowOverwrite = false) {
  const lines = splitCsvRecords(csvContent);
  if (lines.length < 2) {
    alert('File laporan kosong atau tidak memiliki baris data.');
    return;
  }

  // If this is a TikTok Order Details / Semua Pesanan sync file, handle synchronization
  if (isTikTokAllOrdersFile(lines, filename)) {
    processTikTokAllOrdersSync(lines, filename, false);
    return;
  }

  // Detect delimiter using the row with the most delimiters among the first 10 non-empty rows
  let delimiter = ',';
  let bestCount = 0;
  for (let r = 0; r < Math.min(10, lines.length); r++) {
    const l = lines[r];
    if (!l || !l.trim()) continue;
    const commas = (l.match(/,/g) || []).length;
    const semis = (l.match(/;/g) || []).length;
    const tabs = (l.match(/\t/g) || []).length;
    if (commas > bestCount && commas >= semis && commas >= tabs) {
      bestCount = commas;
      delimiter = ',';
    } else if (semis > bestCount && semis > commas && semis >= tabs) {
      bestCount = semis;
      delimiter = ';';
    } else if (tabs > bestCount && tabs > commas && tabs > semis) {
      bestCount = tabs;
      delimiter = '\t';
    }
  }

  const parseLine = (line) => {
    const result = [];
    let insideQuote = false;
    let entry = '';
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (insideQuote && line[i + 1] === '"') {
          entry += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (c === delimiter && !insideQuote) {
        result.push(entry.trim().replace(/^"|"$/g, '').trim());
        entry = '';
      } else {
        entry += c;
      }
    }
    result.push(entry.trim().replace(/^"|"$/g, '').trim());
    return result;
  };

  const store = db.getStore();
  const existingOrderIds = new Set(store.transactions.map(t => t.orderId));
  const productCatalogMap = {};
  store.products.forEach(p => {
    if (p.sku) productCatalogMap[p.sku.toLowerCase()] = p;
    if (p.name) productCatalogMap[p.name.toLowerCase()] = p;
  });

  // Determine Channel (Content-based detection first to prevent accidental dropzone mismatch)
  const fullTextSample = lines.slice(0, 25).join('\n').toLowerCase();
  let detectedChannel = null;

  if (
    fullTextSample.includes('id pesanan/penyesuaian') ||
    fullTextSample.includes('jumlah penyelesaian pembayaran') ||
    fullTextSample.includes('biaya komisi platform') ||
    fullTextSample.includes('detail produk terjual') ||
    fullTextSample.includes('subtotal setelah diskon penjual') ||
    fullTextSample.includes('waktu pembayaran pesanan') ||
    fullTextSample.includes('tiktok shop') ||
    filename.toLowerCase().includes('tiktok') ||
    filename.toLowerCase().startsWith('income_')
  ) {
    detectedChannel = 'tiktok';
  } else if (
    fullTextSample.includes('status pelepasan dana') ||
    fullTextSample.includes('lazkoin') ||
    fullTextSample.includes('order processing fee') ||
    (fullTextSample.includes('nama biaya') && fullTextSample.includes('nomor pesanan')) ||
    fullTextSample.includes('order item id') ||
    fullTextSample.includes('statement number') ||
    fullTextSample.includes('payout amount') ||
    filename.toLowerCase().includes('lazada') ||
    filename.toLowerCase().startsWith('s688')
  ) {
    detectedChannel = 'lazada';
  } else if (
    fullTextSample.includes('total penghasilan') ||
    fullTextSample.includes('ongkos kirim dibayar oleh pembeli') ||
    fullTextSample.includes('potongan biaya promosi') ||
    fullTextSample.includes('biaya administrasi') ||
    filename.toLowerCase().includes('shopee')
  ) {
    detectedChannel = 'shopee';
  }

  let channel = detectedChannel || forcedChannel || 'shopee';

  let parsedList = [];
  let skippedDuplicates = 0;
  let metaStoreName = '';
  let metaDateRange = '';
  let metaTotalGross = 0;
  let metaTotalNet = 0;
  let metaTotalDeductions = 0;

  // ==========================================
  // PARSER A: TIKTOK SHOP SETTLEMENT FORMAT
  // ==========================================
  if (channel === 'tiktok') {
    // Find header row for TikTok (typically row 0)
    let headerRowIdx = -1;
    let headers = [];

    for (let r = 0; r < Math.min(10, lines.length); r++) {
      const rowCols = parseLine(lines[r]).map(h => h.trim().toLowerCase());
      if (rowCols.some(h => h.includes('id pesanan') || h.includes('id pesanan/penyesuaian'))) {
        headerRowIdx = r;
        headers = rowCols;
        break;
      }
    }

    if (headerRowIdx === -1) {
      headerRowIdx = 0;
      headers = parseLine(lines[0]).map(h => h.trim().toLowerCase());
    }

    const orderIdx = headers.findIndex(h => h.includes('id pesanan/penyesuaian') || h.includes('id pesanan') || h.includes('order id'));
    const prodNameIdx = headers.findIndex(h => h === 'nama produk' || h === 'product name' || h.includes('nama produk') || h.includes('product name'));
    const qtyIdx = headers.findIndex(h => h === 'quantity' || h === 'qty' || h === 'jumlah' || h.includes('quantity') || h.includes('kuantitas') || h.includes('jumlah produk'));
    const trxTypeIdx = headers.findIndex(h => h.includes('jenis transaksi') || h.includes('transaction type'));
    const netIdx = headers.findIndex(h => h.includes('jumlah penyelesaian pembayaran') || h.includes('total settlement amount') || h.includes('jumlah penyelesaian'));
    const grossIdx = headers.findIndex(h => h.includes('subtotal setelah diskon penjual') || h.includes('subtotal sebelum diskon') || h.includes('total pendapatan'));
    const refundIdx = headers.findIndex(h => h.includes('total pengembalian dana setelah diskon') || h.includes('pengembalian dana'));
    const totalCostIdx = headers.findIndex(h => h === 'total biaya' || h.includes('total biaya') || h.includes('total fee'));
    const commIdx = headers.findIndex(h => h.includes('biaya komisi platform') || h.includes('platform commission'));
    const dynamicCommIdx = headers.findIndex(h => h.includes('komisi dinamis') || h.includes('dynamic commission'));
    const affiliateIdx = headers.findIndex(h => h === 'komisi afiliasi' || h.includes('komisi afiliasi') || h.includes('affiliate commission'));
    const preOrderFeeIdx = headers.findIndex(h => h.includes('biaya layanan pre-order') || h.includes('pre-order service fee'));
    const processingFeeIdx = headers.findIndex(h => h.includes('biaya pemrosesan pesanan') || h.includes('order processing fee'));
    const shippingIdx = headers.findIndex(h => h.includes('biaya layanan logistik') || h === 'ongkir' || h.includes('shipping fee'));
    const transIdx = headers.findIndex(h => h.includes('biaya pembayaran') || h.includes('transaction fee'));
    const xtraIdx = headers.findIndex(h => h.includes('growth xtra') || h.includes('bebas ongkir') || h.includes('program layanan'));
    const gmvMaxIdx = headers.findIndex(h => h.includes('biaya iklan gmv max') || h.includes('gmv max'));
    const pph22Idx = headers.findIndex(h => h.includes('pph pasal 22') || h.includes('pph 22'));
    const adjAmountIdx = headers.findIndex(h => h.includes('jumlah penyesuaian') || h.includes('adjustment amount'));
    const dateIdx = headers.findIndex(h => h.includes('waktu pemesanan') || h.includes('created time') || h.includes('order creation time'));
    const releaseIdx = headers.findIndex(h => h.includes('waktu pembayaran pesanan') || h.includes('settlement time') || h.includes('waktu pembayaran'));
    const prodIdx = headers.findIndex(h => h.includes('detail produk terjual') || h.includes('sku'));
    const relatedOrderIdx = headers.findIndex(h => h.includes('id pesanan terkait') || h.includes('related order id'));
    const sourceIdx = headers.findIndex(h => h.includes('sumber pesanan') || h.includes('order source'));

    let ordersTableEnded = false;

    // Scan lines for order records until summary section
    for (let i = headerRowIdx + 1; i < lines.length; i++) {
      const rawLine = lines[i];
      if (!rawLine || !rawLine.trim()) continue;
      const trimmedLine = rawLine.trim();

      const cols = parseLine(rawLine);
      if (cols.length < 5) continue;

      const orderId = orderIdx >= 0 ? (cols[orderIdx] || '').trim() : '';
      const isNumericOrder = orderId && /^\d{12,}/.test(orderId);

      // Check if line is footer summary, withdrawal, or glossarium (when not a genuine order)
      const lowerLine = trimmedLine.toLowerCase();
      if (!isNumericOrder && (
        lowerLine.includes('periode') ||
        lowerLine.includes('jumlah penyelesaian') ||
        lowerLine.includes('total pendapatan') ||
        lowerLine.includes('total biaya') ||
        lowerLine.includes('penjelasan tentang biaya') ||
        lowerLine.includes('jenis transaksi,id referensi') ||
        lowerLine.startsWith('withdrawal') ||
        lowerLine.startsWith('earnings') ||
        lowerLine.includes('nama,penjelasan') ||
        lowerLine.includes('berbagai jenis penyesuaian') ||
        lowerLine.includes('informasi pendukung tambahan')
      )) {
        if (lowerLine.includes('periode')) {
          const parts = rawLine.split(',');
          metaDateRange = (parts[parts.length - 1] || '').trim();
        }
        if (lowerLine.includes('jumlah penyelesaian pembayaran') || lowerLine.includes('jumlah penyelesaian')) {
          const parts = rawLine.split(',');
          const num = cleanNumber(parts[parts.length - 1]);
          if (num > 0) metaTotalNet = num;
        }
        if (lowerLine.includes('total pendapatan')) {
          const parts = rawLine.split(',');
          const num = cleanNumber(parts[parts.length - 1]);
          if (num > 0) metaTotalGross = num;
        }
        if (lowerLine.includes('total biaya')) {
          const parts = rawLine.split(',');
          const num = cleanNumber(parts[parts.length - 1]);
          if (num !== 0) metaTotalDeductions = Math.abs(num);
        }
        continue;
      }

      if (!isNumericOrder) {
        continue;
      }

      // Check duplicate
      const isExisting = existingOrderIds.has(orderId);
      if (isExisting && !allowOverwrite) {
        skippedDuplicates++;
        continue;
      }

      let net = netIdx >= 0 ? cleanNumber(cols[netIdx]) : 0;
      let gross = grossIdx >= 0 ? Math.abs(cleanNumber(cols[grossIdx])) : 0;
      let refund = refundIdx >= 0 ? cleanNumber(cols[refundIdx]) : 0;
      let totalCost = totalCostIdx >= 0 ? Math.abs(cleanNumber(cols[totalCostIdx])) : 0;

      let platformComm = commIdx >= 0 ? Math.abs(cleanNumber(cols[commIdx])) : 0;
      let dynamicComm = dynamicCommIdx >= 0 ? Math.abs(cleanNumber(cols[dynamicCommIdx])) : 0;
      let affiliateComm = affiliateIdx >= 0 ? Math.abs(cleanNumber(cols[affiliateIdx])) : 0;
      let admin = platformComm + dynamicComm + affiliateComm;

      let processing = processingFeeIdx >= 0 ? Math.abs(cleanNumber(cols[processingFeeIdx])) : 0;
      let shipping = shippingIdx >= 0 ? Math.abs(cleanNumber(cols[shippingIdx])) : 0;
      let xtra = xtraIdx >= 0 ? Math.abs(cleanNumber(cols[xtraIdx])) : 0;
      let preOrder = preOrderFeeIdx >= 0 ? Math.abs(cleanNumber(cols[preOrderFeeIdx])) : 0;
      let service = processing + shipping + xtra + preOrder;

      let trans = transIdx >= 0 ? Math.abs(cleanNumber(cols[transIdx])) : 0;
      let gmvMax = gmvMaxIdx >= 0 ? Math.abs(cleanNumber(cols[gmvMaxIdx])) : 0;
      let pph22 = pph22Idx >= 0 ? Math.abs(cleanNumber(cols[pph22Idx])) : 0;
      let transactionFee = trans + gmvMax + pph22;

      let voucherFee = 0;

      if (totalCost > 0) {
        const itemizedSum = admin + service + transactionFee;
        if (totalCost > itemizedSum) {
          voucherFee = totalCost - itemizedSum;
        } else if (itemizedSum === 0) {
          service = totalCost;
        }
      }

      let date = new Date().toISOString().split('T')[0];
      if (dateIdx >= 0 && cols[dateIdx]) {
        const rawDate = cols[dateIdx].replace(/\//g, '-').split(' ')[0];
        if (rawDate.match(/^\d{4}-\d{2}-\d{2}/)) date = rawDate;
      }

      let releaseDate = date;
      if (releaseIdx >= 0 && cols[releaseIdx]) {
        const rawRel = cols[releaseIdx].replace(/\//g, '-').split(' ')[0];
        if (rawRel.match(/^\d{4}-\d{2}-\d{2}/)) releaseDate = rawRel;
      }

      let trxType = trxTypeIdx >= 0 ? cols[trxTypeIdx].trim() : 'Pesanan';
      let relatedId = relatedOrderIdx >= 0 ? cols[relatedOrderIdx].trim() : '';
      let orderSource = sourceIdx >= 0 ? (cols[sourceIdx] || '').trim() : 'TikTok Shop';

      // Determine Product Name & SKU:
      let prodName = '';
      let sku = '';
      let qty = 1;

      // Read direct Quantity column if available
      if (qtyIdx >= 0 && cols[qtyIdx]) {
        const parsedQ = parseInt(cols[qtyIdx].trim(), 10);
        if (!isNaN(parsedQ) && parsedQ > 0) qty = parsedQ;
      }

      const isBadName = (str) => {
        if (!str) return true;
        const s = String(str).trim().toLowerCase();
        return s === '' || s === '/' || s === '-' || s === 'n/a' || s === '#n/a' || s === 'na' || s === '#ref!' || s === 'nan' || s === 'null' || s === 'undefined' || s === 'none';
      };

      // 1. Direct explicit "Nama Produk" column if available in this format
      if (prodNameIdx >= 0 && cols[prodNameIdx]) {
        const pval = cols[prodNameIdx].trim();
        if (!isBadName(pval)) {
          prodName = pval;
        }
      }

      // 2. Extract SKU and Quantity from "detail produk terjual" (e.g. "1737863318058665295 * 2;")
      let rawDetail = prodIdx >= 0 ? cols[prodIdx].trim() : '';
      if (rawDetail && rawDetail !== '/' && rawDetail !== '-') {
        if (rawDetail.includes('*')) {
          const parts = rawDetail.split('*');
          sku = parts[0].trim();
          const parsedQty = parseInt(parts[1].replace(/;/g, '').trim(), 10);
          if (!isNaN(parsedQty) && parsedQty > 0 && qty === 1) qty = parsedQty;
        } else {
          sku = rawDetail.replace(/;/g, '').trim();
        }
      }

      // 3. Check store.tiktokProductMap (from previously synchronized "Semua Pesanan" file)
      let buyerName = 'Pelanggan TikTok';
      let paymentMethod = orderSource.toLowerCase().includes('tokopedia') ? 'Tokopedia / Online' : 'TikTok / Online';
      let courier = 'J&T / Ninja';

      if (store.tiktokProductMap) {
        const matched = findTikTokProductInMap(orderId, sku, store.tiktokProductMap);
        if (matched) {
          if (matched.productName && (isBadName(prodName) || prodName === 'Produk TikTok Shop' || prodName.startsWith('Item SKU:'))) {
            prodName = matched.productName + (matched.variation && matched.variation !== 'Default' ? ` (${matched.variation})` : '');
          }
          if (matched.sku && !sku) sku = matched.sku;
          if (matched.buyerName) buyerName = matched.buyerName;
          if (matched.paymentMethod) paymentMethod = matched.paymentMethod;
          if (matched.courier) courier = matched.courier;
          if (matched.qty && (!qty || qty === 1)) qty = matched.qty;
        }
      }

      // 4. Handle Logistics adjustment / reimbursement (e.g. Penggantian Biaya Logistik)
      if (isBadName(prodName) && (trxType.toLowerCase().includes('logistik') || trxType.toLowerCase().includes('penyesuaian') || /^\d{19}$/.test(orderId) || orderId.startsWith('769') || orderId.startsWith('770'))) {
        prodName = `Kompensasi / ${trxType || 'Penyesuaian Biaya Logistik'}` + (relatedId ? ` (ID Terkait: ${relatedId})` : '');
      }

      // 5. Intelligent Store Catalog Match & Price Heuristic Fallback (Never show 'N/A' or 'Produk TikTok Shop')
      if (isBadName(prodName)) {
        if (sku && productCatalogMap[sku.toLowerCase()]) {
          prodName = productCatalogMap[sku.toLowerCase()].name;
        } else if (gross >= 105000 && gross <= 125000) {
          prodName = 'Nalatiqa Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami';
        } else if (gross >= 60000 && gross <= 75000) {
          prodName = 'HALO SEHAT HERBAL TENGGOROKAN GEL NALATIQA 20G';
        } else if (gross >= 130000 && gross <= 145000) {
          prodName = 'HALO SEHAT HERBAL TENGGOROKAN GEL NALATIQA (Paket 2 Pcs)';
        } else if (sku) {
          prodName = `Item SKU: ${sku}`;
        } else {
          prodName = 'Nalatiqa Spiny Bitter Gourd Capsule Herbal';
        }
      }

      // If adjustment (gross = 0, but net > 0): count gross as net so revenue is registered
      if (gross === 0 && net > 0) {
        gross = net;
      }

      // Match HPP from product catalog if available
      let matchedHpp = 0;
      if (prodName && productCatalogMap[prodName.toLowerCase()]) {
        matchedHpp = productCatalogMap[prodName.toLowerCase()].hpp * qty;
      } else if (sku && productCatalogMap[sku.toLowerCase()]) {
        matchedHpp = productCatalogMap[sku.toLowerCase()].hpp * qty;
      } else {
        const defaultHppRate = (store.settings.defaultHppPercentage || 45.0) / 100;
        matchedHpp = Math.round(gross * defaultHppRate);
      }

      // Status handling: if net is 0 and refund is negative, mark as cancelled
      let status = 'settled';
      let noteText = orderSource ? `${orderSource} Settlement` : 'TikTok Shop Settlement';
      if (net === 0 && refund !== 0) {
        status = 'cancelled';
        noteText = `Dibatalkan / Pengembalian Dana Pembeli (Refund: ${formatRupiah(refund)})`;
      } else if (net === 0 && refund === 0 && gross > 0) {
        status = 'cancelled';
        noteText = 'Pesanan Dibatalkan / Penyesuaian Saldo';
      } else if (trxType.toLowerCase().includes('logistik') || trxType.toLowerCase().includes('penyesuaian')) {
        noteText = `Penyesuaian Saldo: ${trxType}` + (relatedId ? ` (Ref: ${relatedId})` : '');
      }

      parsedList.push({
        id: `TRX-IMP-${Date.now()}-${parsedList.length + 1}`,
        orderId,
        channel: 'tiktok',
        date,
        releaseDate,
        buyerName,
        productName: prodName,
        sku,
        qty,
        grossSales: gross,
        adminFee: admin,
        serviceFee: service,
        transactionFee: transactionFee,
        voucherFee: voucherFee,
        netSettlement: net,
        hppTotal: status === 'cancelled' ? 0 : matchedHpp,
        status,
        paymentMethod,
        courier,
        notes: noteText,
        isUpdate: isExisting
      });
    }

    metaStoreName = store.settings.tiktokStoreName || 'TikTok Shop Store';
    if (metaTotalGross === 0) metaTotalGross = parsedList.reduce((sum, item) => sum + item.grossSales, 0);
    if (metaTotalNet === 0) metaTotalNet = parsedList.reduce((sum, item) => sum + item.netSettlement, 0);
    if (metaTotalDeductions === 0) metaTotalDeductions = parsedList.reduce((sum, item) => sum + (item.adminFee + item.serviceFee + item.transactionFee + item.voucherFee), 0);
  }

  // ==========================================
  // PARSER B: LAZADA ACCOUNT STATEMENT FORMAT
  // ==========================================
  else if (channel === 'lazada') {
    let headerRowIdx = -1;
    let headers = [];

    for (let r = 0; r < Math.min(15, lines.length); r++) {
      const rowCols = parseLine(lines[r]).map(h => h.trim().toLowerCase());
      if (rowCols.some(h => h.includes('nomor pesanan') || h.includes('order no') || h.includes('order number') || h.includes('nama biaya'))) {
        headerRowIdx = r;
        headers = rowCols;
        break;
      }
    }

    if (headerRowIdx === -1) {
      headerRowIdx = 0;
      headers = parseLine(lines[0]).map(h => h.trim().toLowerCase());
    }

    const isMultiRowLedger = headers.some(h => h.includes('nama biaya')) && headers.some(h => h.includes('jumlah'));

    metaStoreName = store.settings.lazadaStoreName || 'TOKO NALATIQA (Lazada)';

    if (isMultiRowLedger) {
      // User's Official Lazada Account Statement Format (Multi-Row per Order)
      const orderIdx = headers.findIndex(h => h === 'nomor pesanan' || h.includes('nomor pesanan'));
      const orderItemIdIdx = headers.findIndex(h => h === 'id pesanan' || h.includes('id pesanan'));
      const feeNameIdx = headers.findIndex(h => h === 'nama biaya' || h.includes('nama biaya') || h.includes('fee name'));
      const amountIdx = headers.findIndex(h => h.includes('jumlah (termasuk pajak)') || h === 'jumlah' || h.includes('amount'));
      const orderDateIdx = headers.findIndex(h => h.includes('tanggal pesanan dibuat') || h.includes('order creation'));
      const releaseDateIdx = headers.findIndex(h => h.includes('tanggal dilepas') || h.includes('payout date'));
      const txDateIdx = headers.findIndex(h => h.includes('tanggal transaksi') || h.includes('transaction date'));
      const prodIdx = headers.findIndex(h => h.includes('nama produk') || h.includes('item name') || h.includes('product name'));
      const sellerSkuIdx = headers.findIndex(h => h.includes('sku penjual') || h.includes('seller sku'));
      const lazadaSkuIdx = headers.findIndex(h => h.includes('lazada sku'));
      const statusIdx = headers.findIndex(h => h.includes('status pesanan') || h.includes('status pelepasan dana') || h.includes('status'));
      const periodIdx = headers.findIndex(h => h.includes('periode laporan'));

      const orderGroups = {};

      for (let i = headerRowIdx + 1; i < lines.length; i++) {
        const cols = parseLine(lines[i]);
        if (cols.length < 3) continue;

        const rawOrderId = orderIdx !== -1 ? (cols[orderIdx] || '').trim() : '';
        if (!rawOrderId || rawOrderId.toLowerCase().includes('nomor pesanan') || rawOrderId.startsWith('Total')) continue;

        if (periodIdx !== -1 && cols[periodIdx] && !metaDateRange) {
          metaDateRange = cols[periodIdx].trim();
        }

        if (!orderGroups[rawOrderId]) {
          orderGroups[rawOrderId] = {
            orderId: rawOrderId,
            orderDate: orderDateIdx !== -1 ? cols[orderDateIdx] : '',
            releaseDate: releaseDateIdx !== -1 ? cols[releaseDateIdx] : '',
            txDate: txDateIdx !== -1 ? cols[txDateIdx] : '',
            productName: prodIdx !== -1 ? cols[prodIdx] : '',
            sellerSku: sellerSkuIdx !== -1 ? cols[sellerSkuIdx] : '',
            lazadaSku: lazadaSkuIdx !== -1 ? cols[lazadaSkuIdx] : '',
            status: statusIdx !== -1 ? cols[statusIdx] : 'Dikonfirmasi',
            itemIds: new Set(),
            gross: 0,
            adminFee: 0,
            transactionFee: 0,
            serviceFee: 0,
            voucherFee: 0,
            net: 0
          };
        }

        const og = orderGroups[rawOrderId];
        if (!og.orderDate && orderDateIdx !== -1 && cols[orderDateIdx]) og.orderDate = cols[orderDateIdx];
        if (!og.releaseDate && releaseDateIdx !== -1 && cols[releaseDateIdx]) og.releaseDate = cols[releaseDateIdx];
        if (!og.txDate && txDateIdx !== -1 && cols[txDateIdx]) og.txDate = cols[txDateIdx];
        if (!og.productName && prodIdx !== -1 && cols[prodIdx]) og.productName = cols[prodIdx];
        if (!og.sellerSku && sellerSkuIdx !== -1 && cols[sellerSkuIdx]) og.sellerSku = cols[sellerSkuIdx];
        if (!og.lazadaSku && lazadaSkuIdx !== -1 && cols[lazadaSkuIdx]) og.lazadaSku = cols[lazadaSkuIdx];

        const itemId = orderItemIdIdx !== -1 ? (cols[orderItemIdIdx] || '').trim() : '';
        if (itemId) og.itemIds.add(itemId);

        const feeName = feeNameIdx !== -1 ? (cols[feeNameIdx] || '').trim().toLowerCase() : '';
        const amount = amountIdx !== -1 ? cleanNumber(cols[amountIdx]) : 0;

        if (feeName.includes('omset penjualan') || feeName.includes('item price credit') || feeName.includes('harga barang')) {
          og.gross += Math.abs(amount);
        } else if (feeName.includes('komisi') || feeName.includes('commission')) {
          og.adminFee += Math.abs(amount);
        } else if (feeName.includes('biaya transaksi') || feeName.includes('payment fee') || feeName.includes('biaya pembayaran')) {
          og.transactionFee += Math.abs(amount);
        } else if (feeName.includes('lazkoin') || feeName.includes('promosi') || feeName.includes('voucher') || feeName.includes('diskon')) {
          og.voucherFee += Math.abs(amount);
        } else {
          // Deductions e.g. Order Processing Fee, Pajak Penghasilan Pasal 22, Bebas Ongkir
          if (amount < 0) {
            og.serviceFee += Math.abs(amount);
          } else if (amount > 0) {
            og.gross += amount;
          }
        }
      }

      Object.values(orderGroups).forEach(og => {
        const isExisting = existingOrderIds.has(og.orderId);
        if (isExisting && !allowOverwrite) {
          skippedDuplicates++;
          return;
        }

        const totalDeductions = og.adminFee + og.serviceFee + og.transactionFee + og.voucherFee;
        og.net = og.gross - totalDeductions;

        const qty = Math.max(1, og.itemIds.size);

        const catalogItem = productCatalogMap[(og.sellerSku || '').toLowerCase()] || productCatalogMap[(og.productName || '').toLowerCase()];
        const finalName = og.productName || (catalogItem ? catalogItem.name : `Produk Lazada (${og.sellerSku || og.orderId})`);
        const finalSku = og.sellerSku || (catalogItem ? catalogItem.sku : '-');

        let matchedHpp = 0;
        if (catalogItem && catalogItem.hpp) {
          matchedHpp = catalogItem.hpp * qty;
        } else {
          const defaultHppRate = (store.settings.defaultHppPercentage || 45.0) / 100;
          matchedHpp = Math.round(og.gross * defaultHppRate);
        }

        const cleanOrderDate = parseLazadaDate(og.orderDate || og.txDate);
        const cleanReleaseDate = parseLazadaDate(og.releaseDate || og.txDate || og.orderDate);

        let status = 'settled';
        const rawStatus = (og.status || '').toLowerCase();
        if (rawStatus.includes('batal') || rawStatus.includes('cancel') || rawStatus.includes('retur') || rawStatus.includes('refund')) {
          status = 'cancelled';
        }

        parsedList.push({
          id: `TRX-LZ-${Date.now()}-${parsedList.length + 1}`,
          orderId: og.orderId,
          channel: 'lazada',
          date: cleanOrderDate,
          releaseDate: cleanReleaseDate,
          buyerName: 'Pelanggan Lazada',
          productName: finalName,
          sku: finalSku,
          qty: qty,
          grossSales: og.gross,
          adminFee: og.adminFee,
          serviceFee: og.serviceFee,
          transactionFee: og.transactionFee,
          voucherFee: og.voucherFee,
          netSettlement: og.net,
          hppTotal: status === 'cancelled' ? 0 : matchedHpp,
          status: status,
          paymentMethod: 'Lazada Wallet / Online',
          courier: 'Lazada Logistics (LEX)',
          notes: `Import Lazada: ${filename}`
        });

        metaTotalGross += og.gross;
        metaTotalNet += og.net;
        metaTotalDeductions += totalDeductions;
      });

    } else {
      // Tabular / Single-Row Lazada Format Fallback
      const orderIdx = headers.findIndex(h => h.includes('order no') || h.includes('order number') || h.includes('nomor pesanan') || h.includes('order id'));
      const dateIdx = headers.findIndex(h => h.includes('transaction date') || h.includes('order creation date') || h.includes('tanggal') || h.includes('date'));
      const itemIdx = headers.findIndex(h => h.includes('item name') || h.includes('product name') || h.includes('nama barang') || h.includes('nama produk') || h.includes('detail'));
      const skuIdx = headers.findIndex(h => h.includes('seller sku') || h.includes('lazada sku') || h.includes('sku'));
      const amountIdx = headers.findIndex(h => h.includes('paid price') || h.includes('item price credit') || h.includes('item price') || h.includes('amount') || h.includes('harga') || h.includes('gross'));
      const commIdx = headers.findIndex(h => h.includes('commission') || h.includes('biaya komisi') || h.includes('komisi'));
      const paymentFeeIdx = headers.findIndex(h => h.includes('payment fee') || h.includes('biaya pembayaran') || h.includes('biaya transaksi'));
      const shippingIdx = headers.findIndex(h => h.includes('shipping') || h.includes('ongkir') || h.includes('free shipping max'));
      const netIdx = headers.findIndex(h => h.includes('net payout') || h.includes('payout') || h.includes('net amount') || h.includes('jumlah penyelesaian') || h.includes('pencairan'));
      const statusIdx = headers.findIndex(h => h.includes('status') || h.includes('paid status') || h.includes('transaction type'));

      const orderGroups = {};

      for (let i = headerRowIdx + 1; i < lines.length; i++) {
        const cols = parseLine(lines[i]);
        if (cols.length < 2) continue;

        const rawOrderId = orderIdx !== -1 ? (cols[orderIdx] || '').trim() : '';
        if (!rawOrderId || rawOrderId.length < 3 || rawOrderId.toLowerCase().includes('total')) continue;

        if (!orderGroups[rawOrderId]) {
          orderGroups[rawOrderId] = {
            orderId: rawOrderId,
            date: dateIdx !== -1 ? (cols[dateIdx] || '').split(' ')[0] : '',
            productName: itemIdx !== -1 ? cols[itemIdx] : '',
            sku: skuIdx !== -1 ? cols[skuIdx] : '',
            gross: 0,
            adminFee: 0,
            serviceFee: 0,
            transactionFee: 0,
            voucherFee: 0,
            net: 0,
            status: 'settled'
          };
        }

        const og = orderGroups[rawOrderId];
        if (!og.date && dateIdx !== -1 && cols[dateIdx]) {
          og.date = cols[dateIdx].split(' ')[0];
        }
        if (!og.productName && itemIdx !== -1 && cols[itemIdx]) {
          og.productName = cols[itemIdx];
        }
        if (!og.sku && skuIdx !== -1 && cols[skuIdx]) {
          og.sku = cols[skuIdx];
        }

        const rowAmount = amountIdx !== -1 ? cleanNumber(cols[amountIdx]) : 0;
        const rowType = statusIdx !== -1 ? (cols[statusIdx] || '').toLowerCase() : '';

        if (rowType.includes('commission')) {
          og.adminFee += Math.abs(rowAmount);
        } else if (rowType.includes('payment') || rowType.includes('transaction fee')) {
          og.transactionFee += Math.abs(rowAmount);
        } else if (rowType.includes('shipping') || rowType.includes('voucher') || rowType.includes('max')) {
          og.serviceFee += Math.abs(rowAmount);
        } else if (rowType.includes('refund') || rowType.includes('retur') || rowType.includes('cancel')) {
          og.status = 'cancelled';
        } else if (netIdx !== -1 && cols[netIdx]) {
          og.gross = Math.abs(rowAmount);
          if (commIdx !== -1) og.adminFee = Math.abs(cleanNumber(cols[commIdx]));
          if (paymentFeeIdx !== -1) og.transactionFee = Math.abs(cleanNumber(cols[paymentFeeIdx]));
          if (shippingIdx !== -1) og.serviceFee = Math.abs(cleanNumber(cols[shippingIdx]));
          og.net = cleanNumber(cols[netIdx]);
        } else {
          if (rowAmount > 0) og.gross += rowAmount;
          else if (rowAmount < 0) og.adminFee += Math.abs(rowAmount);
        }
      }

      Object.values(orderGroups).forEach(og => {
        const isExisting = existingOrderIds.has(og.orderId);
        if (isExisting && !allowOverwrite) {
          skippedDuplicates++;
          return;
        }

        const totalDeductions = og.adminFee + og.serviceFee + og.transactionFee + og.voucherFee;
        if (og.net === 0 && og.gross > 0) {
          og.net = Math.max(0, og.gross - totalDeductions);
        }

        const catalogItem = productCatalogMap[(og.sku || '').toLowerCase()] || productCatalogMap[(og.productName || '').toLowerCase()];
        const finalName = og.productName || (catalogItem ? catalogItem.name : `Produk Lazada (${og.sku || og.orderId})`);
        const finalSku = og.sku || (catalogItem ? catalogItem.sku : '-');

        const cleanDate = parseLazadaDate(og.date);

        parsedList.push({
          id: `TRX-LZ-${Date.now()}-${parsedList.length + 1}`,
          orderId: og.orderId,
          channel: 'lazada',
          date: cleanDate,
          releaseDate: cleanDate,
          buyerName: 'Pelanggan Lazada',
          sku: finalSku,
          productName: finalName,
          qty: 1,
          grossSales: og.gross,
          adminFee: og.adminFee,
          serviceFee: og.serviceFee,
          transactionFee: og.transactionFee,
          voucherFee: og.voucherFee,
          netSettlement: og.net,
          hppTotal: 0,
          status: og.status,
          paymentMethod: 'Lazada Wallet / Online',
          courier: 'Lazada Logistics (LEX)',
          notes: `Import Lazada: ${filename}`
        });

        metaTotalGross += og.gross;
        metaTotalNet += og.net;
        metaTotalDeductions += totalDeductions;
      });
    }
  }

  // ==========================================
  // PARSER C: SHOPEE SELLER CENTRE FORMAT
  // ==========================================
  else {
    // 1. Scan for Store Metadata & Executive Summary in Header Lines
    for (let r = 0; r < lines.length; r++) {
      const lineStr = lines[r];
      const cols = parseLine(lineStr);
      const col0 = (cols[0] || '').trim().toLowerCase();

      if (col0.includes('username (penjual)')) {
        metaStoreName = (cols[1] || '').trim();
      } else if (col0 === 'dari') {
        metaDateRange = (cols[1] || '').trim();
      } else if (col0 === 'ke') {
        metaDateRange += ' s/d ' + (cols[1] || '').trim();
      } else if (col0.includes('1. total pendapatan')) {
        metaTotalGross = Math.abs(cleanNumber(cols[3] || cols[1]));
      } else if (col0.includes('2. total pengeluaran')) {
        metaTotalDeductions = Math.abs(cleanNumber(cols[3] || cols[1]));
      } else if (col0.includes('3. total yang dilepas')) {
        metaTotalNet = Math.abs(cleanNumber(cols[3] || cols[1]));
      }
    }

    // 2. Scan entire file to find the Main Table Header row
    let headerRowIdx = -1;
    let headers = [];

    for (let r = 0; r < lines.length; r++) {
      const rowCols = parseLine(lines[r]).map(h => h.trim().toLowerCase());
      if (
        rowCols.some(h => h.includes('no. pesanan') || h.includes('order id') || h.includes('order sn')) &&
        rowCols.some(h => h.includes('total penghasilan') || h.includes('harga produk') || h.includes('lihat berdasarkan'))
      ) {
        headerRowIdx = r;
        headers = rowCols;
        break;
      }
    }

    if (headerRowIdx === -1) {
      headerRowIdx = 0;
      headers = parseLine(lines[0]).map(h => h.trim().toLowerCase());
    }

    const orderIdx = headers.findIndex(h => h === 'no. pesanan' || h.includes('no. pesanan') || h.includes('order id') || h.includes('order sn'));
    const typeIdx = headers.findIndex(h => h.includes('lihat berdasarkan'));
    const grossIdx = headers.findIndex(h => h === 'harga produk' || h.includes('harga produk') || h.includes('harga asli') || h.includes('subtotal pesanan') || h.includes('subtotal produk'));
    const netIdx = headers.findIndex(h => h === 'total penghasilan' || h.includes('total penghasilan') || h.includes('penghasilan'));
    const adminIdx = headers.findIndex(h => h.includes('biaya administrasi'));
    const transIdx = headers.findIndex(h => h.includes('biaya proses pesanan') || h.includes('biaya transaksi') || h.includes('biaya pembayaran'));
    const xtraIdx = headers.findIndex(h => h.includes('biaya gratis ongkir xtra'));
    const promoXtraIdx = headers.findIndex(h => h.includes('biaya layanan promo xtra') || h.includes('biaya layanan'));
    const campaignIdx = headers.findIndex(h => h.includes('biaya kampanye'));
    const amsIdx = headers.findIndex(h => h.includes('biaya komisi ams'));
    const voucherIdx = headers.findIndex(h => h.includes('voucher disponsor oleh penjual') || h.includes('voucher'));
    const coinIdx = headers.findIndex(h => h.includes('cashback koin disponsori penjual'));
    const dateIdx = headers.findIndex(h => h.includes('waktu pesanan dibuat') || h.includes('waktu pesanan'));
    const releaseIdx = headers.findIndex(h => h.includes('tanggal dana dilepaskan') || h.includes('waktu dana dilepaskan'));
    const productIdx = headers.findIndex(h => h === 'nama produk' || h.includes('nama produk'));
    const productIdIdx = headers.findIndex(h => h.includes('id produk'));
    const skuIdx = headers.findIndex(h => h.includes('nomor referensi sku') || h.includes('sku'));
    const buyerIdx = headers.findIndex(h => h.includes('username (pembeli)') || h.includes('buyer'));
    const paymentIdx = headers.findIndex(h => h.includes('metode pembayaran pembeli') || h.includes('metode pembayaran'));
    const courierIdx = headers.findIndex(h => h.includes('nama kurir') || h.includes('jasa kirim'));

    const orderMap = {};
    const skippedOrderSet = new Set();

    for (let i = headerRowIdx + 1; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      if (cols.length < 3) continue;

      const orderId = orderIdx >= 0 ? cols[orderIdx].trim() : '';
      if (!orderId || orderId === '-' || orderId.toLowerCase() === 'no. pesanan') continue;

      const isExisting = existingOrderIds.has(orderId);
      if (isExisting && !allowOverwrite) {
        skippedOrderSet.add(orderId);
        continue;
      }

      const currentProduct = productIdx >= 0 ? cols[productIdx].trim() : '';
      const currentProductId = productIdIdx >= 0 ? cols[productIdIdx].trim() : '';
      const currentSku = skuIdx >= 0 ? cols[skuIdx].trim() : '';
      const currentBuyer = buyerIdx >= 0 ? cols[buyerIdx].trim() : '';
      const currentPayment = paymentIdx >= 0 ? cols[paymentIdx].trim() : '';
      const currentCourier = courierIdx >= 0 ? cols[courierIdx].trim() : '';

      if (!orderMap[orderId]) {
        let gross = grossIdx >= 0 ? Math.abs(cleanNumber(cols[grossIdx])) : 0;
        let net = netIdx >= 0 ? Math.abs(cleanNumber(cols[netIdx])) : 0;
        let admin = adminIdx >= 0 ? Math.abs(cleanNumber(cols[adminIdx])) : 0;
        let trans = transIdx >= 0 ? Math.abs(cleanNumber(cols[transIdx])) : 0;
        let xtra = xtraIdx >= 0 ? Math.abs(cleanNumber(cols[xtraIdx])) : 0;
        let promoXtra = promoXtraIdx >= 0 ? Math.abs(cleanNumber(cols[promoXtraIdx])) : 0;
        let camp = campaignIdx >= 0 ? Math.abs(cleanNumber(cols[campaignIdx])) : 0;
        let ams = amsIdx >= 0 ? Math.abs(cleanNumber(cols[amsIdx])) : 0;
        let voucher = voucherIdx >= 0 ? Math.abs(cleanNumber(cols[voucherIdx])) : 0;
        let coin = coinIdx >= 0 ? Math.abs(cleanNumber(cols[coinIdx])) : 0;

        let date = dateIdx >= 0 && cols[dateIdx] ? parseShopeeDate(cols[dateIdx]) : new Date().toISOString().split('T')[0];
        let releaseDate = releaseIdx >= 0 && cols[releaseIdx] ? parseShopeeDate(cols[releaseIdx]) : date;

        let matchedHpp = 0;
        if (currentSku && productCatalogMap[currentSku.toLowerCase()]) {
          matchedHpp = productCatalogMap[currentSku.toLowerCase()].hpp;
        } else if (currentProductId && productCatalogMap[currentProductId.toLowerCase()]) {
          matchedHpp = productCatalogMap[currentProductId.toLowerCase()].hpp;
        } else if (currentProduct && currentProduct !== '-' && productCatalogMap[currentProduct.toLowerCase()]) {
          matchedHpp = productCatalogMap[currentProduct.toLowerCase()].hpp;
        } else {
          const defaultHppRate = (store.settings.defaultHppPercentage || 45.0) / 100;
          matchedHpp = Math.round(gross * defaultHppRate);
        }

        orderMap[orderId] = {
          id: `TRX-IMP-${Date.now()}-${Object.keys(orderMap).length + 1}`,
          orderId,
          channel: 'shopee',
          date,
          releaseDate,
          buyerName: (currentBuyer && currentBuyer !== '-') ? currentBuyer : 'Pembeli Shopee',
          productName: (currentProduct && currentProduct !== '-') ? currentProduct : 'Pesanan Shopee',
          sku: (currentSku && currentSku !== '-') ? currentSku : ((currentProductId && currentProductId !== '-') ? currentProductId : ''),
          qty: 1,
          grossSales: gross,
          adminFee: admin,
          serviceFee: xtra + promoXtra,
          transactionFee: trans,
          voucherFee: voucher + coin + camp + ams,
          netSettlement: net,
          hppTotal: matchedHpp,
          status: 'settled',
          paymentMethod: (currentPayment && currentPayment !== '-') ? currentPayment : 'COD (Bayar di Tempat)',
          courier: (currentCourier && currentCourier !== '-') ? currentCourier : 'SPX Hemat',
          notes: `Import: ${filename}`,
          isUpdate: isExisting
        };
      } else {
        const existing = orderMap[orderId];

        // If financial info was missing in previous row (e.g. Sku row came first)
        let gross = grossIdx >= 0 ? Math.abs(cleanNumber(cols[grossIdx])) : 0;
        let net = netIdx >= 0 ? Math.abs(cleanNumber(cols[netIdx])) : 0;
        let admin = adminIdx >= 0 ? Math.abs(cleanNumber(cols[adminIdx])) : 0;
        let trans = transIdx >= 0 ? Math.abs(cleanNumber(cols[transIdx])) : 0;
        let xtra = xtraIdx >= 0 ? Math.abs(cleanNumber(cols[xtraIdx])) : 0;
        let promoXtra = promoXtraIdx >= 0 ? Math.abs(cleanNumber(cols[promoXtraIdx])) : 0;
        let camp = campaignIdx >= 0 ? Math.abs(cleanNumber(cols[campaignIdx])) : 0;
        let ams = amsIdx >= 0 ? Math.abs(cleanNumber(cols[amsIdx])) : 0;
        let voucher = voucherIdx >= 0 ? Math.abs(cleanNumber(cols[voucherIdx])) : 0;
        let coin = coinIdx >= 0 ? Math.abs(cleanNumber(cols[coinIdx])) : 0;

        if (existing.netSettlement === 0 && net > 0) {
          existing.grossSales = gross;
          existing.netSettlement = net;
          existing.adminFee = admin;
          existing.serviceFee = xtra + promoXtra;
          existing.transactionFee = trans;
          existing.voucherFee = voucher + coin + camp + ams;
          if (dateIdx >= 0 && cols[dateIdx]) existing.date = parseShopeeDate(cols[dateIdx]);
          if (releaseIdx >= 0 && cols[releaseIdx]) existing.releaseDate = parseShopeeDate(cols[releaseIdx]);
        }
        if (existing.grossSales === 0 && gross > 0) {
          existing.grossSales = gross;
        }

        // Link product name from Sku row
        if (currentProduct && currentProduct !== '-' && currentProduct !== '') {
          if (!existing.productName || existing.productName === 'Pesanan Shopee') {
            existing.productName = currentProduct;
          } else if (!existing.productName.includes(currentProduct)) {
            existing.productName += ` + ${currentProduct}`;
            existing.qty = (existing.qty || 1) + 1;
          }
          // Re-evaluate HPP
          if (currentSku && productCatalogMap[currentSku.toLowerCase()]) {
            existing.hppTotal = productCatalogMap[currentSku.toLowerCase()].hpp * (existing.qty || 1);
          } else if (currentProductId && productCatalogMap[currentProductId.toLowerCase()]) {
            existing.hppTotal = productCatalogMap[currentProductId.toLowerCase()].hpp * (existing.qty || 1);
          } else if (productCatalogMap[currentProduct.toLowerCase()]) {
            existing.hppTotal = productCatalogMap[currentProduct.toLowerCase()].hpp * (existing.qty || 1);
          }
        }
        if (currentSku && currentSku !== '-' && !existing.sku) {
          existing.sku = currentSku;
        }
        if (currentProductId && currentProductId !== '-' && !existing.sku) {
          existing.sku = currentProductId;
        }
        if (currentBuyer && currentBuyer !== '-' && (!existing.buyerName || existing.buyerName === 'Pembeli Shopee')) {
          existing.buyerName = currentBuyer;
        }
        if (currentPayment && currentPayment !== '-' && (!existing.paymentMethod || existing.paymentMethod === 'COD / Saldo')) {
          existing.paymentMethod = currentPayment;
        }
        if (currentCourier && currentCourier !== '-' && (!existing.courier || existing.courier === 'Kurir Standar')) {
          existing.courier = currentCourier;
        }
      }
    }

    skippedDuplicates = skippedOrderSet.size;
    parsedList = Object.values(orderMap);
    if (metaTotalGross === 0) metaTotalGross = parsedList.reduce((sum, item) => sum + item.grossSales, 0);
    if (metaTotalNet === 0) metaTotalNet = parsedList.reduce((sum, item) => sum + item.netSettlement, 0);
    if (metaTotalDeductions === 0) metaTotalDeductions = parsedList.reduce((sum, item) => sum + (item.adminFee + item.serviceFee + item.transactionFee + item.voucherFee), 0);
    if (!metaStoreName) metaStoreName = store.settings.shopeeStoreName || 'Shopee Store';
  }

  // Build Staged HPP Product Map for the Wizard
  stagedHppProductMap = {};
  parsedList.forEach(t => {
    const rawKey = (t.sku || t.productName).trim();
    const key = rawKey.toLowerCase();
    
    // Check if this product/SKU exists in store.products
    let catalogItem = null;
    if (t.sku && productCatalogMap[t.sku.toLowerCase()]) {
      catalogItem = productCatalogMap[t.sku.toLowerCase()];
    } else if (productCatalogMap[t.productName.toLowerCase()]) {
      catalogItem = productCatalogMap[t.productName.toLowerCase()];
    }

    if (!stagedHppProductMap[key]) {
      const isCatalog = !!catalogItem;
      const initialHppUnit = catalogItem 
        ? catalogItem.hpp 
        : (t.status === 'cancelled' ? 0 : Math.round((t.hppTotal || 0) / (t.qty || 1)));

      stagedHppProductMap[key] = {
        key,
        sku: t.sku || '-',
        name: catalogItem ? catalogItem.name : t.productName,
        orderCount: 1,
        totalQty: t.qty || 1,
        totalGross: t.grossSales,
        hppUnit: initialHppUnit,
        isFromCatalog: isCatalog,
        saveToCatalog: !isCatalog // if new, auto-check save so next time it is remembered!
      };
    } else {
      stagedHppProductMap[key].orderCount += 1;
      stagedHppProductMap[key].totalQty += (t.qty || 1);
      stagedHppProductMap[key].totalGross += t.grossSales;
    }
  });

  const selectedTargetStore = (document.getElementById('importer-target-store') && document.getElementById('importer-target-store').value) || (currentStoreFilter !== 'all' ? currentStoreFilter : 'auto');
  const targetStoreId = selectedTargetStore;

  parsedList.forEach(t => {
    let finalStoreId = selectedTargetStore;
    if (selectedTargetStore === 'auto' || selectedTargetStore === 'company' || selectedTargetStore === 'all') {
      finalStoreId = detectStoreFromProductName(t.productName, (currentStoreFilter !== 'all' && currentStoreFilter !== 'company') ? currentStoreFilter : 'health');
    }
    const meta = getStoreMeta(finalStoreId);
    t.storeId = finalStoreId;
    t.storeAccount = meta.name;
  });

  const targetStoreMeta = selectedTargetStore === 'auto' ? { name: '✨ Multi-Toko Otomatis (Per Produk)' } : getStoreMeta(selectedTargetStore);

  stagedImportTransactions = parsedList;
  stagedImportMeta = {
    rawCsvContent: csvContent,
    filename,
    channel,
    targetStoreId,
    targetStoreName: targetStoreMeta.name,
    detectedStoreName: metaStoreName,
    detectedDateRange: metaDateRange || 'Bulan Berjalan',
    totalRows: parsedList.length,
    skippedDuplicates,
    totalGross: metaTotalGross,
    totalNet: metaTotalNet,
    totalDeductions: metaTotalDeductions
  };

  showImportPreviewScreen();
}

function showImportPreviewScreen() {
  const previewContainer = document.getElementById('import-preview-container');
  if (!previewContainer) return;

  const m = stagedImportMeta;
  if (!m || m.totalRows === 0) {
    if (m && m.skippedDuplicates > 0) {
      const wantReimport = confirm(
        `File '${m.filename}' selesai dibaca (${m.skippedDuplicates} data pesanan ditemukan).\n\n` +
        `Semua ${m.skippedDuplicates} nomor pesanan ini sudah pernah tersimpan di pembukuan Anda sebelumnya.\n\n` +
        `Apakah Anda ingin MEMPERBARUI (update & timpa) data transaksi yang sudah ada dengan isi file terbaru ini?\n\n` +
        `• Klik 'OK' untuk memperbarui & menimpa data lama\n` +
        `• Klik 'Batal' untuk membatalkan`
      );
      if (wantReimport && m.rawCsvContent) {
        parseMarketplaceCsvFile(m.rawCsvContent, m.filename, m.channel, true);
        return;
      }
    } else {
      alert(`File selesai dibaca, namun tidak ada baris transaksi pesanan yang valid untuk diimpor.\n\nPastikan Anda mengunggah file laporan resmi dari Shopee, TikTok Shop, atau Lazada (.xlsx / .csv).`);
    }
    return;
  }

  document.getElementById('wizard-step-1').className = 'wizard-step-item completed';
  document.getElementById('wizard-step-2').className = 'wizard-step-item active';

  previewContainer.style.display = 'block';

  document.getElementById('import-preview-filename').textContent = m.filename;
  let chLabel = 'Shopee Indonesia';
  if (m.channel === 'tiktok') chLabel = 'TikTok Shop';
  else if (m.channel === 'lazada') chLabel = 'Lazada Indonesia';
  document.getElementById('import-preview-channel').textContent = `${chLabel} (${m.detectedStoreName || 'Marketplace'})`;
  document.getElementById('import-preview-count').textContent = `${m.totalRows} Pesanan Riil`;
  document.getElementById('import-preview-skipped').textContent = `${m.skippedDuplicates} Duplikat`;
  document.getElementById('import-preview-gross').textContent = formatRupiah(m.totalGross);
  document.getElementById('import-preview-deduction').textContent = formatRupiah(m.totalDeductions);
  document.getElementById('import-preview-net').textContent = formatRupiah(m.totalNet);

  // Render the Orders Preview Table
  renderImportOrdersPreviewTable();

  previewContainer.scrollIntoView({ behavior: 'smooth' });
}

function renderImportOrdersPreviewTable() {
  const tbody = document.getElementById('import-preview-tbody');
  if (!tbody) return;

  tbody.innerHTML = stagedImportTransactions.map(t => {
    const isCancelled = t.status === 'cancelled';
    const statusBadge = isCancelled 
      ? `<span class="badge badge-danger">Dibatalkan/Refund</span>` 
      : `<span class="badge badge-success">Cair</span>`;

    return `
      <tr>
        <td>
          <strong>${t.orderId}</strong>
          <div style="font-size:11px;color:var(--text-muted);">${formatDateIndo(t.date)} &bull; ${t.paymentMethod || '-'}</div>
        </td>
        <td>
          <div style="font-weight:600;max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${t.productName}">${t.productName}</div>
          <div style="font-size:11px;color:var(--text-muted);">${t.buyerName ? 'Pembeli: ' + t.buyerName + ' &bull; ' : ''}SKU: <code>${t.sku || '-'}</code></div>
        </td>
        <td style="font-weight:600;">${formatRupiah(t.grossSales)}</td>
        <td style="color:var(--danger);font-size:12px;">-${formatRupiah(t.adminFee + t.serviceFee + t.transactionFee + t.voucherFee)}</td>
        <td style="color:var(--success);font-weight:700;">${formatRupiah(t.netSettlement)}</td>
        <td>
          ${statusBadge}
          ${t.isUpdate ? '<div style="margin-top:3px;"><span class="badge" style="background:#e0f2fe;color:#0284c7;border:1px solid #bae6fd;font-size:10px;">Update</span></div>' : ''}
        </td>
      </tr>
    `;
  }).join('');
}

function cancelImportPreview() {
  stagedImportTransactions = [];
  stagedImportMeta = null;
  document.getElementById('import-preview-container').style.display = 'none';
  document.getElementById('wizard-step-1').className = 'wizard-step-item active';
  document.getElementById('wizard-step-2').className = 'wizard-step-item';
}

function confirmCommitImport() {
  if (!stagedImportTransactions || stagedImportTransactions.length === 0) return;

  const store = db.getStore();
  const selectedTargetStore = (document.getElementById('importer-target-store') && document.getElementById('importer-target-store').value) || stagedImportMeta.targetStoreId || 'auto';
  const targetStoreId = selectedTargetStore;

  stagedImportTransactions.forEach(t => {
    let finalStoreId = selectedTargetStore;
    if (selectedTargetStore === 'auto' || selectedTargetStore === 'company' || selectedTargetStore === 'all') {
      finalStoreId = detectStoreFromProductName(t.productName, (currentStoreFilter !== 'all' && currentStoreFilter !== 'company') ? currentStoreFilter : 'health');
    }
    const meta = getStoreMeta(finalStoreId);
    t.storeId = finalStoreId;
    t.storeAccount = meta.name;
  });

  const targetStoreMeta = selectedTargetStore === 'auto' ? { name: '✨ Multi-Toko Otomatis (Per Produk)' } : getStoreMeta(selectedTargetStore);
  
  if (stagedImportMeta.channel === 'shopee' && stagedImportMeta.detectedStoreName && (!store.settings.shopeeStoreName || store.settings.shopeeStoreName === 'Shopee Store')) {
    store.settings.shopeeStoreName = stagedImportMeta.detectedStoreName;
  } else if (stagedImportMeta.channel === 'lazada' && stagedImportMeta.detectedStoreName && (!store.settings.lazadaStoreName || store.settings.lazadaStoreName === 'Lazada Store')) {
    store.settings.lazadaStoreName = stagedImportMeta.detectedStoreName;
  }

  // Commit transactions with smart upsert (replace existing duplicate orderId, append new)
  const incomingMap = new Map();
  stagedImportTransactions.forEach(t => {
    incomingMap.set(t.orderId, t);
  });
  const existingRetained = (store.transactions || []).filter(t => !incomingMap.has(t.orderId));
  store.transactions = [...stagedImportTransactions, ...existingRetained];

  const historyEntry = {
    id: `IMP-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    filename: stagedImportMeta.filename,
    channel: stagedImportMeta.channel,
    storeId: targetStoreId,
    storeAccount: targetStoreMeta.name,
    rowCount: stagedImportMeta.totalRows,
    totalGross: stagedImportMeta.totalGross,
    totalNet: stagedImportMeta.totalNet
  };

  if (!store.importHistory) store.importHistory = [];
  store.importHistory.unshift(historyEntry);

  db.saveData(store);

  alert(`BERHASIL!\n\nSebanyak ${stagedImportMeta.totalRows} transaksi pesanan dari ${stagedImportMeta.filename} telah dimasukkan ke pembukuan Toko ${targetStoreMeta.name}.\n\nTotal Omset Kotor: ${formatRupiah(stagedImportMeta.totalGross)}\nTotal Dana Cair: ${formatRupiah(stagedImportMeta.totalNet)}\n\nDashboard dan Laporan Penjualan Anda telah terupdate.`);

  cancelImportPreview();
  switchTab('transactions');
  renderDashboard();
  renderTransactions();
  if (typeof renderImportHistory === 'function') renderImportHistory();
}

// 1-Click Instant Test with User's Exact 27-Order Shopee File (nalatiqahealth)
function testImportOfficialShopee() {
  const fullContent = `Laporan Penghasilan,,,
,,,
,,,
,,,
Rincian Laporan,,,
Username (Penjual),nalatiqahealth,,
Dari,2026-09-01,,
ke,2026-10-25,,
,,,
Ringkasan Penghasilan,,,Rp
1. Total Pendapatan,,,3451200
Subtotal Pesanan,,,3451200
,Harga Asli Produk,3451200,
,Jumlah Pengembalian Dana ke Pembeli,0,
Voucher & Subsidi,,,0
,Voucher disponsor oleh Penjual,0,
,Cashback Koin disponsori Penjual,0,
,Diskon Produk dari Shopee,0,
,Voucher co-fund disponsor oleh Penjual,0,
,Cashback Koin Co-fund disponsori Penjual,0,
2. Total Pengeluaran,,,-752736
Total Biaya Pengiriman,,,0
,Ongkir Dibayar Pembeli,3000,
,Ongkir yang Diteruskan oleh Shopee ke Jasa Kirim,-435000,
,Diskon Ongkir Ditanggung Jasa Kirim,0,
,Gratis Ongkir dari Shopee,432000,
,Ongkos Kirim Pengembalian Barang,0,
,Kembali ke Biaya Pengiriman Pengirim,0,
,Pengembalian Biaya Kirim,0,
Biaya Platform,,,-353108
,Biaya Administrasi,-319358,
,Biaya Proses Pesanan,-33750,
Biaya Gratis Ongkir XTRA,,,-155308
,Biaya Gratis Ongkir XTRA - Ukuran Biasa (Kategori E),-155308,
Biaya Layanan,,,-155308
,Biaya Layanan Promo XTRA,-155308,
Biaya Promosi,,,-74972
,Biaya Kampanye,0,
,Biaya Komisi AMS,-74972,
,Biaya Isi Saldo Otomatis (dari Penghasilan),0,
Biaya Lainnya,,,0
,Biaya Program Hemat Biaya Kirim,0,
,Premi,0,
Pajak,,,-14040
,PPh 22,-14040,
,,,
3. Total yang Dilepas,,,2698464
,,,
Nilai Lainnya,,,
Promo Gratis Ongkir dari Penjual,,,0
,,,,,,
No.,No. Pesanan,Biaya Platform,Biaya Gratis Ongkir XTRA,Biaya Layanan,Biaya Promosi,Biaya Lainnya
1,260922P1EKGN08,-7541,-3146,-3146,0,0
2,260922NAM9QF98,-8891,-3821,-3821,0,0
3,260918C5H6XUGU,-7541,-3146,-3146,0,0
4,26092879G74U71,-7460,-3105,-3105,0,0
5,2609299S99JXVN,-17875,-7875,-7875,0,0
6,2609299RVARNE8,-17875,-7875,-7875,0,0
7,261004PPHAQXHM,-17875,-7875,-7875,0,0
8,261002JCSR00SP,-17875,-7875,-7875,0,0
9,261005RTSR7K60,-17875,-7875,-7875,-10771,0
10,261003MG8J8MHV,-17875,-7875,-7875,0,0
11,261004QE72T7J2,-17875,-7875,-7875,-10065,0
12,2610071E3AVJCJ,-17875,-7875,-7875,-12238,0
13,261006W0125FSA,-17875,-7875,-7875,0,0
14,2610084XUYJHU3,-17875,-7875,-7875,-11486,0
15,261012DAGR6XHT,-8441,-3596,-3596,-3385,0
16,261012DFUX2DR2,-8441,-3596,-3596,0,0
17,261015M5XAN5X6,-11330,-5040,-5040,0,0
18,261016RFS584UP,-11330,-5040,-5040,0,0
19,261015N8SPSD1B,-11330,-5040,-5040,0,0
20,261014KT1CRU78,-11330,-5040,-5040,-5594,0
21,261016RDRBY0US,-11330,-5040,-5040,-5905,0
22,261015NWXGT8HT,-18521,-8636,-8636,-9918,0
23,261018134N2G9F,-8441,-3596,-3596,0,0
24,261014KMY8Q5PG,-11330,-5040,-5040,0,0
25,2610192XBGKX6B,-8441,-3596,-3596,0,0
26,261017TRY1XD8A,-11330,-5040,-5040,-5610,0
27,261016QQSCREGG,-11330,-5040,-5040,0,0
Informasi Pesanan,,,,,,,,,,Rincian Jumlah Pelepasan Dana,,,,,,,,,,,,,,,,,,,,,,,,,Buyer Info,,,,,Informasi Referensi,,,,,,,,,,,
,,,,,,,,,,Total Penghasilan,Subtotal Pesanan,,Subtotal Ongkos Kirim,,,,,,,Voucher dan Potongan Harga,,,,,Biaya Platform,,Biaya Gratis Ongkir XTRA,Biaya Layanan,Biaya Promosi,,,Biaya Lainnya,,Pajak,,,,,,Pengiriman,,,Promosi,Kompensasi,Rincian pengembalian barang/dana,,,,,Pajak,
No.,Lihat berdasarkan,No. Pesanan,No. Pengajuan,ID Produk,Nama Produk,Waktu Pesanan Dibuat,Tanggal Dana Dilepaskan,Metode Pelepasan Dana,Tipe Pesanan,Total Penghasilan,Harga Produk,Jumlah Pengembalian Dana ke Pembeli,Ongkir Dibayar Pembeli,Ongkos Kirim yang Dibayarkan ke Jasa Kirim,Potongan Ongkos Kirim dari Jasa Kirim,Gratis Ongkir dari Shopee,Ongkos Kirim Pengembalian Barang,Return to Seller Fee,Pengembalian Biaya Kirim,Voucher disponsor oleh Penjual,Cashback Koin disponsori Penjual,Diskon Produk dari Shopee,Voucher co-fund disponsor oleh Penjual,Cashback Koin Co-fund disponsori Penjual,Biaya Administrasi,Biaya Proses Pesanan,Biaya Gratis Ongkir XTRA - Ukuran Biasa (Kategori E),Biaya Layanan Promo XTRA,Biaya Kampanye,Biaya Komisi AMS,Biaya Isi Saldo Otomatis (dari Penghasilan),Premi,FBS Fee,PPh 22,Username (Pembeli),Jumlah Dibayar Pembeli,Metode pembayaran pembeli,Rincian Metode Pembayaran,Rencana Cicilan (jika berlaku),Promo Gratis Ongkir dari Penjual,Jasa Kirim,Nama Kurir,Kode Voucher,Kompensasi,Pengembalian Dana ke Pembeli,Pro-rata Koin yang Ditukarkan untuk Pengembalian Barang,Pro-rata Voucher Shopee untuk Pengembalian Barang,Pro-rated Bank Payment Channel Promotion for return refund Items,Pro-rated Shopee Payment Channel Promotion  for return refund Items,Dasar Pengenaan Pajak,Dasar Pengenaan Pajak (Tidak Termasuk PPN)
1,Order,261017TRY1XD8A,,-,-,2026-10-17,2026-10-25,Saldo Penjual,Normal Order,84420,112000,0,0,-17000,0,17000,0,0,0,0,0,0,0,0,-10080,-1250,-5040,-5040,0,-5610,0,0,0,-560,nellyloebis,106080,COD (Bayar di Tempat),,,0,Hemat Kargo,SPX Hemat,,0,0,0,0,0,0,112000,-
2,Sku,261017TRY1XD8A,-,45818698197,Green Bud Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami | Nalatiqa Herbal,2026-10-17,2026-10-25,Saldo Penjual,Normal Order,84420,112000,0,0,-17000,0,17000,0,0,0,0,0,0,0,0,-10080,-1250,-5040,-5040,0,-5610,0,0,,-560,,-,COD (Bayar di Tempat),,,-,Hemat Kargo,SPX Hemat,,-,-,-,-,-,-,112000,-
3,Order,261016QQSCREGG,,-,-,2026-10-16,2026-10-25,Saldo Penjual,Normal Order,90030,112000,0,0,-22000,0,22000,0,0,0,0,0,0,0,0,-10080,-1250,-5040,-5040,0,0,0,0,0,-560,azzahraa_22,113250,COD (Bayar di Tempat),,,0,Hemat Kargo,SPX Hemat,,0,0,0,0,0,0,112000,-
4,Sku,261016QQSCREGG,-,45468694329,Gula Darah Tinggi Green Bud Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami | Nalatiqa Herbal,2026-10-16,2026-10-25,Saldo Penjual,Normal Order,90030,112000,0,0,-22000,0,22000,0,0,0,0,0,0,0,0,-10080,-1250,-5040,-5040,0,0,0,0,,-560,,-,COD (Bayar di Tempat),,,-,Hemat Kargo,SPX Hemat,,-,-,-,-,-,-,112000,-
5,Order,2610192XBGKX6B,,-,-,2026-10-19,2026-10-24,Saldo Penjual,Normal Order,63867,79900,0,0,-6500,0,6500,0,0,0,0,0,0,0,0,-7191,-1250,-3596,-3596,0,0,0,0,0,-400,faizahhusein,79155,Online Payment,,,0,Reguler,SPX Standard,,0,0,0,0,0,0,79900,-
6,Sku,2610192XBGKX6B,-,53817830109,"Sandhus Vitamin D3 + K2 10000IU + Calcium Magnesium Zinc + Vitamin C + Astaxanthin Premium: Kombinasi Lengkap untuk Kesehatan Tulang & Jantung, 60 Kapsul",2026-10-19,2026-10-24,Saldo Penjual,Normal Order,63867,79900,0,0,-6500,0,6500,0,0,0,0,0,0,0,0,-7191,-1250,-3596,-3596,0,0,0,0,,-400,,-,Online Payment,,,-,Reguler,SPX Standard,,-,-,-,-,-,-,79900,-
7,Order,261018134N2G9F,,-,-,2026-10-18,2026-10-24,Saldo Penjual,Normal Order,63867,79900,0,0,-8000,0,8000,0,0,0,0,0,0,0,0,-7191,-1250,-3596,-3596,0,0,0,0,0,-400,oryza_shop90,78900,Online Payment,,,0,Reguler,SPX Standard,,0,0,0,0,0,0,79900,-
8,Sku,261018134N2G9F,-,53817830109,"Sandhus Vitamin D3 + K2 10000IU + Calcium Magnesium Zinc + Vitamin C + Astaxanthin Premium: Kombinasi Lengkap untuk Kesehatan Tulang & Jantung, 60 Kapsul",2026-10-18,2026-10-24,Saldo Penjual,Normal Order,63867,79900,0,0,-8000,0,8000,0,0,0,0,0,0,0,0,-7191,-1250,-3596,-3596,0,0,0,0,,-400,,-,Online Payment,,,-,Reguler,SPX Standard,,-,-,-,-,-,-,79900,-
9,Order,261014KMY8Q5PG,,-,-,2026-10-14,2026-10-24,Saldo Penjual,Normal Order,90030,112000,0,0,-13000,0,13000,0,0,0,0,0,0,0,0,-10080,-1250,-5040,-5040,0,0,0,0,0,-560,seriwahyuni232,102440,COD (Bayar di Tempat),,,0,Hemat Kargo,SPX Hemat,,0,0,0,0,0,0,112000,-
10,Sku,261014KMY8Q5PG,-,45818698197,Green Bud Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami | Nalatiqa Herbal,2026-10-14,2026-10-24,Saldo Penjual,Normal Order,90030,112000,0,0,-13000,0,13000,0,0,0,0,0,0,0,0,-10080,-1250,-5040,-5040,0,0,0,0,,-560,,-,COD (Bayar di Tempat),,,-,Hemat Kargo,SPX Hemat,,-,-,-,-,-,-,112000,-
11,Order,261015NWXGT8HT,,-,-,2026-10-15,2026-10-21,Saldo Penjual,Normal Order,145229,191900,0,0,-8000,0,8000,0,0,0,0,0,0,0,0,-17271,-1250,-8636,-8636,0,-9918,0,0,0,-960,pdfirmansyah,180814,Saldo ShopeePay,,,0,Reguler,SPX Standard,,0,0,0,0,0,0,191900,-
12,Sku,261015NWXGT8HT,-,45818698197,Green Bud Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami | Nalatiqa Herbal,2026-10-15,2026-10-21,Saldo Penjual,Normal Order,84645,112000,0,0,-4000,0,4000,0,0,0,0,0,0,0,0,-10080,-730,-5040,-5040,0,-5905,0,0,,-560,,-,Saldo ShopeePay,,,-,Reguler,SPX Standard,,-,-,-,-,-,-,112000,-
13,Sku,261015NWXGT8HT,-,53817830109,"Sandhus Vitamin D3 + K2 10000IU + Calcium Magnesium Zinc + Vitamin C + Astaxanthin Premium: Kombinasi Lengkap untuk Kesehatan Tulang & Jantung, 60 Kapsul",2026-10-15,2026-10-21,Saldo Penjual,Normal Order,60584,79900,0,0,-4000,0,4000,0,0,0,0,0,0,0,0,-7191,-520,-3596,-3596,0,-4013,0,0,,-400,,-,Saldo ShopeePay,,,-,Reguler,SPX Standard,,-,-,-,-,-,-,79900,-
14,Order,261016RFS584UP,,-,-,2026-10-16,2026-10-20,Saldo Penjual,Normal Order,90030,112000,0,0,-6500,0,6500,0,0,0,0,0,0,0,0,-10080,-1250,-5040,-5040,0,0,0,0,0,-560,nonomarsono648,96804,Saldo ShopeePay,,,0,Reguler,SPX Standard,,0,0,0,0,0,0,112000,-
15,Sku,261016RFS584UP,-,45818698197,Green Bud Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami | Nalatiqa Herbal,2026-10-16,2026-10-20,Saldo Penjual,Normal Order,90030,112000,0,0,-6500,0,6500,0,0,0,0,0,0,0,0,-10080,-1250,-5040,-5040,0,0,0,0,,-560,,-,Saldo ShopeePay,,,-,Reguler,SPX Standard,,-,-,-,-,-,-,112000,-
16,Order,261016RDRBY0US,,-,-,2026-10-16,2026-10-20,Saldo Penjual,Normal Order,84125,112000,0,0,-6500,0,6500,0,0,0,0,0,0,0,0,-10080,-1250,-5040,-5040,0,-5905,0,0,0,-560,fajarmoy,111400,COD (Bayar di Tempat),,,0,Reguler,SPX Standard,,0,0,0,0,0,0,112000,-
17,Sku,261016RDRBY0US,-,45818698197,Green Bud Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami | Nalatiqa Herbal,2026-10-16,2026-10-20,Saldo Penjual,Normal Order,84125,112000,0,0,-6500,0,6500,0,0,0,0,0,0,0,0,-10080,-1250,-5040,-5040,0,-5905,0,0,,-560,,-,COD (Bayar di Tempat),,,-,Reguler,SPX Standard,,-,-,-,-,-,-,112000,-
18,Order,261015N8SPSD1B,,-,-,2026-10-15,2026-10-20,Saldo Penjual,Normal Order,90030,112000,0,0,-11000,0,11000,0,0,0,0,0,0,0,0,-10080,-1250,-5040,-5040,0,0,0,0,0,-560,sriwahyuni09.m,101320,COD (Bayar di Tempat),,,0,Hemat Kargo,SPX Hemat,,0,0,0,0,0,0,112000,-
19,Sku,261015N8SPSD1B,-,45818698197,Green Bud Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami | Nalatiqa Herbal,2026-10-15,2026-10-20,Saldo Penjual,Normal Order,90030,112000,0,0,-11000,0,11000,0,0,0,0,0,0,0,0,-10080,-1250,-5040,-5040,0,0,0,0,,-560,,-,COD (Bayar di Tempat),,,-,Hemat Kargo,SPX Hemat,,-,-,-,-,-,-,112000,-
20,Order,261014KT1CRU78,,-,-,2026-10-14,2026-10-20,Saldo Penjual,Normal Order,84436,112000,0,0,-5000,0,5000,0,0,0,0,0,0,0,0,-10080,-1250,-5040,-5040,0,-5594,0,0,0,-560,agung.sakti83,105800,COD (Bayar di Tempat),,,0,Hemat Kargo,SPX Hemat,,0,0,0,0,0,0,112000,-
21,Sku,261014KT1CRU78,-,45818698197,Green Bud Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami | Nalatiqa Herbal,2026-10-14,2026-10-20,Saldo Penjual,Normal Order,84436,112000,0,0,-5000,0,5000,0,0,0,0,0,0,0,0,-10080,-1250,-5040,-5040,0,-5594,0,0,,-560,,-,COD (Bayar di Tempat),,,-,Hemat Kargo,SPX Hemat,,-,-,-,-,-,-,112000,-
22,Order,261015M5XAN5X6,,-,-,2026-10-14,2026-10-18,Saldo Penjual,Normal Order,90030,112000,0,0,-6500,0,6500,0,0,0,0,0,0,0,0,-10080,-1250,-5040,-5040,0,0,0,0,0,-560,turinatrusanti,100560,Online Payment,,,0,Reguler,Pos Reguler,,0,0,0,0,0,0,112000,-
23,Sku,261015M5XAN5X6,-,45818698197,Green Bud Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami | Nalatiqa Herbal,2026-10-14,2026-10-18,Saldo Penjual,Normal Order,90030,112000,0,0,-6500,0,6500,0,0,0,0,0,0,0,0,-10080,-1250,-5040,-5040,0,0,0,0,,-560,,-,Online Payment,,,-,Reguler,Pos Reguler,,-,-,-,-,-,-,112000,-
24,Order,261012DFUX2DR2,,-,-,2026-10-12,2026-10-15,Saldo Penjual,Normal Order,63867,79900,0,0,-6500,0,6500,0,0,0,0,0,0,0,0,-7191,-1250,-3596,-3596,0,0,0,0,0,-400,tquillashots,77412,QRIS,,,0,Reguler,SPX Standard,,0,0,0,0,0,0,79900,-
25,Sku,261012DFUX2DR2,-,53817830109,"Sandhus Vitamin D3 + K2 10000IU + Calcium Magnesium Zinc + Vitamin C + Astaxanthin Premium: Kombinasi Lengkap untuk Kesehatan Tulang & Jantung, 60 Kapsul",2026-10-12,2026-10-15,Saldo Penjual,Normal Order,63867,79900,0,0,-6500,0,6500,0,0,0,0,0,0,0,0,-7191,-1250,-3596,-3596,0,0,0,0,,-400,,-,QRIS,,,-,Reguler,SPX Standard,,-,-,-,-,-,-,79900,-
26,Order,261012DAGR6XHT,,-,-,2026-10-12,2026-10-15,Saldo Penjual,Normal Order,60482,79900,0,0,-6500,0,6500,0,0,0,0,0,0,0,0,-7191,-1250,-3596,-3596,0,-3385,0,0,0,-400,blackrose2302,62994,Online Payment,,,0,Reguler,SPX Standard,,0,0,0,0,0,0,79900,-
27,Sku,261012DAGR6XHT,-,53817830109,"Sandhus Vitamin D3 + K2 10000IU + Calcium Magnesium Zinc + Vitamin C + Astaxanthin Premium: Kombinasi Lengkap untuk Kesehatan Tulang & Jantung, 60 Kapsul",2026-10-12,2026-10-15,Saldo Penjual,Normal Order,60482,79900,0,0,-6500,0,6500,0,0,0,0,0,0,0,0,-7191,-1250,-3596,-3596,0,-3385,0,0,,-400,,-,Online Payment,,,-,Reguler,SPX Standard,,-,-,-,-,-,-,79900,-
28,Order,2610084XUYJHU3,,-,-,2026-10-08,2026-10-14,Saldo Penjual,Normal Order,129014,175000,0,0,-42000,0,42000,0,0,0,0,0,0,0,0,-16625,-1250,-7875,-7875,0,-11486,0,0,0,-875,1cejna6vxc,150027,COD (Bayar di Tempat),,,0,Reguler,SPX Standard,,0,0,0,0,0,0,175000,-
29,Sku,2610084XUYJHU3,-,47118328760,"GINKLIN 60 Kapsul 100% Original Asli Herbal Alami Ekstrak Kumis Kucing, Keci Beling, Tempuyung. Meluruhkan Batu di Ginjal dan Saluran Kemih",2026-10-08,2026-10-14,Saldo Penjual,Normal Order,129014,175000,0,0,-42000,0,42000,0,0,0,0,0,0,0,0,-16625,-1250,-7875,-7875,0,-11486,0,0,,-875,,-,COD (Bayar di Tempat),,,-,Reguler,SPX Standard,,-,-,-,-,-,-,175000,-
30,Order,2610071E3AVJCJ,,-,-,2026-10-07,2026-10-11,Saldo Penjual,Normal Order,128262,175000,0,0,-44000,0,44000,0,0,0,0,0,0,0,0,-16625,-1250,-7875,-7875,0,-12238,0,0,0,-875,sumiardiiyar435,159500,Online Payment,,,0,Reguler,JNE Reguler,,0,0,0,0,0,0,175000,-
31,Sku,2610071E3AVJCJ,-,47118328760,"GINKLIN 60 Kapsul 100% Original Asli Herbal Alami Ekstrak Kumis Kucing, Keci Beling, Tempuyung. Meluruhkan Batu di Ginjal dan Saluran Kemih",2026-10-07,2026-10-11,Saldo Penjual,Normal Order,128262,175000,0,0,-44000,0,44000,0,0,0,0,0,0,0,0,-16625,-1250,-7875,-7875,0,-12238,0,0,,-875,,-,Online Payment,,,-,Reguler,JNE Reguler,,-,-,-,-,-,-,175000,-
32,Order,261006W0125FSA,,-,-,2026-10-06,2026-10-11,Saldo Penjual,Normal Order,140500,175000,0,0,-6500,0,6500,0,0,0,0,0,0,0,0,-16625,-1250,-7875,-7875,0,0,0,0,0,-875,lamanajah,156415,COD (Bayar di Tempat),,,0,Reguler,SPX Standard,,0,0,0,0,0,0,175000,-
33,Sku,261006W0125FSA,-,47118328760,"GINKLIN 60 Kapsul 100% Original Asli Herbal Alami Ekstrak Kumis Kucing, Keci Beling, Tempuyung. Meluruhkan Batu di Ginjal dan Saluran Kemih",2026-10-06,2026-10-11,Saldo Penjual,Normal Order,140500,175000,0,0,-6500,0,6500,0,0,0,0,0,0,0,0,-16625,-1250,-7875,-7875,0,0,0,0,,-875,,-,COD (Bayar di Tempat),,,-,Reguler,SPX Standard,,-,-,-,-,-,-,175000,-
34,Order,261004QE72T7J2,,-,-,2026-10-04,2026-10-09,Saldo Penjual,Normal Order,130435,175000,0,0,-6500,0,6500,0,0,0,0,0,0,0,0,-16625,-1250,-7875,-7875,0,-10065,0,0,0,-875,0n2tarzw36,131737,Online Payment,,,0,Reguler,SPX Standard,,0,0,0,0,0,0,175000,-
35,Sku,261004QE72T7J2,-,47118328760,"GINKLIN 60 Kapsul 100% Original Asli Herbal Alami Ekstrak Kumis Kucing, Keci Beling, Tempuyung. Meluruhkan Batu di Ginjal dan Saluran Kemih",2026-10-04,2026-10-09,Saldo Penjual,Normal Order,130435,175000,0,0,-6500,0,6500,0,0,0,0,0,0,0,0,-16625,-1250,-7875,-7875,0,-10065,0,0,,-875,,-,Online Payment,,,-,Reguler,SPX Standard,,-,-,-,-,-,-,175000,-
36,Order,261003MG8J8MHV,,-,-,2026-10-03,2026-10-09,Saldo Penjual,Normal Order,140500,175000,0,3000,-63000,0,60000,0,0,0,0,0,0,0,0,-16625,-1250,-7875,-7875,0,0,0,0,0,-875,2y24truwc2,171250,COD (Bayar di Tempat),,,0,Reguler,SPX Standard,,0,0,0,0,0,0,175000,-
37,Sku,261003MG8J8MHV,-,47118328760,"GINKLIN 60 Kapsul 100% Original Asli Herbal Alami Ekstrak Kumis Kucing, Keci Beling, Tempuyung. Meluruhkan Batu di Ginjal dan Saluran Kemih",2026-10-03,2026-10-09,Saldo Penjual,Normal Order,140500,175000,0,3000,-63000,0,60000,0,0,0,0,0,0,0,0,-16625,-1250,-7875,-7875,0,0,0,0,,-875,,-,COD (Bayar di Tempat),,,-,Reguler,SPX Standard,,-,-,-,-,-,-,175000,-
38,Order,261005RTSR7K60,,-,-,2026-10-05,2026-10-08,Saldo Penjual,Normal Order,129729,175000,0,0,-6500,0,6500,0,0,0,0,0,0,0,0,-16625,-1250,-7875,-7875,0,-10771,0,0,0,-875,0wg813jopj,140823,Online Payment,,,0,Reguler,SPX Standard,,0,0,0,0,0,0,175000,-
39,Sku,261005RTSR7K60,-,47118328760,"GINKLIN 60 Kapsul 100% Original Asli Herbal Alami Ekstrak Kumis Kucing, Keci Beling, Tempuyung. Meluruhkan Batu di Ginjal dan Saluran Kemih",2026-10-05,2026-10-08,Saldo Penjual,Normal Order,129729,175000,0,0,-6500,0,6500,0,0,0,0,0,0,0,0,-16625,-1250,-7875,-7875,0,-10771,0,0,,-875,,-,Online Payment,,,-,Reguler,SPX Standard,,-,-,-,-,-,-,175000,-
40,Order,261002JCSR00SP,,-,-,2026-10-02,2026-10-08,Saldo Penjual,Normal Order,140500,175000,0,0,-38000,0,38000,0,0,0,0,0,0,0,0,-16625,-1250,-7875,-7875,0,0,0,0,0,-875,asrinsunduy,154450,COD (Bayar di Tempat),,,0,Reguler,SPX Standard,,0,0,0,0,0,0,175000,-
41,Sku,261002JCSR00SP,-,47118328760,"GINKLIN 60 Kapsul 100% Original Asli Herbal Alami Ekstrak Kumis Kucing, Keci Beling, Tempuyung. Meluruhkan Batu di Ginjal dan Saluran Kemih",2026-10-02,2026-10-08,Saldo Penjual,Normal Order,140500,175000,0,0,-38000,0,38000,0,0,0,0,0,0,0,0,-16625,-1250,-7875,-7875,0,0,0,0,,-875,,-,COD (Bayar di Tempat),,,-,Reguler,SPX Standard,,-,-,-,-,-,-,175000,-
42,Order,261004PPHAQXHM,,-,-,2026-10-04,2026-10-07,Saldo Penjual,Normal Order,140500,175000,0,0,-6500,0,6500,0,0,0,0,0,0,0,0,-16625,-1250,-7875,-7875,0,0,0,0,0,-875,tmwwmawh1b,168450,Online Payment,,,0,Reguler,SPX Standard,,0,0,0,0,0,0,175000,-
43,Sku,261004PPHAQXHM,-,47118328760,"GINKLIN 60 Kapsul 100% Original Asli Herbal Alami Ekstrak Kumis Kucing, Keci Beling, Tempuyung. Meluruhkan Batu di Ginjal dan Saluran Kemih",2026-10-04,2026-10-07,Saldo Penjual,Normal Order,140500,175000,0,0,-6500,0,6500,0,0,0,0,0,0,0,0,-16625,-1250,-7875,-7875,0,0,0,0,,-875,,-,Online Payment,,,-,Reguler,SPX Standard,,-,-,-,-,-,-,175000,-
44,Order,2609299RVARNE8,,-,-,2026-09-29,2026-10-05,Saldo Penjual,Normal Order,141375,175000,0,0,-41000,0,41000,0,0,0,0,0,0,0,0,-16625,-1250,-7875,-7875,0,0,0,0,0,0,xqqoh8kecz,154450,COD (Bayar di Tempat),,,0,Reguler,SPX Standard,,0,0,0,0,0,0,0,-
45,Sku,2609299RVARNE8,-,47118328760,"GINKLIN 60 Kapsul 100% Original Asli Herbal Alami Ekstrak Kumis Kucing, Keci Beling, Tempuyung. Meluruhkan Batu di Ginjal dan Saluran Kemih",2026-09-29,2026-10-05,Saldo Penjual,Normal Order,141375,175000,0,0,-41000,0,41000,0,0,0,0,0,0,0,0,-16625,-1250,-7875,-7875,0,0,0,0,,0,,-,COD (Bayar di Tempat),,,-,Reguler,SPX Standard,,-,-,-,-,-,-,0,-
46,Order,2609299S99JXVN,,-,-,2026-09-29,2026-10-04,Saldo Penjual,Normal Order,141375,175000,0,0,-8000,0,8000,0,0,0,0,0,0,0,0,-16625,-1250,-7875,-7875,0,0,0,0,0,0,mingan084,110063,COD (Bayar di Tempat),,,0,Reguler,SPX Standard,,0,0,0,0,0,0,0,-
47,Sku,2609299S99JXVN,-,47118328760,"GINKLIN 60 Kapsul 100% Original Asli Herbal Alami Ekstrak Kumis Kucing, Keci Beling, Tempuyung. Meluruhkan Batu di Ginjal dan Saluran Kemih",2026-09-29,2026-10-04,Saldo Penjual,Normal Order,141375,175000,0,0,-8000,0,8000,0,0,0,0,0,0,0,0,-16625,-1250,-7875,-7875,0,0,0,0,,0,,-,COD (Bayar di Tempat),,,-,Reguler,SPX Standard,,-,-,-,-,-,-,0,-
48,Order,26092879G74U71,,-,-,2026-09-28,2026-10-02,Saldo Penjual,Normal Order,55330,69000,0,0,-13000,0,13000,0,0,0,0,0,0,0,0,-6210,-1250,-3105,-3105,0,0,0,0,0,0,la5lhbp2n3,68175,COD (Bayar di Tempat),,,0,Hemat Kargo,SPX Hemat,,0,0,0,0,0,0,0,-
49,Sku,26092879G74U71,-,45367990837,"NALATIQA TENGGOROKAN HERBAL GEL 20G UNTUK BERSIHKAN DAHAK PARU-PARU, BATUK BERDAHAK, DADA SESAK & NAPAS BERAT",2026-09-28,2026-10-02,Saldo Penjual,Normal Order,55330,69000,0,0,-13000,0,13000,0,0,0,0,0,0,0,0,-6210,-1250,-3105,-3105,0,0,0,0,,0,,-,COD (Bayar di Tempat),,,-,Hemat Kargo,SPX Hemat,,-,-,-,-,-,-,0,-
50,Order,260918C5H6XUGU,,-,-,2026-09-18,2026-09-30,Saldo Penjual,Normal Order,56067,69900,0,0,-12000,0,12000,0,0,0,0,0,0,0,0,-6291,-1250,-3146,-3146,0,0,0,0,0,0,oktavianaasiau1984,69655,COD (Bayar di Tempat),,,0,Hemat Kargo,SPX Hemat,,0,0,0,0,0,0,0,-
51,Sku,260918C5H6XUGU,-,52667818737,"Vitamin D3 + K2 10000IU + Calcium Magnesium Zinc + Vitamin C + Astaxanthin Premium: Kombinasi Lengkap untuk Kesehatan Tulang & Jantung, 60 Kapsul",2026-09-18,2026-09-30,Saldo Penjual,Normal Order,56067,69900,0,0,-12000,0,12000,0,0,0,0,0,0,0,0,-6291,-1250,-3146,-3146,0,0,0,0,,0,,-,COD (Bayar di Tempat),,,-,Hemat Kargo,SPX Hemat,,-,-,-,-,-,-,0,-
52,Order,260922NAM9QF98,,-,-,2026-09-22,2026-09-29,Saldo Penjual,Normal Order,68367,84900,0,0,-17000,0,17000,0,0,0,0,0,0,0,0,-7641,-1250,-3821,-3821,0,0,0,0,0,0,kasirinlelek,85655,COD (Bayar di Tempat),,,0,Hemat Kargo,SPX Hemat,,0,0,0,0,0,0,0,-
53,Sku,260922NAM9QF98,-,47417845516,Verdavita 3-IN-1 120pcs Vitamin D3 Tulang & Gigi Kalsium Magnesium & Seng Kapsul Suplement Mineral,2026-09-22,2026-09-29,Saldo Penjual,Normal Order,68367,84900,0,0,-17000,0,17000,0,0,0,0,0,0,0,0,-7641,-1250,-3821,-3821,0,0,0,0,,0,,-,COD (Bayar di Tempat),,,-,Hemat Kargo,SPX Hemat,,-,-,-,-,-,-,0,-
54,Order,260922P1EKGN08,,-,-,2026-09-22,2026-09-28,Saldo Penjual,Normal Order,56067,69900,0,0,-8000,0,8000,0,0,0,0,0,0,0,0,-6291,-1250,-3146,-3146,0,0,0,0,0,0,muslimin851,69305,Saldo ShopeePay,,,0,Reguler,SPX Standard,,0,0,0,0,0,0,0,-
55,Sku,260922P1EKGN08,-,53817830109,"Sandhus Vitamin D3 + K2 10000IU + Calcium Magnesium Zinc + Vitamin C + Astaxanthin Premium: Kombinasi Lengkap untuk Kesehatan Tulang & Jantung, 60 Kapsul",2026-09-22,2026-09-28,Saldo Penjual,Normal Order,56067,69900,0,0,-8000,0,8000,0,0,0,0,0,0,0,0,-6291,-1250,-3146,-3146,0,0,0,0,,0,,-,Saldo ShopeePay,,,-,Reguler,SPX Standard,,-,-,-,-,-,-,0,-`;
  parseMarketplaceCsvFile(fullContent, 'Income.sudah_dilepas.id.20260901_20261025_(1).csv', 'shopee');
}


// 1-Click Instant Test with User's Exact TikTok Shop File (Official Settlement Format with Nama Produk)
function testImportOfficialTikTok() {
  const fullContent = `ID Pesanan/Penyesuaian,Nama Produk,Jenis transaksi,Waktu pemesanan,Waktu pembayaran pesanan,Mata uang,Jumlah penyelesaian pembayaran,Total Pendapatan,Subtotal setelah diskon penjual,Subtotal sebelum diskon,Diskon penjual,Biaya produk sesuai jarak dari Program Horison+,Total pengembalian dana setelah diskon,Total pengembalian dana sebelum diskon,Pengembalian dana diskon penjual,Total Biaya,Biaya komisi platform,Biaya layanan pre-order,Biaya layanan Mall,Biaya Pembayaran,Credit card installment - Handling fee,Ongkir,Ongkir yang ditalangi penyedia jasa logistik,Ongkir penggantian (ditanggung pembeli),Ongkir penukaran (ditanggung pembeli),Ongkir yang ditanggung platform,Ongkir yang ditanggung pembeli,Pengembalian ongkir yang dibayar pembeli,Ongkir pengembalian barang (yang ditanggung pembeli),Subsidi ongkir,Biaya pengiriman sesuai jarak dari Program Horison+,Biaya layanan logistik,Penggantian biaya asuransi,Komisi Afiliasi,Komisi mitra afiliasi,Komisi Iklan Toko afiliasi,Deposit komisi afiliasi,Pengembalian dana komisi afiliasi,Komisi iklan toko Mitra Afiliasi,Biaya layanan Program Bebas Ongkir,Komisi dinamis,Biaya layanan Program Growth Xtra,Biaya layanan Khusus LIVE,Biaya layanan Growth Xtra Program Super,Biaya pemrosesan pesanan,Biaya layanan Program EAMS,Biaya layanan Brands Crazy Deal/Flash Sale,Biaya Dilayani Tokopedia,Biaya penanganan Dilayani Tokopedia,Biaya program PayLater,Biaya sumber daya campaign,Biaya layanan penginstalan,PPh Pasal 22 dipungut,Biaya layanan khusus platform,Biaya iklan GMV Max,Voucher GMV Max,Pajak penjualan atas voucher GMV Max,Program layanan terkelola (Pajak penjualan),Program layanan terkelola (Biaya per pesanan),Ongkir pesanan gagal kirim,Ongkir pengembalian barang karena kesalahan pembeli,Biaya asuransi,,Jumlah penyesuaian,ID pesanan terkait,Pembayaran oleh pembeli,Pengembalian dana pembeli,Diskon voucher yang ditanggung penjual,Pengembalian dana diskon voucher yang ditanggung penjual,Diskon platform,Pengembalian dana diskon platform,Diskon voucher yang ditanggung platform,Pengembalian dana diskon voucher yang ditanggung platform,Diskon ongkir dari penjual,Perkiraan berat paket,Berat paket yang bisa dikenai biaya,Detail produk terjual,Sumber pesanan
586760581269391356,Nalatiqa Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh GreenBud herbal,Pesanan,2026/10/24,2026/10/25,IDR,0,0,112000,200000,-88000,0,-112000,-200000,88000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586760581269391356,109726,-109726,0,0,3360,-3360,0,0,0,200,0,/,TikTok Shop
586616337555228072,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/16,2026/10/25,IDR,84236,112000,112000,200000,-88000,0,0,0,0,-27764,-6294,0,0,0,0,-1920,-16000,0,0,16000,0,0,0,0,0,-1920,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10460,0,0,0,0,0,0,0,,0,586616337555228072,113120,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586606865666049717,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/15,2026/10/25,IDR,85166,112000,112000,200000,-88000,0,0,0,0,-26834,-6294,0,0,0,0,-990,-20500,0,0,20500,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10460,0,0,0,0,0,0,0,,0,586606865666049717,113120,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586605970298143929,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/15,2026/10/25,IDR,77326,112000,112000,200000,-88000,0,0,0,0,-34674,-6294,0,0,0,0,-990,-14500,0,0,14500,0,0,0,0,0,-990,0,-7840,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10460,0,0,0,0,0,0,0,,0,586605970298143929,113120,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586603758071023147,Green Bud Bud Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami Nalatiqa Herbal,Pesanan,2026/10/15,2026/10/25,IDR,89016,112000,112000,200000,-88000,0,0,0,0,-22984,-6294,0,0,0,0,-990,-20500,0,0,20500,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-6610,0,0,0,0,0,0,0,,0,586603758071023147,113221,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586595283349112056,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/15,2026/10/25,IDR,77326,112000,112000,200000,-88000,0,0,0,0,-34674,-6294,0,0,0,0,-990,-14500,0,0,14500,0,0,0,0,0,-990,0,-7840,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10460,0,0,0,0,0,0,0,,0,586595283349112056,113120,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586569330997430087,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/13,2026/10/25,IDR,65447,112000,112000,200000,-88000,0,0,0,0,-46553,-6294,-3360,0,0,0,-2830,-48000,0,0,35000,13000,0,0,0,0,-2830,0,-13328,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-11651,0,0,0,0,0,0,0,,0,586569330997430087,109200,0,0,0,16800,0,0,0,0,200,200,/,TikTok Shop
586503136209110278,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/11,2026/10/25,IDR,76724,112000,112000,200000,-88000,0,0,0,0,-35276,-6294,-3360,0,0,0,-3440,-69500,0,0,40000,29500,0,0,0,0,-3440,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-13092,0,0,0,0,0,0,0,,0,586503136209110278,141600,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586481526427780249,Green Bud Bud Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami Nalatiqa Herbal,Pesanan,2026/10/08,2026/10/25,IDR,85232,112000,112000,200000,-88000,0,0,0,0,-26768,-6294,-3360,0,0,0,-1420,-20000,0,0,20000,0,0,0,0,0,-1420,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-6604,0,0,0,0,0,0,0,,0,586481526427780249,113120,0,0,0,0,0,0,0,0,200,200,1737772230992430415 * 1;,TikTok Shop
586477577755460903,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/08,2026/10/25,IDR,70716,112000,112000,200000,-88000,0,0,0,0,-41284,-6294,-3360,0,0,0,-3540,-47500,0,0,40000,7500,0,0,0,0,-3540,0,-7840,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-11160,0,0,0,0,0,0,0,,0,586477577755460903,120695,0,0,0,0,0,0,0,0,200,200,1737772511282627919 * 1;,TikTok Shop
586744016550790180,Nalatiqa Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh GreenBud herbal,Pesanan,2026/10/23,2026/10/24,IDR,0,0,112000,200000,-88000,0,-112000,-200000,88000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586744016550790180,110043,-110043,0,0,3047,-3047,0,0,0,200,0,1737772511282627919 * 1;,TikTok Shop
586742318464337526,KL Prima Madu Hitam KLPrima Original 150ML Madu Murni Herbal 100% Original Syrup BPOM,Pesanan,2026/10/23,2026/10/24,IDR,0,0,96000,150000,-54000,0,-96000,-150000,54000,0,0,0,0,0,0,0,0,0,0,0,18500,-18500,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586742318464337526,107888,-107888,0,0,7680,-7680,0,0,0,250,0,1738117209614746959 * 1;,TikTok Shop
586723350762718578,Nalatiqa Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh GreenBud herbal,Pesanan,2026/10/22,2026/10/24,IDR,0,0,112000,200000,-88000,0,-112000,-200000,88000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586723350762718578,113120,-113120,0,0,0,0,0,0,0,200,0,/,TikTok Shop
586617366761407717,"HALO SEHAT HERBAL TENGGOROKAN GEL NALATIQA UNTUK BERSIHKAN DAHAK PARU-PARU, BATUK BERDAHAK, DADA SESAK & NAPAS BERAT",Pesanan,2026/10/16,2026/10/24,IDR,102218,138000,138000,200000,-62000,0,0,0,0,-35782,-7714,0,0,0,0,-990,-7500,0,0,7500,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-9660,0,0,0,-1250,0,0,0,0,0,0,0,-690,0,-15478,0,0,0,0,0,0,0,,0,586617366761407717,135562,0,0,0,3880,0,0,0,0,200,200,1737828436956841295 * 2;,TikTok Shop
586614289678501570,"HALO SEHAT HERBAL TENGGOROKAN GEL NALATIQA UNTUK BERSIHKAN DAHAK PARU-PARU, BATUK BERDAHAK, DADA SESAK & NAPAS BERAT",Pesanan,2026/10/16,2026/10/24,IDR,46526,69000,69000,100000,-31000,0,0,0,0,-22474,-3857,0,0,0,0,-990,-9500,0,0,9500,0,0,0,0,0,-990,0,-3312,0,0,0,0,0,0,-4830,0,0,0,-1250,0,0,0,0,0,0,0,-345,0,-7890,0,0,0,0,0,0,0,,0,586614289678501570,68316,0,0,0,2760,0,0,0,0,100,100,1737828436956841295 * 1;,TikTok Shop
586606705418143483,Nalatiqa Spiny Bitter Gourd Capsule Plus – Herbal untuk Gaya Hidup Sehat & Seimbang | Pelancar Gula Darah | Nalatiqa Herbal,Pesanan,2026/10/15,2026/10/24,IDR,82228,112000,112000,200000,-88000,0,0,0,0,-29772,-6294,0,0,0,0,-990,-7500,0,0,0,7500,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-13398,0,0,0,0,0,0,0,,0,586606705418143483,120695,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586597871832958600,Green Bud Bud Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami Nalatiqa Herbal,Pesanan,2026/10/15,2026/10/24,IDR,89027,112000,112000,200000,-88000,0,0,0,0,-22973,-6294,0,0,0,0,-990,-24000,0,0,24000,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-6599,0,0,0,0,0,0,0,,0,586597871832958600,103020,0,0,0,10000,0,0,0,0,200,200,/,TikTok Shop
586578730561931153,"TEHSURE Ginseng | Teh Kurma Merah Wolfberry Murbei | Bantu Jaga Stamina, Relaksasi, Tidur Lebih Nyaman & Keseimbangan Badan Harian | Nalatiqa Nature",Pesanan,2026/10/14,2026/10/24,IDR,52289,78500,78500,125000,-46500,0,0,0,0,-26211,-3799,0,0,0,0,-990,-25000,0,0,25000,0,0,0,0,0,-990,0,-7222,0,0,0,0,0,0,-5102,0,0,0,-1250,0,0,0,0,0,0,0,-392,0,-7456,0,0,0,0,0,0,0,,0,586578730561931153,74356,0,0,0,6280,0,0,0,0,100,100,/,TikTok Shop
586566083453093775,"NALATIQA HALO SEHAT HERBAL TENGGOROKAN GEL NALATIQA UNTUK BERSIHKAN DAHAK PARU-PARU, BATUK BERDAHAK, DADA SESAK & NAPAS BERAT",Pesanan,2026/10/13,2026/10/24,IDR,49948,69000,69000,100000,-31000,0,0,0,0,-19052,-3857,0,0,0,0,-1920,-16000,0,0,16000,0,0,0,0,0,-1920,0,-6850,0,0,0,0,0,0,-4830,0,0,0,-1250,0,0,0,0,0,0,0,-345,0,0,0,0,0,0,0,0,0,,0,586566083453093775,70599,0,0,0,500,0,0,0,0,100,100,/,TikTok Shop
586543754736076427,"HALO SEHAT HERBAL TENGGOROKAN GEL NALATIQA UNTUK BERSIHKAN DAHAK PARU-PARU, BATUK BERDAHAK, DADA SESAK & NAPAS BERAT",Pesanan,2026/10/12,2026/10/24,IDR,0,0,69000,100000,-31000,0,-69000,-100000,31000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586543754736076427,71104,-71104,0,0,0,0,0,0,0,100,0,1737828436956841295 * 1;,TikTok Shop
586529721465734257,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/11,2026/10/24,IDR,80876,112000,112000,200000,-88000,0,0,0,0,-31124,-6294,-3360,0,0,0,-1920,-27500,0,0,27500,0,0,0,0,0,-1920,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10460,0,0,0,0,0,0,0,,0,586529721465734257,113120,0,0,0,0,0,0,0,0,200,200,1737772511282627919 * 1;,TikTok Shop
586515907808691286,Green Bud Bud Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami Nalatiqa Herbal,Pesanan,2026/10/10,2026/10/24,IDR,83225,112000,112000,200000,-88000,0,0,0,0,-28775,-6294,-3360,0,0,0,-2830,-45000,0,0,35000,10000,0,0,0,0,-2830,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-7201,0,0,0,0,0,0,0,,0,586515907808691286,123321,0,0,0,0,0,0,0,0,200,200,1737772230992430415 * 1;,TikTok Shop
586512560900638103,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/10,2026/10/24,IDR,80868,112000,112000,200000,-88000,0,0,0,0,-31132,-6294,-3360,0,0,0,-1920,-13500,0,0,13500,0,0,0,0,0,-1920,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10468,0,0,0,0,0,0,0,,0,586512560900638103,113221,0,0,0,0,0,0,0,0,200,200,1737772511282627919 * 1;,TikTok Shop
586511996810003534,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/10,2026/10/24,IDR,81642,112000,112000,200000,-88000,0,0,0,0,-30358,-6294,-3360,0,0,0,-990,-22000,0,0,22000,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10624,0,0,0,0,0,0,0,,0,586511996810003534,111540,0,0,0,3360,0,0,0,0,200,200,1737772511282627919 * 1;,Tokopedia
586498748060173504,Green Bud Bitter Gourd – Herbal untuk Gaya Hidup Sehat & Seimbang Kadar Gula Darah Stabil Mendukung Metabolisme Tubuh Nalatiqa Herbal,Pesanan,2026/10/09,2026/10/24,IDR,80178,112000,112000,200000,-88000,0,0,0,0,-31822,-6294,-3360,0,0,0,-3940,-69500,0,0,25000,44500,0,0,0,0,-3940,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-9138,0,0,0,0,0,0,0,,0,586498748060173504,156500,0,0,0,0,0,0,0,0,200,200,1737772488388805967 * 1;,TikTok Shop
586496289077757618,Green Bud Bitter Gourd – Herbal untuk Gaya Hidup Sehat & Seimbang Kadar Gula Darah Stabil Mendukung Metabolisme Tubuh Nalatiqa Herbal,Pesanan,2026/10/09,2026/10/24,IDR,69546,112000,112000,200000,-88000,0,0,0,0,-42454,-6294,-3360,0,0,0,-1920,-24500,0,0,24500,0,0,0,0,0,-1920,0,-15188,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-6602,0,0,0,0,0,0,0,,0,586496289077757618,109570,0,0,0,3515,0,0,0,0,200,200,1737772488388805967 * 1;,TikTok Shop
586491168034948830,Green Bud Bitter Gourd – Herbal untuk Gaya Hidup Sehat & Seimbang | Nalatiqa Herbal,Pesanan,2026/10/09,2026/10/24,IDR,85662,112000,112000,200000,-88000,0,0,0,0,-26338,-6294,-3360,0,0,0,-990,-14500,0,0,14500,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-6604,0,0,0,0,0,0,0,,0,586491168034948830,113120,0,0,0,0,0,0,0,0,200,200,1737772176169862479 * 1;,TikTok Shop
586476459903583488,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/08,2026/10/24,IDR,79256,112000,112000,200000,-88000,0,0,0,0,-32744,-6294,-3360,0,0,0,-3540,-33000,0,0,33000,0,0,0,0,0,-3540,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10460,0,0,0,0,0,0,0,,0,586476459903583488,113120,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586440487366853802,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/06,2026/10/24,IDR,0,0,112000,200000,-88000,0,-112000,-200000,88000,0,0,0,0,0,0,0,0,0,0,0,49500,-49500,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586440487366853802,163115,-163115,0,0,0,0,0,0,0,200,0,/,TikTok Shop
586422395167410067,Green Bud Bitter Gourd – Herbal untuk Gaya Hidup Sehat & Seimbang Kadar Gula Darah Stabil Mendukung Metabolisme Tubuh Nalatiqa Herbal,Pesanan,2026/10/05,2026/10/24,IDR,69052,112000,112000,200000,-88000,0,0,0,0,-42948,-6294,-3360,0,0,0,-1920,-35000,0,0,35000,0,0,0,0,0,-1920,0,-15680,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-6604,0,0,0,0,0,0,0,,0,586422395167410067,113120,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586405553281074985,Green Bud Bitter Gourd – Herbal untuk Gaya Hidup Sehat & Seimbang,Pesanan,2026/10/04,2026/10/24,IDR,80682,112000,112000,200000,-88000,0,0,0,0,-31318,-9128,-3360,0,0,0,-3130,-38500,0,0,38500,0,0,0,0,0,-3130,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-6610,0,0,0,0,0,0,0,,0,586405553281074985,113221,0,0,0,0,0,0,0,0,200,200,1737772176169862479 * 1;,TikTok Shop
586373151581308638,Green Bud Bitter Gourd – Herbal untuk Gaya Hidup Sehat & Seimbang,Pesanan,2026/10/02,2026/10/24,IDR,0,0,112000,200000,-88000,0,-112000,-200000,88000,0,0,0,0,0,0,0,0,0,0,0,2500,-2500,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586373151581308638,115645,-115645,0,0,0,0,0,0,0,200,0,1737772176169862479 * 1;,TikTok Shop
586731067581105891,"HALO SEHAT HERBAL TENGGOROKAN GEL NALATIQA UNTUK BERSIHKAN DAHAK PARU-PARU, BATUK BERDAHAK, DADA SESAK & NAPAS BERAT",Pesanan,2026/10/22,2026/10/23,IDR,0,0,69000,100000,-31000,0,-69000,-100000,31000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586731067581105891,68316,-68316,0,0,2760,-2760,0,0,0,100,0,1737828436956841295 * 1;,TikTok Shop
586608761144902908,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/15,2026/10/23,IDR,0,0,112000,200000,-88000,0,-112000,-200000,88000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586608761144902908,96152,-96152,0,0,16800,-16800,0,0,0,200,0,/,TikTok Shop
586601844088866749,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/15,2026/10/23,IDR,85475,112000,112000,200000,-88000,0,0,0,0,-26525,-6294,0,0,0,0,-690,-7500,0,0,7500,0,0,0,0,0,-690,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10451,0,0,0,0,0,0,0,,0,586601844088866749,104070,0,0,0,8960,0,0,0,0,200,200,1737772511282627919 * 1;,TikTok Shop
586588711851034196,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/14,2026/10/23,IDR,0,0,112000,200000,-88000,0,-112000,-200000,88000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586588711851034196,113221,-113221,0,0,0,0,0,0,0,200,0,/,TikTok Shop
586588143877719567,"HALO SEHAT HERBAL TENGGOROKAN GEL NALATIQA UNTUK BERSIHKAN DAHAK PARU-PARU, BATUK BERDAHAK, DADA SESAK & NAPAS BERAT",Pesanan,2026/10/14,2026/10/23,IDR,49992,69000,69000,100000,-31000,0,0,0,0,-19008,-3857,0,0,0,0,-990,-7500,0,0,7500,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-4830,0,0,0,-1250,0,0,0,0,0,0,0,-345,0,-7736,0,0,0,0,0,0,0,,0,586588143877719567,69690,0,0,0,0,0,0,0,0,100,100,1737828436956841295 * 1;,TikTok Shop
586582768203957758,"HALO SEHAT HERBAL TENGGOROKAN GEL NALATIQA UNTUK BERSIHKAN DAHAK PARU-PARU, BATUK BERDAHAK, DADA SESAK & NAPAS BERAT",Pesanan,2026/10/14,2026/10/23,IDR,49105,69000,69000,100000,-31000,0,0,0,0,-19895,-3857,0,0,0,0,0,-15000,0,0,0,15000,0,0,0,0,0,0,0,0,0,0,0,0,0,-4830,0,0,0,-1250,0,0,0,0,0,0,0,-345,0,-9613,0,0,0,0,0,0,0,,0,586582768203957758,86600,0,0,0,0,0,0,0,0,100,100,1737828436956841295 * 1;,Tokopedia
586582097919510243,"HALO SEHAT HERBAL TENGGOROKAN GEL NALATIQA UNTUK BERSIHKAN DAHAK PARU-PARU, BATUK BERDAHAK, DADA SESAK & NAPAS BERAT",Pesanan,2026/10/14,2026/10/23,IDR,0,0,69000,100000,-31000,0,-69000,-100000,31000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586582097919510243,70902,-70902,0,0,200,-200,0,0,0,100,0,1737828436956841295 * 1;,TikTok Shop
586577798135580525,Teh Herba Mulberry Ginseng TehSure | Teh Kurma Merah Wolfberry Murbei dengan Ginseng untuk Stamina Harian  | Nalatiqa Nature,Pesanan,2026/10/14,2026/10/23,IDR,56509,78500,78500,125000,-46500,0,0,0,0,-21991,-3799,0,0,0,0,-3940,-40500,0,0,40000,500,0,0,0,0,-3940,0,0,0,0,0,0,0,0,-5102,0,0,0,-1250,0,0,0,0,0,0,0,-392,0,-7508,0,0,0,0,0,0,0,,0,586577798135580525,81204,0,0,0,0,0,0,0,0,100,100,/,TikTok Shop
586577460280591825,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/14,2026/10/23,IDR,85166,112000,112000,200000,-88000,0,0,0,0,-26834,-6294,0,0,0,0,-990,-7500,0,0,7500,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10460,0,0,0,0,0,0,0,,0,586577460280591825,113120,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586571397691377044,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/13,2026/10/23,IDR,69486,112000,112000,200000,-88000,0,0,0,0,-42514,-6294,0,0,0,0,-990,-20500,0,0,20500,0,0,0,0,0,-990,0,-15680,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10460,0,0,0,0,0,0,0,,0,586571397691377044,113120,0,0,0,0,0,0,0,0,200,200,1737772511282627919 * 1;,TikTok Shop
586570683307755317,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/13,2026/10/23,IDR,81806,112000,112000,200000,-88000,0,0,0,0,-30194,-6294,-3360,0,0,0,-990,-22500,0,0,22500,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10460,0,0,0,0,0,0,0,,0,586570683307755317,113120,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586567426967701340,Nalatiqa Spiny Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami | Best Seller,Pesanan,2026/10/13,2026/10/23,IDR,78780,112000,112000,200000,-88000,0,0,0,0,-33220,-6294,-3360,0,0,0,-1920,-15000,0,0,15000,0,0,0,0,0,-1920,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-12556,0,0,0,0,0,0,0,,0,586567426967701340,113120,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586551076578690911,"NALATIQA HALO SEHAT HERBAL TENGGOROKAN GEL NALATIQA UNTUK BERSIHKAN DAHAK PARU-PARU, BATUK BERDAHAK, DADA SESAK & NAPAS BERAT",Pesanan,2026/10/12,2026/10/23,IDR,137972,187000,187000,300000,-113000,0,0,0,0,-49028,-10453,0,0,0,0,-1920,-17000,0,0,0,17000,0,0,0,0,-1920,0,-9350,0,0,0,0,0,0,-13090,0,0,0,-1250,0,0,0,0,0,0,0,-935,0,-12030,0,0,0,0,0,0,0,,0,586551076578690911,206040,0,0,0,0,0,0,0,0,250,336,1737893541198202191 * 1;,TikTok Shop
586539414233974314,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/11,2026/10/23,IDR,81153,112000,112000,200000,-88000,0,0,0,0,-30847,-6294,-3360,0,0,0,-990,-32000,0,0,25000,7000,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-11113,0,0,0,0,0,0,0,,0,586539414233974314,120190,0,0,0,0,0,0,0,0,200,200,1737772511282627919 * 1;,TikTok Shop
586538901952824874,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/11,2026/10/23,IDR,81153,112000,112000,200000,-88000,0,0,0,0,-30847,-6294,-3360,0,0,0,-990,-32000,0,0,25000,7000,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-11113,0,0,0,0,0,0,0,,0,586538901952824874,120190,0,0,0,0,0,0,0,0,200,200,1737772511282627919 * 1;,TikTok Shop
586531491835578002,"NALATIQA HERBAL TENGGOROKAN GEL NALATIQA UNTUK BERSIHKAN DAHAK PARU-PARU, BATUK BERDAHAK, DADA SESAK & NAPAS BERAT",Pesanan,2026/10/11,2026/10/23,IDR,52650,69000,69000,100000,-31000,0,0,0,0,-16350,-3857,0,0,0,0,-1920,-24500,0,0,24500,0,0,0,0,0,-1920,0,0,0,0,0,0,0,0,-4830,0,0,0,-1250,0,0,0,0,0,0,0,-345,0,-4148,0,0,0,0,0,0,0,,0,586531491835578002,65529,0,0,0,5520,0,0,0,0,100,100,1737893541198071119 * 1;,TikTok Shop
586494343388890328,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/09,2026/10/23,IDR,77583,112000,112000,200000,-88000,0,0,0,0,-34417,-6294,-3360,0,0,0,-3440,-59000,0,0,40000,19000,0,0,0,0,-3440,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-12233,0,0,0,0,0,0,0,,0,586494343388890328,132310,0,0,0,0,0,0,0,0,200,200,1737772511282627919 * 1;,TikTok Shop
586481579422221924,Green Bud Bud Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami Nalatiqa Herbal,Pesanan,2026/10/08,2026/10/23,IDR,84726,112000,112000,200000,-88000,0,0,0,0,-27274,-6294,-3360,0,0,0,-1920,-27000,0,0,27000,0,0,0,0,0,-1920,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-6610,0,0,0,0,0,0,0,,0,586481579422221924,113221,0,0,0,0,0,0,0,0,200,200,1737772230992430415 * 1;,TikTok Shop
586473190624102238,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/08,2026/10/23,IDR,79513,112000,112000,200000,-88000,0,0,0,0,-32487,-6294,-3360,0,0,0,-1920,-14500,0,0,0,14500,0,0,0,0,-1920,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-11823,0,0,0,0,0,0,0,,0,586473190624102238,127866,0,0,0,0,0,0,0,0,200,200,1737772511282627919 * 1;,TikTok Shop
586420652471125310,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh,Pesanan,2026/10/05,2026/10/23,IDR,71826,112000,112000,200000,-88000,0,0,0,0,-40174,-6294,-3360,0,0,0,-3130,-40000,0,0,40000,0,0,0,0,0,-3130,0,-7840,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10460,0,0,0,0,0,0,0,,0,586420652471125310,113120,0,0,0,0,0,0,0,0,200,200,1737772511282627919 * 1;,TikTok Shop
586419832551999328,Green Bud Bitter Gourd – Herbal untuk Gaya Hidup Sehat & Seimbang,Pesanan,2026/10/05,2026/10/23,IDR,0,0,112000,200000,-88000,0,-112000,-200000,88000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586419832551999328,113221,-113221,0,0,0,0,0,0,0,200,0,1737772176169862479 * 1;,TikTok Shop
586414932911752948,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh,Pesanan,2026/10/05,2026/10/23,IDR,69230,112000,112000,200000,-88000,0,0,0,0,-42770,-9128,-3360,0,0,0,-3130,-36000,0,0,36000,0,0,0,0,0,-3130,0,-7605,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10457,0,0,0,0,0,0,0,,0,586414932911752948,109740,0,0,0,3360,0,0,0,0,200,200,/,TikTok Shop
586404973041387102,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh,Pesanan,2026/10/04,2026/10/23,IDR,72816,112000,112000,200000,-88000,0,0,0,0,-39184,-9128,-3360,0,0,0,-3130,-43000,0,0,0,43000,0,0,0,0,-3130,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-14476,0,0,0,0,0,0,0,,0,586404973041387102,156550,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586393131969578241,"Expce Teh Herbal 12 Sachet, Segar Alami, Relaksasi Setiap Hari",Pesanan,2026/10/03,2026/10/23,IDR,58731,78500,78500,149000,-70500,0,0,0,0,-19769,-6476,0,0,0,0,-1920,-18000,0,0,18000,0,0,0,0,0,-1920,0,0,0,0,0,0,0,0,-5102,0,0,0,-1250,0,0,0,0,0,0,0,-392,0,-4629,0,0,0,0,0,0,0,,0,586393131969578241,79285,0,0,0,0,0,0,0,0,200,200,1737771470188807503 * 1;,TikTok Shop
586718110731568239,Nalatiqa Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh GreenBud herbal,Pesanan,2026/10/22,2026/10/22,IDR,0,0,112000,200000,-88000,0,-112000,-200000,88000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586718110731568239,113120,-113120,0,0,0,0,0,0,0,200,0,/,TikTok Shop
586602873938150996,Nalatiqa Spiny Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami | Best Seller,Pesanan,2026/10/15,2026/10/22,IDR,0,0,112000,200000,-88000,0,-112000,-200000,88000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586602873938150996,113221,-113221,0,0,0,0,0,0,0,200,0,1737894752772851023 * 1;,TikTok Shop
586584361563227403,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/14,2026/10/22,IDR,69486,112000,112000,200000,-88000,0,0,0,0,-42514,-6294,0,0,0,0,-990,-9500,0,0,9500,0,0,0,0,0,-990,0,-15680,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10460,0,0,0,0,0,0,0,,0,586584361563227403,113120,0,0,0,0,0,0,0,0,200,200,1737772511282627919 * 1;,TikTok Shop
586578424742315900,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/14,2026/10/22,IDR,77430,112000,112000,200000,-88000,0,0,0,0,-34570,-6294,0,0,0,0,-990,-8500,0,0,8500,0,0,0,0,0,-990,0,-7840,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10356,0,0,0,0,0,0,0,,0,586578424742315900,112000,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586546945280346039,Green Bud Bud Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami Nalatiqa Herbal,Pesanan,2026/10/12,2026/10/22,IDR,85662,112000,112000,200000,-88000,0,0,0,0,-26338,-6294,-3360,0,0,0,-990,-20500,0,0,20500,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-6604,0,0,0,0,0,0,0,,0,586546945280346039,113120,0,0,0,0,0,0,0,0,200,200,1737772230992430415 * 1;,TikTok Shop
586539810205239008,"HALO SEHAT HERBAL TENGGOROKAN GEL NALATIQA UNTUK BERSIHKAN DAHAK PARU-PARU, BATUK BERDAHAK, DADA SESAK & NAPAS BERAT",Pesanan,2026/10/11,2026/10/22,IDR,48186,69000,69000,100000,-31000,0,0,0,0,-20814,-3857,0,0,0,0,-2830,-68500,0,0,68500,0,0,0,0,0,-2830,0,0,0,0,0,0,0,0,-4830,0,0,0,-1250,0,0,0,0,0,0,0,-345,0,-7702,0,0,0,0,0,0,0,,0,586539810205239008,39390,0,0,0,30000,0,0,0,0,100,100,1737828436956841295 * 1;,TikTok Shop
586535277776766903,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/11,2026/10/22,IDR,71911,112000,112000,200000,-88000,0,0,0,0,-40089,-6294,-3360,0,0,0,-1920,-16000,0,0,0,16000,0,0,0,0,-1920,0,-7476,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-11949,0,0,0,0,0,0,0,,0,586535277776766903,124028,0,0,0,5200,0,0,0,0,200,200,1737772511282627919 * 1;,TikTok Shop
586518298151191579,"HALO SEHAT HERBAL TENGGOROKAN GEL NALATIQA UNTUK BERSIHKAN DAHAK PARU-PARU, BATUK BERDAHAK, DADA SESAK & NAPAS BERAT",Pesanan,2026/10/10,2026/10/22,IDR,46386,69000,69000,100000,-31000,0,0,0,0,-22614,-3857,0,0,0,0,-990,-17000,0,0,17000,0,0,0,0,0,-990,0,-3450,0,0,0,0,0,0,-4830,0,0,0,-1250,0,0,0,0,0,0,0,-345,0,-7892,0,0,0,0,0,0,0,,0,586518298151191579,71104,0,0,0,0,0,0,0,0,100,100,1737828436956841295 * 1;,TikTok Shop
586512516981491382,"[Tehsure] Teh Herba Peredaran Darah TehSure | Mulberry Ginseng, Kurma Merah & Wolfberry | Minuman Herba Harian untuk Sirkulasi, Stamina & Keseimbangan Badan Nalatiqa",Pesanan,2026/10/10,2026/10/22,IDR,57344,78500,78500,125000,-46500,0,0,0,0,-21156,-3799,0,0,0,0,-1420,-20000,0,0,0,20000,0,0,0,0,-1420,0,0,0,0,0,0,0,0,-5102,0,0,0,-1250,0,0,0,0,0,0,0,-392,0,-9193,0,0,0,0,0,0,0,,0,586512516981491382,93142,0,0,0,6280,0,0,0,0,100,100,/,TikTok Shop
586508204044682277,Nalatiqa Spiny Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami | Best Seller,Pesanan,2026/10/10,2026/10/22,IDR,64030,112000,112000,200000,-88000,0,0,0,0,-47970,-6294,-3360,0,0,0,-990,-14500,0,0,14500,0,0,0,0,0,-990,0,-15680,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-12556,0,0,0,0,0,0,0,,0,586508204044682277,113120,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586494557884024184,Green Bud Bud Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami Nalatiqa Herbal,Pesanan,2026/10/09,2026/10/22,IDR,78936,112000,112000,200000,-88000,0,0,0,0,-33064,-6294,-3360,0,0,0,-990,-21500,0,0,21500,0,0,0,0,0,-990,0,-6664,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-6666,0,0,0,0,0,0,0,,0,586494557884024184,97358,0,0,0,16800,0,0,0,0,200,200,1737772230992430415 * 1;,Tokopedia
586493114693289232,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/09,2026/10/22,IDR,81806,112000,112000,200000,-88000,0,0,0,0,-30194,-6294,-3360,0,0,0,-990,-31000,0,0,31000,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10460,0,0,0,0,0,0,0,,0,586493114693289232,113120,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586477387641881780,Green Bud Bud Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami Nalatiqa Herbal,Pesanan,2026/10/08,2026/10/22,IDR,85986,112000,112000,200000,-88000,0,0,0,0,-26014,-6294,-3360,0,0,0,0,-10500,0,0,0,10500,0,0,0,0,0,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-7270,0,0,0,0,0,0,0,,0,586477387641881780,124533,0,0,0,0,0,0,0,0,200,200,1737772230992430415 * 1;,Tokopedia
586463248661317005,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/07,2026/10/22,IDR,0,0,112000,200000,-88000,0,-112000,-200000,88000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586463248661317005,113120,-113120,0,0,0,0,0,0,0,200,0,/,TikTok Shop
586457447853688225,"HALO SEHAT HERBAL TENGGOROKAN GEL NALATIQA UNTUK BERSIHKAN DAHAK PARU-PARU, BATUK BERDAHAK, DADA SESAK & NAPAS BERAT",Pesanan,2026/10/07,2026/10/22,IDR,50155,69000,69000,100000,-31000,0,0,0,0,-18845,-3857,0,0,0,0,-2430,-35000,0,0,0,35000,0,0,0,0,-2430,0,0,0,0,0,0,0,0,-4830,0,0,0,-1250,0,0,0,0,0,0,0,-345,0,-6133,0,0,0,0,0,0,0,,0,586457447853688225,105040,0,0,0,0,0,0,0,0,100,100,1737828436956841295 * 1;,TikTok Shop
586456461799359611,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/07,2026/10/22,IDR,0,0,112000,200000,-88000,0,-112000,-200000,88000,0,0,0,0,0,0,0,0,0,0,0,61000,-61000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586456461799359611,174730,-174730,0,0,0,0,0,0,0,200,0,/,TikTok Shop
586456062897784679,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/07,2026/10/22,IDR,73355,112000,112000,200000,-88000,0,0,0,0,-38645,-6294,-3360,0,0,0,-1920,-16000,0,0,16000,0,0,0,0,0,-1920,0,-7526,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10455,0,0,0,0,0,0,0,,0,586456062897784679,108595,0,0,0,4480,0,0,0,0,200,200,1737772511282627919 * 1;,TikTok Shop
586388647343785474,Green Bud Bitter Gourd – Herbal untuk Gaya Hidup Sehat & Seimbang,Pesanan,2026/10/03,2026/10/22,IDR,79920,112000,112000,200000,-88000,0,0,0,0,-32080,-9128,-3360,0,0,0,-3130,-43000,0,0,30000,13000,0,0,0,0,-3130,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-7372,0,0,0,0,0,0,0,,0,586388647343785474,126250,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586548168563328558,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/12,2026/10/21,IDR,82004,112000,112000,200000,-88000,0,0,0,0,-29996,-6294,-3360,0,0,0,-690,-7500,0,0,7500,0,0,0,0,0,-690,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10562,0,0,0,0,0,0,0,,0,586548168563328558,114231,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586538643564627868,"HALO SEHAT HERBAL TENGGOROKAN GEL NALATIQA UNTUK BERSIHKAN DAHAK PARU-PARU, BATUK BERDAHAK, DADA SESAK & NAPAS BERAT",Pesanan,2026/10/11,2026/10/21,IDR,49816,69000,69000,100000,-31000,0,0,0,0,-19184,-3857,0,0,0,0,-990,-20500,0,0,20500,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-4830,0,0,0,-1250,0,0,0,0,0,0,0,-345,0,-7912,0,0,0,0,0,0,0,,0,586538643564627868,69055,0,0,0,2229,0,0,0,0,100,100,1737828436956841295 * 1;,TikTok Shop
586516124196504792,Nalatiqa Spiny Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami | Best Seller,Pesanan,2026/10/10,2026/10/21,IDR,80010,112000,112000,200000,-88000,0,0,0,0,-31990,-6294,-3360,0,0,0,-690,-7500,0,0,7500,0,0,0,0,0,-690,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-12556,0,0,0,0,0,0,0,,0,586516124196504792,113120,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586496273474029292,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/09,2026/10/21,IDR,73958,112000,112000,200000,-88000,0,0,0,0,-38042,-6294,-3360,0,0,0,-990,-9500,0,0,9500,0,0,0,0,0,-990,0,-7840,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10468,0,0,0,0,0,0,0,,0,586496273474029292,113221,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586493953075348848,Green Bud Bud Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami Nalatiqa Herbal,Pesanan,2026/10/09,2026/10/21,IDR,77887,112000,112000,200000,-88000,0,0,0,0,-34113,-6294,-3360,0,0,0,-990,-7500,0,0,7500,0,0,0,0,0,-990,0,-7840,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-6539,0,0,0,0,0,0,0,,0,586493953075348848,112000,0,0,0,0,0,0,0,0,200,200,1737772230992430415 * 1;,TikTok Shop
586478718173939492,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/08,2026/10/21,IDR,73966,112000,112000,200000,-88000,0,0,0,0,-38034,-6294,-3360,0,0,0,-990,-25000,0,0,25000,0,0,0,0,0,-990,0,-7840,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10460,0,0,0,0,0,0,0,,0,586478718173939492,113120,0,0,0,0,0,0,0,0,200,200,1737772511282627919 * 1;,TikTok Shop
586470744579671952,Green Bud Bud Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami Nalatiqa Herbal,Pesanan,2026/10/08,2026/10/21,IDR,78138,112000,112000,200000,-88000,0,0,0,0,-33862,-6294,-3360,0,0,0,-990,-21000,0,0,21000,0,0,0,0,0,-990,0,-7526,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-6602,0,0,0,0,0,0,0,,0,586470744579671952,108595,0,0,0,4480,0,0,0,0,200,200,1737772230992430415 * 1;,TikTok Shop
586468664495736807,Green Bud Bitter Gourd – Herbal untuk Gaya Hidup Sehat & Seimbang | Nalatiqa Herbal,Pesanan,2026/10/08,2026/10/21,IDR,77822,112000,112000,200000,-88000,0,0,0,0,-34178,-6294,-3360,0,0,0,-990,-14500,0,0,14500,0,0,0,0,0,-990,0,-7840,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-6604,0,0,0,0,0,0,0,,0,586468664495736807,113120,0,0,0,0,0,0,0,0,200,200,1737772176169862479 * 1;,TikTok Shop
586435401805497751,Green Bud Bud Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami Nalatiqa Herbal,Pesanan,2026/10/06,2026/10/21,IDR,75653,112000,112000,200000,-88000,0,0,0,0,-36347,-6294,-3360,0,0,0,-1920,-21000,0,0,0,21000,0,0,0,0,-1920,0,-7840,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-7843,0,0,0,0,0,0,0,,0,586435401805497751,134330,0,0,0,0,0,0,0,0,200,200,1737772230992430415 * 1;,TikTok Shop
586425405921789547,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/05,2026/10/21,IDR,73391,112000,112000,200000,-88000,0,0,0,0,-38609,-6294,-3360,0,0,0,-1920,-22500,0,0,22500,0,0,0,0,0,-1920,0,-7490,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10455,0,0,0,0,0,0,0,,0,586425405921789547,108070,0,0,0,5000,0,0,0,0,200,200,/,TikTok Shop
586550385434265169,"Ex pce Teh Herbal 12 Sachet, Segar Alami, Relaksasi Setiap Hari, Nalatiqa Herbal",Pesanan,2026/10/12,2026/10/20,IDR,54173,78500,78500,149000,-70500,0,0,0,0,-24327,-3799,0,0,0,0,-990,-7500,0,0,7500,0,0,0,0,0,-990,0,-3925,0,0,0,0,0,0,-5102,0,0,0,-1250,0,0,0,0,0,0,0,-392,0,-8869,0,0,0,0,0,0,0,,0,586550385434265169,79900,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586550227759630126,"Ex pce Teh Herbal 12 Sachet, Segar Alami, Relaksasi Setiap Hari, Nalatiqa Herbal",Pesanan,2026/10/12,2026/10/20,IDR,53655,78500,78500,149000,-70500,0,0,0,0,-24845,-3799,0,0,0,0,-990,-7500,0,0,0,7500,0,0,0,0,-990,0,-3611,0,0,0,0,0,0,-5102,0,0,0,-1250,0,0,0,0,0,0,0,-392,0,-9701,0,0,0,0,0,0,0,,0,586550227759630126,81120,0,0,0,6280,0,0,0,0,200,200,1737771470188807503 * 1;,TikTok Shop
586500802433025055,"NALATIQA TENGGOROKAN HERBAL GEL 20G UNTUK BERSIHKAN DAHAK PARU-PARU, BATUK BERDAHAK, DADA SESAK & NAPAS BERAT",Pesanan,2026/10/09,2026/10/20,IDR,48175,69000,69000,100000,-31000,0,0,0,0,-20825,-3857,0,0,0,0,-2830,-33000,0,0,33000,0,0,0,0,0,-2830,0,0,0,0,0,0,0,0,-4830,0,0,0,-1250,0,0,0,0,0,0,0,-345,0,-7713,0,0,0,0,0,0,0,,0,586500802433025055,49490,0,0,0,20000,0,0,0,0,100,100,1737828249843107151 * 1;,TikTok Shop
586499567322891962,"HALO SEHAT HERBAL TENGGOROKAN GEL NALATIQA UNTUK BERSIHKAN DAHAK PARU-PARU, BATUK BERDAHAK, DADA SESAK & NAPAS BERAT",Pesanan,2026/10/09,2026/10/20,IDR,49838,69000,69000,100000,-31000,0,0,0,0,-19162,-3857,0,0,0,0,-990,-25000,0,0,25000,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-4830,0,0,0,-1250,0,0,0,0,0,0,0,-345,0,-7890,0,0,0,0,0,0,0,,0,586499567322891962,68316,0,0,0,2760,0,0,0,0,100,100,1737828436956841295 * 1;,TikTok Shop
586492579351332249,"[TehSure] Teh Herba Mulberry Ginseng TehSure | Teh Kurma Merah Wolfberry Murbei dengan Ginseng | Minuman Herba untuk Menyokong Peredaran Darah Sihat, Stamina & Keseimbangan Badan Nalatiqa Nature",Pesanan,2026/10/09,2026/10/20,IDR,62259,78500,78500,125000,-46500,0,0,0,0,-16241,-3799,0,0,0,0,-990,-25000,0,0,25000,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-5102,0,0,0,-1250,0,0,0,0,0,0,0,-392,0,-4708,0,0,0,0,0,0,0,,0,586492579351332249,74356,0,0,0,6280,0,0,0,0,100,100,1737863312088859983 * 1;,TikTok Shop
586481565621257356,"HALO SEHAT HERBAL TENGGOROKAN GEL NALATIQA UNTUK BERSIHKAN DAHAK PARU-PARU, BATUK BERDAHAK, DADA SESAK & NAPAS BERAT",Pesanan,2026/10/08,2026/10/20,IDR,103761,132000,132000,200000,-68000,0,0,0,0,-28239,-7379,0,0,0,0,-1920,-40000,0,0,40000,0,0,0,0,0,-1920,0,0,0,0,0,0,0,0,-9240,0,0,0,-1250,0,0,0,0,0,0,0,-660,0,-7790,0,0,0,0,0,0,0,,0,586481565621257356,133421,0,0,0,0,0,0,0,0,150,200,1737828436956906831 * 1;,TikTok Shop
586478923096950744,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/08,2026/10/20,IDR,81806,112000,112000,200000,-88000,0,0,0,0,-30194,-6294,-3360,0,0,0,-990,-7500,0,0,7500,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10460,0,0,0,0,0,0,0,,0,586478923096950744,113120,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586459345199138527,Green Bud Bud Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami Nalatiqa Herbal,Pesanan,2026/10/07,2026/10/20,IDR,173563,224000,224000,400000,-176000,0,0,0,0,-50437,-12589,-6720,0,0,0,-990,-25000,0,0,25000,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-14560,0,0,0,-1250,0,0,0,0,0,0,0,-1120,0,-13208,0,0,0,0,0,0,0,,0,586459345199138527,226240,0,0,0,0,0,0,0,0,400,400,1737772230992430415 * 2;,TikTok Shop
586439282143692271,Green Bud Bud Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami Nalatiqa Herbal,Pesanan,2026/10/06,2026/10/20,IDR,85558,112000,112000,200000,-88000,0,0,0,0,-26442,-6294,-3360,0,0,0,-990,-26500,0,0,26500,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-6708,0,0,0,0,0,0,0,,0,586439282143692271,99889,0,0,0,15000,0,0,0,0,200,200,1737772230992430415 * 1;,Tokopedia
586429739903125356,Green Bud Bitter Gourd – Herbal untuk Gaya Hidup Sehat & Seimbang Kadar Gula Darah Stabil Mendukung Metabolisme Tubuh Nalatiqa Herbal,Pesanan,2026/10/05,2026/10/20,IDR,82227,112000,112000,200000,-88000,0,0,0,0,-29773,-6294,-3360,0,0,0,-3540,-55000,0,0,40000,15000,0,0,0,0,-3540,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-7489,0,0,0,0,0,0,0,,0,586429739903125356,128270,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586426834585749481,Green Bud Bitter Gourd – Herbal untuk Gaya Hidup Sehat & Seimbang Kadar Gula Darah Stabil Mendukung Metabolisme Tubuh Nalatiqa Herbal,Pesanan,2026/10/05,2026/10/20,IDR,85662,112000,112000,200000,-88000,0,0,0,0,-26338,-6294,-3360,0,0,0,-990,-25000,0,0,25000,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-6604,0,0,0,0,0,0,0,,0,586426834585749481,113120,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586661064454342069,Nalatiqa Bitter Gourd – Herbal untuk Gaya Hidup Sehat & Seimbang | Greenbud Herbal,Pesanan,2026/10/18,2026/10/19,IDR,0,0,112000,200000,-88000,0,-112000,-200000,88000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586661064454342069,113000,-113000,0,0,0,0,0,0,0,200,0,1737772176169862479 * 1;,TikTok Shop
586655862643787120,Nalatiqa Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami GreenBud Herbal,Pesanan,2026/10/18,2026/10/19,IDR,0,0,112000,200000,-88000,0,-112000,-200000,88000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586655862643787120,113120,-113120,0,0,0,0,0,0,0,200,0,1737772230992430415 * 1;,TikTok Shop
586595130264159248,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/15,2026/10/19,IDR,84272,112000,112000,200000,-88000,0,0,0,0,-27728,-6294,0,0,0,0,-1720,-35000,0,0,35000,0,0,0,0,0,-1720,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10624,0,0,0,0,0,0,0,,0,586595130264159248,114900,0,0,0,0,0,0,0,0,200,200,1737772511282627919 * 1;,Tokopedia
586499793155753938,"HALO SEHAT HERBAL TENGGOROKAN GEL NALATIQA UNTUK BERSIHKAN DAHAK PARU-PARU, BATUK BERDAHAK, DADA SESAK & NAPAS BERAT",Pesanan,2026/10/09,2026/10/19,IDR,46386,69000,69000,100000,-31000,0,0,0,0,-22614,-3857,0,0,0,0,-990,-20500,0,0,20500,0,0,0,0,0,-990,0,-3450,0,0,0,0,0,0,-4830,0,0,0,-1250,0,0,0,0,0,0,0,-345,0,-7892,0,0,0,0,0,0,0,,0,586499793155753938,71104,0,0,0,0,0,0,0,0,100,100,1737828436956841295 * 1;,TikTok Shop
586476017280845115,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/08,2026/10/19,IDR,81806,112000,112000,200000,-88000,0,0,0,0,-30194,-6294,-3360,0,0,0,-990,-12000,0,0,12000,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10460,0,0,0,0,0,0,0,,0,586476017280845115,113120,0,0,0,0,0,0,0,0,200,200,1737772511282627919 * 1;,TikTok Shop
586460297903899997,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/07,2026/10/19,IDR,81806,112000,112000,200000,-88000,0,0,0,0,-30194,-6294,-3360,0,0,0,-990,-11000,0,0,11000,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10460,0,0,0,0,0,0,0,,0,586460297903899997,113120,0,0,0,0,0,0,0,0,200,200,1737772511282627919 * 1;,TikTok Shop
586450881036125408,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/07,2026/10/19,IDR,81806,112000,112000,200000,-88000,0,0,0,0,-30194,-6294,-3360,0,0,0,-990,-14500,0,0,14500,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10460,0,0,0,0,0,0,0,,0,586450881036125408,113120,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586437747017090361,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/06,2026/10/19,IDR,73036,112000,112000,200000,-88000,0,0,0,0,-38964,-6294,-3360,0,0,0,-1920,-15000,0,0,15000,0,0,0,0,0,-1920,0,-7840,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10460,0,0,0,0,0,0,0,,0,586437747017090361,113120,0,0,0,0,0,0,0,0,200,200,1737772511282627919 * 1;,TikTok Shop
586430528422446632,Green Bud Bitter Gourd – Herbal untuk Gaya Hidup Sehat & Seimbang Kadar Gula Darah Stabil Mendukung Metabolisme Tubuh Nalatiqa Herbal,Pesanan,2026/10/05,2026/10/19,IDR,85670,112000,112000,200000,-88000,0,0,0,0,-26330,-6294,-3360,0,0,0,-990,-14500,0,0,14500,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-6596,0,0,0,0,0,0,0,,0,586430528422446632,97970,0,0,0,15000,0,0,0,0,200,200,/,TikTok Shop
586397729002653653,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh,Pesanan,2026/10/04,2026/10/19,IDR,78972,112000,112000,200000,-88000,0,0,0,0,-33028,-9128,-3360,0,0,0,-990,-25000,0,0,25000,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10460,0,0,0,0,0,0,0,,0,586397729002653653,113120,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586391031283025453,"Expce Teh Herbal 12 Sachet, Segar Alami, Relaksasi Setiap Hari",Pesanan,2026/10/03,2026/10/19,IDR,300921,392500,392500,745000,-352500,0,0,0,0,-91579,-32381,0,0,0,0,-3540,-144500,0,0,80000,64500,0,0,0,0,-3540,0,0,0,0,0,0,0,0,-25512,0,0,0,-1250,0,0,0,0,0,0,0,-1960,0,-26936,0,0,0,0,0,0,0,,0,586391031283025453,437330,0,0,0,24000,0,0,0,0,1000,1000,1737771470188807503 * 5;,TikTok Shop
586381561397020586,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh,Pesanan,2026/10/03,2026/10/19,IDR,78042,112000,112000,200000,-88000,0,0,0,0,-33958,-9128,-3360,0,0,0,-1920,-40500,0,0,40500,0,0,0,0,0,-1920,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10460,0,0,0,0,0,0,0,,0,586381561397020586,113120,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586639241091777801,"Ex pce Teh Herbal 12 Sachet, Minuman Teh Herbal Alami, Nalatiqa Herbal",Pesanan,2026/10/17,2026/10/18,IDR,0,0,78500,149000,-70500,0,-78500,-149000,70500,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586639241091777801,81204,-81204,0,0,0,0,0,0,0,200,0,1737771653291803983 * 1;,TikTok Shop
586507327420335907,"NALATIQA TENGGOROKAN HERBAL GEL 20G UNTUK BERSIHKAN DAHAK PARU-PARU, BATUK BERDAHAK, DADA SESAK & NAPAS BERAT",Pesanan,2026/10/10,2026/10/18,IDR,49836,69000,69000,100000,-31000,0,0,0,0,-19164,-3857,0,0,0,0,-990,-7500,0,0,7500,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-4830,0,0,0,-1250,0,0,0,0,0,0,0,-345,0,-7892,0,0,0,0,0,0,0,,0,586507327420335907,71104,0,0,0,0,0,0,0,0,100,100,/,TikTok Shop
586439594181166811,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/06,2026/10/18,IDR,81798,112000,112000,200000,-88000,0,0,0,0,-30202,-6294,-3360,0,0,0,-990,-7500,0,0,7500,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10468,0,0,0,0,0,0,0,,0,586439594181166811,113221,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586408819435734968,"Expce Teh Herbal 12 Sachet, Segar Alami, Relaksasi Setiap Hari",Pesanan,2026/10/04,2026/10/18,IDR,55223,78500,78500,149000,-70500,0,0,0,0,-23277,-6476,0,0,0,0,-1420,-20000,0,0,20000,0,0,0,0,0,-1420,0,-3925,0,0,0,0,0,0,-5102,0,0,0,-1250,0,0,0,0,0,0,0,-392,0,-4712,0,0,0,0,0,0,0,,0,586408819435734968,80699,0,0,0,0,0,0,0,0,200,200,1737771470188807503 * 1;,TikTok Shop
586618127173125782,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/16,2026/10/17,IDR,0,0,112000,200000,-88000,0,-112000,-200000,88000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586618127173125782,104690,-104690,0,0,8347,-8347,0,0,0,200,0,/,TikTok Shop
586582381558531832,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/14,2026/10/17,IDR,83254,112000,112000,200000,-88000,0,0,0,0,-28746,-6294,0,0,0,0,-2830,-37000,0,0,37000,0,0,0,0,0,-2830,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10532,0,0,0,0,0,0,0,,0,586582381558531832,103900,0,0,0,10000,0,0,0,0,200,200,1737772511282627919 * 1;,Tokopedia
586408491795318051,"Expce Teh Herbal 12 Sachet, Minuman Teh Herbal Alami",Pesanan,2026/10/04,2026/10/17,IDR,52740,78500,78500,149000,-70500,0,0,0,0,-25760,-6476,0,0,0,0,-3130,-54500,0,0,40000,14500,0,0,0,0,-3130,0,-3925,0,0,0,0,0,0,-5102,0,0,0,-1250,0,0,0,0,0,0,0,-392,0,-5485,0,0,0,0,0,0,0,,0,586408491795318051,93930,0,0,0,0,0,0,0,0,200,200,1737771653291803983 * 1;,TikTok Shop
586383046952126094,"Expce Teh Herbal 12 Sachet, Segar Alami, Relaksasi Setiap Hari",Pesanan,2026/10/03,2026/10/17,IDR,109588,157000,157000,298000,-141000,0,0,0,0,-47412,-12952,0,0,0,0,-3540,-97500,0,0,70000,27500,0,0,0,0,-3540,0,-7850,0,0,0,0,0,0,-10205,0,0,0,-1250,0,0,0,0,0,0,0,-784,0,-10831,0,0,0,0,0,0,0,,0,586383046952126094,185500,0,0,0,0,0,0,0,0,400,400,/,TikTok Shop
586609886948525332,Teh Herbal 12 Sachet | Pilihan Utama Vitalitas Kesehatan | Segar Alami | COD | Nalatiqa Herbal,Pesanan,2026/10/15,2026/10/16,IDR,0,0,78500,149000,-70500,0,-78500,-149000,70500,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586609886948525332,80699,-80699,0,0,0,0,0,0,0,200,0,1737771546187564367 * 1;,TikTok Shop
586423892881082324,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/05,2026/10/16,IDR,81806,112000,112000,200000,-88000,0,0,0,0,-30194,-6294,-3360,0,0,0,-990,-25000,0,0,25000,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10460,0,0,0,0,0,0,0,,0,586423892881082324,113120,0,0,0,0,0,0,0,0,200,200,1737772511282627919 * 1;,TikTok Shop
586579656214021360,Nalatiqa HALO SEHAT TENGGOROKAN HERBAL GEL 20G untuk Meredakan Batuk & Membersihkan Dahak Paru-Paru dengan Formula Herbal Alami dan Absorpsi Cepat,Pesanan,2026/10/14,2026/10/15,IDR,0,0,69000,100000,-31000,0,-69000,-100000,31000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586579656214021360,71104,-71104,0,0,0,0,0,0,0,100,0,1737893571392079183 * 1;,TikTok Shop
586552492571985437,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/12,2026/10/15,IDR,81651,112000,112000,200000,-88000,0,0,0,0,-30349,-6294,-3360,0,0,0,-990,-11500,0,0,11500,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10615,0,0,0,0,0,0,0,,0,586552492571985437,114800,0,0,0,0,0,0,0,0,200,200,1737772511282627919 * 1;,Tokopedia
586391594720068955,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh,Pesanan,2026/10/03,2026/10/15,IDR,79076,112000,112000,200000,-88000,0,0,0,0,-32924,-9128,-3360,0,0,0,-990,-9500,0,0,9500,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10356,0,0,0,0,0,0,0,,0,586391594720068955,105009,0,0,0,6991,0,0,0,0,200,200,/,TikTok Shop
586389624837408302,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh,Pesanan,2026/10/03,2026/10/14,IDR,78972,112000,112000,200000,-88000,0,0,0,0,-33028,-9128,-3360,0,0,0,-990,-7500,0,0,7500,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10460,0,0,0,0,0,0,0,,0,586389624837408302,113120,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586387587686368267,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh,Pesanan,2026/10/03,2026/10/14,IDR,71432,112000,112000,200000,-88000,0,0,0,0,-40568,-9128,-3360,0,0,0,-690,-7500,0,0,7500,0,0,0,0,0,-690,0,-7840,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-10460,0,0,0,0,0,0,0,,0,586387587686368267,113120,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586545457777575546,Nalatiqa Spiny Bitter Gourd Capsule Plus – Herbal untuk Gaya Hidup Sehat & Seimbang | Pelancar Gula Darah | Nalatiqa Herbal,Pesanan,2026/10/12,2026/10/13,IDR,0,0,112000,200000,-88000,0,-112000,-200000,88000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586545457777575546,106050,-106050,0,0,7000,-7000,0,0,0,200,0,1737894646785606991 * 1;,TikTok Shop
586368050335942051,Green Bud Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami,Pesanan,2026/10/02,2026/10/13,IDR,88987,112000,112000,200000,-88000,0,0,0,0,-23013,-9128,0,0,0,0,-990,-14500,0,0,14500,0,0,0,0,0,-990,0,0,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-3805,0,0,0,0,0,0,0,,0,586368050335942051,113120,0,0,0,0,0,0,0,0,200,200,1737772230992430415 * 1;,TikTok Shop
586363652781933774,Ginklin 100% Original Herbal Solusi Alami Melancarkan Saluran Kemih Batu Ginjal,Pesanan,2026/10/02,2026/10/13,IDR,142955,175000,175000,245000,-70000,0,0,0,0,-32045,-16625,0,0,0,0,-1920,-14500,0,0,0,14500,0,0,0,0,-1920,0,0,0,0,0,0,0,0,-11375,0,0,0,-1250,0,0,0,0,0,0,0,-875,0,0,0,0,0,0,0,0,0,,0,586363652781933774,191496,0,0,0,0,0,0,0,0,200,200,/,TikTok Shop
586387187570804116,Green Bud Bitter Gourd – Herbal untuk Gaya Hidup Sehat & Seimbang,Pesanan,2026/10/03,2026/10/12,IDR,75330,112000,112000,200000,-88000,0,0,0,0,-36670,-9128,-3360,0,0,0,-990,-7500,0,0,7500,0,0,0,0,0,-990,0,-7500,0,0,0,0,0,0,-7280,0,0,0,-1250,0,0,0,0,0,0,0,-560,0,-6602,0,0,0,0,0,0,0,,0,586387187570804116,108215,0,0,0,4856,0,0,0,0,200,200,/,TikTok Shop
586384246041183813,"Expce Teh Herbal 12 Sachet, Segar Alami, Relaksasi Setiap Hari",Pesanan,2026/10/03,2026/10/12,IDR,59961,78500,78500,149000,-70500,0,0,0,0,-18539,-6476,0,0,0,0,-690,-7500,0,0,7500,0,0,0,0,0,-690,0,0,0,0,0,0,0,0,-5102,0,0,0,-1250,0,0,0,0,0,0,0,-392,0,-4629,0,0,0,0,0,0,0,,0,586384246041183813,79285,0,0,0,0,0,0,0,0,200,200,1737771470188807503 * 1;,TikTok Shop
586521037940229871,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/10,2026/10/11,IDR,0,0,112000,200000,-88000,0,-112000,-200000,88000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586521037940229871,87870,-87870,0,0,25000,-25000,0,0,0,200,0,1737772511282627919 * 1;,TikTok Shop
586516813747488092,"HALO SEHAT HERBAL TENGGOROKAN GEL NALATIQA UNTUK BERSIHKAN DAHAK PARU-PARU, BATUK BERDAHAK, DADA SESAK & NAPAS BERAT",Pesanan,2026/10/10,2026/10/11,IDR,0,0,69000,100000,-31000,0,-69000,-100000,31000,0,0,0,0,0,0,0,0,0,0,0,13500,-13500,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586516813747488092,83325,-83325,0,0,0,0,0,0,0,100,0,1737828436956841295 * 1;,TikTok Shop
586516056610866375,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/10,2026/10/11,IDR,0,0,112000,200000,-88000,0,-112000,-200000,88000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586516056610866375,113120,-113120,0,0,0,0,0,0,0,200,0,/,TikTok Shop
586512314669106613,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/10,2026/10/11,IDR,0,0,112000,200000,-88000,0,-112000,-200000,88000,0,0,0,0,0,0,0,0,0,0,0,21000,-21000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586512314669106613,134431,-134431,0,0,0,0,0,0,0,200,0,/,TikTok Shop
586508142064600101,Nalatiqa Spiny Bitter Gourd Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami | Best Seller,Pesanan,2026/10/10,2026/10/11,IDR,0,0,112000,200000,-88000,0,-112000,-200000,88000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586508142064600101,113120,-113120,0,0,0,0,0,0,0,200,0,/,TikTok Shop
586506724861118139,"HALO SEHAT HERBAL TENGGOROKAN GEL NALATIQA UNTUK BERSIHKAN DAHAK PARU-PARU, BATUK BERDAHAK, DADA SESAK & NAPAS BERAT",Pesanan,2026/10/10,2026/10/11,IDR,0,0,69000,100000,-31000,0,-69000,-100000,31000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586506724861118139,71104,-71104,0,0,0,0,0,0,0,100,0,/,TikTok Shop
586494252124898520,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/09,2026/10/10,IDR,0,0,112000,200000,-88000,0,-112000,-200000,88000,0,0,0,0,0,0,0,0,0,0,0,7500,-7500,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586494252124898520,120695,-120695,0,0,0,0,0,0,0,200,0,1737772511282627919 * 1;,TikTok Shop
586450602915431838,Green Bud Spiny Bitter Gourd Capsule Plus 45 Kapsul Herbal Alami Bantu Menjaga & Kontrol Gula Darah Secara Alami Pelancar Metabolisme Tubuh Nalatiqa herbal,Pesanan,2026/10/07,2026/10/08,IDR,0,0,112000,200000,-88000,0,-112000,-200000,88000,0,0,0,0,0,0,0,0,0,0,0,9000,-9000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586450602915431838,122210,-122210,0,0,0,0,0,0,0,200,0,1737772511282627919 * 1;,TikTok Shop
586426642405885929,Green Bud Bitter Gourd – Herbal untuk Gaya Hidup Sehat & Seimbang Kadar Gula Darah Stabil Mendukung Metabolisme Tubuh Nalatiqa Herbal,Pesanan,2026/10/05,2026/10/06,IDR,0,0,112000,200000,-88000,0,-112000,-200000,88000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586426642405885929,113120,-113120,0,0,0,0,0,0,0,200,0,1737772488388805967 * 1;,TikTok Shop
586419812748788769,Green Bud Kapsul Herbal Bantu Menjaga & Kontrol Gula Darah Secara Alami,Pesanan,2026/10/05,2026/10/06,IDR,0,0,112000,200000,-88000,0,-112000,-200000,88000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586419812748788769,113120,-113120,0,0,0,0,0,0,0,200,0,1737772230992430415 * 1;,TikTok Shop
586262849648428292,"Yyanst Feminine Wash dengan Minyak Bunga Matahari, Formula Amerika 150ml – Perawatan Intim dengan pH Seimbang untuk Kesegaran, Kebersihan & Kekencangan, Formula Lembut & Menenangkan untuk Penggunaan Sehari-hari Mengencangkan Wanita Wangi - 1 Botol",Pesanan,2026/09/26,2026/09/30,IDR,0,0,65000,120000,-55000,0,-65000,-120000,55000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,,0,586262849648428292,62014,-62014,0,0,5000,-5000,0,0,0,150,0,1737429837674808655 * 1;,TikTok Shop
,,,,,
,Periode,,,,2026/09/01-2026/10/25
,Zona waktu,,,,UTC+7
,Mata uang,,,,IDR
,,,,,
,Jumlah penyelesaian pembayaran,,,,8127325
,,Total Pendapatan,,,11375500
,,,Subtotal setelah diskon penjual,,14795500
,,,,Subtotal sebelum diskon,25850000
,,,,Diskon penjual,-11054500
,,,,Biaya produk sesuai jarak dari Program Horison+,0
,,,Total pengembalian dana setelah diskon,,-3420000
,,,,Total pengembalian dana sebelum diskon,-5968000
,,,,Pengembalian dana diskon penjual,2548000
,,Total Biaya,,,-3248175
,,,Biaya komisi platform,,-695862
,,,Biaya layanan pre-order,,-204960
,,,Biaya layanan Mall,,0
,,,Biaya Pembayaran,,0
,,,Credit card installment - Handling fee,,0
,,,Ongkir,,-167130
,,,,Ongkir yang ditalangi penyedia jasa logistik,-2589000
,,,,Ongkir penggantian (ditanggung pembeli),0
,,,,Ongkir penukaran (ditanggung pembeli),0
,,,,Ongkir yang ditanggung platform,2095000
,,,,Ongkir yang ditanggung pembeli,676500
,,,,Pengembalian ongkir yang dibayar pembeli,-182500
,,,,Ongkir pengembalian barang (yang ditanggung pembeli),0
,,,,Subsidi ongkir,0
,,,,Biaya pengiriman sesuai jarak dari Program Horison+,0
,,,,Biaya layanan logistik,-167130
,,,,Penggantian biaya asuransi,0
,,,Komisi Afiliasi,,-293973
,,,Komisi mitra afiliasi,,0
,,,Komisi Iklan Toko afiliasi,,0
,,,Deposit komisi afiliasi,,0
,,,Pengembalian dana komisi afiliasi,,0
,,,Komisi iklan toko Mitra Afiliasi,,0
,,,Biaya layanan Program Bebas Ongkir,,0
,,,Komisi dinamis,,-746172
,,,Biaya layanan Program Growth Xtra,,0
,,,Biaya layanan Khusus LIVE,,0
,,,Biaya layanan Growth Xtra Program Super,,0
,,,Biaya pemrosesan pesanan,,-130000
,,,Biaya layanan Program EAMS,,0
,,,Biaya layanan Brands Crazy Deal/Flash Sale,,0
,,,Biaya Dilayani Tokopedia,,0
,,,,Biaya penanganan Dilayani Tokopedia,0
,,,Biaya program PayLater,,0
,,,Biaya sumber daya campaign,,0
,,,Biaya layanan penginstalan,,0
,,,PPh Pasal 22 dipungut,,-56869
,,,Biaya layanan khusus platform,,0
,,,Biaya iklan GMV Max,,-953209
,,,Voucher GMV Max,,0
,,,Pajak penjualan atas voucher GMV Max,,0
,,,Program layanan terkelola (Pajak penjualan),,0
,,,Program layanan terkelola (Biaya per pesanan),,0
,,,Ongkir pesanan gagal kirim,,0
,,,Ongkir pengembalian barang karena kesalahan pembeli,,0
,,,Biaya asuransi,,0
,,Penyesuaian,,,0
,,,Penyesuaian ongkir,,0
,,,Kompensasi Ongkir,,0
,,,Chargeback,,0
,,,Kompensasi kepada pembeli,,0
,,,Penyesuaian Promosi,,0
,,,Kompensasi Platform,,0
,,,Penalti Platform,,0
,,,Biaya pengiriman sampel,,0
,,,Penggantian Biaya Logistik,,0
,,,Subsidi kepuasan,,0
,,,Potongan dana ditanggung penjual,,0
,,,Potongan biaya pengiriman,,0
,,,Biaya layanan gudang,,0
,,,Penyesuaian komisi platform,,0
,,,Kompensasi komisi platform,,0
,,,Penyesuaian biaya transaksi,,0
,,,Restitusi pajak,,0
,,,Biaya paket manfaat pemasaran,,0
,,,Biaya paket keuntungan pemasaran tambahan,,0
,,,Pembayaran GMV untuk Promosi,,0
,,,Pembayaran GMV untuk Iklan TikTok,,0
,,,Kompensasi biaya sumber daya campaign,,0
,,,Kompensasi asuransi pengiriman,,0
,,,Penyesuaian Lainnya,,0
,,,Pengembalian PPh Pasal 22 yang dipotong,,0
Jenis transaksi,ID referensi,Waktu permintaan,Total,Status,Waktu keberhasilan,Rekening bank
Withdrawal,3741848476141847887,2026/10/25,-3000000,Transferred,2026/10/25,********6499
Earnings,3740751758690387279,2026/10/25,711189,Transferred,2026/10/25,/
Earnings,3739106645043610959,2026/10/24,1045919,Transferred,2026/10/24,/
Earnings,3737470295980082511,2026/10/23,1423672,Transferred,2026/10/23,/
Withdrawal,3736927819677402447,2026/10/22,-2761219,Transferred,2026/10/22,********6499
Earnings,3736473998167868751,2026/10/22,1137897,Transferred,2026/10/22,/
Earnings,3735146849400358223,2026/10/21,742645,Transferred,2026/10/21,/
Earnings,3734154204958852431,2026/10/20,880677,Transferred,2026/10/20,/
Withdrawal,3733297895795164495,2026/10/19,-1667689,Transferred,2026/10/19,********6499
Earnings,3733067411425232207,2026/10/19,992717,Transferred,2026/10/19,/
Earnings,3732035381983413583,2026/10/18,186857,Transferred,2026/10/18,/
Earnings,3731097826915288399,2026/10/17,245582,Transferred,2026/10/17,/
Earnings,3730072126559978831,2026/10/16,81806,Transferred,2026/10/16,/
Earnings,3729006133595047247,2026/10/15,160727,Transferred,2026/10/15,/
Withdrawal,3728024670491477327,2026/10/14,-517637,Transferred,2026/10/14,********6499
Earnings,3727896129646396751,2026/10/14,150404,Transferred,2026/10/14,/
Earnings,3726722912306300239,2026/10/13,231942,Transferred,2026/10/13,/
Earnings,3725442020366648655,2026/10/12,135291,Transferred,2026/10/12,/
Penjelasan tentang biaya,
Nama,Penjelasan
ID Pesanan/Penyesuaian,ID transaksi
Jenis transaksi,Jenis pesanan/penyesuaian.
Waktu pemesanan,Waktu saat pembeli membuat pesanan ini.
Waktu pembayaran pesanan,Waktu saat bayaran pesanan ini masuk ke saldo akun Anda.
Mata uang,IDR
Jumlah penyelesaian pembayaran,"Total nominal setelah jumlah penjualan bersih, biaya, dan penyesuaian."
Subtotal setelah diskon penjual,Subtotal setelah diskon penjual adalah harga setelah dikurangi diskon penjual
Subtotal sebelum diskon,Subtotal sebelum diskon adalah total harga sebelum dikurangi diskon penjual dan TikTok Shop
Diskon penjual,"Diskon penjual adalah promosi yang biayanya ditanggung oleh penjual, seperti voucher atau diskon produk"
Biaya produk sesuai jarak dari Program Horison+,"Biaya sesuai jarak untuk produk yang dibayar pembeli. Dengan pengaturan Program Horison+ Anda saat ini, biaya ini termasuk dalam harga produk untuk pesanan yang dikirim ke luar pulau Jawa."
Total pengembalian dana setelah diskon,Subtotal SKU yang dikembalikan dananya setelah diskon penjual
Total pengembalian dana sebelum diskon,Subtotal SKU yang dikembalikan dananya sebelum diskon penjual
Pengembalian dana diskon penjual,Diskon yang dikembalikan kepada penjual
Biaya komisi platform,
Biaya layanan pre-order,
Biaya layanan Mall,"Biaya layanan Mall dikenakan demi memastikan pesanan Mall bisa dipenuhi dengan baik. Biaya ini dihitung berdasarkan harga produk setelah dipotong diskon penjual x persentase berdasarkan kategori, atau maks. Rp50.000. "
Biaya Pembayaran,"Merupakan biaya yang dikenakan ketika pembeli melakukan pembayaran, pengembalian dana, penyesuaian tarif, dll.
Cara hitung =  (Pembayaran pembeli - pengembalian dana) * tarif %"
Credit card installment - Handling fee,
Ongkir,Ongkir bersih yang ditanggung penjual ketika ada perbedaan berat atau penjual telah memberikan diskon ongkir kepada pembeli.
Ongkir yang ditalangi penyedia jasa logistik,Ongkir yang diteruskan ke penyedia jasa logistik dihitung berdasarkan berat/dimensi yang diukur oleh mereka.
Ongkir penggantian (ditanggung pembeli),Ongkir yang ditanggung pembeli untuk pengantaran produk pengganti.
Ongkir penukaran (ditanggung pembeli),Ongkir yang ditanggung pembeli untuk pengantaran produk yang ditukar.
Ongkir yang ditanggung platform,Insentif ongkir yang disediakan oleh platform
Ongkir yang ditanggung pembeli,Ongkir yang ditanggung pembeli dihitung berdasarkan berat produk yang Anda unggah.
Pengembalian ongkir yang dibayar pembeli,Jumlah ongkir yang awalnya dibayar oleh pembeli dan telah dikembalikan.
Ongkir pengembalian barang (yang ditanggung pembeli),Ongkir yang dibebankan kepada pembeli untuk pengembalian barang
Subsidi ongkir,Jumlah positif menunjukkan subsidi ongkir yang telah Anda terima dan jumlah negatif menunjukkan subsidi ongkir yang mesti Anda kembalikan.
Biaya pengiriman sesuai jarak dari Program Horison+,"Biaya sesuai jarak untuk pengiriman yang dibayar pembeli. Dengan pengaturan Program Horison+ Anda saat ini, biaya ini termasuk dalam harga produk untuk pesanan yang dikirim ke luar pulau Jawa."
Biaya layanan logistik,Biaya logistik berdasarkan berat paket dan rute pengiriman. 
Penggantian biaya asuransi,Pembayaran dari penyedia layanan asuransi untuk membayar ongkir
Komisi Afiliasi,"Komisi afiliasi = (Harga produk sebelum pajak − Diskon penjual) × Persentase komisi. Jika pembeli menerima pengembalian dana setelah pembayaran pesanan diselesaikan, komisi afiliasi yang sudah dibayarkan tidak akan dikembalikan. "
Komisi mitra afiliasi,(Harga produk (di luar pajak) − Diskon penjual) * Persentase komisi mitra afiliasi. Komisi mitra afiliasi tidak bisa dikembalikan jika ada pengembalian dana setelah penyelesaian pembayaran pesanan.
Komisi Iklan Toko afiliasi,(Harga produk (di luar pajak) − Diskon penjual) * Persentase komisi iklan. Komisi Iklan Toko afiliasi tidak bisa dikembalikan jika ada pengembalian dana setelah penyelesaian pembayaran pesanan.
Deposit komisi afiliasi,Jumlah yang dialokasikan untuk komisi kreator setelah pesanan dibayar. Hanya berlaku atas komisi berdasarkan volume pesanan dan persentase penghasilan tertinggi.
Pengembalian dana komisi afiliasi,Deposit komisi yang dikembalikan kepada Anda setelah pesanan dibayar. Hanya berlaku atas komisi berdasarkan volume pesanan.
Komisi iklan toko Mitra Afiliasi,"Biaya komisi iklan yang dibayarkan penjual kepada
Mitra Afiliasi TikTok Shop (TAP)."
Biaya layanan Program Bebas Ongkir,"Mengingat partisipasi Anda dalam program dan manfaatnya, kami mengenakan biaya layanan sesuai dengan "
Komisi dinamis,Biaya komisi dinamis adalah biaya yang dibebankan platform kepada penjual untuk semua pesanan yang terkirim. 
Biaya layanan Program Growth Xtra,Biaya layanan untuk penjual yang mengikuti Program Growth Xtra dan menerima keuntungan program. 
Biaya layanan Khusus LIVE,Ada biaya layanan terkait jika Anda mengikuti program Khusus LIVE.
Biaya layanan Growth Xtra Program Super,Biaya layanan tambahan akan dikenakan setelah upgrade ke Super Program Growth Xtra untuk menikmati keuntungan eksklusif.
Biaya pemrosesan pesanan,"Biaya yang dikenakan pada tiap transaksi di platform untuk membiayai kegiatan operasional, seperti pemrosesan dan pemenuhan pesanan. "
Biaya layanan Program EAMS,"Biaya layanan untuk mengikuti Program Solusi Marketing Afiliasi Eksternal, sebagaimana yang dijelaskan selama pendaftaran."
Biaya layanan Brands Crazy Deal/Flash Sale,Biaya yang dikenakan kepada penjual yang mengikuti campaign Brands Crazy Deal/Flash Sale.
Biaya Dilayani Tokopedia,Biaya Dilayani Tokopedia
Biaya penanganan Dilayani Tokopedia,Biaya penanganan yang dikenakan ke penjual untuk pesanan Dilayani Tokopedia
Biaya program PayLater,Biaya yang dikenakan kepada penjual untuk mengikuti program PayLater.
Biaya sumber daya campaign,Total biaya sumber daya campaign dari program yang diikuti penjual.
Biaya layanan penginstalan,Biaya yang dikenakan TikTok Shop untuk penggunaan layanan penginstalan platform.
PPh Pasal 22 dipungut,PPh Pasal 22 dipungut oleh platform berdasarkan PMK 37/2025. 
Biaya layanan khusus platform,"Sebagian dari Biaya Pengiriman Jarak Jauh yang dibayarkan oleh pembeli yang melebihi biaya yang dikenakan oleh penyedia layanan logistik, disimpan oleh TikTok Shop untuk mendukung pengalaman pemenuhan pesanan yang aman."
Biaya iklan GMV Max,Penghitungan biaya iklan untuk tiap pesanan adalah: (Total pembayaran + Diskon platform untuk produk) ÷ ROI iklan × (1 + tarif pajak). 
Voucher GMV Max,Biaya voucher GMV Max.
Pajak penjualan atas voucher GMV Max,Pajak penjualan yang dikenakan pada biaya voucher GMV Max.
Program layanan terkelola (Pajak penjualan),Nominal ini dipungut atas nama pemerintah.
Program layanan terkelola (Biaya per pesanan),Dihitung sebagai persentase dari (harga asli - diskon penjual + ongkir yang dibayar pembeli).
Ongkir pesanan gagal kirim,"Ongkir untuk pesanan yang gagal dikirimkan kepada pembeli. Namun, penjual dan platform mungkin menanggung bersama ongkir tersebut dalam kasus tertentu."
Ongkir pengembalian barang karena kesalahan pembeli,"Ongkir untuk pengembalian barang karena kesalahan pembeli. Namun, penjual dan platform mungkin menanggung bersama ongkir tersebut dalam kasus tertentu."
Biaya asuransi,Premi yang dikenakan per pesanan untuk pertanggungan
Jumlah penyesuaian,Jumlah penyesuaian.
ID pesanan terkait,"Pesanan yang terkait dengan penyesuaian, jika ada."
Berbagai jenis penyesuaian,Penjelasan
Penyesuaian ongkir,Penyesuaian Biaya Pengiriman: Penyesuaian karena perbedaan antara biaya pengiriman aktual dan biaya pengiriman prabayar
Kompensasi Ongkir,Kompensasi bagi penjual karena ada selisih antara ongkir sebenarnya dan ongkir yang sudah dibayar
Chargeback,Chargeback: Jumlah yang dikembalikan ke kartu pembayaran setelah pengajuan sengketa oleh pembeli atas suatu produk di rekening koran atau laporan transaksi mereka disetujui.
Kompensasi kepada pembeli,Kompensasi kepada pembeli: Jumlah pengembalian dana setelah pesanan dibayarkan atau jumlah pengembalian dana tambahan yang dibayarkan kepada pembeli.
Penyesuaian Promosi,Penyesuaian Promosi: Jumlah yang ditanggung penjual dalam kegiatan pemasaran
Kompensasi Platform,Kompensasi yang diberikan kepada Penjual atas disetujuinya pengajuan selisih/sengketa
Penalti Platform,Anda di denda karena toko Anda terindikasi melakukan pelanggaran terhadap ketentuan Platform. Untuk informasi lebih lanjut silakan cek notifikasi yang dikirimkan ke email Anda.
Biaya pengiriman sampel,Biaya ini dikenakan untuk pengiriman sampel menggunakan penyedia jasa logistik platform.
Penggantian Biaya Logistik,Pengembalian dana yang dibayarkan oleh TikTok Shop atas kerugian dikarenakan masalah logistik.
Subsidi kepuasan,Subsidi dari TikTok Shop karena ketidakpuasan terhadap platform.
Potongan dana ditanggung penjual,"Jika ketidaknyamanan pembeli terjadi karena kesalahan Anda, biaya kerugian yang dialami pembeli menjadi tanggung jawab Anda."
Potongan biaya pengiriman,Potongan biaya pengiriman karena mengikuti aktivitas di platform
Biaya layanan gudang,"Biaya tersebut dikenakan untuk penyediaan layanan gudang, seperti pengemasan, bahan kemasan, menempelkan barcode, menginspeksi produk baru, dsb."
Penyesuaian komisi platform,Penyesuaian saat ada selisih pada komisi platform yang dibayarkan oleh penjual.
Kompensasi komisi platform,Kompensasi bagi penjual jika ada selisih pada komisi platform yang dibayarkan oleh penjual
Penyesuaian biaya transaksi,Selisih antara biaya transaksi yang wajib dibayar penjual dan nominal yang dibayar penjual.
Restitusi pajak,Jumlah restitusi pajak setelah verifikasi dan penerimaan formulir 2307 dari penjual dalam bentuk salinan fisik dan digital.
Biaya paket manfaat pemasaran,Biaya yang dikenakan saat penjual mengikuti campaign.
Biaya paket keuntungan pemasaran tambahan,"Biaya tambahan yang dikenakan 21 hari setelah campaign berakhir, berdasarkan GMV yang didapat selama campaign."
Pembayaran GMV untuk Promosi,Jumlah penyelesaian pembayaran digunakan untuk membayar Promosi
Pembayaran GMV untuk Iklan TikTok,"Saat penjual mengaktifkan ""Bayar iklan dengan GMV"", penghasilan toko akan digunakan untuk membayar biaya iklan."
Kompensasi biaya sumber daya campaign,Total kompensasi biaya sumber daya campaign dari program yang diikuti penjual.
Kompensasi asuransi pengiriman,"Kompensasi yang dibayarkan untuk klaim Anda atas paket yang hilang atau rusak, mencakup harga produk atau ongkir pengembalian/penukaran barang."
Penyesuaian Lainnya,Penyesuaian Lainnya: Penyesuaian karena kondisi lain
Pengembalian PPh Pasal 22 yang dipotong,"Pengembalian PPh Pasal 22 yang dipotong platform pada 1–6 Agustus 2026. Karena penerapan PMK 37/2025 ditunda hingga 1 November 2026, seluruh PPh yang dipotong selama periode tersebut telah dikembalikan kepada Anda."
Informasi pendukung tambahan,Penjelasan
Pembayaran oleh pembeli,Total biaya yang dibayar oleh pembeli. Pembayaran oleh pembeli = Subtotal setelah diskon penjual - Diskon platform + Ongkir pembeli 
Pengembalian dana pembeli,Nominal yang dikembalikan kepada pembeli.
Diskon voucher yang ditanggung penjual,Porsi voucher diskon yang ditanggung bersama dari penjual selama mereka mengikuti campaign yang ditanggung bersama.
Pengembalian dana diskon voucher yang ditanggung penjual,Jumlah diskon yang dananya dikembalikan kepada penjual sekaligus berasal dari porsi voucher yang ditanggung bersama dari penjual selama mereka mengikuti campaign yang ditanggung bersama.
Diskon platform,"Jumlah diskon yang ditanggung platform (TikTok Shop). Ini termasuk:

i) Diskon yang ditanggung platform melalui Subsidi Langsung Platform, Flash Deal Platform, Beli Banyak Lebih Hemat Platform, dan Voucher Platform.

ii) Porsi voucher diskon yang ditanggung bersama dari platform selama campaign yang ditanggung bersama."
Pengembalian dana diskon platform,"Jumlah diskon yang dikembalikan dananya kepada platform. Ini termasuk:

i) Diskon yang ditanggung platform melalui Subsidi Langsung Platform, Flash Deal Platform, Beli Banyak Lebih Hemat Platform, dan Voucher Platform.

ii) Porsi voucher diskon yang ditanggung bersama dari platform selama campaign yang ditanggung bersama."
Diskon voucher yang ditanggung platform,Porsi voucher diskon yang ditanggung bersama dari platform selama campaign yang ditanggung bersama.
Pengembalian dana diskon voucher yang ditanggung platform,Jumlah diskon yang dananya dikembalikan kepada platform sekaligus berasal dari porsi voucher yang ditanggung bersama dari platform selama campaign yang ditanggung bersama.
Diskon ongkir dari penjual,Diskon ongkir yang disediakan penjual.
Perkiraan berat paket,Berat produk yang diunggah oleh penjual.
Berat paket yang bisa dikenai biaya,Berat yang ditimbang oleh penyedia logistik platform.
`;
  parseMarketplaceCsvFile(fullContent, 'income_20261118115817(UTC+7).csv', 'tiktok', true);
}

// 1-Click Instant Test with Official Lazada Account Statement
function testImportOfficialLazada() {
  const fullContent = `Periode Laporan,Nomor Laporan,Tanggal Transaksi ,Nama Biaya,Jumlah (Termasuk Pajak),VAT Amount,Status Pelepasan Dana,Tanggal Dilepas,Komentar ,Tanggal Pesanan Dibuat,Nomor Pesanan, ID Pesanan,SKU Penjual,Lazada SKU,WHT Amount,WHT termasuk dalam jumlah,Status Pesanan,Nama Produk,Short Code
24 Oct 2026 - 24 Oct 2026,ID67XGXUHD-2026-1024,24 Oct 2026,Order Processing Fee,-1250,124,Dilepas ke Saldo Toko,25 Oct 2026,,16 Oct 2026,2788310065789557,2788310065889557,18900264676-1789629131498-0,18900264676_ID-116290099961,0,NO,Dikonfirmasi,HaloseHat Krim Pijat Kulit Gel Rinsing 20 g dan 29 g Praktis Mudah Digunakan Sensitif Sejuk Pemakaian Luar Ringkas,ID67XGXUHD
24 Oct 2026 - 24 Oct 2026,ID67XGXUHD-2026-1024,24 Oct 2026,Komisi,-4339,430,Dilepas ke Saldo Toko,25 Oct 2026,,16 Oct 2026,2788310065789557,2788310065889557,18900264676-1789629131498-0,18900264676_ID-116290099961,0,NO,Dikonfirmasi,HaloseHat Krim Pijat Kulit Gel Rinsing 20 g dan 29 g Praktis Mudah Digunakan Sensitif Sejuk Pemakaian Luar Ringkas,ID67XGXUHD
24 Oct 2026 - 24 Oct 2026,ID67XGXUHD-2026-1024,24 Oct 2026,Biaya Promosi Diskon LazKoin,-627,62,Dilepas ke Saldo Toko,25 Oct 2026,https://files.alicdn.com/tpsservice/bd43ec227c531347084ba7c41b169d07.pdf,16 Oct 2026,2788310065789557,2788310065889557,18900264676-1789629131498-0,18900264676_ID-116290099961,0,NO,Dikonfirmasi,HaloseHat Krim Pijat Kulit Gel Rinsing 20 g dan 29 g Praktis Mudah Digunakan Sensitif Sejuk Pemakaian Luar Ringkas,ID67XGXUHD
24 Oct 2026 - 24 Oct 2026,ID67XGXUHD-2026-1024,24 Oct 2026,"Biaya Transaksi

",-1029,102,Dilepas ke Saldo Toko,25 Oct 2026,,16 Oct 2026,2788310065789557,2788310065889557,18900264676-1789629131498-0,18900264676_ID-116290099961,0,NO,Dikonfirmasi,HaloseHat Krim Pijat Kulit Gel Rinsing 20 g dan 29 g Praktis Mudah Digunakan Sensitif Sejuk Pemakaian Luar Ringkas,ID67XGXUHD
24 Oct 2026 - 24 Oct 2026,ID67XGXUHD-2026-1024,24 Oct 2026,Omset Penjualan,56500,0,Dilepas ke Saldo Toko,25 Oct 2026,,16 Oct 2026,2788310065789557,2788310065889557,18900264676-1789629131498-0,18900264676_ID-116290099961,0,NO,Dikonfirmasi,HaloseHat Krim Pijat Kulit Gel Rinsing 20 g dan 29 g Praktis Mudah Digunakan Sensitif Sejuk Pemakaian Luar Ringkas,ID67XGXUHD
24 Oct 2026 - 24 Oct 2026,ID67XGXUHD-2026-1024,24 Oct 2026,Pajak Penghasilan Pasal 22,-283,0,Dilepas ke Saldo Toko,25 Oct 2026,,16 Oct 2026,2788310065789557,2788310065889557,18900264676-1789629131498-0,18900264676_ID-116290099961,0,NO,Dikonfirmasi,HaloseHat Krim Pijat Kulit Gel Rinsing 20 g dan 29 g Praktis Mudah Digunakan Sensitif Sejuk Pemakaian Luar Ringkas,ID67XGXUHD
03 Oct 2026 - 03 Oct 2026,ID67XGXUHD-2026-1003,03 Oct 2026,Order Processing Fee,-1250,124,Dilepas ke Saldo Toko,04 Oct 2026,,29 Sep 2026,2786900456200527,2786900456300527,18882053569-1786279886799-0,18882053569_ID-116283403704,0,NO,Dikonfirmasi,"Oxyelle Gel Hangat Perut Wanita untuk Nyeri Haid, Kram Menstruasi,Penghangat Perut Bawah 30g",ID67XGXUHD
03 Oct 2026 - 03 Oct 2026,ID67XGXUHD-2026-1003,03 Oct 2026,Komisi,-5184,514,Dilepas ke Saldo Toko,04 Oct 2026,,29 Sep 2026,2786900456200527,2786900456300527,18882053569-1786279886799-0,18882053569_ID-116283403704,0,NO,Dikonfirmasi,"Oxyelle Gel Hangat Perut Wanita untuk Nyeri Haid, Kram Menstruasi,Penghangat Perut Bawah 30g",ID67XGXUHD
03 Oct 2026 - 03 Oct 2026,ID67XGXUHD-2026-1003,03 Oct 2026,Biaya Promosi Diskon LazKoin,-749,74,Dilepas ke Saldo Toko,04 Oct 2026,https://files.alicdn.com/tpsservice/bd43ec227c531347084ba7c41b169d07.pdf,29 Sep 2026,2786900456200527,2786900456300527,18882053569-1786279886799-0,18882053569_ID-116283403704,0,NO,Dikonfirmasi,"Oxyelle Gel Hangat Perut Wanita untuk Nyeri Haid, Kram Menstruasi,Penghangat Perut Bawah 30g",ID67XGXUHD
03 Oct 2026 - 03 Oct 2026,ID67XGXUHD-2026-1003,03 Oct 2026,"Biaya Transaksi

",-1229,122,Dilepas ke Saldo Toko,04 Oct 2026,,29 Sep 2026,2786900456200527,2786900456300527,18882053569-1786279886799-0,18882053569_ID-116283403704,0,NO,Dikonfirmasi,"Oxyelle Gel Hangat Perut Wanita untuk Nyeri Haid, Kram Menstruasi,Penghangat Perut Bawah 30g",ID67XGXUHD
03 Oct 2026 - 03 Oct 2026,ID67XGXUHD-2026-1003,03 Oct 2026,Omset Penjualan,67500,0,Dilepas ke Saldo Toko,04 Oct 2026,,29 Sep 2026,2786900456200527,2786900456300527,18882053569-1786279886799-0,18882053569_ID-116283403704,0,NO,Dikonfirmasi,"Oxyelle Gel Hangat Perut Wanita untuk Nyeri Haid, Kram Menstruasi,Penghangat Perut Bawah 30g",ID67XGXUHD
02 Oct 2026 - 02 Oct 2026,ID67XGXUHD-2026-1002,02 Oct 2026,Order Processing Fee,-625,62,Dilepas ke Saldo Toko,03 Oct 2026,,28 Sep 2026,2786796682551556,2786796682751556,18900264676-1789629131498-0,18900264676_ID-116290099961,0,NO,Dikonfirmasi,HaloseHat Krim Pijat Kulit Gel Rinsing 20 g dan 29 g Praktis Mudah Digunakan Sensitif Sejuk Pemakaian Luar Ringkas,ID67XGXUHD
02 Oct 2026 - 02 Oct 2026,ID67XGXUHD-2026-1002,02 Oct 2026,Komisi,-4339,430,Dilepas ke Saldo Toko,03 Oct 2026,,28 Sep 2026,2786796682551556,2786796682751556,18900264676-1789629131498-0,18900264676_ID-116290099961,0,NO,Dikonfirmasi,HaloseHat Krim Pijat Kulit Gel Rinsing 20 g dan 29 g Praktis Mudah Digunakan Sensitif Sejuk Pemakaian Luar Ringkas,ID67XGXUHD
02 Oct 2026 - 02 Oct 2026,ID67XGXUHD-2026-1002,02 Oct 2026,Biaya Promosi Diskon LazKoin,-627,62,Dilepas ke Saldo Toko,03 Oct 2026,https://files.alicdn.com/tpsservice/bd43ec227c531347084ba7c41b169d07.pdf,28 Sep 2026,2786796682551556,2786796682751556,18900264676-1789629131498-0,18900264676_ID-116290099961,0,NO,Dikonfirmasi,HaloseHat Krim Pijat Kulit Gel Rinsing 20 g dan 29 g Praktis Mudah Digunakan Sensitif Sejuk Pemakaian Luar Ringkas,ID67XGXUHD
02 Oct 2026 - 02 Oct 2026,ID67XGXUHD-2026-1002,02 Oct 2026,"Biaya Transaksi

",-1029,102,Dilepas ke Saldo Toko,03 Oct 2026,,28 Sep 2026,2786796682551556,2786796682751556,18900264676-1789629131498-0,18900264676_ID-116290099961,0,NO,Dikonfirmasi,HaloseHat Krim Pijat Kulit Gel Rinsing 20 g dan 29 g Praktis Mudah Digunakan Sensitif Sejuk Pemakaian Luar Ringkas,ID67XGXUHD
02 Oct 2026 - 02 Oct 2026,ID67XGXUHD-2026-1002,02 Oct 2026,Omset Penjualan,56500,0,Dilepas ke Saldo Toko,03 Oct 2026,,28 Sep 2026,2786796682551556,2786796682751556,18900264676-1789629131498-0,18900264676_ID-116290099961,0,NO,Dikonfirmasi,HaloseHat Krim Pijat Kulit Gel Rinsing 20 g dan 29 g Praktis Mudah Digunakan Sensitif Sejuk Pemakaian Luar Ringkas,ID67XGXUHD
02 Oct 2026 - 02 Oct 2026,ID67XGXUHD-2026-1002,02 Oct 2026,Order Processing Fee,-625,62,Dilepas ke Saldo Toko,03 Oct 2026,,28 Sep 2026,2786796682551556,2786796682651556,18900264676-1789629131498-0,18900264676_ID-116290099961,0,NO,Dikonfirmasi,HaloseHat Krim Pijat Kulit Gel Rinsing 20 g dan 29 g Praktis Mudah Digunakan Sensitif Sejuk Pemakaian Luar Ringkas,ID67XGXUHD
02 Oct 2026 - 02 Oct 2026,ID67XGXUHD-2026-1002,02 Oct 2026,Komisi,-4339,430,Dilepas ke Saldo Toko,03 Oct 2026,,28 Sep 2026,2786796682551556,2786796682651556,18900264676-1789629131498-0,18900264676_ID-116290099961,0,NO,Dikonfirmasi,HaloseHat Krim Pijat Kulit Gel Rinsing 20 g dan 29 g Praktis Mudah Digunakan Sensitif Sejuk Pemakaian Luar Ringkas,ID67XGXUHD
02 Oct 2026 - 02 Oct 2026,ID67XGXUHD-2026-1002,02 Oct 2026,Biaya Promosi Diskon LazKoin,-627,62,Dilepas ke Saldo Toko,03 Oct 2026,https://files.alicdn.com/tpsservice/bd43ec227c531347084ba7c41b169d07.pdf,28 Sep 2026,2786796682551556,2786796682651556,18900264676-1789629131498-0,18900264676_ID-116290099961,0,NO,Dikonfirmasi,HaloseHat Krim Pijat Kulit Gel Rinsing 20 g dan 29 g Praktis Mudah Digunakan Sensitif Sejuk Pemakaian Luar Ringkas,ID67XGXUHD
02 Oct 2026 - 02 Oct 2026,ID67XGXUHD-2026-1002,02 Oct 2026,"Biaya Transaksi

",-1029,102,Dilepas ke Saldo Toko,03 Oct 2026,,28 Sep 2026,2786796682551556,2786796682651556,18900264676-1789629131498-0,18900264676_ID-116290099961,0,NO,Dikonfirmasi,HaloseHat Krim Pijat Kulit Gel Rinsing 20 g dan 29 g Praktis Mudah Digunakan Sensitif Sejuk Pemakaian Luar Ringkas,ID67XGXUHD
02 Oct 2026 - 02 Oct 2026,ID67XGXUHD-2026-1002,02 Oct 2026,Omset Penjualan,56500,0,Dilepas ke Saldo Toko,03 Oct 2026,,28 Sep 2026,2786796682551556,2786796682651556,18900264676-1789629131498-0,18900264676_ID-116290099961,0,NO,Dikonfirmasi,HaloseHat Krim Pijat Kulit Gel Rinsing 20 g dan 29 g Praktis Mudah Digunakan Sensitif Sejuk Pemakaian Luar Ringkas,ID67XGXUHD
26 Sep 2026 - 26 Sep 2026,ID67XGXUHD-2026-0926,26 Sep 2026,Order Processing Fee,-1250,124,Dilepas ke Saldo Toko,27 Sep 2026,,18 Sep 2026,2785992826501489,2785992826601489,18831553370-1774683520412-0,18831553370_ID-116259921650,0,NO,Dikonfirmasi,Beauty Of Angel Glow Soap Bar  Pemutih Badan- Sabun Antioksidan Melembabkan & Cerahkan Kulit - Paket 3pcs Hemat 40gr,ID67XGXUHD
26 Sep 2026 - 26 Sep 2026,ID67XGXUHD-2026-0926,26 Sep 2026,Komisi,-2154,213,Dilepas ke Saldo Toko,27 Sep 2026,,18 Sep 2026,2785992826501489,2785992826601489,18831553370-1774683520412-0,18831553370_ID-116259921650,0,NO,Dikonfirmasi,Beauty Of Angel Glow Soap Bar  Pemutih Badan- Sabun Antioksidan Melembabkan & Cerahkan Kulit - Paket 3pcs Hemat 40gr,ID67XGXUHD
26 Sep 2026 - 26 Sep 2026,ID67XGXUHD-2026-0926,26 Sep 2026,Biaya Promosi Diskon LazKoin,-372,37,Dilepas ke Saldo Toko,27 Sep 2026,https://files.alicdn.com/tpsservice/bd43ec227c531347084ba7c41b169d07.pdf,18 Sep 2026,2785992826501489,2785992826601489,18831553370-1774683520412-0,18831553370_ID-116259921650,0,NO,Dikonfirmasi,Beauty Of Angel Glow Soap Bar  Pemutih Badan- Sabun Antioksidan Melembabkan & Cerahkan Kulit - Paket 3pcs Hemat 40gr,ID67XGXUHD
26 Sep 2026 - 26 Sep 2026,ID67XGXUHD-2026-0926,26 Sep 2026,"Biaya Transaksi

",-610,60,Dilepas ke Saldo Toko,27 Sep 2026,,18 Sep 2026,2785992826501489,2785992826601489,18831553370-1774683520412-0,18831553370_ID-116259921650,0,NO,Dikonfirmasi,Beauty Of Angel Glow Soap Bar  Pemutih Badan- Sabun Antioksidan Melembabkan & Cerahkan Kulit - Paket 3pcs Hemat 40gr,ID67XGXUHD
26 Sep 2026 - 26 Sep 2026,ID67XGXUHD-2026-0926,26 Sep 2026,Omset Penjualan,33500,0,Dilepas ke Saldo Toko,27 Sep 2026,,18 Sep 2026,2785992826501489,2785992826601489,18831553370-1774683520412-0,18831553370_ID-116259921650,0,NO,Dikonfirmasi,Beauty Of Angel Glow Soap Bar  Pemutih Badan- Sabun Antioksidan Melembabkan & Cerahkan Kulit - Paket 3pcs Hemat 40gr,ID67XGXUHD`;

  parseMarketplaceCsvFile(fullContent, 'Account_Statement_Lazada_Resmi_Oktober_2026.csv');
}

function downloadSampleLazadaCsv() {
  const content = `Periode Laporan,Nomor Laporan,Tanggal Transaksi ,Nama Biaya,Jumlah (Termasuk Pajak),VAT Amount,Status Pelepasan Dana,Tanggal Dilepas,Komentar ,Tanggal Pesanan Dibuat,Nomor Pesanan, ID Pesanan,SKU Penjual,Lazada SKU,WHT Amount,WHT termasuk dalam jumlah,Status Pesanan,Nama Produk,Short Code
24 Oct 2026 - 24 Oct 2026,ID67XGXUHD-2026-1024,24 Oct 2026,Order Processing Fee,-1250,124,Dilepas ke Saldo Toko,25 Oct 2026,,16 Oct 2026,2788310065789557,2788310065889557,18900264676-1789629131498-0,18900264676_ID-116290099961,0,NO,Dikonfirmasi,HaloseHat Krim Pijat Kulit Gel Rinsing 20 g dan 29 g Praktis Mudah Digunakan Sensitif Sejuk Pemakaian Luar Ringkas,ID67XGXUHD
24 Oct 2026 - 24 Oct 2026,ID67XGXUHD-2026-1024,24 Oct 2026,Komisi,-4339,430,Dilepas ke Saldo Toko,25 Oct 2026,,16 Oct 2026,2788310065789557,2788310065889557,18900264676-1789629131498-0,18900264676_ID-116290099961,0,NO,Dikonfirmasi,HaloseHat Krim Pijat Kulit Gel Rinsing 20 g dan 29 g Praktis Mudah Digunakan Sensitif Sejuk Pemakaian Luar Ringkas,ID67XGXUHD
24 Oct 2026 - 24 Oct 2026,ID67XGXUHD-2026-1024,24 Oct 2026,Biaya Promosi Diskon LazKoin,-627,62,Dilepas ke Saldo Toko,25 Oct 2026,https://files.alicdn.com/tpsservice/bd43ec227c531347084ba7c41b169d07.pdf,16 Oct 2026,2788310065789557,2788310065889557,18900264676-1789629131498-0,18900264676_ID-116290099961,0,NO,Dikonfirmasi,HaloseHat Krim Pijat Kulit Gel Rinsing 20 g dan 29 g Praktis Mudah Digunakan Sensitif Sejuk Pemakaian Luar Ringkas,ID67XGXUHD
24 Oct 2026 - 24 Oct 2026,ID67XGXUHD-2026-1024,24 Oct 2026,"Biaya Transaksi

",-1029,102,Dilepas ke Saldo Toko,25 Oct 2026,,16 Oct 2026,2788310065789557,2788310065889557,18900264676-1789629131498-0,18900264676_ID-116290099961,0,NO,Dikonfirmasi,HaloseHat Krim Pijat Kulit Gel Rinsing 20 g dan 29 g Praktis Mudah Digunakan Sensitif Sejuk Pemakaian Luar Ringkas,ID67XGXUHD
24 Oct 2026 - 24 Oct 2026,ID67XGXUHD-2026-1024,24 Oct 2026,Omset Penjualan,56500,0,Dilepas ke Saldo Toko,25 Oct 2026,,16 Oct 2026,2788310065789557,2788310065889557,18900264676-1789629131498-0,18900264676_ID-116290099961,0,NO,Dikonfirmasi,HaloseHat Krim Pijat Kulit Gel Rinsing 20 g dan 29 g Praktis Mudah Digunakan Sensitif Sejuk Pemakaian Luar Ringkas,ID67XGXUHD
24 Oct 2026 - 24 Oct 2026,ID67XGXUHD-2026-1024,24 Oct 2026,Pajak Penghasilan Pasal 22,-283,0,Dilepas ke Saldo Toko,25 Oct 2026,,16 Oct 2026,2788310065789557,2788310065889557,18900264676-1789629131498-0,18900264676_ID-116290099961,0,NO,Dikonfirmasi,HaloseHat Krim Pijat Kulit Gel Rinsing 20 g dan 29 g Praktis Mudah Digunakan Sensitif Sejuk Pemakaian Luar Ringkas,ID67XGXUHD`;

  downloadCsvFile(content, 'Contoh_Laporan_Lazada_Account_Statement_Resmi.csv');
}

function downloadCsvFile(content, filename) {
  const blob = new Blob(["\ufeff" + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Products View
function renderProducts() {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;

  const store = db.getStore();
  let list = store.products || [];

  if (currentStoreFilter !== 'all') {
    list = list.filter(p => !p.storeId || p.storeId === 'all' || p.storeId === currentStoreFilter);
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-muted);">Belum ada produk terdaftar untuk filter ini</td></tr>`;
    renderPaginationBar('products-pagination', 'products', { total: 0 }, 'renderProducts');
    return;
  }

  const paged = getPaginationSlice('products', list);
  renderPaginationBar('products-pagination', 'products', paged, 'renderProducts');

  tbody.innerHTML = paged.items.map(p => {
    const marginNominal = p.sellPrice - p.hpp;
    const marginPercent = p.sellPrice > 0 ? (marginNominal / p.sellPrice) * 100 : 0;

    return `
      <tr>
        <td><code>${p.sku}</code></td>
        <td>${getStoreBadgeHtml(p.storeId || 'health')}</td>
        <td style="font-weight:600;">${p.name}</td>
        <td><span class="badge badge-neutral">${p.category || 'Umum'}</span></td>
        <td style="font-weight:700;">${formatRupiah(p.sellPrice)}</td>
        <td style="color:var(--text-muted);">${formatRupiah(p.hpp)}</td>
        <td>
          <div style="color:var(--success);font-weight:700;">+${formatRupiah(marginNominal)}</div>
          <div style="font-size:11px;color:var(--text-muted);">${marginPercent.toFixed(1)}% margin kotor</div>
        </td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-secondary btn-sm" onclick="editProduct('${p.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">Hapus</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Helper to calculate Omset & ROAS automatically from Dashboard transactions
function getAdMetricsFromDashboard(ad, allTxs) {
  const storeId = ad.storeId;
  const channel = ad.channel;
  const sDate = (ad.startDate || ad.date || '').replace(/\//g, '-').split('T')[0];
  const eDate = (ad.endDate || ad.startDate || ad.date || '').replace(/\//g, '-').split('T')[0];

  let salesGross = 0;
  let orderCount = 0;

  (allTxs || []).forEach(t => {
    if (t.status === 'cancelled') return;

    if (storeId && storeId !== 'all' && storeId !== 'company') {
      const tStore = t.storeId || (t.storeAccount ? t.storeAccount.toLowerCase() : 'health');
      if (tStore !== storeId) return;
    }

    if (channel && channel !== 'all') {
      if (t.channel !== channel) return;
    }

    const tDate = String(t.date || '').replace(/\//g, '-').split('T')[0];
    if (sDate && tDate < sDate) return;
    if (eDate && tDate > eDate) return;

    salesGross += Number(t.grossSales || 0);
    orderCount++;
  });

  // Fallback for legacy demo items with no matching imported transactions
  if (salesGross === 0 && Number(ad.salesGross || 0) > 0 && orderCount === 0) {
    salesGross = Number(ad.salesGross);
  }

  const spend = Number(ad.spend || 0);
  const roas = (spend > 0 && salesGross > 0) ? (salesGross / spend).toFixed(2) : (spend > 0 ? '0.00' : '-');
  const acos = salesGross > 0 ? ((spend / salesGross) * 100).toFixed(1) : '-';

  return { salesGross, orderCount, roas, acos };
}

// Ads View
function renderAds() {
  const tbody = document.getElementById('ads-tbody');
  if (!tbody) return;

  const store = db.getStore();
  if (!store.ads) store.ads = [];

  const list = getFilteredRecords(store.ads);
  list.sort((a, b) => {
    const dateB = new Date(b.endDate || b.startDate || b.date || 0);
    const dateA = new Date(a.endDate || a.startDate || a.date || 0);
    return dateB - dateA;
  });

  // 1. Total Ad Spend from matching ads in active filter
  let totalSpend = 0;
  list.forEach(a => {
    totalSpend += Number(a.spend || 0);
  });

  // 2. Total Gross Sales from Dashboard transactions matching active filter
  const txs = getFilteredRecords(store.transactions || []);
  let totalGrossSales = 0;
  txs.forEach(t => {
    if (t.status === 'cancelled') return;
    totalGrossSales += Number(t.grossSales || 0);
  });

  const overallRoas = (totalSpend > 0 && totalGrossSales > 0) ? (totalGrossSales / totalSpend).toFixed(2) : '0';
  const overallAcos = (totalGrossSales > 0 && totalSpend > 0) ? ((totalSpend / totalGrossSales) * 100).toFixed(1) : '0';

  const spendEl = document.getElementById('ads-total-spend');
  if (spendEl) spendEl.textContent = formatRupiah(totalSpend);

  const salesEl = document.getElementById('ads-total-sales');
  if (salesEl) salesEl.textContent = formatRupiah(totalGrossSales);

  const roasEl = document.getElementById('ads-roas');
  if (roasEl) roasEl.textContent = `${overallRoas}x ROAS`;

  const subtextEl = document.getElementById('ads-roas-subtext');
  if (subtextEl) {
    subtextEl.textContent = totalGrossSales > 0 
      ? `ACOS: ${overallAcos}% (Beban iklan thdp omset)` 
      : 'Omset Kotor ÷ Biaya Iklan';
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:36px;color:var(--text-muted);">Belum ada catatan biaya iklan untuk filter ini. Klik tombol <strong>+ Catat Biaya Iklan</strong> untuk menambahkan pengeluaran iklan Anda.</td></tr>`;
    renderPaginationBar('ads-pagination', 'ads', { total: 0 }, 'renderAds');
    return;
  }

  const paged = getPaginationSlice('ads', list);
  renderPaginationBar('ads-pagination', 'ads', paged, 'renderAds');

  tbody.innerHTML = paged.items.map(a => {
    const channelBadge = a.channel === 'shopee'
      ? `<span class="badge badge-shopee">Shopee Ads</span>`
      : (a.channel === 'lazada'
        ? `<span class="badge badge-lazada">Lazada Sponsored</span>`
        : `<span class="badge badge-tiktok">TikTok Ads</span>`);

    const sDate = a.startDate || a.date;
    const eDate = a.endDate || a.startDate || a.date;
    let dateDisplay = '';
    if (sDate === eDate) {
      dateDisplay = `<div><strong>${formatDateIndo(sDate)}</strong></div><span class="badge badge-secondary" style="font-size:10px; margin-top:2px;">Harian</span>`;
    } else {
      const diffDays = Math.max(1, Math.round((new Date(eDate) - new Date(sDate)) / (1000 * 60 * 60 * 24)) + 1);
      dateDisplay = `
        <div style="font-weight:600; font-size:12.5px; color:#1e293b;">${formatDateIndo(sDate)} &ndash; ${formatDateIndo(eDate)}</div>
        <span class="badge badge-info" style="font-size:10px; background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd; margin-top:2px;">Periode ${diffDays} Hari</span>
      `;
    }

    const adMetrics = getAdMetricsFromDashboard(a, store.transactions || []);
    
    let roasHtml = '';
    if (adMetrics.salesGross > 0 && a.spend > 0) {
      const roasVal = Number(adMetrics.roas);
      const badgeBg = roasVal >= 4 ? '#10b981' : (roasVal >= 2 ? '#3b82f6' : '#f59e0b');
      roasHtml = `
        <div style="display:flex; flex-direction:column; gap:2px;">
          <span class="badge" style="background:${badgeBg}; color:white; font-size:12px; font-weight:700;">${adMetrics.roas}x ROAS</span>
          <span style="font-size:11px; color:#64748b; font-weight:600;">ACOS: ${adMetrics.acos}%</span>
        </div>
      `;
    } else if (a.spend > 0) {
      roasHtml = `<span class="badge badge-secondary" style="font-size:11px; color:#64748b;">- (0.00x)</span>`;
    } else {
      roasHtml = `<span style="color:var(--text-muted);">-</span>`;
    }

    const notesHtml = a.notes 
      ? `<div style="font-size:12px; color:var(--text-secondary); max-width:200px; word-break:break-word;">${escapeHtml(a.notes)}</div>` 
      : '<span style="color:var(--text-muted);">-</span>';

    return `
      <tr>
        <td>${dateDisplay}</td>
        <td>${getStoreBadgeHtml(a.storeId)}</td>
        <td>${channelBadge}</td>
        <td><strong>${escapeHtml(a.campaignType || 'Iklan')}</strong></td>
        <td style="font-weight:700; color:var(--danger); font-size:13.5px;">${formatRupiah(a.spend)}</td>
        <td>
          <div style="font-weight:700; color:var(--success); font-size:13.5px;">${formatRupiah(adMetrics.salesGross)}</div>
          <div style="font-size:11px; color:var(--text-muted);">${adMetrics.orderCount > 0 ? `${adMetrics.orderCount} pesanan terdata` : 'Belum ada pesanan'}</div>
        </td>
        <td>${roasHtml}</td>
        <td>${notesHtml}</td>
        <td>
          <div style="display:flex; gap:6px; align-items:center;">
            <button class="btn btn-secondary btn-sm" onclick="editAds('${a.id}')" title="Edit Data Iklan" style="padding:4px 8px; font-size:11px;">✏️ Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteAds('${a.id}')" title="Hapus Catatan Iklan" style="padding:4px 8px; font-size:11px;">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Expenses & Stock Purchases (Biaya & Modal)
function renderExpenses() {
  renderStockPurchasesTable();
  renderMetaAdsTable();
  renderExpensesTable();
}

function renderStockPurchasesTable() {
  const tbody = document.getElementById('stock-purchases-tbody');
  if (!tbody) return;

  const store = db.getStore();
  if (!store.stockPurchases) store.stockPurchases = [];

  const searchVal = (document.getElementById('stock-search')?.value || '').toLowerCase();
  let list = getFilteredRecords(store.stockPurchases, 'date');

  if (searchVal) {
    list = list.filter(sp => 
      (sp.productName && sp.productName.toLowerCase().includes(searchVal)) ||
      (sp.sku && sp.sku.toLowerCase().includes(searchVal)) ||
      (sp.supplier && sp.supplier.toLowerCase().includes(searchVal)) ||
      (sp.notes && sp.notes.toLowerCase().includes(searchVal))
    );
  }

  list.sort((a, b) => new Date(b.date) - new Date(a.date));

  let totalStockCost = 0;
  let totalStockQty = 0;
  list.forEach(sp => {
    totalStockCost += Number(sp.totalCost || 0);
    totalStockQty += Number(sp.qty || 0);
  });

  const totalStockEl = document.getElementById('stock-total-display');
  if (totalStockEl) totalStockEl.textContent = formatRupiah(totalStockCost);

  const qtyEl = document.getElementById('stock-qty-display');
  if (qtyEl) qtyEl.textContent = `${totalStockQty} unit barang dibeli`;

  // Calculate combined expenses (stock purchases + opex)
  const opexList = getFilteredRecords(store.expenses || [], 'date');
  let totalOpex = 0;
  opexList.forEach(e => totalOpex += Number(e.amount || 0));

  const combinedEl = document.getElementById('combined-expense-display');
  if (combinedEl) combinedEl.textContent = formatRupiah(totalStockCost + totalOpex);

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" style="text-align:center;padding:32px;color:var(--text-muted);">Belum ada data belanja modal barang. Klik tombol <strong>+ Catat Belanja Modal Barang</strong> untuk mencatat kulakan pertama Anda.</td></tr>`;
    renderPaginationBar('stock-purchases-pagination', 'stockPurchases', { total: 0 }, 'renderStockPurchasesTable');
    const masterStock = document.getElementById('select-all-stock');
    if (masterStock) { masterStock.checked = false; masterStock.indeterminate = false; }
    updateBulkDeleteStockButtonState();
    return;
  }

  const paged = getPaginationSlice('stockPurchases', list);
  renderPaginationBar('stock-purchases-pagination', 'stockPurchases', paged, 'renderStockPurchasesTable');

  const masterStock = document.getElementById('select-all-stock');
  if (masterStock) { masterStock.checked = false; masterStock.indeterminate = false; }
  updateBulkDeleteStockButtonState();

  tbody.innerHTML = paged.items.map(sp => `
    <tr>
      <td style="text-align: center;">
        <input type="checkbox" class="stock-checkbox" value="${sp.id}" onchange="handleStockCheckboxChange()" style="cursor: pointer; width: 16px; height: 16px; accent-color: #f59e0b;">
      </td>
      <td><strong>${formatDateIndo(sp.date)}</strong></td>
      <td>${getStoreBadgeHtml(sp.storeId)}</td>
      <td>
        <div style="font-weight:700; color:var(--text-main);">${sp.productName}</div>
      </td>
      <td><code>${sp.sku || '-'}</code></td>
      <td><strong>${sp.qty}</strong> pcs</td>
      <td style="color:var(--text-muted);">${formatRupiah(sp.unitPrice)}</td>
      <td style="font-weight:800; color:#b45309;">${formatRupiah(sp.totalCost)}</td>
      <td><span class="badge badge-neutral">${sp.supplier || 'Supplier'}</span></td>
      <td><span class="badge badge-neutral">${sp.paymentMethod || 'Transfer'}</span></td>
      <td style="font-size:12px; color:var(--text-muted); max-width:180px; overflow:hidden; text-overflow:ellipsis;" title="${sp.notes || ''}">
        ${sp.notes || '-'}
      </td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-secondary btn-sm" onclick="editStockPurchase('${sp.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteStockPurchase('${sp.id}')">Hapus</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Bulk Selection & Mass Delete for Stock Purchases (HPP Belanja)
function toggleSelectAllStockPurchases(master) {
  const checkboxes = document.querySelectorAll('.stock-checkbox');
  checkboxes.forEach(cb => { cb.checked = master.checked; });
  updateBulkDeleteStockButtonState();
}

function handleStockCheckboxChange() {
  const checkboxes = document.querySelectorAll('.stock-checkbox');
  const checked = document.querySelectorAll('.stock-checkbox:checked');
  const master = document.getElementById('select-all-stock');
  if (master) {
    master.checked = checkboxes.length > 0 && checkboxes.length === checked.length;
    master.indeterminate = checked.length > 0 && checked.length < checkboxes.length;
  }
  updateBulkDeleteStockButtonState();
}

function updateBulkDeleteStockButtonState() {
  const checked = document.querySelectorAll('.stock-checkbox:checked');
  const btn = document.getElementById('btn-bulk-delete-stock');
  const countSpan = document.getElementById('selected-stock-count');
  if (btn) {
    if (checked.length > 0) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      btn.style.display = 'inline-flex';
      btn.style.backgroundColor = 'var(--danger)';
      btn.style.color = '#ffffff';
      if (countSpan) countSpan.textContent = checked.length;
    } else {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
      btn.style.display = 'inline-flex';
      btn.style.backgroundColor = '';
      btn.style.color = '';
      if (countSpan) countSpan.textContent = '0';
    }
  }
}

function bulkDeleteSelectedStockPurchases() {
  const checked = document.querySelectorAll('.stock-checkbox:checked');
  const count = checked.length;
  if (count === 0) {
    alert('Pilih minimal satu item belanja modal untuk dihapus.');
    return;
  }

  if (confirm(`Apakah Anda yakin ingin menghapus ${count} item belanja modal barang yang dipilih?\n\nTindakan ini akan menghapus data belanja terpilih dan memperbarui total HPP belanja serta laporan laba rugi.`)) {
    const selectedIds = new Set(Array.from(checked).map(cb => cb.value));
    const store = db.getStore();
    store.stockPurchases = (store.stockPurchases || []).filter(sp => !selectedIds.has(sp.id));
    db.saveData(store);

    if (typeof showToast === 'function') {
      showToast(`${count} item belanja modal berhasil dihapus!`, 'success');
    } else {
      alert(`${count} item belanja modal berhasil dihapus!`);
    }
    renderCurrentView();
  }
}

// Buku Kas Iklan (Meta) - FB & Instagram Ads
function renderMetaAdsTable() {
  const tbodyExpenses = document.getElementById('meta-ads-tbody');
  const tbodyView = document.getElementById('view-meta-ads-tbody');
  if (!tbodyExpenses && !tbodyView) return;

  const store = db.getStore();
  if (!store.metaAds) store.metaAds = [];

  // Auto-heal any existing records in store.metaAds to include topUpFee, ppnAmount, totalAmount
  let hasHealed = false;
  store.metaAds.forEach(m => {
    const amt = Number(m.amount || 0);
    const expectedFee = Math.round(amt * 0.05);
    const expectedPpn = Math.round(expectedFee * 0.11);
    const expectedTotal = amt + expectedFee + expectedPpn;
    if (m.topUpFee === undefined || m.ppnAmount === undefined || m.totalAmount === undefined) {
      m.topUpFee = expectedFee;
      m.ppnAmount = expectedPpn;
      m.totalAmount = expectedTotal;
      hasHealed = true;
    }
  });
  if (hasHealed) {
    db.saveData(store);
  }

  const searchVal = (
    document.getElementById('view-meta-ads-search')?.value || 
    document.getElementById('meta-ads-search')?.value || ''
  ).toLowerCase();
  let list = getFilteredRecords(store.metaAds, 'date');

  if (searchVal) {
    list = list.filter(m => 
      (m.campaignName && m.campaignName.toLowerCase().includes(searchVal)) ||
      (m.accountName && m.accountName.toLowerCase().includes(searchVal)) ||
      (m.paymentMethod && m.paymentMethod.toLowerCase().includes(searchVal)) ||
      (m.notes && m.notes.toLowerCase().includes(searchVal))
    );
  }

  list.sort((a, b) => new Date(b.date) - new Date(a.date));

  let totalMetaAmount = 0;
  let totalMetaFee = 0;
  let totalMetaPpn = 0;
  let totalMetaSpend = 0;

  list.forEach(m => {
    const amt = Number(m.amount || 0);
    const fee = m.topUpFee !== undefined ? Number(m.topUpFee) : Math.round(amt * 0.05);
    const ppn = m.ppnAmount !== undefined ? Number(m.ppnAmount) : Math.round(fee * 0.11);
    const total = m.totalAmount !== undefined ? Number(m.totalAmount) : (amt + fee + ppn);

    totalMetaAmount += amt;
    totalMetaFee += fee;
    totalMetaPpn += ppn;
    totalMetaSpend += total;
  });

  // Update KPI in view-expenses (if present)
  const metaTotalEl = document.getElementById('meta-ads-total-display');
  if (metaTotalEl) metaTotalEl.textContent = formatRupiah(totalMetaSpend);

  const countEl = document.getElementById('meta-ads-count-display');
  if (countEl) countEl.textContent = `${list.length} catatan pengeluaran iklan`;

  // Update KPI in view-meta-ads
  const viewMetaTotalEl = document.getElementById('view-meta-total-display');
  if (viewMetaTotalEl) viewMetaTotalEl.textContent = formatRupiah(totalMetaSpend);

  const viewMetaSubtextEl = document.getElementById('view-meta-subtext-display');
  if (viewMetaSubtextEl) {
    viewMetaSubtextEl.textContent = `Pokok: ${formatRupiah(totalMetaAmount)} • Fee: ${formatRupiah(totalMetaFee)} • PPN: ${formatRupiah(totalMetaPpn)}`;
  }

  const viewMetaPokokEl = document.getElementById('view-meta-pokok-display');
  if (viewMetaPokokEl) viewMetaPokokEl.textContent = formatRupiah(totalMetaAmount);

  const viewMetaTaxEl = document.getElementById('view-meta-tax-display');
  if (viewMetaTaxEl) viewMetaTaxEl.textContent = formatRupiah(totalMetaFee + totalMetaPpn);

  const viewMetaTaxSubtext = document.getElementById('view-meta-tax-subtext');
  if (viewMetaTaxSubtext) {
    viewMetaTaxSubtext.textContent = `Fee 5%: ${formatRupiah(totalMetaFee)} • PPN 11%: ${formatRupiah(totalMetaPpn)}`;
  }

  const viewCountEl = document.getElementById('view-meta-count-display');
  if (viewCountEl) viewCountEl.textContent = `${list.length} Kampanye`;

  const viewAvgEl = document.getElementById('view-meta-avg-display');
  if (viewAvgEl) {
    const avg = list.length > 0 ? Math.round(totalMetaSpend / list.length) : 0;
    viewAvgEl.textContent = `Rata-rata: ${formatRupiah(avg)} / catatan`;
  }

  let htmlRows = '';
  if (list.length === 0) {
    htmlRows = `<tr><td colspan="11" style="text-align:center;padding:32px;color:var(--text-muted);">Belum ada catatan biaya iklan Meta (FB & IG). Klik tombol <strong>+ Catat Iklan (Meta)</strong> untuk mencatat pengeluaran kampanye Anda.</td></tr>`;
    renderPaginationBar('view-meta-ads-pagination', 'metaAds', { total: 0 }, 'renderMetaAdsTable');
  } else {
    const paged = getPaginationSlice('metaAds', list);
    renderPaginationBar('view-meta-ads-pagination', 'metaAds', paged, 'renderMetaAdsTable');

    htmlRows = paged.items.map(m => {
      const amt = Number(m.amount || 0);
      const fee = m.topUpFee !== undefined ? Number(m.topUpFee) : Math.round(amt * 0.05);
      const ppn = m.ppnAmount !== undefined ? Number(m.ppnAmount) : Math.round(fee * 0.11);
      const total = m.totalAmount !== undefined ? Number(m.totalAmount) : (amt + fee + ppn);

      return `
        <tr>
          <td><strong>${formatDateIndo(m.date)}</strong></td>
          <td>${getStoreBadgeHtml(m.storeId || 'company')}</td>
          <td>
            <div style="font-weight:700; color:var(--text-main);">${m.campaignName}</div>
          </td>
          <td><span class="badge badge-meta">${m.accountName || 'Meta Ads'}</span></td>
          <td style="text-align:right; font-weight:600;">${formatRupiah(amt)}</td>
          <td style="text-align:right;">
            <span class="badge" style="background:#e0f2fe; color:#0284c7; font-weight:700; font-size:11px;">+${formatRupiah(fee)}</span>
          </td>
          <td style="text-align:right;">
            <span class="badge" style="background:#fef3c7; color:#b45309; font-weight:700; font-size:11px;">+${formatRupiah(ppn)}</span>
          </td>
          <td style="text-align:right; font-weight:800; color:#1e3a8a; font-size:13px;">${formatRupiah(total)}</td>
          <td><span class="badge badge-neutral">${m.paymentMethod || 'Kartu Kredit'}</span></td>
          <td style="font-size:12px; color:var(--text-muted); max-width:180px; overflow:hidden; text-overflow:ellipsis;" title="${m.notes || ''}">
            ${m.notes || '-'}
          </td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-secondary btn-sm" onclick="editMetaAds('${m.id}')">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteMetaAds('${m.id}')">Hapus</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  if (tbodyExpenses) tbodyExpenses.innerHTML = htmlRows;
  if (tbodyView) tbodyView.innerHTML = htmlRows;
}

function renderExpensesTable() {
  const tbody = document.getElementById('expenses-tbody');
  if (!tbody) return;

  const store = db.getStore();

  // One-time migration of any legacy stockPurchases into expenses (with category: 'hpp_belanja')
  if (store.stockPurchases && store.stockPurchases.length > 0) {
    if (!store.expenses) store.expenses = [];
    store.stockPurchases.forEach(sp => {
      const alreadyExists = store.expenses.some(e => e.id === sp.id || (e.title === sp.productName && e.date === sp.date));
      if (!alreadyExists) {
        store.expenses.push({
          id: sp.id || `EXP-STK-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          storeId: sp.storeId || 'company',
          storeAccount: sp.storeAccount || 'Konsolidasi Perusahaan',
          date: sp.date || new Date().toISOString().split('T')[0],
          category: 'hpp_belanja',
          title: sp.productName || 'Belanja Modal Barang',
          amount: Number(sp.totalCost || (Number(sp.qty || 1) * Number(sp.unitPrice || 0))),
          paymentMethod: sp.paymentMethod || 'Transfer Bank',
          notes: sp.notes || (sp.sku ? `SKU: ${sp.sku}` : '')
        });
      }
    });
    // Permanently drain stockPurchases so deleted items NEVER resurrect!
    store.stockPurchases = [];
    db.saveData(store);
  }

  let list = getFilteredRecords(store.expenses || [], 'date');

  // Compute breakdown for KPIs from all expenses in the active date/channel/store scope
  let totalHpp = 0;
  let totalOpex = 0;
  list.forEach(e => {
    const amt = Number(e.amount || 0);
    if (e.category === 'hpp_belanja') {
      totalHpp += amt;
    } else {
      totalOpex += amt;
    }
  });

  const totalCombined = totalHpp + totalOpex;

  const hppDisplay = document.getElementById('stock-total-display');
  if (hppDisplay) hppDisplay.textContent = formatRupiah(totalHpp);

  const stockQtyEl = document.getElementById('stock-qty-display');
  if (stockQtyEl) {
    stockQtyEl.textContent = 'Modal belanja barang / kulakan terjual';
  }

  const opexDisplay = document.getElementById('expense-total-display');
  if (opexDisplay) opexDisplay.textContent = formatRupiah(totalOpex);

  const combinedEl = document.getElementById('combined-expense-display');
  if (combinedEl) combinedEl.textContent = formatRupiah(totalCombined);

  // Category filter
  const catFilter = document.getElementById('expense-category-filter')?.value || 'all';
  if (catFilter !== 'all') {
    list = list.filter(e => e.category === catFilter);
  }

  // Search filter
  const searchVal = (document.getElementById('expense-search')?.value || '').toLowerCase().trim();
  if (searchVal) {
    list = list.filter(e => 
      (e.title && e.title.toLowerCase().includes(searchVal)) ||
      (e.notes && e.notes.toLowerCase().includes(searchVal)) ||
      (e.category && e.category.toLowerCase().includes(searchVal)) ||
      (e.paymentMethod && e.paymentMethod.toLowerCase().includes(searchVal))
    );
  }

  list.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--text-muted);">Belum ada catatan pengeluaran. Klik tombol <strong>+ Catat Pengeluaran (Beban & HPP)</strong> untuk menambah pengeluaran baru.</td></tr>`;
    renderPaginationBar('expenses-pagination', 'expenses', { total: 0 }, 'renderExpensesTable');
    const masterExp = document.getElementById('select-all-expenses');
    if (masterExp) { masterExp.checked = false; masterExp.indeterminate = false; }
    updateBulkDeleteExpenseButtonState();
    return;
  }

  const paged = getPaginationSlice('expenses', list);
  renderPaginationBar('expenses-pagination', 'expenses', paged, 'renderExpensesTable');

  const masterExp = document.getElementById('select-all-expenses');
  if (masterExp) { masterExp.checked = false; masterExp.indeterminate = false; }
  updateBulkDeleteExpenseButtonState();

  const categoryNames = {
    hpp_belanja: '📦 HPP Belanja Modal',
    packing: 'Bahan Packing',
    salary: 'Gaji & Upah',
    shipping: 'Ongkir & Drop Off',
    tools: 'Peralatan & Label',
    rent: 'Sewa & Listrik',
    other: 'Lain-lain'
  };

  tbody.innerHTML = paged.items.map(e => {
    let catBadge = '';
    if (e.category === 'hpp_belanja') {
      catBadge = `<span class="badge" style="background:#fef3c7;color:#b45309;font-weight:700;border:1px solid #fde68a;">📦 HPP Belanja Modal</span>`;
    } else if (e.category === 'packing') {
      catBadge = `<span class="badge" style="background:#f0fdf4;color:#166534;font-weight:600;border:1px solid #bbf7d0;">📦 Bahan Packing</span>`;
    } else if (e.category === 'salary') {
      catBadge = `<span class="badge" style="background:#f5f3ff;color:#6b21a8;font-weight:600;border:1px solid #ddd6fe;">👥 Gaji & Upah</span>`;
    } else if (e.category === 'shipping') {
      catBadge = `<span class="badge" style="background:#eff6ff;color:#1e40af;font-weight:600;border:1px solid #bfdbfe;">🚚 Ongkir / Drop-Off</span>`;
    } else if (e.category === 'tools') {
      catBadge = `<span class="badge" style="background:#fdf4ff;color:#86198f;font-weight:600;border:1px solid #f5d0fe;">🏷️ Alat & Label</span>`;
    } else if (e.category === 'rent') {
      catBadge = `<span class="badge" style="background:#fff7ed;color:#9a3412;font-weight:600;border:1px solid #fed7aa;">🏢 Sewa & Listrik</span>`;
    } else {
      catBadge = `<span class="badge badge-neutral">${categoryNames[e.category] || e.category || 'Lain-lain'}</span>`;
    }

    const isHpp = e.category === 'hpp_belanja';
    const amountColor = isHpp ? '#b45309' : 'var(--danger)';

    return `
      <tr>
        <td style="text-align: center;">
          <input type="checkbox" class="expense-checkbox" value="${e.id}" onchange="handleExpenseCheckboxChange()" style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--primary);">
        </td>
        <td>${formatDateIndo(e.date)}</td>
        <td>${getStoreBadgeHtml(e.storeId || 'company')}</td>
        <td>${catBadge}</td>
        <td><strong>${e.title}</strong></td>
        <td style="font-weight:700;color:${amountColor};">${formatRupiah(e.amount)}</td>
        <td><span class="badge badge-neutral">${e.paymentMethod || 'Transfer BCA'}</span></td>
        <td style="font-size:12px;color:var(--text-muted);">${e.notes || '-'}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-secondary btn-sm" onclick="editExpense('${e.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteExpense('${e.id}')">Hapus</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Bulk Selection & Mass Delete for Expenses (Beban Operasional)
function toggleSelectAllExpenses(master) {
  const checkboxes = document.querySelectorAll('.expense-checkbox');
  checkboxes.forEach(cb => { cb.checked = master.checked; });
  updateBulkDeleteExpenseButtonState();
}

function handleExpenseCheckboxChange() {
  const checkboxes = document.querySelectorAll('.expense-checkbox');
  const checked = document.querySelectorAll('.expense-checkbox:checked');
  const master = document.getElementById('select-all-expenses');
  if (master) {
    master.checked = checkboxes.length > 0 && checkboxes.length === checked.length;
    master.indeterminate = checked.length > 0 && checked.length < checkboxes.length;
  }
  updateBulkDeleteExpenseButtonState();
}

function updateBulkDeleteExpenseButtonState() {
  const checked = document.querySelectorAll('.expense-checkbox:checked');
  const btn = document.getElementById('btn-bulk-delete-expenses');
  const countSpan = document.getElementById('selected-expenses-count');
  if (btn) {
    if (checked.length > 0) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      btn.style.display = 'inline-flex';
      btn.style.backgroundColor = 'var(--danger)';
      btn.style.color = '#ffffff';
      if (countSpan) countSpan.textContent = checked.length;
    } else {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
      btn.style.display = 'inline-flex';
      btn.style.backgroundColor = '';
      btn.style.color = '';
      if (countSpan) countSpan.textContent = '0';
    }
  }
}

function bulkDeleteSelectedExpenses() {
  const checked = document.querySelectorAll('.expense-checkbox:checked');
  const count = checked.length;
  if (count === 0) {
    alert('Pilih minimal satu beban operasional untuk dihapus.');
    return;
  }

  if (confirm(`Apakah Anda yakin ingin menghapus ${count} catatan pengeluaran yang dipilih?\n\nTindakan ini akan menghapus data terpilih dan memperbarui seluruh laporan keuangan.`)) {
    const selectedIds = new Set(Array.from(checked).map(cb => cb.value));
    const store = db.getStore();
    store.expenses = (store.expenses || []).filter(e => !selectedIds.has(e.id));
    if (store.stockPurchases && store.stockPurchases.length > 0) {
      store.stockPurchases = store.stockPurchases.filter(s => !selectedIds.has(s.id));
    }
    db.saveData(store);

    if (typeof showToast === 'function') {
      showToast(`${count} pengeluaran berhasil dihapus!`, 'success');
    } else {
      alert(`${count} pengeluaran berhasil dihapus!`);
    }
    renderCurrentView();
  }
}

// Laporan Laba Rugi (P&L) View
function renderPnL() {
  const metrics = computeMetrics();
  const store = db.getStore();

  const storeNameEl = document.getElementById('pnl-store-name');
  if (storeNameEl) {
    if (currentStoreFilter === 'all') {
      storeNameEl.textContent = 'PT NALATIQA GROUP (KONSOLIDASI 5 TOKO)';
    } else {
      const storeMeta = getStoreMeta(currentStoreFilter);
      storeNameEl.textContent = `${storeMeta.name.toUpperCase()} (SHOPEE, TIKTOK & LAZADA)`;
    }
  }

  const badgeScopeEl = document.getElementById('pnl-store-badge-scope');
  if (badgeScopeEl) {
    if (currentStoreFilter === 'all') {
      badgeScopeEl.innerHTML = '<span class="badge badge-store-holding" style="font-size:12px;padding:4px 12px;">🏛️ Konsolidasi Keseluruhan Perusahaan (5 Toko & 15 Marketplace)</span>';
    } else {
      const storeMeta = getStoreMeta(currentStoreFilter);
      badgeScopeEl.innerHTML = `<span class="badge ${storeMeta.badgeClass}" style="font-size:12px;padding:4px 12px;">${storeMeta.icon} Laporan Keuangan Mandiri: ${storeMeta.name}</span>`;
    }
  }
  
  const periodTextMap = {
    today: 'Hari Ini',
    '7days': '7 Hari Terakhir',
    month: 'Bulan Ini',
    lastmonth: 'Bulan Lalu',
    all: 'Semua Periode',
    custom: (customStartDate && customEndDate) 
      ? `Periode: ${formatDateIndo(customStartDate)} s/d ${formatDateIndo(customEndDate)}`
      : (customStartDate ? `Mulai ${formatDateIndo(customStartDate)}` : (customEndDate ? `Hingga ${formatDateIndo(customEndDate)}` : 'Periode Kustom'))
  };
  document.getElementById('pnl-period-text').textContent = periodTextMap[dateFilter] || 'Semua Periode';

  document.getElementById('pnl-shopee-sales').textContent = formatRupiah(metrics.shopeeGross);
  document.getElementById('pnl-tiktok-sales').textContent = formatRupiah(metrics.tiktokGross);
  const pnlLazada = document.getElementById('pnl-lazada-sales');
  if (pnlLazada) pnlLazada.textContent = formatRupiah(metrics.lazadaGross || 0);
  document.getElementById('pnl-gross-revenue').textContent = formatRupiah(metrics.grossSales);

  document.getElementById('pnl-deductions').textContent = `(${formatRupiah(metrics.totalDeductions)})`;
  document.getElementById('pnl-net-revenue').textContent = formatRupiah(metrics.netSettlement);

  document.getElementById('pnl-hpp').textContent = `(${formatRupiah(metrics.hppTotal)})`;
  document.getElementById('pnl-gross-profit').textContent = formatRupiah(metrics.grossProfit);

  document.getElementById('pnl-ads-expense').textContent = `(${formatRupiah(metrics.totalAdsSpend)})`;
  const pnlMeta = document.getElementById('pnl-meta-ads-expense');
  if (pnlMeta) pnlMeta.textContent = `(${formatRupiah(metrics.totalMetaAds || 0)})`;
  document.getElementById('pnl-opex-expense').textContent = `(${formatRupiah(metrics.totalOpex)})`;

  const totalOpexAndAds = (metrics.totalAdsSpend || 0) + (metrics.totalMetaAds || 0) + (metrics.totalOpex || 0);
  document.getElementById('pnl-total-opex').textContent = `(${formatRupiah(totalOpexAndAds)})`;

  const elNetProfit = document.getElementById('pnl-net-profit');
  elNetProfit.textContent = formatRupiah(metrics.netProfit);
  elNetProfit.style.color = metrics.netProfit >= 0 ? 'var(--success)' : 'var(--danger)';

  // 4-Way Profit Sharing Allocation in P&L (Romie 25%, Akrom 25%, Tio 25%, Laba Diputar 25%)
  const isSettlement = profitSharingBasis === 'settlement';
  const rawBase = isSettlement ? Number(metrics.netSettlement || 0) : Number(metrics.netProfit || 0);
  const pnlBase = Math.max(0, Math.round(rawBase));
  const pnlQuarter = Math.round(pnlBase / 4);
  const pnlReinvest = Math.max(0, pnlBase - (pnlQuarter * 3));

  const elPnlRomie = document.getElementById('pnl-share-romie');
  if (elPnlRomie) elPnlRomie.textContent = formatRupiah(pnlQuarter);

  const elPnlAkrom = document.getElementById('pnl-share-akrom');
  if (elPnlAkrom) elPnlAkrom.textContent = formatRupiah(pnlQuarter);

  const elPnlTio = document.getElementById('pnl-share-tio');
  if (elPnlTio) elPnlTio.textContent = formatRupiah(pnlQuarter);

  const elPnlReinvest = document.getElementById('pnl-share-reinvest');
  if (elPnlReinvest) elPnlReinvest.textContent = formatRupiah(pnlReinvest);
}

// Settings View
function renderSettings() {
  const store = db.getStore();
  const s = store.settings || {};

  const elStore = document.getElementById('setting-store-name');
  if (elStore) elStore.value = s.storeName || '';
  const elOwner = document.getElementById('setting-owner-name');
  if (elOwner) elOwner.value = s.ownerName || '';
}

// Transaction Modal Actions
function openAddTransactionModal(channel = 'shopee') {
  document.getElementById('tx-modal-id').value = '';
  const storeSelect = document.getElementById('tx-modal-store');
  if (storeSelect) {
    storeSelect.value = (currentStoreFilter && currentStoreFilter !== 'all') ? currentStoreFilter : 'health';
  }
  document.getElementById('tx-modal-channel').value = channel;
  document.getElementById('tx-modal-date').value = new Date().toISOString().split('T')[0];
  const qtyInput = document.getElementById('tx-modal-qty');
  if (qtyInput) qtyInput.value = '1';
  const prefix = channel === 'shopee' ? 'SP' : (channel === 'lazada' ? 'LZ' : 'TT');
  document.getElementById('tx-modal-order-id').value = `${prefix}${Date.now().toString().slice(-8)}`;
  document.getElementById('tx-modal-buyer').value = '';
  document.getElementById('tx-modal-gross').value = '';
  document.getElementById('tx-modal-admin-fee').value = '';
  document.getElementById('tx-modal-service-fee').value = '';
  document.getElementById('tx-modal-trans-fee').value = '';
  document.getElementById('tx-modal-voucher-fee').value = '0';
  document.getElementById('tx-modal-net').value = '';
  document.getElementById('tx-modal-status').value = 'settled';
  document.getElementById('tx-modal-notes').value = '';

  populateProductDropdown('tx-modal-product-select');
  const channelName = channel === 'shopee' ? 'Shopee' : (channel === 'lazada' ? 'Lazada' : 'TikTok Shop');
  document.getElementById('tx-modal-title').textContent = `Catat Penjualan Baru (${channelName})`;
  openModal('modal-transaction');
}

function populateProductDropdown(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const store = db.getStore();
  select.innerHTML = `<option value="">-- Pilih Produk dari Katalog (Opsional) --</option>` +
    store.products.map(p => `
      <option value="${p.sku}" data-name="${p.name}" data-price="${p.sellPrice}">
        ${p.sku} - ${p.name} (${formatRupiah(p.sellPrice)})
      </option>
    `).join('');
}

function onProductSelectedInModal() {
  const select = document.getElementById('tx-modal-product-select');
  const selectedOpt = select.options[select.selectedIndex];
  if (!selectedOpt || !selectedOpt.value) return;

  const price = selectedOpt.getAttribute('data-price');
  if (price) document.getElementById('tx-modal-gross').value = price;

  calculateModalDeductions();
}

function calculateModalDeductions() {
  const channel = document.getElementById('tx-modal-channel').value;
  const gross = parseFloat(document.getElementById('tx-modal-gross').value) || 0;
  const store = db.getStore();
  const s = store.settings;

  if (gross > 0) {
    if (channel === 'shopee') {
      const adminRate = (s.shopeeDefaultAdminFee || 9.0) / 100;
      const serviceRate = (s.shopeeDefaultServiceFee || 4.5) / 100;
      const transRate = 0.01;

      document.getElementById('tx-modal-admin-fee').value = Math.round(gross * adminRate);
      document.getElementById('tx-modal-service-fee').value = Math.round(gross * serviceRate);
      document.getElementById('tx-modal-trans-fee').value = Math.round(gross * transRate);
    } else if (channel === 'lazada') {
      const commRate = (s.lazadaDefaultCommission || 5.0) / 100;
      const paymentRate = (s.lazadaDefaultPaymentFee || 2.0) / 100;
      const serviceRate = 0.01;

      document.getElementById('tx-modal-admin-fee').value = Math.round(gross * commRate);
      document.getElementById('tx-modal-service-fee').value = Math.round(gross * serviceRate);
      document.getElementById('tx-modal-trans-fee').value = Math.round(gross * paymentRate);
    } else {
      const commRate = (s.tiktokDefaultCommission || 5.0) / 100;
      const serviceRate = (s.tiktokDefaultServiceFee || 1.0) / 100;
      const transRate = 0.01;

      document.getElementById('tx-modal-admin-fee').value = Math.round(gross * commRate);
      document.getElementById('tx-modal-service-fee').value = Math.round(gross * serviceRate);
      document.getElementById('tx-modal-trans-fee').value = Math.round(gross * transRate);
    }

    const admin = parseFloat(document.getElementById('tx-modal-admin-fee').value) || 0;
    const service = parseFloat(document.getElementById('tx-modal-service-fee').value) || 0;
    const trans = parseFloat(document.getElementById('tx-modal-trans-fee').value) || 0;
    const voucher = parseFloat(document.getElementById('tx-modal-voucher-fee').value) || 0;

    const net = gross - admin - service - trans - voucher;
    document.getElementById('tx-modal-net').value = Math.max(0, net);
  }
}

function saveTransactionFromModal() {
  const store = db.getStore();
  const id = document.getElementById('tx-modal-id').value || `TRX-${Date.now()}`;
  const storeId = document.getElementById('tx-modal-store')?.value || (currentStoreFilter !== 'all' ? currentStoreFilter : 'health');
  const storeMeta = getStoreMeta(storeId);
  const storeAccount = storeMeta ? storeMeta.name : 'Nalatiqa Health';
  const channel = document.getElementById('tx-modal-channel').value;
  const date = document.getElementById('tx-modal-date').value;
  const orderId = document.getElementById('tx-modal-order-id').value;
  const buyerName = document.getElementById('tx-modal-buyer').value;
  const grossSales = parseFloat(document.getElementById('tx-modal-gross').value) || 0;
  const adminFee = parseFloat(document.getElementById('tx-modal-admin-fee').value) || 0;
  const serviceFee = parseFloat(document.getElementById('tx-modal-service-fee').value) || 0;
  const transactionFee = parseFloat(document.getElementById('tx-modal-trans-fee').value) || 0;
  const voucherFee = parseFloat(document.getElementById('tx-modal-voucher-fee').value) || 0;
  const netSettlement = parseFloat(document.getElementById('tx-modal-net').value) || (grossSales - adminFee - serviceFee - transactionFee - voucherFee);
  const qtyInput = document.getElementById('tx-modal-qty');
  const qty = qtyInput ? (parseInt(qtyInput.value, 10) || 1) : 1;
  const status = document.getElementById('tx-modal-status').value;
  const notes = document.getElementById('tx-modal-notes').value;

  const select = document.getElementById('tx-modal-product-select');
  const selectedOpt = select.options[select.selectedIndex];
  const sku = selectedOpt && selectedOpt.value ? selectedOpt.value : '';
  const productName = selectedOpt && selectedOpt.value ? selectedOpt.getAttribute('data-name') : 'Pesanan Langsung';

  if (!orderId || grossSales <= 0) {
    alert('Harap isi No. Pesanan dan Nilai Penjualan!');
    return;
  }

  const newTx = {
    id,
    storeId,
    storeAccount,
    orderId,
    channel,
    date,
    releaseDate: status === 'settled' ? date : null,
    buyerName,
    sku,
    productName,
    qty,
    grossSales,
    adminFee,
    serviceFee,
    transactionFee,
    voucherFee,
    netSettlement,
    hppTotal: 0,
    status,
    notes
  };

  const existingIndex = store.transactions.findIndex(t => t.id === id);
  if (existingIndex >= 0) {
    store.transactions[existingIndex] = newTx;
  } else {
    store.transactions.unshift(newTx);
  }

  db.saveData(store);
  closeModal('modal-transaction');
  renderCurrentView();
}

function editTransaction(id) {
  const store = db.getStore();
  const tx = store.transactions.find(t => t.id === id);
  if (!tx) return;

  populateProductDropdown('tx-modal-product-select');

  document.getElementById('tx-modal-id').value = tx.id;
  const storeSelect = document.getElementById('tx-modal-store');
  if (storeSelect) {
    storeSelect.value = tx.storeId || 'health';
  }
  document.getElementById('tx-modal-channel').value = tx.channel;
  document.getElementById('tx-modal-date').value = tx.date;
  document.getElementById('tx-modal-order-id').value = tx.orderId;
  document.getElementById('tx-modal-buyer').value = tx.buyerName || '';
  document.getElementById('tx-modal-gross').value = tx.grossSales;
  document.getElementById('tx-modal-admin-fee').value = tx.adminFee;
  document.getElementById('tx-modal-service-fee').value = tx.serviceFee;
  document.getElementById('tx-modal-trans-fee').value = tx.transactionFee;
  document.getElementById('tx-modal-voucher-fee').value = tx.voucherFee || 0;
  document.getElementById('tx-modal-net').value = tx.netSettlement;
  document.getElementById('tx-modal-status').value = tx.status;
  document.getElementById('tx-modal-notes').value = tx.notes || '';
  const qtyInput = document.getElementById('tx-modal-qty');
  if (qtyInput) qtyInput.value = tx.qty || 1;

  if (tx.sku) {
    document.getElementById('tx-modal-product-select').value = tx.sku;
  }

  document.getElementById('tx-modal-title').textContent = `Detail Transaksi: ${tx.orderId}`;
  openModal('modal-transaction');
}

function deleteTransaction(id) {
  if (confirm('Yakin ingin menghapus transaksi ini?')) {
    const store = db.getStore();
    store.transactions = store.transactions.filter(t => t.id !== id);
    db.saveData(store);
    renderCurrentView();
  }
}

// Product Modal Actions
function openAddProductModal() {
  document.getElementById('product-modal-id').value = '';
  const storeSelect = document.getElementById('product-modal-store');
  if (storeSelect) {
    storeSelect.value = (currentStoreFilter && currentStoreFilter !== 'all') ? currentStoreFilter : 'all';
  }
  document.getElementById('product-modal-sku').value = '';
  document.getElementById('product-modal-name').value = '';
  document.getElementById('product-modal-category').value = 'Kesehatan & Suplemen';
  document.getElementById('product-modal-price').value = '';
  document.getElementById('product-modal-hpp').value = '';
  document.getElementById('product-modal-stock').value = '100';
  document.getElementById('product-modal-title').textContent = 'Tambah Produk / SKU Baru';
  openModal('modal-product');
}

function saveProductFromModal() {
  const store = db.getStore();
  const id = document.getElementById('product-modal-id').value || `PRD-${Date.now()}`;
  const storeId = document.getElementById('product-modal-store')?.value || (currentStoreFilter !== 'all' ? currentStoreFilter : 'all');
  const storeMeta = getStoreMeta(storeId);
  const storeAccount = storeMeta ? storeMeta.name : (storeId === 'all' ? 'Semua Toko' : 'Nalatiqa Health');
  const sku = document.getElementById('product-modal-sku').value.trim();
  const name = document.getElementById('product-modal-name').value.trim();
  const category = document.getElementById('product-modal-category').value;
  const sellPrice = parseFloat(document.getElementById('product-modal-price').value) || 0;
  const hpp = parseFloat(document.getElementById('product-modal-hpp').value) || 0;
  const stock = parseInt(document.getElementById('product-modal-stock').value) || 0;

  if (!sku || !name || sellPrice <= 0) {
    alert('Harap lengkapi Kode SKU, Nama Produk, dan Harga Jual!');
    return;
  }

  const newProduct = { id, storeId, storeAccount, sku, name, category, sellPrice, hpp, stock };

  const existingIdx = store.products.findIndex(p => p.id === id);
  if (existingIdx >= 0) {
    store.products[existingIdx] = newProduct;
  } else {
    store.products.push(newProduct);
  }

  db.saveData(store);
  closeModal('modal-product');
  renderCurrentView();
}

function editProduct(id) {
  const store = db.getStore();
  const p = store.products.find(item => item.id === id);
  if (!p) return;

  document.getElementById('product-modal-id').value = p.id;
  const storeSelect = document.getElementById('product-modal-store');
  if (storeSelect) {
    storeSelect.value = p.storeId || 'all';
  }
  document.getElementById('product-modal-sku').value = p.sku;
  document.getElementById('product-modal-name').value = p.name;
  document.getElementById('product-modal-category').value = p.category;
  document.getElementById('product-modal-price').value = p.sellPrice;
  document.getElementById('product-modal-hpp').value = p.hpp;
  document.getElementById('product-modal-stock').value = p.stock;
  document.getElementById('product-modal-title').textContent = 'Edit Data Produk';
  openModal('modal-product');
}

function deleteProduct(id) {
  if (confirm('Yakin ingin menghapus produk ini dari katalog?')) {
    const store = db.getStore();
    store.products = store.products.filter(p => p.id !== id);
    db.saveData(store);
    renderCurrentView();
  }
}

// Ads Modal Actions
function openAddAdsModal() {
  const titleEl = document.getElementById('ads-modal-header-title');
  if (titleEl) titleEl.textContent = 'Catat Biaya Iklan Marketplace';

  const idEl = document.getElementById('ads-modal-id');
  if (idEl) idEl.value = '';

  const storeSelect = document.getElementById('ads-modal-store');
  if (storeSelect) {
    storeSelect.value = (currentStoreFilter && currentStoreFilter !== 'all') ? currentStoreFilter : 'health';
  }

  const channelSelect = document.getElementById('ads-modal-channel');
  if (channelSelect) {
    channelSelect.value = (channelFilter && channelFilter !== 'all') ? channelFilter : 'shopee';
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const sDateEl = document.getElementById('ads-modal-start-date');
  if (sDateEl) sDateEl.value = todayStr;
  const eDateEl = document.getElementById('ads-modal-end-date');
  if (eDateEl) eDateEl.value = todayStr;

  const typeEl = document.getElementById('ads-modal-type');
  if (typeEl) typeEl.value = 'Iklan Pencarian & GMV Max';
  const spendEl = document.getElementById('ads-modal-spend');
  if (spendEl) spendEl.value = '';
  const notesEl = document.getElementById('ads-modal-notes');
  if (notesEl) notesEl.value = '';

  updateAdModalPreview();
  openModal('modal-ads');
}

function editAds(id) {
  const store = db.getStore();
  const ad = (store.ads || []).find(a => a.id === id);
  if (!ad) return;

  const titleEl = document.getElementById('ads-modal-header-title');
  if (titleEl) titleEl.textContent = 'Edit Catatan Biaya Iklan';

  const idEl = document.getElementById('ads-modal-id');
  if (idEl) idEl.value = ad.id;

  const storeSelect = document.getElementById('ads-modal-store');
  if (storeSelect) storeSelect.value = ad.storeId || 'health';

  const channelSelect = document.getElementById('ads-modal-channel');
  if (channelSelect) channelSelect.value = ad.channel || 'shopee';

  const sDate = ad.startDate || ad.date || new Date().toISOString().split('T')[0];
  const eDate = ad.endDate || ad.startDate || ad.date || new Date().toISOString().split('T')[0];
  const sDateEl = document.getElementById('ads-modal-start-date');
  if (sDateEl) sDateEl.value = sDate;
  const eDateEl = document.getElementById('ads-modal-end-date');
  if (eDateEl) eDateEl.value = eDate;

  const typeEl = document.getElementById('ads-modal-type');
  if (typeEl) typeEl.value = ad.campaignType || '';
  const spendEl = document.getElementById('ads-modal-spend');
  if (spendEl) spendEl.value = ad.spend || '';
  const notesEl = document.getElementById('ads-modal-notes');
  if (notesEl) notesEl.value = ad.notes || '';

  updateAdModalPreview();
  openModal('modal-ads');
}

function setAdModalDatePreset(preset) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  let sDate = todayStr;
  let eDate = todayStr;

  if (preset === 'today') {
    sDate = todayStr;
    eDate = todayStr;
  } else if (preset === '7days') {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    sDate = d.toISOString().split('T')[0];
    eDate = todayStr;
  } else if (preset === 'month') {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    sDate = `${y}-${m}-01`;
    eDate = todayStr;
  } else if (preset === 'lastmonth') {
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const y = prevMonthDate.getFullYear();
    const m = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    sDate = `${y}-${m}-01`;
    eDate = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
  }

  const sDateEl = document.getElementById('ads-modal-start-date');
  if (sDateEl) sDateEl.value = sDate;
  const eDateEl = document.getElementById('ads-modal-end-date');
  if (eDateEl) eDateEl.value = eDate;
  updateAdModalPreview();
}

function updateAdModalPreview() {
  const store = db.getStore();
  const storeId = document.getElementById('ads-modal-store')?.value || 'health';
  const channel = document.getElementById('ads-modal-channel')?.value || 'shopee';
  const sDate = document.getElementById('ads-modal-start-date')?.value || '';
  const eDate = document.getElementById('ads-modal-end-date')?.value || sDate;
  const spend = parseFloat(document.getElementById('ads-modal-spend')?.value) || 0;

  const salesEl = document.getElementById('ads-modal-preview-sales');
  const salesDescEl = document.getElementById('ads-modal-preview-sales-desc');
  const roasEl = document.getElementById('ads-modal-preview-roas');
  const acosEl = document.getElementById('ads-modal-preview-acos');

  if (!salesEl) return;

  const allTxs = store.transactions || [];
  let salesGross = 0;
  let orderCount = 0;

  allTxs.forEach(t => {
    if (t.status === 'cancelled') return;
    if (storeId && storeId !== 'all' && storeId !== 'company') {
      const tStore = t.storeId || (t.storeAccount ? t.storeAccount.toLowerCase() : 'health');
      if (tStore !== storeId) return;
    }
    if (channel && channel !== 'all') {
      if (t.channel !== channel) return;
    }
    const tDate = String(t.date || '').replace(/\//g, '-').split('T')[0];
    if (sDate && tDate < sDate) return;
    if (eDate && tDate > eDate) return;

    salesGross += Number(t.grossSales || 0);
    orderCount++;
  });

  salesEl.textContent = formatRupiah(salesGross);
  if (orderCount > 0) {
    salesDescEl.textContent = `Dihitung otomatis dari ${orderCount} transaksi pesanan di periode ini`;
  } else {
    salesDescEl.textContent = `Belum ada data transaksi di periode tanggal ini`;
  }

  if (spend > 0) {
    if (salesGross > 0) {
      const roasVal = (salesGross / spend).toFixed(2);
      const acosVal = ((spend / salesGross) * 100).toFixed(1);
      roasEl.innerHTML = `<span style="color:#16a34a; font-size:18px; font-weight:800;">${roasVal}x ROAS</span>`;
      acosEl.innerHTML = `<span style="color:#0f766e; font-weight:600;">Rasio Beban Iklan (ACOS): ${acosVal}%</span>`;
    } else {
      roasEl.innerHTML = `<span style="color:#d97706; font-size:15px; font-weight:700;">0.00x ROAS</span>`;
      acosEl.innerHTML = `<span style="color:#b45309;">(Belum ada omset penjualan terdeteksi)</span>`;
    }
  } else {
    roasEl.textContent = '-';
    acosEl.textContent = 'Ketik nominal biaya iklan di atas';
  }
}

function saveAdsFromModal() {
  const store = db.getStore();
  if (!store.ads) store.ads = [];

  const id = document.getElementById('ads-modal-id')?.value;
  const storeId = document.getElementById('ads-modal-store')?.value || (currentStoreFilter !== 'all' ? currentStoreFilter : 'health');
  const storeMeta = getStoreMeta(storeId);
  const storeAccount = storeMeta ? storeMeta.name : (storeId === 'company' ? 'Konsolidasi / Semua Toko' : 'Nalatiqa Health');
  const channel = document.getElementById('ads-modal-channel')?.value || 'shopee';
  const startDate = document.getElementById('ads-modal-start-date')?.value;
  const endDate = document.getElementById('ads-modal-end-date')?.value || startDate;
  const campaignType = document.getElementById('ads-modal-type')?.value.trim() || 'Iklan';
  const spend = parseFloat(document.getElementById('ads-modal-spend')?.value) || 0;
  const notes = document.getElementById('ads-modal-notes')?.value.trim();

  if (!startDate) {
    alert('Harap tentukan tanggal mulai periode iklan!');
    return;
  }
  if (endDate < startDate) {
    alert('Tanggal selesai tidak boleh lebih awal dari tanggal mulai!');
    return;
  }
  if (spend <= 0) {
    alert('Harap isi nominal biaya iklan yang terpakai!');
    return;
  }

  if (id) {
    const idx = store.ads.findIndex(a => a.id === id);
    if (idx !== -1) {
      store.ads[idx] = {
        ...store.ads[idx],
        storeId,
        storeAccount,
        channel,
        startDate,
        endDate,
        date: startDate,
        campaignType,
        spend,
        notes
      };
    }
  } else {
    const newAd = {
      id: `ADS-${Date.now()}`,
      storeId,
      storeAccount,
      channel,
      startDate,
      endDate,
      date: startDate,
      campaignType,
      spend,
      notes
    };
    store.ads.unshift(newAd);
  }

  db.saveData(store);
  closeModal('modal-ads');
  renderCurrentView();
}

function deleteAds(id) {
  if (confirm('Hapus catatan iklan ini?')) {
    const store = db.getStore();
    store.ads = store.ads.filter(a => a.id !== id);
    db.saveData(store);
    renderCurrentView();
  }
}

// Expense Modal Actions
function openAddExpenseModal() {
  const titleEl = document.getElementById('exp-modal-header-title');
  if (titleEl) titleEl.textContent = 'Catat Pengeluaran (Beban Operasional & HPP)';
  const idEl = document.getElementById('exp-modal-id');
  if (idEl) idEl.value = '';
  const storeSelect = document.getElementById('exp-modal-store');
  if (storeSelect) {
    storeSelect.value = (currentStoreFilter && currentStoreFilter !== 'all') ? currentStoreFilter : 'company';
  }
  document.getElementById('exp-modal-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('exp-modal-category').value = 'hpp_belanja';
  document.getElementById('exp-modal-title').value = '';
  document.getElementById('exp-modal-amount').value = '';
  document.getElementById('exp-modal-payment').value = 'Transfer BCA';
  document.getElementById('exp-modal-notes').value = '';
  openModal('modal-expense');
}

function editExpense(id) {
  const store = db.getStore();
  const item = (store.expenses || []).find(e => e.id === id);
  if (!item) return;

  const titleEl = document.getElementById('exp-modal-header-title');
  if (titleEl) titleEl.textContent = 'Edit Pengeluaran (Beban Operasional & HPP)';
  const idEl = document.getElementById('exp-modal-id');
  if (idEl) idEl.value = item.id;

  const storeSelect = document.getElementById('exp-modal-store');
  if (storeSelect) {
    storeSelect.value = item.storeId || 'company';
  }

  document.getElementById('exp-modal-date').value = item.date || new Date().toISOString().split('T')[0];
  document.getElementById('exp-modal-category').value = item.category || 'hpp_belanja';
  document.getElementById('exp-modal-title').value = item.title || '';
  document.getElementById('exp-modal-amount').value = item.amount || '';
  document.getElementById('exp-modal-payment').value = item.paymentMethod || 'Transfer BCA';
  document.getElementById('exp-modal-notes').value = item.notes || '';

  openModal('modal-expense');
}

function saveExpenseFromModal() {
  const store = db.getStore();
  if (!store.expenses) store.expenses = [];

  const id = document.getElementById('exp-modal-id')?.value;
  const storeId = document.getElementById('exp-modal-store')?.value || (currentStoreFilter !== 'all' ? currentStoreFilter : 'company');
  const storeMeta = getStoreMeta(storeId);
  const storeAccount = storeMeta ? storeMeta.name : (storeId === 'company' ? 'Konsolidasi Perusahaan' : 'Nalatiqa Health');
  const date = document.getElementById('exp-modal-date').value;
  const category = document.getElementById('exp-modal-category').value;
  const title = document.getElementById('exp-modal-title').value.trim();
  const amount = parseFloat(document.getElementById('exp-modal-amount').value) || 0;
  const paymentMethod = document.getElementById('exp-modal-payment').value;
  const notes = document.getElementById('exp-modal-notes').value.trim();

  if (!title || amount <= 0) {
    alert('Harap isi nama pengeluaran dan jumlah nominal!');
    return;
  }

  if (id) {
    const idx = store.expenses.findIndex(e => e.id === id);
    if (idx !== -1) {
      store.expenses[idx] = {
        ...store.expenses[idx],
        storeId,
        storeAccount,
        date,
        category,
        title,
        amount,
        paymentMethod,
        notes
      };
    }
  } else {
    const newExp = {
      id: `EXP-${Date.now()}`,
      storeId,
      storeAccount,
      date,
      category,
      title,
      amount,
      paymentMethod,
      notes
    };
    store.expenses.unshift(newExp);
  }

  db.saveData(store);
  closeModal('modal-expense');
  renderCurrentView();
}

function deleteExpense(id) {
  if (confirm('Hapus catatan pengeluaran ini?')) {
    const store = db.getStore();
    store.expenses = (store.expenses || []).filter(e => e.id !== id);
    if (store.stockPurchases && store.stockPurchases.length > 0) {
      store.stockPurchases = store.stockPurchases.filter(s => s.id !== id);
    }
    db.saveData(store);
    renderCurrentView();
    if (typeof showToast === 'function') {
      showToast('Catatan pengeluaran berhasil dihapus!', 'success');
    }
  }
}

// =========================================================================
// MODAL & ACTION HANDLERS: MODAL BELANJA BARANG (HPP BELANJA)
// =========================================================================

function updateStockProductSuggestions() {
  const datalist = document.getElementById('stock-product-suggestions');
  if (!datalist) return;
  const store = db.getStore();
  const products = store.products || [];
  datalist.innerHTML = products.map(p => `
    <option value="${(p.name || '').replace(/"/g, '&quot;')}">SKU: ${(p.sku || '-').replace(/"/g, '&quot;')}</option>
  `).join('');
}

function openAddStockPurchaseModal() {
  openAddExpenseModal();
  const catEl = document.getElementById('exp-modal-category');
  if (catEl) catEl.value = 'hpp_belanja';
}

function legacy_openAddStockPurchaseModal_unused() {
  const stockModalTitle = document.getElementById('stock-modal-title');
  if (stockModalTitle) stockModalTitle.textContent = 'Catat Belanja Modal Barang (HPP Belanja)';
  const stockModalId = document.getElementById('stock-modal-id');
  if (stockModalId) stockModalId.value = '';
  const storeSelect = document.getElementById('stock-modal-store');
  if (storeSelect) {
    storeSelect.value = (currentStoreFilter && currentStoreFilter !== 'all') ? currentStoreFilter : 'company';
  }
  const dateEl = document.getElementById('stock-modal-date');
  if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
  const payEl = document.getElementById('stock-modal-payment');
  if (payEl) payEl.value = 'Transfer Bank';
  const nameEl = document.getElementById('stock-modal-name');
  if (nameEl) nameEl.value = '';
  const skuEl = document.getElementById('stock-modal-sku');
  if (skuEl) skuEl.value = '';
  const supEl = document.getElementById('stock-modal-supplier');
  if (supEl) supEl.value = '';
  const qtyEl = document.getElementById('stock-modal-qty');
  if (qtyEl) qtyEl.value = '1';
  const priceEl = document.getElementById('stock-modal-price');
  if (priceEl) priceEl.value = '';
  const totalEl = document.getElementById('stock-modal-total');
  if (totalEl) totalEl.value = '';
  const notesEl = document.getElementById('stock-modal-notes');
  if (notesEl) notesEl.value = '';

  updateStockProductSuggestions();

  // Auto-fill SKU and price if matched from products catalog
  const nameInput = document.getElementById('stock-modal-name');
  if (nameInput) {
    nameInput.oninput = () => {
      const val = nameInput.value.trim().toLowerCase();
      if (!val) return;
      const store = db.getStore();
      const match = (store.products || []).find(p => p.name && p.name.toLowerCase() === val);
      if (match) {
        if (match.sku && !document.getElementById('stock-modal-sku').value) {
          document.getElementById('stock-modal-sku').value = match.sku;
        }
        if (match.hpp && !document.getElementById('stock-modal-price').value) {
          document.getElementById('stock-modal-price').value = match.hpp;
          calculateStockModalTotal();
        }
      }
    };
  }

  openModal('modal-stock-purchase');
}

function calculateStockModalTotal() {
  const qty = parseFloat(document.getElementById('stock-modal-qty').value) || 0;
  const price = parseFloat(document.getElementById('stock-modal-price').value) || 0;
  const total = qty * price;
  document.getElementById('stock-modal-total').value = total > 0 ? total : '';
}

function saveStockPurchaseFromModal() {
  const store = db.getStore();
  if (!store.stockPurchases) store.stockPurchases = [];

  const id = document.getElementById('stock-modal-id').value;
  const storeId = document.getElementById('stock-modal-store')?.value || (currentStoreFilter !== 'all' ? currentStoreFilter : 'company');
  const storeMeta = getStoreMeta(storeId);
  const storeAccount = storeMeta ? storeMeta.name : (storeId === 'company' ? 'Kantor Pusat' : 'Nalatiqa Health');
  const date = document.getElementById('stock-modal-date').value;
  const paymentMethod = document.getElementById('stock-modal-payment').value;
  const productName = document.getElementById('stock-modal-name').value.trim();
  const sku = document.getElementById('stock-modal-sku').value.trim();
  const supplier = document.getElementById('stock-modal-supplier').value.trim();
  const qty = parseFloat(document.getElementById('stock-modal-qty').value) || 0;
  const unitPrice = parseFloat(document.getElementById('stock-modal-price').value) || 0;
  let totalCost = parseFloat(document.getElementById('stock-modal-total').value);

  if (isNaN(totalCost) || totalCost <= 0) {
    totalCost = qty * unitPrice;
  }
  const notes = document.getElementById('stock-modal-notes').value.trim();

  if (!date) {
    alert('Harap pilih tanggal belanja barang!');
    return;
  }
  if (!productName) {
    alert('Harap isi nama produk / barang yang dibeli!');
    return;
  }
  if (qty <= 0) {
    alert('Jumlah (Qty) belanja harus lebih dari 0!');
    return;
  }
  if (totalCost <= 0) {
    alert('Harap isi harga beli satuan atau total belanja barang!');
    return;
  }

  // Also auto-add or link to product catalog if SKU or product doesn't exist yet
  if (productName) {
    if (!store.products) store.products = [];
    const existingPrd = store.products.find(p => (sku && p.sku === sku) || p.name.toLowerCase() === productName.toLowerCase());
    if (!existingPrd && sku) {
      store.products.push({
        id: `PRD-${Date.now()}`,
        storeId,
        storeAccount,
        sku: sku,
        name: productName,
        category: 'Umum',
        sellPrice: Math.round(unitPrice * 1.3),
        hpp: unitPrice,
        stock: qty
      });
    }
  }

  if (id) {
    // Edit existing purchase
    const idx = store.stockPurchases.findIndex(sp => sp.id === id);
    if (idx !== -1) {
      store.stockPurchases[idx] = {
        ...store.stockPurchases[idx],
        storeId,
        storeAccount,
        date,
        paymentMethod,
        productName,
        sku,
        supplier,
        qty,
        unitPrice,
        totalCost,
        notes
      };
    }
  } else {
    // Add new purchase
    const newStockPurchase = {
      id: `STK-${Date.now()}`,
      storeId,
      storeAccount,
      date,
      paymentMethod,
      productName,
      sku,
      supplier,
      qty,
      unitPrice,
      totalCost,
      notes
    };
    store.stockPurchases.unshift(newStockPurchase);
  }

  db.saveData(store);
  closeModal('modal-stock-purchase');
  renderCurrentView();
}

function editStockPurchase(id) {
  const store = db.getStore();
  const item = (store.stockPurchases || []).find(sp => sp.id === id);
  if (!item) return;

  document.getElementById('stock-modal-title').textContent = 'Edit Belanja Modal Barang (HPP Belanja)';
  document.getElementById('stock-modal-id').value = item.id;
  const storeSelect = document.getElementById('stock-modal-store');
  if (storeSelect) {
    storeSelect.value = item.storeId || 'company';
  }
  document.getElementById('stock-modal-date').value = item.date || new Date().toISOString().split('T')[0];
  document.getElementById('stock-modal-payment').value = item.paymentMethod || 'Transfer Bank';
  document.getElementById('stock-modal-name').value = item.productName || '';
  document.getElementById('stock-modal-sku').value = item.sku || '';
  document.getElementById('stock-modal-supplier').value = item.supplier || '';
  document.getElementById('stock-modal-qty').value = item.qty || 1;
  document.getElementById('stock-modal-price').value = item.unitPrice || 0;
  document.getElementById('stock-modal-total').value = item.totalCost || 0;
  document.getElementById('stock-modal-notes').value = item.notes || '';

  updateStockProductSuggestions();
  openModal('modal-stock-purchase');
}

function deleteStockPurchase(id) {
  if (confirm('Apakah Anda yakin ingin menghapus catatan belanja modal barang ini?')) {
    const store = db.getStore();
    store.stockPurchases = (store.stockPurchases || []).filter(sp => sp.id !== id);
    db.saveData(store);
    renderCurrentView();
  }
}

// =========================================================================
// MODAL & ACTION HANDLERS: IKLAN META (FACEBOOK & INSTAGRAM ADS)
// =========================================================================

function calculateMetaModalFees(trigger = 'amount') {
  const amount = parseFloat(document.getElementById('meta-modal-amount')?.value) || 0;
  const feePct = parseFloat(document.getElementById('meta-modal-fee-pct')?.value) || 0;
  const ppnPct = parseFloat(document.getElementById('meta-modal-ppn-pct')?.value) || 0;

  const elFee = document.getElementById('meta-modal-fee');
  const elPpn = document.getElementById('meta-modal-ppn');
  const elTotInput = document.getElementById('meta-modal-total');
  const elTotDisplay = document.getElementById('meta-modal-total-display');
  const elFormulaDesc = document.getElementById('meta-modal-total-formula-desc');

  let fee = 0;
  let ppn = 0;

  if (trigger === 'fee_manual') {
    // User edited fee nominal directly
    fee = parseFloat(elFee?.value) || 0;
    ppn = Math.round(fee * (ppnPct / 100));
    if (elPpn) elPpn.value = ppn;
  } else if (trigger === 'ppn_manual') {
    // User edited ppn nominal directly
    fee = parseFloat(elFee?.value) || 0;
    ppn = parseFloat(elPpn?.value) || 0;
  } else if (trigger === 'ppn_pct') {
    // User edited PPN percentage
    fee = parseFloat(elFee?.value) || 0;
    ppn = Math.round(fee * (ppnPct / 100));
    if (elPpn) elPpn.value = ppn;
  } else {
    // trigger === 'amount' or 'fee_pct': recalculate fee and ppn from percentages
    fee = Math.round(amount * (feePct / 100));
    ppn = Math.round(fee * (ppnPct / 100));
    if (elFee) elFee.value = fee;
    if (elPpn) elPpn.value = ppn;
  }

  const total = amount + fee + ppn;

  if (elTotInput) elTotInput.value = total;
  if (elTotDisplay) elTotDisplay.textContent = formatRupiah(total);
  if (elFormulaDesc) {
    elFormulaDesc.textContent = `Pokok: ${formatRupiah(amount)} + Fee (${feePct}%): ${formatRupiah(fee)} + PPN (${ppnPct}%): ${formatRupiah(ppn)}`;
  }
}

function onMetaFeePctChange() {
  calculateMetaModalFees('fee_pct');
}

function onMetaPpnPctChange() {
  calculateMetaModalFees('ppn_pct');
}

function onMetaFeeManualChange() {
  calculateMetaModalFees('fee_manual');
}

function onMetaPpnManualChange() {
  calculateMetaModalFees('ppn_manual');
}

function openAddMetaAdsModal() {
  document.getElementById('meta-modal-title').textContent = 'Catat Pengeluaran Iklan (Meta)';
  document.getElementById('meta-modal-id').value = '';
  const storeSelect = document.getElementById('meta-modal-store');
  if (storeSelect) {
    storeSelect.value = (currentStoreFilter && currentStoreFilter !== 'all') ? currentStoreFilter : 'company';
  }
  document.getElementById('meta-modal-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('meta-modal-payment').value = 'Kartu Kredit / Debit Online';
  document.getElementById('meta-modal-campaign').value = '';
  document.getElementById('meta-modal-account').value = '';
  document.getElementById('meta-modal-amount').value = '';

  const elFeePct = document.getElementById('meta-modal-fee-pct');
  if (elFeePct) elFeePct.value = '5';
  const elPpnPct = document.getElementById('meta-modal-ppn-pct');
  if (elPpnPct) elPpnPct.value = '11';
  
  const elFee = document.getElementById('meta-modal-fee');
  if (elFee) elFee.value = '';
  const elPpn = document.getElementById('meta-modal-ppn');
  if (elPpn) elPpn.value = '';
  const elTotInput = document.getElementById('meta-modal-total');
  if (elTotInput) elTotInput.value = '0';
  const elTotDisplay = document.getElementById('meta-modal-total-display');
  if (elTotDisplay) elTotDisplay.textContent = 'Rp 0';
  const elFormulaDesc = document.getElementById('meta-modal-total-formula-desc');
  if (elFormulaDesc) elFormulaDesc.textContent = 'Biaya Iklan Pokok + Top Up Fee + PPN';

  document.getElementById('meta-modal-notes').value = '';
  openModal('modal-meta-ads');
}

function saveMetaAdsFromModal() {
  const store = db.getStore();
  if (!store.metaAds) store.metaAds = [];

  const id = document.getElementById('meta-modal-id').value;
  const storeId = document.getElementById('meta-modal-store')?.value || (currentStoreFilter !== 'all' ? currentStoreFilter : 'company');
  const storeMeta = getStoreMeta(storeId);
  const storeAccount = storeMeta ? storeMeta.name : (storeId === 'company' ? 'Konsolidasi Perusahaan' : 'Nalatiqa Health');
  const date = document.getElementById('meta-modal-date').value;
  const paymentMethod = document.getElementById('meta-modal-payment').value;
  const campaignName = document.getElementById('meta-modal-campaign').value.trim();
  const accountName = document.getElementById('meta-modal-account').value.trim();
  const amount = parseFloat(document.getElementById('meta-modal-amount').value) || 0;
  
  // Ambil nilai persentase dan nominal yang dihitung otomatis atau diedit manual oleh user
  const feePercent = parseFloat(document.getElementById('meta-modal-fee-pct')?.value) || 5;
  const topUpFee = parseFloat(document.getElementById('meta-modal-fee')?.value) || 0;
  const ppnPercent = parseFloat(document.getElementById('meta-modal-ppn-pct')?.value) || 11;
  const ppnAmount = parseFloat(document.getElementById('meta-modal-ppn')?.value) || 0;
  const totalAmount = amount + topUpFee + ppnAmount;

  const notes = document.getElementById('meta-modal-notes').value.trim();

  if (!date) {
    alert('Harap pilih tanggal pengeluaran iklan Meta!');
    return;
  }
  if (!campaignName) {
    alert('Harap isi nama campaign / materi iklan!');
    return;
  }
  if (amount <= 0) {
    alert('Jumlah biaya iklan Meta harus lebih dari Rp 0!');
    return;
  }

  if (id) {
    const idx = store.metaAds.findIndex(m => m.id === id);
    if (idx !== -1) {
      store.metaAds[idx] = {
        ...store.metaAds[idx],
        storeId,
        storeAccount,
        date,
        paymentMethod,
        campaignName,
        accountName,
        amount,
        feePercent,
        topUpFee,
        ppnPercent,
        ppnAmount,
        totalAmount,
        notes
      };
    }
  } else {
    const newMetaAd = {
      id: `META-${Date.now()}`,
      storeId,
      storeAccount,
      date,
      paymentMethod,
      campaignName,
      accountName,
      amount,
      feePercent,
      topUpFee,
      ppnPercent,
      ppnAmount,
      totalAmount,
      notes
    };
    store.metaAds.unshift(newMetaAd);
  }

  db.saveData(store);
  closeModal('modal-meta-ads');
  renderCurrentView();
}

function editMetaAds(id) {
  const store = db.getStore();
  const item = (store.metaAds || []).find(m => m.id === id);
  if (!item) return;

  document.getElementById('meta-modal-title').textContent = 'Edit Pengeluaran Iklan (Meta)';
  document.getElementById('meta-modal-id').value = item.id;
  const storeSelect = document.getElementById('meta-modal-store');
  if (storeSelect) {
    storeSelect.value = item.storeId || 'company';
  }
  document.getElementById('meta-modal-date').value = item.date || new Date().toISOString().split('T')[0];
  document.getElementById('meta-modal-payment').value = item.paymentMethod || 'Kartu Kredit / Debit Online';
  document.getElementById('meta-modal-campaign').value = item.campaignName || '';
  document.getElementById('meta-modal-account').value = item.accountName || '';
  document.getElementById('meta-modal-amount').value = item.amount || 0;

  const amt = Number(item.amount || 0);
  const feePct = item.feePercent !== undefined ? Number(item.feePercent) : 5;
  const ppnPct = item.ppnPercent !== undefined ? Number(item.ppnPercent) : 11;
  const fee = item.topUpFee !== undefined ? Number(item.topUpFee) : Math.round(amt * (feePct / 100));
  const ppn = item.ppnAmount !== undefined ? Number(item.ppnAmount) : Math.round(fee * (ppnPct / 100));
  const total = item.totalAmount !== undefined ? Number(item.totalAmount) : (amt + fee + ppn);

  const elFeePct = document.getElementById('meta-modal-fee-pct');
  if (elFeePct) elFeePct.value = feePct;
  const elPpnPct = document.getElementById('meta-modal-ppn-pct');
  if (elPpnPct) elPpnPct.value = ppnPct;

  const elFee = document.getElementById('meta-modal-fee');
  if (elFee) elFee.value = fee;
  const elPpn = document.getElementById('meta-modal-ppn');
  if (elPpn) elPpn.value = ppn;
  const elTotInput = document.getElementById('meta-modal-total');
  if (elTotInput) elTotInput.value = total;
  const elTotDisplay = document.getElementById('meta-modal-total-display');
  if (elTotDisplay) elTotDisplay.textContent = formatRupiah(total);
  const elFormulaDesc = document.getElementById('meta-modal-total-formula-desc');
  if (elFormulaDesc) {
    elFormulaDesc.textContent = `Pokok: ${formatRupiah(amt)} + Fee (${feePct}%): ${formatRupiah(fee)} + PPN (${ppnPct}%): ${formatRupiah(ppn)}`;
  }

  document.getElementById('meta-modal-notes').value = item.notes || '';

  openModal('modal-meta-ads');
}

function deleteMetaAds(id) {
  if (confirm('Apakah Anda yakin ingin menghapus catatan pengeluaran iklan Meta ini?')) {
    const store = db.getStore();
    store.metaAds = (store.metaAds || []).filter(m => m.id !== id);
    db.saveData(store);
    renderCurrentView();
  }
}

// ==========================================
// MODUL: BUKU KAS & MODAL USAHA TOKO
// (Pinjaman Hutang, Laba Diputar, Modal Pemilik, Pembayaran Cicilan)
// ==========================================

function renderCapitalView() {
  const metrics = computeMetrics();
  const store = db.getStore();
  const rawCapital = store.capitalInjections || [];

  // Auto-heal: Pastikan seluruh modal kas masuk awal (sebesar Rp 29.000.000) tercatat di level 'company' (Kas Perusahaan)
  let hasHealed = false;
  rawCapital.forEach(c => {
    if (!c.storeId || c.storeId === 'all') {
      c.storeId = 'company';
      c.storeAccount = 'Holding Perusahaan';
      hasHealed = true;
    }
  });
  if (hasHealed) {
    db.saveData(store);
  }

  const isConsolidated = currentStoreFilter === 'all' || currentStoreFilter === 'company';

  // Update KPI Cards on Kas & Modal View
  const elTotal = document.getElementById('capital-total-display');
  if (elTotal) elTotal.textContent = formatRupiah(metrics.totalCapitalIn);

  const elCount = document.getElementById('capital-count-display');
  if (elCount) {
    const activeList = rawCapital.filter(c => {
      const cStore = c.storeId || 'company';
      return isConsolidated ? true : cStore === currentStoreFilter;
    });
    const inCount = activeList.filter(c => c.category !== 'bayar_hutang').length;
    elCount.textContent = `${inCount} transaksi modal masuk`;
  }

  const elDebt = document.getElementById('capital-debt-display');
  if (elDebt) elDebt.textContent = formatRupiah(metrics.totalDebtIn);

  const elDebtRem = document.getElementById('capital-debt-remaining');
  if (elDebtRem) {
    elDebtRem.textContent = `Sisa Hutang: ${formatRupiah(metrics.remainingDebt)}`;
    elDebtRem.style.color = metrics.remainingDebt > 0 ? '#b91c1c' : '#059669';
  }

  // Compute 25% Reinvest Total from active profit sharing allocation
  const isSettlement = profitSharingBasis === 'settlement';
  const rawBase = isSettlement ? Number(metrics.netSettlement || 0) : Number(metrics.netProfit || 0);
  const baseAmount = Math.max(0, Math.round(rawBase));
  const quarterAmount = Math.round(baseAmount / 4);
  const withdrawnTotal = quarterAmount * 3;
  const autoReinvest25 = Math.max(0, baseAmount - withdrawnTotal);
  const displayCapitalProfit = (metrics.totalProfitReinvest && metrics.totalProfitReinvest > 0)
    ? metrics.totalProfitReinvest
    : autoReinvest25;

  const elProfit = document.getElementById('capital-profit-display');
  if (elProfit) elProfit.textContent = formatRupiah(displayCapitalProfit);

  const elOwner = document.getElementById('capital-owner-display');
  if (elOwner) elOwner.textContent = formatRupiah(metrics.totalOwnerCapital + metrics.totalInvestorCapital);

  const elCashBal = document.getElementById('capital-cash-balance-display');
  if (elCashBal) {
    elCashBal.textContent = formatRupiah(metrics.netCashBalance);
    elCashBal.style.color = metrics.netCashBalance >= 0 ? '#047857' : '#b91c1c';
  }

  // Info banner when in specific store mode
  const storeBanner = document.getElementById('capital-store-banner');
  if (storeBanner) {
    if (!isConsolidated) {
      const storeMeta = getStoreMeta(currentStoreFilter);
      storeBanner.style.display = 'block';
      storeBanner.innerHTML = `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: var(--radius-md); padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 24px;">🏢</div>
            <div>
              <div style="font-weight: 800; color: #166534; font-size: 14px;">Total Modal Kas Masuk (Rp 29.000.000) Terpusat di Kas Perusahaan (Holding)</div>
              <div style="font-size: 12px; color: #15803d; margin-top: 2px;">
                Akun <strong>${storeMeta.name}</strong> adalah unit toko yang menghasilkan kas murni dari penjualan marketplace. Modal usaha dan pinjaman KUR dikelola di level <strong>Kas Perusahaan (Semua Toko)</strong>.
              </div>
            </div>
          </div>
          <button class="btn btn-sm btn-outline-primary" onclick="setStoreFilter('all')" style="font-weight: 700; background: #ffffff;">
            Lihat Kas Perusahaan &rarr;
          </button>
        </div>
      `;
    } else {
      storeBanner.style.display = 'none';
      storeBanner.innerHTML = '';
    }
  }

  renderCapitalTable();
}

function renderCapitalTable() {
  const tbody = document.getElementById('capital-tbody');
  if (!tbody) return;

  const store = db.getStore();
  if (!store.capitalInjections) store.capitalInjections = [];

  const searchVal = (document.getElementById('capital-search')?.value || '').toLowerCase().trim();
  const catFilter = document.getElementById('capital-category-filter')?.value || 'all';

  let list = [...store.capitalInjections];
  if (currentStoreFilter !== 'all') {
    list = list.filter(item => (item.storeId || 'company') === currentStoreFilter);
  }

  if (catFilter !== 'all') {
    list = list.filter(item => item.category === catFilter);
  }

  if (searchVal) {
    list = list.filter(item => {
      const src = (item.source || '').toLowerCase();
      const notes = (item.notes || '').toLowerCase();
      const acc = (item.account || '').toLowerCase();
      const terms = (item.debtTerms || '').toLowerCase();
      return src.includes(searchVal) || notes.includes(searchVal) || acc.includes(searchVal) || terms.includes(searchVal);
    });
  }

  // Sort by date descending
  list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  if (list.length === 0) {
    renderPaginationBar('capital-pagination', 'capital', { total: 0 }, 'renderCapitalTable');
    const masterCap = document.getElementById('select-all-capital');
    if (masterCap) { masterCap.checked = false; masterCap.indeterminate = false; }
    updateBulkDeleteCapitalButtonState();

    if (currentStoreFilter !== 'all') {
      const storeMeta = getStoreMeta(currentStoreFilter);
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 36px; color: var(--text-muted);">
            <div style="font-size: 28px; margin-bottom: 8px;">🏢</div>
            <div style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Tidak Ada Catatan Modal Kas Khusus Toko ${storeMeta.name}</div>
            <div style="font-size: 13px; max-width: 540px; margin: 0 auto 16px auto; color: var(--text-muted); line-height: 1.5;">
              Toko ${storeMeta.name} menghasilkan pendapatan kas dari <strong>penjualan marketplace</strong>.<br>
              Total modal kas uang masuk sebesar Rp 29.000.000 dicatat dan dikelola pada <strong>Kas Perusahaan (Konsolidasi Perusahaan)</strong>.
            </div>
            <button class="btn btn-outline-primary btn-sm" onclick="setStoreFilter('all')" style="font-weight: 700;">
              Lihat Kas & Permodalan Perusahaan (Semua Toko) &rarr;
            </button>
          </td>
        </tr>
      `;
    } else if (store.capitalInjections.length > 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 36px; color: var(--text-light);">
            <div style="font-size: 15px; font-weight: 600; margin-bottom: 6px;">Tidak Ada Data yang Cocok</div>
            <div style="font-size: 13px; margin-bottom: 14px;">Tidak ditemukan catatan modal yang sesuai dengan kata kunci pencarian atau filter kategori yang dipilih.</div>
            <button class="btn btn-outline btn-sm" onclick="document.getElementById('capital-search').value=''; document.getElementById('capital-category-filter').value='all'; renderCapitalTable();">Reset Filter</button>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 36px; color: var(--text-light);">
            <div style="font-size: 15px; font-weight: 600; margin-bottom: 6px;">Belum Ada Catatan Kas & Modal Usaha</div>
            <div style="font-size: 13px; margin-bottom: 14px;">Tambahkan modal awal dari pinjaman hutang bank/KUR, modal dari keuntungan toko, atau modal pribadi pemilik.</div>
            <button class="btn btn-primary btn-sm" onclick="openAddCapitalModal()" style="background: #10b981; border-color: #059669; color: white;">+ Tambah Modal Kas Baru</button>
          </td>
        </tr>
      `;
    }
    return;
  }

  const paged = getPaginationSlice('capital', list);
  renderPaginationBar('capital-pagination', 'capital', paged, 'renderCapitalTable');

  const masterCap = document.getElementById('select-all-capital');
  if (masterCap) { masterCap.checked = false; masterCap.indeterminate = false; }
  updateBulkDeleteCapitalButtonState();

  const categoryLabels = {
    pinjaman_hutang: { label: 'Pinjaman / Hutang', badgeClass: 'badge-debt' },
    laba_keuntungan: { label: 'Laba Toko Diputar', badgeClass: 'badge-profit-reinvest' },
    modal_pemilik: { label: 'Modal Pribadi', badgeClass: 'badge-owner-equity' },
    investor_lainnya: { label: 'Modal Investor', badgeClass: 'badge-investor' },
    bayar_hutang: { label: 'Bayar Cicilan Hutang', badgeClass: 'badge-repay' },
    prive_penarikan: { label: 'Pencairan Bagi Hasil (Prive)', badgeClass: 'badge-profit-reinvest' }
  };

  tbody.innerHTML = paged.items.map(item => {
    const catInfo = categoryLabels[item.category] || { label: item.category || 'Lainnya', badgeClass: 'badge-default' };
    const isOutflow = item.category === 'bayar_hutang' || item.category === 'prive_penarikan';
    const amountFormatted = formatRupiah(item.amount || 0);

    let debtStatusHtml = '<span style="color: #94a3b8; font-size: 12px;">-</span>';
    let payActionBtn = '';

    if (item.category === 'pinjaman_hutang') {
      const allPayments = store.capitalInjections.filter(c => c.category === 'bayar_hutang' && c.parentDebtId === item.id);
      const totalPaid = allPayments.reduce((sum, c) => sum + Number(c.amount || 0), 0);
      const remaining = Math.max(0, Number(item.amount || 0) - totalPaid);

      if (remaining === 0) {
        debtStatusHtml = `<span style="color: #059669; font-weight: 700; font-size: 12px; background: #d1fae5; padding: 2px 8px; border-radius: 4px;">LUNAS</span>`;
      } else {
        debtStatusHtml = `
          <div style="font-size: 12px; font-weight: 700; color: #b91c1c;">Sisa: ${formatRupiah(remaining)}</div>
          <div style="font-size: 11px; color: #64748b;">Dibayar: ${formatRupiah(totalPaid)}</div>
          ${item.dueDate ? `<div style="font-size: 11px; color: #6d28d9; margin-top: 2px;">Tempo: ${item.dueDate}</div>` : ''}
        `;
        payActionBtn = `
          <button class="btn btn-outline-danger btn-xs" onclick="openPayDebtModal('${item.id}')" title="Bayar cicilan pinjaman ini" style="font-size: 11px; padding: 2px 8px; margin-right: 4px;">
            + Bayar
          </button>
        `;
      }
    } else if (item.category === 'bayar_hutang') {
      const parent = store.capitalInjections.find(c => c.id === item.parentDebtId);
      debtStatusHtml = `
        <div style="font-size: 12px; color: #475569;">Cicilan untuk:</div>
        <div style="font-size: 11px; font-weight: 600; color: #0284c7;">${escapeHtml(parent ? parent.source : 'Pinjaman Toko')}</div>
      `;
    }

    return `
      <tr>
        <td style="text-align: center;">
          <input type="checkbox" class="capital-checkbox" value="${item.id}" onchange="handleCapitalCheckboxChange()" style="cursor: pointer; width: 16px; height: 16px; accent-color: #10b981;">
        </td>
        <td style="white-space: nowrap; font-weight: 500;">${item.date || '-'}</td>
        <td>${getStoreBadgeHtml(item.storeId || 'company')}</td>
        <td><span class="badge ${catInfo.badgeClass}">${catInfo.label}</span></td>
        <td>
          <div style="font-weight: 600; color: var(--text-dark);">${escapeHtml(item.source || '-')}</div>
          ${item.debtTerms ? `<div style="font-size: 11px; color: #6d28d9;">Ketentuan: ${escapeHtml(item.debtTerms)}</div>` : ''}
        </td>
        <td>
          <div style="color: var(--text); font-size: 13px;">${escapeHtml(item.notes || '-')}</div>
        </td>
        <td style="white-space: nowrap;">
          ${isOutflow 
            ? `<span style="color: #b91c1c; font-weight: 700;">-${amountFormatted}</span><br><small style="color: #e11d48; font-size: 10px;">(Kas Keluar)</small>` 
            : `<span style="color: #047857; font-weight: 700;">+${amountFormatted}</span><br><small style="color: #059669; font-size: 10px;">(Kas Masuk)</small>`}
        </td>
        <td>${debtStatusHtml}</td>
        <td style="font-size: 12px; color: #475569;">${escapeHtml(item.account || 'Rekening Utama')}</td>
        <td style="text-align: right; white-space: nowrap;">
          ${payActionBtn}
          ${!isOutflow ? `<button class="btn btn-outline btn-xs" onclick="editCapital('${item.id}')" style="margin-right: 4px; font-size: 11px; padding: 2px 8px;">Edit</button>` : ''}
          <button class="btn btn-outline-danger btn-xs" onclick="deleteCapital('${item.id}')" style="font-size: 11px; padding: 2px 8px;">Hapus</button>
        </td>
      </tr>
    `;
  }).join('');
}

// Bulk Selection & Mass Delete for Capital & Cash (Buku Kas & Modal Usaha)
function toggleSelectAllCapital(master) {
  const checkboxes = document.querySelectorAll('.capital-checkbox');
  checkboxes.forEach(cb => { cb.checked = master.checked; });
  updateBulkDeleteCapitalButtonState();
}

function handleCapitalCheckboxChange() {
  const checkboxes = document.querySelectorAll('.capital-checkbox');
  const checked = document.querySelectorAll('.capital-checkbox:checked');
  const master = document.getElementById('select-all-capital');
  if (master) {
    master.checked = checkboxes.length > 0 && checkboxes.length === checked.length;
    master.indeterminate = checked.length > 0 && checked.length < checkboxes.length;
  }
  updateBulkDeleteCapitalButtonState();
}

function updateBulkDeleteCapitalButtonState() {
  const checked = document.querySelectorAll('.capital-checkbox:checked');
  const btn = document.getElementById('btn-bulk-delete-capital');
  const countSpan = document.getElementById('selected-capital-count');
  if (btn) {
    if (checked.length > 0) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      btn.style.display = 'inline-flex';
      btn.style.backgroundColor = 'var(--danger)';
      btn.style.color = '#ffffff';
      if (countSpan) countSpan.textContent = checked.length;
    } else {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
      btn.style.display = 'inline-flex';
      btn.style.backgroundColor = '';
      btn.style.color = '';
      if (countSpan) countSpan.textContent = '0';
    }
  }
}

function bulkDeleteSelectedCapital() {
  const checked = document.querySelectorAll('.capital-checkbox:checked');
  const count = checked.length;
  if (count === 0) {
    alert('Pilih minimal satu catatan kas & modal untuk dihapus.');
    return;
  }

  if (confirm(`Apakah Anda yakin ingin menghapus ${count} catatan kas & modal yang dipilih?\nJika terdapat pinjaman yang dihapus, data pembayaran cicilan terkait juga akan ikut dibersihkan.`)) {
    const selectedIds = new Set(Array.from(checked).map(cb => cb.value));
    const store = db.getStore();
    store.capitalInjections = (store.capitalInjections || []).filter(c => !selectedIds.has(c.id) && !selectedIds.has(c.parentDebtId));
    db.saveData(store);

    if (typeof showToast === 'function') {
      showToast(`${count} catatan kas modal berhasil dihapus!`, 'success');
    } else {
      alert(`${count} catatan kas modal berhasil dihapus!`);
    }
    renderCurrentView();
    renderDashboard();
  }
}

function openAddCapitalModal(category = 'pinjaman_hutang') {
  document.getElementById('capital-modal-title').textContent = 'Tambah Kas & Modal Usaha';
  document.getElementById('capital-modal-id').value = '';
  const storeSelect = document.getElementById('capital-modal-store');
  if (storeSelect) {
    storeSelect.value = 'company';
  }
  document.getElementById('capital-modal-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('capital-modal-category').value = category;
  document.getElementById('capital-modal-amount').value = '';
  document.getElementById('capital-modal-source').value = '';
  document.getElementById('capital-modal-account').value = 'Rekening Bank Utama (BCA)';
  document.getElementById('capital-modal-notes').value = '';
  document.getElementById('capital-modal-duedate').value = '';
  document.getElementById('capital-modal-debt-terms').value = '';

  handleCapitalCategoryChange();
  openModal('modal-capital');
}

function handleCapitalCategoryChange() {
  const cat = document.getElementById('capital-modal-category')?.value;
  const debtFields = document.getElementById('capital-debt-fields');
  const sourceLabel = document.querySelector('label[for="capital-modal-source"]') || document.getElementById('capital-modal-source')?.previousElementSibling;

  if (debtFields) {
    debtFields.style.display = (cat === 'pinjaman_hutang') ? 'block' : 'none';
  }

  const srcInput = document.getElementById('capital-modal-source');
  if (srcInput) {
    if (cat === 'pinjaman_hutang') {
      srcInput.placeholder = 'Contoh: Bank Mandiri (KUR) / BNI / Pinjaman Keluarga';
    } else if (cat === 'laba_keuntungan') {
      srcInput.placeholder = 'Contoh: Laba Bersih Toko Bulan September (Reinvestasi)';
    } else if (cat === 'modal_pemilik') {
      srcInput.placeholder = 'Contoh: Tabungan Pribadi Pemilik Toko';
    } else if (cat === 'prive_penarikan') {
      srcInput.placeholder = 'Contoh: Pencairan Hak Penghasilan Romie (25%) via Transfer Rekening';
    } else {
      srcInput.placeholder = 'Contoh: Investor Mitra / Rekan Bisnis';
    }
  }
}

function saveCapitalFromModal() {
  const store = db.getStore();
  if (!store.capitalInjections) store.capitalInjections = [];

  const id = document.getElementById('capital-modal-id').value;
  const storeId = document.getElementById('capital-modal-store')?.value || (currentStoreFilter !== 'all' ? currentStoreFilter : 'company');
  const storeMeta = getStoreMeta(storeId);
  const storeAccount = storeMeta ? storeMeta.name : (storeId === 'company' ? 'Konsolidasi Perusahaan' : 'Nalatiqa Health');
  const date = document.getElementById('capital-modal-date').value;
  const category = document.getElementById('capital-modal-category').value;
  const amount = parseFloat(document.getElementById('capital-modal-amount').value) || 0;
  const source = document.getElementById('capital-modal-source').value.trim();
  const account = document.getElementById('capital-modal-account').value;
  const notes = document.getElementById('capital-modal-notes').value.trim();
  const dueDate = document.getElementById('capital-modal-duedate').value;
  const debtTerms = document.getElementById('capital-modal-debt-terms').value.trim();

  if (!date) {
    alert('Harap masukkan tanggal transaksi modal!');
    return;
  }
  if (!source) {
    alert('Harap masukkan sumber dana / nama pihak penyedia modal!');
    return;
  }
  if (amount <= 0) {
    alert('Jumlah modal harus lebih besar dari Rp 0!');
    return;
  }

  if (id) {
    const idx = store.capitalInjections.findIndex(c => c.id === id);
    if (idx !== -1) {
      store.capitalInjections[idx] = {
        ...store.capitalInjections[idx],
        storeId,
        storeAccount,
        date,
        category,
        amount,
        source,
        account,
        notes,
        dueDate: category === 'pinjaman_hutang' ? dueDate : '',
        debtTerms: category === 'pinjaman_hutang' ? debtTerms : ''
      };
    }
  } else {
    const newCapital = {
      id: `CAP-${Date.now()}`,
      storeId,
      storeAccount,
      date,
      category,
      amount,
      source,
      account,
      notes,
      dueDate: category === 'pinjaman_hutang' ? dueDate : '',
      debtTerms: category === 'pinjaman_hutang' ? debtTerms : ''
    };
    store.capitalInjections.unshift(newCapital);
  }

  db.saveData(store);
  closeModal('modal-capital');
  renderCurrentView();
  renderDashboard();
}

function editCapital(id) {
  const store = db.getStore();
  const item = (store.capitalInjections || []).find(c => c.id === id);
  if (!item) return;

  document.getElementById('capital-modal-title').textContent = 'Edit Kas & Modal Usaha';
  document.getElementById('capital-modal-id').value = item.id;
  const storeSelect = document.getElementById('capital-modal-store');
  if (storeSelect) {
    storeSelect.value = item.storeId || 'company';
  }
  document.getElementById('capital-modal-date').value = item.date || new Date().toISOString().split('T')[0];
  document.getElementById('capital-modal-category').value = item.category || 'pinjaman_hutang';
  document.getElementById('capital-modal-amount').value = item.amount || 0;
  document.getElementById('capital-modal-source').value = item.source || '';
  document.getElementById('capital-modal-account').value = item.account || 'Rekening Bank Utama (BCA)';
  document.getElementById('capital-modal-notes').value = item.notes || '';
  document.getElementById('capital-modal-duedate').value = item.dueDate || '';
  document.getElementById('capital-modal-debt-terms').value = item.debtTerms || '';

  handleCapitalCategoryChange();
  openModal('modal-capital');
}

function deleteCapital(id) {
  const store = db.getStore();
  const item = (store.capitalInjections || []).find(c => c.id === id);
  if (!item) return;

  const isDebt = item.category === 'pinjaman_hutang';
  let confirmMsg = 'Apakah Anda yakin ingin menghapus catatan kas modal ini?';

  if (isDebt) {
    const linkedPayments = (store.capitalInjections || []).filter(c => c.category === 'bayar_hutang' && c.parentDebtId === id);
    if (linkedPayments.length > 0) {
      confirmMsg = `Catatan pinjaman ini memiliki ${linkedPayments.length} riwayat pembayaran cicilan.\nMenghapus pinjaman ini juga akan menghapus data pembayaran terkait. Lanjutkan?`;
    }
  }

  if (confirm(confirmMsg)) {
    store.capitalInjections = (store.capitalInjections || []).filter(c => c.id !== id && c.parentDebtId !== id);
    db.saveData(store);
    renderCurrentView();
    renderDashboard();
  }
}

function openPayDebtModal(targetDebtId = null) {
  const store = db.getStore();
  const debts = (store.capitalInjections || []).filter(c => c.category === 'pinjaman_hutang');

  if (debts.length === 0) {
    alert('Belum ada catatan Pinjaman / Hutang Usaha yang tersimpan.\nSilakan tambahkan pinjaman terlebih dahulu di tombol "+ Tambah Modal Kas Usaha".');
    return;
  }

  const select = document.getElementById('paydebt-target-select');
  if (!select) return;

  select.innerHTML = debts.map(d => {
    const paid = (store.capitalInjections || []).filter(c => c.category === 'bayar_hutang' && c.parentDebtId === d.id).reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const rem = Math.max(0, Number(d.amount || 0) - paid);
    return `<option value="${d.id}" ${d.id === targetDebtId ? 'selected' : ''}>${escapeHtml(d.source)} (Pinjaman: ${formatRupiah(d.amount)} - Sisa: ${formatRupiah(rem)})</option>`;
  }).join('');

  if (targetDebtId) {
    select.value = targetDebtId;
  }

  handlePayDebtTargetChange();

  document.getElementById('paydebt-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('paydebt-amount').value = '';
  document.getElementById('paydebt-notes').value = '';

  openModal('modal-pay-debt');
}

function handlePayDebtTargetChange() {
  const store = db.getStore();
  const select = document.getElementById('paydebt-target-select');
  if (!select) return;

  const debtId = select.value;
  const debt = (store.capitalInjections || []).find(d => d.id === debtId);
  if (!debt) return;

  const paid = (store.capitalInjections || []).filter(c => c.category === 'bayar_hutang' && c.parentDebtId === debt.id).reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const remaining = Math.max(0, Number(debt.amount || 0) - paid);

  document.getElementById('paydebt-info-source').textContent = debt.source || '-';
  document.getElementById('paydebt-info-original').textContent = formatRupiah(debt.amount || 0);
  document.getElementById('paydebt-info-remaining').textContent = formatRupiah(remaining);
  if (remaining === 0) {
    document.getElementById('paydebt-info-remaining').textContent += ' (SUDAH LUNAS)';
  }
}

function saveDebtPaymentFromModal() {
  const store = db.getStore();
  if (!store.capitalInjections) store.capitalInjections = [];

  const debtId = document.getElementById('paydebt-target-select').value;
  const date = document.getElementById('paydebt-date').value;
  const amount = parseFloat(document.getElementById('paydebt-amount').value) || 0;
  const account = document.getElementById('paydebt-account').value;
  const notes = document.getElementById('paydebt-notes').value.trim();

  if (!debtId) {
    alert('Harap pilih pinjaman yang akan dibayar!');
    return;
  }
  if (!date) {
    alert('Harap pilih tanggal pembayaran cicilan hutang!');
    return;
  }
  if (amount <= 0) {
    alert('Nominal cicilan/pelunasan harus lebih besar dari Rp 0!');
    return;
  }

  const parentDebt = store.capitalInjections.find(d => d.id === debtId);
  const parentStoreId = parentDebt ? (parentDebt.storeId || 'company') : 'company';
  const storeMeta = getStoreMeta(parentStoreId);
  const newPayment = {
    id: `CAP-PAY-${Date.now()}`,
    storeId: parentStoreId,
    storeAccount: storeMeta ? storeMeta.name : (parentStoreId === 'company' ? 'Konsolidasi Perusahaan' : 'Nalatiqa Health'),
    date,
    category: 'bayar_hutang',
    parentDebtId: debtId,
    source: `Cicilan: ${parentDebt ? parentDebt.source : 'Pinjaman Toko'}`,
    amount,
    account: account || 'Rekening Bank Utama (BCA)',
    notes: notes || 'Pembayaran cicilan pokok hutang usaha'
  };

  store.capitalInjections.unshift(newPayment);
  db.saveData(store);
  closeModal('modal-pay-debt');
  renderCurrentView();
  renderDashboard();
}

// Save Settings
function saveStoreSettings() {
  const store = db.getStore();
  if (!store.settings) store.settings = {};
  store.settings.storeName = document.getElementById('setting-store-name')?.value.trim() || 'PT NALATIQA GROUP';
  store.settings.ownerName = document.getElementById('setting-owner-name')?.value.trim() || '';

  db.saveData(store);
  alert('Pengaturan profil toko berhasil disimpan!');
  renderDashboard();
}

// Backup & Restore
function exportDatabaseToFile() {
  const store = db.getStore();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(store, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `Backup_BukuToko_${new Date().toISOString().split('T')[0]}.json`);
  dlAnchor.click();
}

function importDatabaseFromFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed && parsed.transactions && parsed.settings) {
        if (confirm('Apakah Anda yakin ingin memulihkan (restore) data ini? Data yang ada saat ini akan ditimpa.')) {
          db.saveData(parsed);
          alert('Data berhasil dipulihkan!');
          renderCurrentView();
        }
      } else {
        alert('Format file backup tidak valid!');
      }
    } catch (err) {
      alert('Gagal membaca file JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
}

// Modal Utility Functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('show');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('show');
}

// Date Filter Actions
function setDateFilter(filterType) {
  dateFilter = filterType;
  Object.keys(paginationState).forEach(k => paginationState[k].page = 1);
  document.querySelectorAll('.filter-date-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filterType);
  });

  const customBox = document.getElementById('custom-date-container');
  if (customBox) {
    customBox.style.display = filterType === 'custom' ? 'inline-flex' : 'none';
  }

  if (filterType === 'custom') {
    const startInput = document.getElementById('custom-date-start');
    const endInput = document.getElementById('custom-date-end');
    
    // Auto-prefill dates if empty
    if (startInput && !startInput.value) {
      const store = db.getStore();
      const allDates = (store.transactions || []).map(t => (t.date || '').replace(/\//g, '-').split('T')[0]).filter(Boolean).sort();
      if (allDates.length > 0) {
        startInput.value = customStartDate || allDates[0];
      } else {
        const now = new Date();
        startInput.value = customStartDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      }
      customStartDate = startInput.value;
    }
    if (endInput && !endInput.value) {
      const store = db.getStore();
      const allDates = (store.transactions || []).map(t => (t.date || '').replace(/\//g, '-').split('T')[0]).filter(Boolean).sort();
      if (allDates.length > 0) {
        endInput.value = customEndDate || allDates[allDates.length - 1];
      } else {
        const now = new Date();
        endInput.value = customEndDate || now.toISOString().split('T')[0];
      }
      customEndDate = endInput.value;
    }
  }

  renderCurrentView();
}

function applyCustomDateFilter() {
  const startInput = document.getElementById('custom-date-start');
  const endInput = document.getElementById('custom-date-end');
  if (!startInput || !endInput) return;

  const startVal = startInput.value;
  const endVal = endInput.value;

  if (startVal && endVal && startVal > endVal) {
    alert('Tanggal mulai ("Dari") tidak boleh lebih besar dari tanggal akhir ("s/d")!');
    return;
  }

  customStartDate = startVal;
  customEndDate = endVal;
  dateFilter = 'custom';

  document.querySelectorAll('.filter-date-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === 'custom');
  });

  const customBox = document.getElementById('custom-date-container');
  if (customBox) {
    customBox.style.display = 'inline-flex';
  }

  renderCurrentView();
}

function setChannelFilter(channel) {
  channelFilter = channel;
  Object.keys(paginationState).forEach(k => paginationState[k].page = 1);
  document.querySelectorAll('.filter-channel-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.channel === channel);
  });
  renderCurrentView();
}

// Reset Database Handler
function handleResetDatabase() {
  if (confirm('PERINGATAN: Apakah Anda yakin ingin mengembalikan data ke contoh simulasi (Demo)? Semua data inputan Anda akan direset.')) {
    db.resetToDemo();
    alert('Database telah diatur kembali ke Data Contoh.');
    renderCurrentView();
  }
}

function handleClearDatabase() {
  if (confirm('PERINGATAN KERAS: Semua data penjualan, produk, dan pengeluaran akan DIHAPUS KOSONG. Tindakan ini tidak dapat dibatalkan.')) {
    db.clearAllData();
    alert('Database berhasil dikosongkan.');
    renderCurrentView();
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.currentTarget.dataset.tab;
      if (tab) switchTab(tab);
    });
  });

  document.querySelectorAll('.filter-date-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      setDateFilter(e.target.dataset.filter);
    });
  });

  document.querySelectorAll('.filter-channel-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      setChannelFilter(e.target.dataset.channel);
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(m => {
    m.addEventListener('click', (e) => {
      if (e.target === m) closeModal(m.id);
    });
  });

  setupDropzoneEvents();
  switchTab('dashboard');
});
