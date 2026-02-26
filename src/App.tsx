import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, Activity, Leaf, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { analyzeFood, UserProfile } from './services/gemini';

type FoodAnalysis = {
  foodName: string;
  estimatedWeight: string;
  calories: string;
  healthiness: string;
  isHealthy: boolean;
  rating: number;
  healthyAlternatives: string[];
  analysis: string;
};

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('doctorFoodProfile');
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleSaveProfile = (newProfile: UserProfile) => {
    localStorage.setItem('doctorFoodProfile', JSON.stringify(newProfile));
    setProfile(newProfile);
  };

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setImage(base64String);
      setAnalysis(null);
      setError(null);
      setIsAnalyzing(true);

      try {
        const result = await analyzeFood(base64String, profile!);
        setAnalysis(result);
      } catch (err) {
        setError('حدث خطأ أثناء تحليل الصورة. يرجى المحاولة مرة أخرى.');
        console.error(err);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetApp = () => {
    setImage(null);
    setAnalysis(null);
    setError(null);
  };

  if (!profile) {
    return <ProfileForm onSave={handleSaveProfile} />;
  }

  return (
    <div className="min-h-screen bg-green-50 text-green-900 font-sans selection:bg-green-200" dir="rtl">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-green-500 p-2 rounded-xl text-white">
              <Leaf size={24} />
            </div>
            <h1 className="text-2xl font-bold text-green-800 tracking-tight">Doctor Food</h1>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('doctorFoodProfile');
              setProfile(null);
            }}
            className="text-sm text-green-600 hover:text-green-800 font-medium"
          >
            تعديل البيانات
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 pb-24">
        <AnimatePresence mode="wait">
          {!image && (
            <motion.div
              key="capture"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center min-h-[60vh] gap-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-green-800">مرحباً بك!</h2>
                <p className="text-green-600">التقط صورة لوجبتك لنقوم بتحليلها</p>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <label className="relative flex flex-col items-center justify-center w-48 h-48 bg-white rounded-full shadow-xl cursor-pointer hover:scale-105 transition-transform duration-300 border-4 border-green-100">
                  <Camera size={48} className="text-green-500 mb-2" />
                  <span className="text-green-700 font-medium">التقط صورة</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    className="hidden" 
                    onChange={handleImageCapture}
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 px-6 py-3 bg-white text-green-700 rounded-full shadow-md cursor-pointer hover:bg-green-50 transition-colors">
                <Upload size={20} />
                <span>أو اختر من المعرض</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageCapture}
                />
              </label>
            </motion.div>
          )}

          {image && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-lg aspect-square bg-black">
                <img src={image} alt="Food" className="w-full h-full object-cover opacity-90" />
                
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-green-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="mb-4"
                    >
                      <RefreshCw size={48} className="text-green-300" />
                    </motion.div>
                    <p className="text-lg font-medium animate-pulse">جاري تحليل الوجبة...</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-2xl flex items-start gap-3 border border-red-100">
                  <AlertTriangle className="shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold">عذراً</h3>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}

              {analysis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-green-100">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-green-900">{analysis.foodName}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          {analysis.isHealthy ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle size={14} /> صحي
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <AlertTriangle size={14} /> غير صحي
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            تقييم: {analysis.rating}/10
                          </span>
                        </div>
                      </div>
                      <div className="text-right bg-green-50 p-3 rounded-2xl">
                        <div className="text-2xl font-black text-green-600">{analysis.calories}</div>
                        <div className="text-xs text-green-800 font-medium">سعر حراري</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-green-50 p-4 rounded-2xl">
                        <div className="text-sm text-green-600 mb-1">الوزن التقديري</div>
                        <div className="font-bold text-green-900">{analysis.estimatedWeight}</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-2xl">
                        <div className="text-sm text-green-600 mb-1">التأثير الصحي</div>
                        <div className="font-bold text-green-900 text-sm leading-snug">{analysis.healthiness}</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                          <Activity size={18} /> التحليل الشامل
                        </h3>
                        <p className="text-green-700 text-sm leading-relaxed bg-white/50 p-4 rounded-2xl border border-green-50">
                          {analysis.analysis}
                        </p>
                      </div>

                      {analysis.healthyAlternatives && analysis.healthyAlternatives.length > 0 && (
                        <div>
                          <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                            <Leaf size={18} /> بدائل صحية
                          </h3>
                          <ul className="space-y-2">
                            {analysis.healthyAlternatives.map((alt, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-green-700 bg-green-50/50 p-3 rounded-xl">
                                <span className="text-green-500 mt-0.5">•</span>
                                {alt}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={resetApp}
                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold shadow-lg shadow-green-200 transition-all active:scale-95"
                  >
                    تحليل وجبة أخرى
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function ProfileForm({ onSave }: { onSave: (p: UserProfile) => void }) {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [weight, setWeight] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (age && gender && weight) {
      onSave({ age, gender, weight });
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl border border-green-100"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-green-500 p-4 rounded-2xl text-white shadow-lg shadow-green-200">
            <Leaf size={40} />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-green-800 mb-2">Doctor Food</h1>
          <p className="text-green-600">لنبدأ رحلتك نحو صحة أفضل. أدخل بياناتك الأساسية لتقديم تحليل دقيق.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-green-800 mb-2">العمر</label>
            <input
              type="number"
              required
              min="1"
              max="120"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-green-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-green-50/50"
              placeholder="مثال: 25"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-green-800 mb-2">النوع</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-3 rounded-xl font-medium transition-all border ${
                  gender === 'male' 
                    ? 'bg-green-500 text-white border-green-500 shadow-md' 
                    : 'bg-white text-green-700 border-green-200 hover:bg-green-50'
                }`}
              >
                ذكر
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-3 rounded-xl font-medium transition-all border ${
                  gender === 'female' 
                    ? 'bg-green-500 text-white border-green-500 shadow-md' 
                    : 'bg-white text-green-700 border-green-200 hover:bg-green-50'
                }`}
              >
                أنثى
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-green-800 mb-2">الوزن (كجم)</label>
            <input
              type="number"
              required
              min="20"
              max="300"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-green-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-green-50/50"
              placeholder="مثال: 70"
            />
          </div>

          <button
            type="submit"
            disabled={!age || !gender || !weight}
            className="w-full py-4 mt-4 bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg shadow-green-200 transition-all active:scale-95"
          >
            ابدأ الآن
          </button>
        </form>
      </motion.div>
    </div>
  );
}
