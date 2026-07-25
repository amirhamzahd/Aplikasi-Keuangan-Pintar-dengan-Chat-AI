'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { User, Mail, Shield, Check, UserCircle2, Save, LogOut, Camera, Lock, Eye, EyeOff } from 'lucide-react';

export function ProfileTab() {
  const { user, updateProfile, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [showPassword3, setShowPassword3] = useState(false);

  const handleSave = () => {
    updateProfile({
      name,
      gender,
      // email usually requires backend validation, but we can allow mock update
      email
    });
    setIsEditing(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 200;
        let width = img.width;
        let height = img.height;

        // Cover crop into a square
        const size = Math.min(width, height);
        const offsetX = (width - size) / 2;
        const offsetY = (height - size) / 2;

        canvas.width = MAX_SIZE;
        canvas.height = MAX_SIZE;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, offsetX, offsetY, size, size, 0, 0, MAX_SIZE, MAX_SIZE);

        // Compress tightly as WebP
        const compressedBase64 = canvas.toDataURL('image/webp', 0.8);
        updateProfile({ photo: compressedBase64 });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Kata sandi baru dan konfirmasi tidak cocok');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Kata sandi baru minimal 6 karakter');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setPasswordError(data.error || 'Gagal mengubah kata sandi');
      } else {
        setPasswordSuccess('Kata sandi berhasil diubah!');
        setTimeout(() => {
          setShowPasswordModal(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setPasswordSuccess('');
        }, 2000);
      }
    } catch (err) {
      setPasswordError('Terjadi kesalahan jaringan');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-24">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <UserCircle2 className="text-primary" size={28} />
          Pengaturan Profil
        </h2>
        <p className="text-sm text-slate-500 mt-1">Kelola identitas dan keamanan akun Anda</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={18} className="text-primary" />
            Data Pribadi
          </CardTitle>
          <CardDescription>
            Perbarui foto profil dan data diri Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
            <div 
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-24 h-24 rounded-full bg-blue-100 border-4 border-white shadow-lg flex items-center justify-center text-blue-700 font-bold text-4xl shrink-0 overflow-hidden">
                {user?.photo ? (
                  <img src={user.photo} alt={name} className="w-full h-full object-cover" />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera size={24} />
              </div>
            </div>
            
            <input 
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
            />

            <div className="text-center sm:text-left">
              <h3 className="font-extrabold text-lg text-slate-800">{name}</h3>
              <p className="text-sm text-slate-500 mb-3">{email}</p>
              <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                Ubah Foto Profil
              </Button>
            </div>
          </div>

          {/* Form Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Nama Lengkap</label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 transition-colors ${
                  isEditing ? 'border-blue-300 bg-white' : 'border-slate-100 bg-slate-50 text-slate-500 cursor-not-allowed'
                }`}
                placeholder="Masukkan nama lengkap"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Mail size={14} className="text-slate-400" />
                Alamat Email
              </label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 transition-colors ${
                  isEditing ? 'border-blue-300 bg-white' : 'border-slate-100 bg-slate-50 text-slate-500 cursor-not-allowed'
                }`}
                placeholder="email@contoh.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Jenis Kelamin</label>
              <select 
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 transition-colors ${
                  isEditing ? 'border-blue-300 bg-white' : 'border-slate-100 bg-slate-50 text-slate-500 cursor-not-allowed'
                }`}
              >
                <option value="">Pilih Jenis Kelamin</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
                <option value="Tidak Ingin Memberitahu">Tidak ingin memberitahu</option>
              </select>
            </div>
          </div>
          
          <div className="pt-4 flex items-center gap-3">
            {isEditing ? (
              <>
                <Button onClick={handleSave} className="flex items-center gap-2">
                  <Save size={16} /> Simpan Perubahan
                </Button>
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  Batal
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                Edit Profil
              </Button>
            )}
            
            {isSaved && (
              <span className="text-emerald-600 font-semibold text-sm flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 animate-in fade-in zoom-in duration-300">
                <Check size={16} /> Berhasil disimpan
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={18} className="text-primary" />
            Keamanan Akun
          </CardTitle>
          <CardDescription>
            Kelola kata sandi dan pengaturan keamanan lainnya.
          </CardDescription>
        </CardHeader>
         <CardContent>
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50">
             <div>
               <h4 className="font-bold text-slate-800 text-sm">Kata Sandi</h4>
               <p className="text-xs text-slate-500 mt-0.5">Disarankan mengubah kata sandi secara berkala</p>
             </div>
             <Button variant="secondary" size="sm" onClick={() => setShowPasswordModal(true)}>
               Ubah Kata Sandi
             </Button>
           </div>
           
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-rose-100 bg-rose-50 mt-4">
             <div>
               <h4 className="font-bold text-rose-700 text-sm">Keluar dari Perangkat Ini</h4>
               <p className="text-xs text-rose-600/70 mt-0.5">Sesi Anda akan segera berakhir.</p>
             </div>
             <Button variant="danger" size="sm" onClick={logout} className="flex items-center gap-2">
               <LogOut size={14} /> Keluar Akun
             </Button>
           </div>
        </CardContent>
      </Card>

      {/* Password Change Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Ubah Kata Sandi">
        <form onSubmit={handlePasswordChange} className="space-y-4 pt-2">
          {passwordError && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg border border-emerald-100 font-medium flex items-center gap-2">
              <Check size={16} /> {passwordSuccess}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Kata Sandi Saat Ini</label>
            <div className="relative">
              <input
                type={showPassword1 ? "text" : "password"}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 pr-10"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Masukkan kata sandi lama"
              />
              <button type="button" onClick={() => setShowPassword1(!showPassword1)} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600">
                {showPassword1 ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Kata Sandi Baru</label>
            <div className="relative">
              <input
                type={showPassword2 ? "text" : "password"}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 pr-10"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Buat kata sandi baru (min. 6 karakter)"
              />
              <button type="button" onClick={() => setShowPassword2(!showPassword2)} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600">
                {showPassword2 ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Konfirmasi Kata Sandi Baru</label>
            <div className="relative">
              <input
                type={showPassword3 ? "text" : "password"}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 pr-10"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang kata sandi baru"
              />
              <button type="button" onClick={() => setShowPassword3(!showPassword3)} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600">
                {showPassword3 ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowPasswordModal(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={isSubmittingPassword}>
              {isSubmittingPassword ? 'Menyimpan...' : 'Perbarui Sandi'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
