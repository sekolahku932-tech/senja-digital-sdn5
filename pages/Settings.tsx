
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Upload, Save, Image as ImageIcon, RefreshCcw, CheckCircle, AlertCircle, Database, Copy, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

export const Settings: React.FC = () => {
  const [bgUrl, setBgUrl] = useState('');
  const [preview, setPreview] = useState('');
  const [dbUrl, setDbUrl] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    // Cert BG
    const saved = storageService.getCertBg();
    if (saved) {
      setBgUrl(saved);
      setPreview(saved);
    } else {
      // Don't set external URL to avoid network errors
      setPreview('');
    }

    // DB URL
    const savedDb = storageService.getDbUrl();
    if (savedDb) setDbUrl(savedDb);
  }, []);

  const showNotify = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBgUrl(e.target.value);
    setPreview(e.target.value);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showNotify('Ukuran file terlalu besar (Max 2MB)', 'error');
        return;
      }
      
      // Auto compress/resize logic could be added here
      const img = document.createElement('img');
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      }
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const MAX_WIDTH = 800; // Resize to reasonable max width
        const scaleSize = MAX_WIDTH / img.width;
        
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to quality JPG
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        setBgUrl(compressedDataUrl);
        setPreview(compressedDataUrl);
        showNotify('Gambar berhasil dikompresi & dimuat.');
      }
      
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCert = () => {
    storageService.setCertBg(bgUrl);
    showNotify('Background sertifikat berhasil disimpan! Jangan lupa Sinkronisasi ulang.');
  };

  const handleResetCert = () => {
    setBgUrl('');
    setPreview('');
    storageService.setCertBg('');
    showNotify('Pengaturan di-reset ke default.');
  };

  const handleSaveDb = () => {
    storageService.setDbUrl(dbUrl);
    showNotify('Database Spreadsheet terhubung! Mencoba sinkronisasi...');
  };

  const copyScript = () => {
    const script = `
/* CODE.GS - SENJA DIGITAL DATABASE (V4 - CHUNKING SUPPORT) */

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = {};
  const mappings = {
    'users': 'senja_users',
    'students': 'senja_students',
    'materials': 'senja_materials',
    'submissions': 'senja_submissions',
    'settings': 'senja_settings'
  };

  Object.keys(mappings).forEach(key => {
    const sheetName = mappings[key];
    let sheet = ss.getSheetByName(sheetName);
    
    // Auto-create sheets if missing
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    const rows = sheet.getDataRange().getValues();
    if (rows.length > 1) {
      const headers = rows[0];
      const rawData = rows.slice(1).map(row => {
        let obj = {};
        headers.forEach((h, i) => {
          if(row[i] !== "") obj[h] = row[i];
        });
        return obj;
      });

      // DE-CHUNKING LOGIC
      // Combine certBg_chunk_0, certBg_chunk_1... back into certBg
      data[key] = rawData.map(item => {
        const newItem = {...item};
        // Find keys that look like name_chunk_index
        const chunkKeys = Object.keys(item).filter(k => k.match(/_chunk_\d+$/)).sort((a,b) => {
             const idxA = parseInt(a.split('_chunk_')[1]);
             const idxB = parseInt(b.split('_chunk_')[1]);
             return idxA - idxB;
        });
        
        if (chunkKeys.length > 0) {
           // Group by base name
           const groups = {};
           chunkKeys.forEach(k => {
              const base = k.split('_chunk_')[0];
              if(!groups[base]) groups[base] = [];
              groups[base].push(item[k]);
              delete newItem[k];
           });
           
           Object.keys(groups).forEach(base => {
              newItem[base] = groups[base].join('');
           });
        }
        return newItem;
      });

      // Special handler for settings (single object)
      if (key === 'settings' && data[key].length > 0) {
         data[key] = data[key][0];
      }
    } else {
       data[key] = key === 'settings' ? {} : [];
    }
  });

  // --- AUTO INITIALIZE ADMIN ---
  if (!data['users'] || data['users'].length === 0) {
    const defaultAdmin = {
      id: 'u1', username: 'admin', password: 'admin', name: 'Administrator', role: 'ADMIN', classAssigned: ''
    };
    if (!data['users']) data['users'] = [];
    data['users'].push(defaultAdmin);
    
    // Write default admin immediately
    const userSheet = ss.getSheetByName(mappings['users']);
    if (userSheet && userSheet.getLastRow() === 0) {
         const headers = Object.keys(defaultAdmin);
         userSheet.appendRow(headers);
         userSheet.appendRow(headers.map(h => defaultAdmin[h]));
    }
  }

  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let json;
  try {
    json = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error'})).setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = json.data;
  const settings = json.settings;
  
  const mappings = {
    'users': 'senja_users',
    'students': 'senja_students',
    'materials': 'senja_materials',
    'submissions': 'senja_submissions',
    'settings': 'senja_settings'
  };

  const saveSheet = (key, items) => {
    const sheetName = mappings[key];
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) sheet = ss.insertSheet(sheetName);
    sheet.clear();
    
    if (items && items.length > 0) {
      // CHUNKING LOGIC: Split long strings (>40k chars) into multiple columns
      const processedItems = items.map(item => {
         const newItem = {};
         Object.keys(item).forEach(k => {
             const val = item[k];
             if (typeof val === 'string' && val.length > 40000) {
                 const chunks = val.match(/.{1,40000}/g);
                 chunks.forEach((chunk, idx) => {
                     newItem[\`\${k}_chunk_\${idx}\`] = chunk;
                 });
             } else {
                 newItem[k] = val;
             }
         });
         return newItem;
      });

      // SMART HEADER DETECTION
      const headerSet = new Set();
      processedItems.forEach(i => Object.keys(i).forEach(k => headerSet.add(k)));
      const headers = Array.from(headerSet);
      
      sheet.appendRow(headers);
      
      const rows = processedItems.map(item => headers.map(h => {
        const val = item[h];
        if (val === undefined || val === null) return "";
        return (typeof val === 'object') ? JSON.stringify(val) : val;
      }));
      
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
  };

  if (data.users) saveSheet('users', data.users);
  if (data.students) saveSheet('students', data.students);
  if (data.materials) saveSheet('materials', data.materials);
  if (data.submissions) saveSheet('submissions', data.submissions);
  
  if (settings) {
      saveSheet('settings', [settings]);
  }

  return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
    navigator.clipboard.writeText(script);
    showNotify('Kode Script V4 berhasil disalin! Silakan update di Google Sheets.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative pb-20">
        {/* Notification Toast */}
        {notification && (
            <div className={`fixed top-24 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                {notification.type === 'success' ? <CheckCircle size={24}/> : <AlertCircle size={24}/>}
                <span className="font-medium">{notification.message}</span>
            </div>
        )}

      <div>
        <h1 className="text-2xl font-display font-bold text-slate-800">Pengaturan</h1>
        <p className="text-slate-500 text-sm">Kelola tampilan sertifikat dan koneksi database.</p>
      </div>

      {/* Database Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Database size={20} className="text-emerald-500"/> 
          Database Spreadsheet (Integrasi)
        </h3>
        
        <div className="space-y-4">
            <p className="text-sm text-slate-600">
                Hubungkan aplikasi ini dengan Google Spreadsheet agar data tersimpan secara online.
            </p>
            
            <div className="flex gap-2">
                <input 
                    type="url" 
                    value={dbUrl} 
                    onChange={e => setDbUrl(e.target.value)}
                    placeholder="Masukkan URL Web App Google Script (https://script.google.com/...)"
                    className="flex-1 border p-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-slate-600"
                />
                <button 
                    onClick={handleSaveDb}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
                >
                    <Save size={18} /> Simpan
                </button>
            </div>

            <div className="border rounded-xl overflow-hidden">
                <button 
                    onClick={() => setShowGuide(!showGuide)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-bold text-slate-700"
                >
                    <span>Panduan Pembuatan & Update Database (Script V4)</span>
                    {showGuide ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                </button>
                
                {showGuide && (
                    <div className="p-4 bg-white space-y-4 text-sm text-slate-600 border-t">
                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-amber-800 font-bold text-xs mb-2">
                            PENTING: Jika background sertifikat gagal tersimpan, mohon COPY ULANG kode di bawah ini dan lakukan DEPLOY NEW VERSION di Google Script.
                        </div>
                        <ol className="list-decimal pl-4 space-y-2">
                            <li>Buka <a href="https://sheets.new" target="_blank" className="text-blue-600 hover:underline inline-flex items-center gap-1">Google Sheets <ExternalLink size={12}/></a> Anda.</li>
                            <li>Klik menu <strong>Extensions (Ekstensi)</strong> &rarr; <strong>Apps Script</strong>.</li>
                            <li>Hapus semua kode lama, lalu <strong>Copy</strong> kode baru di bawah ini:</li>
                            <li className="relative">
                                <button onClick={copyScript} className="absolute top-2 right-2 bg-slate-200 hover:bg-slate-300 p-1 rounded text-xs flex items-center gap-1">
                                    <Copy size={12}/> Salin Script V4
                                </button>
                                <pre className="bg-slate-900 text-slate-50 p-3 rounded-lg overflow-x-auto text-xs font-mono h-40 selection:bg-indigo-500 selection:text-white">
{`/* CODE.GS (V4 - IMAGE CHUNKING) */
function doPost(e) {
  // Script ini otomatis memecah gambar besar menjadi kolom-kolom kecil
  // agar muat di Spreadsheet dan membuat sheet 'settings' otomatis.
  // ... Klik tombol SALIN untuk kode lengkap ...
}`}
                                </pre>
                            </li>
                            <li>Paste kode tersebut ke editor Apps Script.</li>
                            <li>Klik tombol <strong>Deploy</strong> (kanan atas) &rarr; <strong>Manage deployments</strong>.</li>
                            <li>Klik ikon Edit (Pensil) &rarr; Version: <strong>New version</strong> (Penting!).</li>
                            <li>Klik <strong>Deploy</strong>. URL tidak akan berubah, tapi kode baru akan aktif.</li>
                        </ol>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Certificate Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <ImageIcon size={20} className="text-primary"/> 
          Background Sertifikat
        </h3>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                <p className="font-bold mb-1">Panduan Gambar</p>
                <ul className="list-disc pl-4 space-y-1 text-blue-700">
                    <li>Gunakan orientasi <strong>Landscape</strong>.</li>
                    <li>Rekomendasi ukuran: <strong>800x600 px</strong>.</li>
                    <li>Gambar akan dikompres otomatis.</li>
                </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Upload Gambar</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                     <Upload size={24} />
                </div>
                <p className="text-sm text-slate-700 font-bold">Klik untuk upload file</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG (Max 2MB)</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Atau Image URL</label>
              <input 
                type="text" 
                value={bgUrl.startsWith('data:') ? '' : bgUrl} 
                onChange={handleUrlChange}
                placeholder="https://example.com/certificate.png"
                className="w-full border p-2 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button 
                onClick={handleSaveCert}
                className="flex-1 bg-primary hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 active:scale-95"
              >
                <Save size={18} /> Simpan
              </button>
              <button 
                onClick={handleResetCert}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                title="Reset Default"
              >
                <RefreshCcw size={18} />
              </button>
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-2">Preview Tampilan</label>
             <div className="aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative shadow-md group">
                {preview ? (
                  <>
                    <img src={preview} alt="Certificate Background" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                      <h2 className="text-xl md:text-3xl font-serif font-bold text-slate-800 mb-2 drop-shadow-sm">SERTIFIKAT</h2>
                      <p className="text-xs md:text-sm text-slate-600 font-serif">Diberikan kepada</p>
                      <h1 className="text-lg md:text-2xl font-script text-primary my-3 font-bold drop-shadow-sm">Nama Siswa</h1>
                      <div className="w-16 h-0.5 bg-slate-300 mb-2"></div>
                      <p className="text-[10px] md:text-xs text-slate-500 max-w-[80%]">Telah menyelesaikan literasi.</p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full flex-col bg-slate-50">
                     <p className="text-slate-400 text-sm font-medium mb-2">Tidak ada gambar background.</p>
                     <p className="text-xs text-slate-400 text-center px-6">Sertifikat akan menggunakan desain gradasi warna standar.</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
