import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { 
    getFirestore, collection, onSnapshot, 
    addDoc, updateDoc, deleteDoc, doc,
    query, where, getDocs, limit 
} from "firebase/firestore";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCWB7sfDGxxAbdMp_7UK8AN3yhkHgxT1JM",
  authDomain: "dar-alesnad-cards-app.firebaseapp.com",
  projectId: "dar-alesnad-cards-app",
  storageBucket: "dar-alesnad-cards-app.firebasestorage.app",
  messagingSenderId: "883220651145",
  appId: "1:883220651145:web:2e0ede83462d3ef06c3a58",
  measurementId: "G-HXVRST5BM7"
};

// Initialize Firebase and Firestore
let db;
if (firebaseConfig.apiKey) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
}

// --- DATA TYPES ---
interface TextPlaceholder {
    id: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    textAlign: 'left' | 'center' | 'right';
    fontFamily: string;
    fontWeight: string;
    label: string;
}

interface Template {
    id: string; // Firestore document ID
    name: string;
    imageUrl: string;
    placeholders: TextPlaceholder[];
}

interface User {
    id: string; // Firestore document ID
    username: string;
    password: string;
    role: 'admin' | 'super-admin';
}

// --- ICONS (unchanged) ---
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const AdminIcon: React.FC<{ className?: string }> = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-1.007 1.11-1.226l.554-.221c.64-.256 1.355.064 1.688.69l.334.668c.252.502.734.836 1.296.932l.62.103c.637.106 1.118.67 1.118 1.303v.113c0 .542-.223 1.057-.62 1.456l-.398.398c-.41.41-.62 1.003-.544 1.59l.096.71c.083.612-.216 1.206-.744 1.52l-.528.318c-.53.32-1.18.21-1.624-.264l-.442-.442a1.875 1.875 0 0 0-2.652 0l-.442.442c-.444.474-1.094.584-1.624.264l-.528-.318c-.528-.314-.828-.908-.744-1.52l.096-.71c.076-.587-.134-1.18-.544-1.59l-.398-.398c-.398-.399-.62-.914-.62-1.456v-.113c0-.633.48-1.197 1.118-1.303l.62-.103c.562-.095 1.044-.43 1.296-.932l.334-.668c.333-.626 1.048-.946 1.688-.69l.554.221z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /></svg>;
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.033-2.124H8.033C6.91 2.75 6 3.694 6 4.874v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;
const EditIcon: React.FC<{ className?: string }> = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>;
const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>;
const BackIcon: React.FC<{ className?: string }> = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>;
const KeyIcon: React.FC<{ className?: string }> = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0-1.381 1.119-2.5 2.5-2.5s2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5-2.5-1.119-2.5-2.5Zm0 0h-2.25m5 0h2.25" /></svg>;
const UsersIcon: React.FC<{ className?: string }> = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-4.663M12 12.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Z" /></svg>;
const TemplateIcon: React.FC<{ className?: string }> = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>;

// --- HELPER FUNCTIONS ---
const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });

// --- USER VIEW COMPONENT ---
const UserView: React.FC<{ templates: Template[], onAdminClick: () => void, isLoading: boolean }> = ({ templates, onAdminClick, isLoading }) => {
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [userInputs, setUserInputs] = useState<{ [key: string]: string }>({});
    const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);

    useEffect(() => {
        if (selectedTemplate) {
            setLoadedImage(null);
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = selectedTemplate.imageUrl;
            img.onload = () => setLoadedImage(img);
            img.onerror = () => { console.error("Failed to load image."); setLoadedImage(null); }
        }
    }, [selectedTemplate?.id]);

    useEffect(() => {
        const drawCanvas = async () => {
            if (isDrawing.current || !canvasRef.current || !loadedImage || !selectedTemplate) return;
            isDrawing.current = true;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) { isDrawing.current = false; return; }
            
            const fontsToLoad = [...new Set(selectedTemplate.placeholders.map(p => `${p.fontWeight} 10px ${p.fontFamily}`))];
            try { await Promise.all(fontsToLoad.map(font => document.fonts.load(font))); } 
            catch (err) { console.error('Error loading fonts:', err); }

            canvas.width = loadedImage.naturalWidth;
            canvas.height = loadedImage.naturalHeight;
            ctx.drawImage(loadedImage, 0, 0, canvas.width, canvas.height);
            
            selectedTemplate.placeholders.forEach(p => {
                ctx.fillStyle = p.color;
                ctx.font = `${p.fontWeight} ${canvas.width * (p.fontSize / 100)}px ${p.fontFamily}`;
                ctx.textAlign = p.textAlign;
                ctx.textBaseline = 'middle';
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 5;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 2;
                ctx.fillText(userInputs[p.id] || '', canvas.width * (p.x / 100), canvas.height * (p.y / 100));
            });
            
            Object.assign(ctx, { shadowColor: 'transparent', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0 });
            isDrawing.current = false;
        };
        drawCanvas();
    }, [loadedImage, userInputs, selectedTemplate]);

    const handleInputChange = (id: string, value: string) => setUserInputs(prev => ({ ...prev, [id]: value }));
    const handleDownload = () => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = `${selectedTemplate?.name || 'greeting'}.png`;
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
    };
    const handleSelectTemplate = (template: Template) => {
        setSelectedTemplate(template);
        setUserInputs(Object.fromEntries(template.placeholders.map(p => [p.id, ''])));
    };

    if (selectedTemplate) {
        return (
            <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
                 <button onClick={() => { setSelectedTemplate(null); setUserInputs({}); }} className="mb-8 flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors font-semibold">
                     <BackIcon className="w-5 h-5" />
                    <span>العودة إلى القوالب</span>
                 </button>
                <div className="flex flex-col gap-8">
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/80">
                        <h2 className="text-3xl font-bold mb-2 tracking-tight">{selectedTemplate.name}</h2>
                        <p className="text-slate-600 mb-8">أدخل البيانات في الحقول أدناه لتحديث بطاقتك.</p>
                        {selectedTemplate.placeholders.length > 0 ? selectedTemplate.placeholders.map(p => (
                            <div key={p.id} className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">{p.label}</label>
                                <input type="text" value={userInputs[p.id] || ''} onChange={(e) => handleInputChange(p.id, e.target.value)} placeholder={`أدخل ${p.label}...`} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition"/>
                            </div>
                        )) : <p className="text-slate-500">لا توجد حقول نصية لهذا القالب.</p>}
                    </div>
                    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/80">
                        <h3 className="text-xl font-bold mb-4 text-center tracking-tight">المعاينة المباشرة</h3>
                        <div className="flex items-center justify-center min-h-[250px] bg-slate-100 rounded-xl">
                            {!loadedImage && <div className="text-slate-500">جاري تحميل الصورة...</div>}
                            <canvas ref={canvasRef} className={`w-full h-auto rounded-lg ${!loadedImage ? 'hidden' : ''}`} />
                        </div>
                    </div>
                     <div className="mt-4">
                        <button onClick={handleDownload} disabled={!Object.values(userInputs).some(val => typeof val === 'string' && val.trim() !== '')} className="w-full flex items-center justify-center gap-x-3 px-6 py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200/80 hover:bg-indigo-700 transition-all duration-300 disabled:bg-slate-400 disabled:shadow-none disabled:cursor-not-allowed transform hover:-translate-y-0.5">
                            <DownloadIcon className="w-6 h-6" />
                            <span className="text-lg">تحميل البطاقة</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="py-12 sm:py-16 text-center">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">بطاقات شركة دار الإسناد للخدمات الغذائية</h1>
                <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">اختر القالب المناسب، أضف اسمك، وشارك التهنئة مع زملائك!</p>
            </header>
            <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-16">
                {isLoading && <p className="text-center col-span-full">جاري تحميل القوالب...</p>}
                {!isLoading && templates.length === 0 && <p className="text-center col-span-full">لا توجد قوالب لعرضها حالياً.</p>}
                {templates.map(template => (
                    <div key={template.id} onClick={() => handleSelectTemplate(template)} className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/80 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-slate-300/60 hover:-translate-y-2">
                        <div className="aspect-video overflow-hidden"><img src={template.imageUrl} alt={template.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" /></div>
                        <div className="p-5"><h3 className="font-bold text-xl tracking-tight text-slate-900">{template.name}</h3></div>
                    </div>
                ))}
            </main>
             <footer className="text-center py-8">
                <button onClick={onAdminClick} className="group flex items-center gap-2 mx-auto text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                    <AdminIcon className="w-4 h-4 transition-transform group-hover:rotate-12" />
                    <span>لوحة تحكم المسؤول</span>
                </button>
            </footer>
        </div>
    );
};

const LoadingSpinner: React.FC = () => (
    <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
        <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

// --- PASSWORD CHANGE COMPONENT ---
const PasswordChangeForm: React.FC<{
    currentUser: User; onPasswordChange: (newPassword: string) => Promise<void>; onCancel: () => void;
}> = ({ currentUser, onPasswordChange, onCancel }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (oldPassword !== currentUser.password) { setError('كلمة المرور الحالية غير صحيحة.'); return; }
        if (newPassword.length < 4) { setError('كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل.'); return; }
        if (newPassword !== confirmPassword) { setError('كلمات المرور الجديدة غير متطابقة.'); return; }
        
        setLoading(true);
        try { await onPasswordChange(newPassword); setSuccess('تم تغيير كلمة المرور بنجاح!'); setTimeout(() => onCancel(), 2000); } 
        catch { setError('حدث خطأ أثناء تغيير كلمة المرور.'); } 
        finally { setLoading(false); }
    };

    return (
        <div className="my-8 bg-white p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/80">
            <h2 className="text-2xl font-bold mb-6 tracking-tight">تغيير كلمة المرور</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="كلمة المرور الحالية" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition" required />
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="كلمة المرور الجديدة" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition" required />
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="تأكيد كلمة المرور الجديدة" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition" required />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {success && <p className="text-green-600 text-sm">{success}</p>}
                <div className="flex gap-4 pt-2">
                    <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-slate-400">{loading ? 'جاري الحفظ...' : 'حفظ'}</button>
                    <button type="button" onClick={onCancel} className="flex-1 bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300 transition">إلغاء</button>
                </div>
            </form>
        </div>
    );
};

// --- USER MANAGEMENT COMPONENT ---
const UserManagement: React.FC<{ users: User[] }> = ({ users }) => {
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newUsername.trim().length < 3 || newPassword.trim().length < 4) { setError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل وكلمة المرور 4 أحرف على الأقل.'); return; }
        if (users.some(u => u.username === newUsername.trim())) { setError('اسم المستخدم هذا موجود بالفعل.'); return; }
        
        const newUser = { username: newUsername.trim(), password: newPassword.trim(), role: 'admin' };
        setLoading(true);
        try { await addDoc(collection(db, "users"), newUser); setNewUsername(''); setNewPassword(''); } 
        catch { setError('حدث خطأ أثناء إضافة المستخدم.'); } 
        finally { setLoading(false); }
    };

    const handleDeleteUser = async (userId: string, username: string) => {
        if (window.confirm(`هل أنت متأكد من حذف المستخدم '${username}'؟`)) {
            try { await deleteDoc(doc(db, "users", userId)); } 
            catch { alert('حدث خطأ أثناء حذف المستخدم.'); }
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/80">
                <h3 className="text-2xl font-bold mb-6 tracking-tight">إضافة مسؤول جديد</h3>
                <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div className="sm:col-span-1"><label className="block text-sm font-medium text-slate-700 mb-1">اسم المستخدم</label><input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition" /></div>
                    <div className="sm:col-span-1"><label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition" /></div>
                    <button type="submit" disabled={loading} className="sm:col-span-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition h-fit disabled:bg-slate-400">{loading ? 'جاري الإضافة...' : 'إضافة مسؤول'}</button>
                </form>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
            <div className="bg-white shadow-xl shadow-slate-200/70 rounded-2xl overflow-hidden border border-slate-200/80">
                 <h3 className="text-2xl font-bold tracking-tight p-6 border-b border-slate-200">المسؤولون الحاليون</h3>
                <ul className="divide-y divide-slate-200">
                    {users.map(user => (
                        <li key={user.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <p className="font-semibold text-lg text-slate-800">{user.username}</p>
                                <p className={`text-sm font-semibold ${user.role === 'super-admin' ? 'text-indigo-600' : 'text-slate-500'}`}>{user.role === 'super-admin' ? 'مسؤول خارق' : 'مسؤول'}</p>
                            </div>
                            {user.role !== 'super-admin' && (<button onClick={() => handleDeleteUser(user.id, user.username)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-red-100 transition-all"><TrashIcon className="w-6 h-6"/></button>)}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

// --- ADMIN VIEW COMPONENT ---
const AdminView: React.FC<{ 
    loggedInUser: User; templates: Template[]; users: User[]; onLogout: () => void;
}> = ({ loggedInUser, templates, users, onLogout }) => {
    const [editingTemplate, setEditingTemplate] = useState<Template | 'new' | null>(null);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [activeTab, setActiveTab] = useState<'templates' | 'users'>('templates');

    const handleSaveTemplate = async (templateToSave: Omit<Template, 'id'>) => {
        if (editingTemplate === 'new') { await addDoc(collection(db, "templates"), templateToSave); } 
        else { await updateDoc(doc(db, "templates", (editingTemplate as Template).id), templateToSave); }
        setEditingTemplate(null);
    };

    const handleDeleteTemplate = async (id: string) => {
        if (window.confirm("هل أنت متأكد من حذف هذا القالب؟")) {
            await deleteDoc(doc(db, "templates", id));
        }
    };
    
    const handlePasswordChange = async (newPassword: string) => {
        await updateDoc(doc(db, "users", loggedInUser.id), { password: newPassword });
    };

    if (editingTemplate) {
        const templateData: Omit<Template, 'id'> = editingTemplate === 'new'
            ? { name: '', imageUrl: '', placeholders: [] }
            : templates.find(t => t.id === (editingTemplate as Template).id)!;
        return <TemplateEditor template={templateData} onSave={handleSaveTemplate} onCancel={() => setEditingTemplate(null)} />;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">لوحة التحكم</h1>
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsChangingPassword(!isChangingPassword)} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-500 text-white font-semibold rounded-lg shadow-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all"><KeyIcon className="w-5 h-5" /><span>تغيير كلمة المرور</span></button>
                    <button onClick={onLogout} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all"><LogoutIcon className="w-5 h-5" /><span>تسجيل الخروج</span></button>
                </div>
            </div>

            {isChangingPassword && (<PasswordChangeForm currentUser={loggedInUser} onPasswordChange={handlePasswordChange} onCancel={() => setIsChangingPassword(false)}/>)}
            
            {loggedInUser.role === 'super-admin' && (
                <div className="mb-8 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                         <button onClick={() => setActiveTab('templates')} className={`group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-lg ${activeTab === 'templates' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><TemplateIcon className="w-6 h-6" /><span>إدارة القوالب</span></button>
                        <button onClick={() => setActiveTab('users')} className={`group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-lg ${activeTab === 'users' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><UsersIcon className="w-6 h-6" /><span>إدارة المستخدمين</span></button>
                    </nav>
                </div>
            )}
            
            {activeTab === 'templates' && (
                <div>
                     <div className="flex justify-end mb-6"><button onClick={() => setEditingTemplate('new')} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"><PlusIcon className="w-5 h-5" /><span>قالب جديد</span></button></div>
                    <div className="bg-white shadow-xl shadow-slate-200/70 rounded-2xl overflow-hidden border border-slate-200/80">
                        <ul className="divide-y divide-slate-200">
                            {templates.length > 0 ? templates.map(template => (
                                <li key={template.id} className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-5"><img src={template.imageUrl} alt={template.name} className="w-28 h-20 object-cover rounded-lg"/><span className="font-semibold text-lg text-slate-800">{template.name}</span></div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingTemplate(template)} className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-indigo-100 transition-all"><EditIcon className="w-6 h-6"/></button>
                                        <button onClick={() => handleDeleteTemplate(template.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-red-100 transition-all"><TrashIcon className="w-6 h-6"/></button>
                                    </div>
                                </li>
                            )) : (<li className="p-12 text-center text-slate-500"><p className="font-semibold">لا توجد قوالب لعرضها.</p><p className="mt-1 text-sm">ابدأ بإضافة قالب جديد!</p></li>)}
                        </ul>
                    </div>
                </div>
            )}
            
            {activeTab === 'users' && loggedInUser.role === 'super-admin' && (<UserManagement users={users} />)}
        </div>
    );
};

// --- TEMPLATE EDITOR COMPONENT (for Admin) ---
const TemplateEditor: React.FC<{ template: Omit<Template, 'id'>, onSave: (template: Omit<Template, 'id'>) => Promise<void>, onCancel: () => void }> = ({ template, onSave, onCancel }) => {
    const [editedTemplate, setEditedTemplate] = useState(template);
    const [selectedPlaceholderId, setSelectedPlaceholderId] = useState<string | null>(template.placeholders[0]?.id || null);
    const editorImageRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState<{ id: string, offsetX: number, offsetY: number } | null>(null);
    const [imageAspectRatio, setImageAspectRatio] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const selectedPlaceholder = editedTemplate.placeholders.find(p => p.id === selectedPlaceholderId);

    useEffect(() => {
        if (editedTemplate.imageUrl) {
            const img = new Image();
            img.src = editedTemplate.imageUrl;
            img.onload = () => setImageAspectRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
        }
    }, [editedTemplate.imageUrl]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const base64 = await fileToBase64(e.target.files[0]);
            setEditedTemplate(t => ({ ...t, imageUrl: base64 }));
        }
    };
    
    const handleAddPlaceholder = () => {
        const newPlaceholder: TextPlaceholder = { id: `p-${Date.now()}`, label: 'نص جديد', x: 50, y: 50, fontSize: 5, color: '#FFFFFF', textAlign: 'center', fontFamily: 'Cairo', fontWeight: '700' };
        setEditedTemplate(t => ({ ...t, placeholders: [...t.placeholders, newPlaceholder] }));
        setSelectedPlaceholderId(newPlaceholder.id);
    };

    const handleRemovePlaceholder = (id: string) => {
        const newPlaceholders = editedTemplate.placeholders.filter(p => p.id !== id);
        setEditedTemplate(t => ({ ...t, placeholders: newPlaceholders }));
        if (selectedPlaceholderId === id) { setSelectedPlaceholderId(newPlaceholders[0]?.id || null); }
    };

    const updatePlaceholder = (id: string, updates: Partial<TextPlaceholder>) => {
        setEditedTemplate(t => ({ ...t, placeholders: t.placeholders.map(p => p.id === id ? { ...p, ...updates } : p) }));
    };
    
    const onMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
        const target = e.target as HTMLElement;
        const rect = target.getBoundingClientRect();
        setDragging({ id, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top });
        e.preventDefault();
    };

    const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!dragging || !editorImageRef.current) return;
        const editorRect = editorImageRef.current.getBoundingClientRect();
        const placeholderEl = document.getElementById(dragging.id);
        const placeholderData = editedTemplate.placeholders.find(p => p.id === dragging.id);
        if (!placeholderEl || !placeholderData) return;

        let x = e.clientX - editorRect.left - dragging.offsetX;
        let y = e.clientY - editorRect.top - dragging.offsetY;
        x = Math.max(0, Math.min(x, editorRect.width - placeholderEl.offsetWidth));
        y = Math.max(0, Math.min(y, editorRect.height - placeholderEl.offsetHeight));

        let anchorX = x;
        if (placeholderData.textAlign === 'center') anchorX = x + placeholderEl.offsetWidth / 2;
        else if (placeholderData.textAlign === 'right') anchorX = x + placeholderEl.offsetWidth;
        
        const anchorY = y + placeholderEl.offsetHeight / 2;
        const xPercent = (anchorX / editorRect.width) * 100;
        const yPercent = (anchorY / editorRect.height) * 100;

        updatePlaceholder(dragging.id, { x: xPercent, y: yPercent });
    };

    const onMouseUp = () => setDragging(null);
    const getPlaceholderTransform = (p: TextPlaceholder) => {
        let tx = '0%';
        if (p.textAlign === 'center') tx = '-50%';
        else if (p.textAlign === 'right') tx = '-100%';
        return `translate(${tx}, -50%)`;
    };
    
    const handleSave = async () => {
        setIsSaving(true);
        try { await onSave(editedTemplate); } 
        catch { alert('حدث خطأ أثناء الحفظ.'); } 
        finally { setIsSaving(false); }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto" onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">{template.name ? 'تعديل القالب' : 'إنشاء قالب جديد'}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-4 rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-200/80">
                     <h3 className="font-bold text-xl mb-4 tracking-tight">المحرر المرئي</h3>
                    <div ref={editorImageRef} className="relative w-full bg-slate-200 rounded-xl overflow-hidden select-none border" style={{ aspectRatio: imageAspectRatio || '16 / 9' }}>
                        {editedTemplate.imageUrl && <img src={editedTemplate.imageUrl} className="absolute inset-0 w-full h-full object-contain" alt="Template Preview"/>}
                        {editedTemplate.placeholders.map(p => {
                             const isSelected = p.id === selectedPlaceholderId;
                             return (<div key={p.id} id={p.id} onMouseDown={(e) => onMouseDown(e, p.id)} onClick={() => setSelectedPlaceholderId(p.id)} className={`absolute p-1 rounded transition-all duration-150 ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-800/50' : 'outline-dashed outline-1 outline-white/50 hover:outline-indigo-400'} ${dragging?.id === p.id ? 'grabbing-cursor shadow-2xl z-10' : 'grab-cursor'}`} style={{ left: `${p.x}%`, top: `${p.y}%`, transform: getPlaceholderTransform(p), fontSize: `${(p.fontSize / 100) * (editorImageRef.current?.clientWidth || 500)}px`, color: p.color, fontFamily: p.fontFamily, fontWeight: p.fontWeight, whiteSpace: 'nowrap', textShadow: '0 2px 5px rgba(0,0,0,0.5)' }}>{p.label}</div>);
                        })}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-200/80 space-y-6">
                    <div className="space-y-4">
                        <h3 className="font-bold text-xl tracking-tight">تفاصيل القالب</h3>
                        <div><label className="block text-sm font-medium text-slate-700">اسم القالب</label><input type="text" value={editedTemplate.name} onChange={e => setEditedTemplate(t => ({...t, name: e.target.value}))} className="mt-1 w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition" /></div>
                         <div><label className="block text-sm font-medium text-slate-700">صورة القالب</label><input type="file" accept="image/*" onChange={handleImageUpload} className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition" /></div>
                    </div>
                    <hr className="border-slate-200"/>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center"><h3 className="font-bold text-xl tracking-tight">النصوص</h3><button onClick={handleAddPlaceholder} className="inline-flex items-center gap-1 text-sm bg-indigo-100 text-indigo-700 font-semibold px-3 py-1 rounded-full hover:bg-indigo-200 transition"><PlusIcon className="w-4 h-4" /><span>إضافة</span></button></div>
                        {editedTemplate.placeholders.length > 0 ? (<>
                            <select value={selectedPlaceholderId || ''} onChange={e => setSelectedPlaceholderId(e.target.value)} className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition">{editedTemplate.placeholders.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
                            {selectedPlaceholder && (<div className="space-y-4 border border-slate-200 p-4 rounded-lg bg-slate-50">
                                <div className="flex items-center justify-between"><h4 className="font-semibold text-slate-800">{selectedPlaceholder.label}</h4><button onClick={() => handleRemovePlaceholder(selectedPlaceholderId!)} className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full p-1 transition"><TrashIcon className="w-5 h-5"/></button></div>
                                <div><label className="text-xs font-medium text-slate-600">تسمية الحقل</label><input type="text" value={selectedPlaceholder.label} onChange={e => updatePlaceholder(selectedPlaceholder.id, { label: e.target.value })} className="mt-1 w-full text-sm border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"/></div>
                                <div><label className="text-xs font-medium text-slate-600">حجم الخط ({selectedPlaceholder.fontSize.toFixed(1)}%)</label><input type="range" min="1" max="20" step="0.1" value={selectedPlaceholder.fontSize} onChange={e => updatePlaceholder(selectedPlaceholder.id, { fontSize: parseFloat(e.target.value) })} className="mt-1 w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"/></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs font-medium text-slate-600">المحاذاة</label><select value={selectedPlaceholder.textAlign} onChange={e => updatePlaceholder(selectedPlaceholder.id, { textAlign: e.target.value as TextPlaceholder['textAlign'] })} className="mt-1 w-full text-sm border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"><option value="left">يسار</option><option value="center">وسط</option><option value="right">يمين</option></select></div>
                                    <div><label className="text-xs font-medium text-slate-600">وزن الخط</label><select value={selectedPlaceholder.fontWeight} onChange={e => updatePlaceholder(selectedPlaceholder.id, { fontWeight: e.target.value })} className="mt-1 w-full text-sm border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"><option value="400">عادي</option><option value="700">عريض</option><option value="900">عريض جداً</option></select></div>
                                </div>
                                <div><label className="text-xs font-medium text-slate-600">نوع الخط</label><select value={selectedPlaceholder.fontFamily} onChange={e => updatePlaceholder(selectedPlaceholder.id, { fontFamily: e.target.value })} className="mt-1 w-full text-sm border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"><option value="Cairo">Cairo</option><option value="Tajawal">Tajawal</option><option value="Almarai">Almarai</option><option value="Changa">Changa</option><option value="Amiri">Amiri</option></select></div>
                                <div className="flex items-center gap-4"><label className="text-xs font-medium text-slate-600">اللون</label><input type="color" value={selectedPlaceholder.color} onChange={e => updatePlaceholder(selectedPlaceholder.id, { color: e.target.value })} className="h-10 w-16 p-1 border border-slate-300 rounded-md cursor-pointer"/></div>
                            </div>)}
                        </>) : (<div className="text-center py-8 px-4 mt-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 bg-slate-50"><p className="font-semibold">لا توجد عناصر نصية حتى الآن.</p><p className="text-sm mt-1">اضغط على زر "إضافة" لبدء التحرير.</p></div>)}
                    </div>
                     <div className="flex gap-4 mt-4">
                        <button onClick={handleSave} disabled={isSaving} className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:bg-slate-400">{isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</button>
                        <button onClick={onCancel} className="flex-1 bg-slate-200 text-slate-800 px-4 py-3 rounded-lg font-semibold hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all">إلغاء</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- LOGIN COMPONENT ---
const LoginView: React.FC<{ onLogin: (username: string, password: string) => Promise<void>, error: string, setError: (error: string) => void }> = ({ onLogin, error, setError }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onLogin(username, password);
        setLoading(false);
    };
    
    return (
        <div className="flex items-center justify-center min-h-full p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-2xl shadow-slate-300/60 border border-slate-200/80">
                 <div className="text-center"><h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">تسجيل دخول المسؤول</h1></div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div><label className="sr-only">اسم المستخدم</label><input type="text" value={username} onChange={(e) => { setUsername(e.target.value); setError(''); }} placeholder="اسم المستخدم" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition"/></div>
                    <div><label className="sr-only">كلمة المرور</label><input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder="كلمة المرور" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition"/></div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:bg-slate-400">{loading ? 'جاري الدخول...' : 'دخول'}</button>
                </form>
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAppLoading, setAppLoading] = useState(false);
    const [view, setView] = useState<'user' | 'login'>('user');
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
    const [loginError, setLoginError] = useState('');
    
    useEffect(() => {
        if (!db) return;

        const templatesCol = collection(db, "templates");
        const usersCol = collection(db, "users");

        const unsubTemplates = onSnapshot(templatesCol, snapshot => {
            const templatesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Template));
            setTemplates(templatesData);
            setIsLoading(false);
        });

        const unsubUsers = onSnapshot(usersCol, async snapshot => {
            if (snapshot.empty) {
                try {
                    await addDoc(usersCol, { username: 'admin', password: 'admin', role: 'super-admin' });
                } catch (e) { console.error("Error adding super-admin: ", e); }
            } else {
                const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
                setUsers(usersData);
                 // If a user is logged in, refresh their data
                if(loggedInUser) {
                    const updatedUser = usersData.find(u => u.id === loggedInUser.id);
                    if (updatedUser) setLoggedInUser(updatedUser);
                    else handleLogout(); // Log out if user was deleted
                }
            }
        });

        return () => { unsubTemplates(); unsubUsers(); };
    }, []);
    
    const handleLogin = async (username: string, password: string) => {
        setLoginError('');
        if (!db) { setLoginError('لا يمكن الاتصال بقاعدة البيانات.'); return; }

        try {
            const usersCol = collection(db, "users");
            const q = query(usersCol, where("username", "==", username), where("password", "==", password), limit(1));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setLoginError('اسم المستخدم أو كلمة المرور غير صحيحة.');
            } else {
                const userDoc = querySnapshot.docs[0];
                setLoggedInUser({ id: userDoc.id, ...userDoc.data() } as User);
                setView('user');
            }
        } catch (error) {
            console.error("Login error: ", error);
            setLoginError('حدث خطأ أثناء محاولة تسجيل الدخول.');
        }
    };

    const handleLogout = () => {
        setLoggedInUser(null);
        setView('user');
    };
    
    const renderView = () => {
        if (!firebaseConfig.apiKey) {
            return (
                <div className="p-8 text-center bg-red-100 text-red-800">
                    <h2 className="text-2xl font-bold">خطأ في الإعداد</h2>
                    <p className="mt-2">لم يتم العثور على إعدادات Firebase. الرجاء التأكد من لصق كائن `firebaseConfig` في ملف `App.tsx`.</p>
                </div>
            )
        }
        
        if (loggedInUser) {
            return <AdminView loggedInUser={loggedInUser} templates={templates} users={users} onLogout={handleLogout} />;
        }
        
        switch(view) {
            case 'login':
                return <LoginView onLogin={handleLogin} error={loginError} setError={setLoginError} />;
            case 'user':
            default:
                return <UserView templates={templates} onAdminClick={() => setView('login')} isLoading={isLoading} />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            {(isAppLoading) && <LoadingSpinner />}
            <main className="flex-grow">
                {renderView()}
            </main>
            <footer className="w-full text-center py-4 bg-slate-100/80 border-t border-slate-200/80">
                <p className="text-sm text-slate-500">
                    جميع الحقوق محفوظة @ وحدة تقنية المعلومات لشركة دار الإسناد للخدمات الغذائية
                </p>
            </footer>
        </div>
    );
};

export default App;
