import React, { useState, useRef, useEffect } from 'react';
import { 
  Sprout, Store, CloudSun, Mic, Eye, Camera, HelpCircle, AlertTriangle, 
  Zap, Clock, Image as ImageIcon, Bell, Home, ChevronRight, Calendar, 
  Settings, BrainCircuit, Leaf, Search, Star, MapPin, Droplets, Wind, 
  ArrowRight, ArrowUp, ArrowLeft, Volume2, MessageCircle, Share2, Bot, 
  Send, TrendingUp, X, Plus, Pencil, Sparkles, Keyboard, Play, PlayCircle, 
  Check, Loader2, User, WifiOff, MicOff, Upload, Aperture, RefreshCw, CheckCircle2,
  StopCircle
} from 'lucide-react';

/**
 * VACA: Voice-Assisted Crop Advisory
 * FIXED: AI Voice Playback & Local Photo Upload
 */

// --- Local Data "API" ---
const CROP_DB = {
    corn: { price: "RM 1.50/kg", trend: "decreasing", pest: "Fall Armyworm", advice: "Ensure soil moisture is consistent." },
    chili: { price: "RM 12.50/kg", trend: "increasing", pest: "Aphids", advice: "Check under leaves for pests." },
    paddy: { price: "RM 2.40/kg", trend: "stable", pest: "Stem Borer", advice: "Monitor water levels closely." },
    tomato: { price: "RM 3.20/kg", trend: "stable", pest: "Late Blight", advice: "Avoid overhead watering to prevent fungus." },
    spinach: { price: "RM 4.00/kg", trend: "increasing", pest: "Leaf Miners", advice: "Harvest early morning for best crispness." }
};

// --- Image Color Validation ---
const validateCropImage = (imageElement) => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = imageElement.width || imageElement.naturalWidth;
        canvas.height = imageElement.height || imageElement.naturalHeight;
        
        ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        let greenPixels = 0;
        let yellowPixels = 0;
        let totalPixels = pixels.length / 4;
        
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            
            if (g > 80 && g > r && g > b && (g - r) > 20) {
                greenPixels++;
            }
            
            if (r > 100 && g > 100 && b < 150 && Math.abs(r - g) < 50) {
                yellowPixels++;
            }
        }
        
        const greenPercentage = (greenPixels / totalPixels) * 100;
        const yellowPercentage = (yellowPixels / totalPixels) * 100;
        const cropColorPercentage = greenPercentage + yellowPercentage;
        
        resolve({
            hasCropColors: cropColorPercentage > 5,
            greenPercentage,
            yellowPercentage,
            cropColorPercentage
        });
    });
};


// --- Geocoding API - Convert city name to coordinates ---
const getCoordinates = async (cityName) => {
    try {
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
        );
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            return {
                lat: result.latitude,
                lon: result.longitude,
                name: result.name,
                country: result.country || '',
                admin1: result.admin1 || ''
            };
        }
        return null;
    } catch (error) {
        console.error("Geocoding API error:", error);
        return null;
    }
};

// --- Weather API Integration with Location Support ---
const fetchWeatherData = async (cityName = null) => {
    try {
        let lat = 3.0738;
        let lon = 101.5183;
        let locationName = "Subang Jaya";
        
        if (cityName) {
            const coords = await getCoordinates(cityName);
            if (coords) {
                lat = coords.lat;
                lon = coords.lon;
                locationName = coords.admin1 ? `${coords.name}, ${coords.admin1}` : coords.name;
            } else {
                return {
                    temp: 0,
                    humidity: 0,
                    windSpeed: 0,
                    condition: "Unknown",
                    rainInfo: `Could not find weather data for "${cityName}". Please try another city name.`,
                    location: "Unknown",
                    error: true
                };
            }
        }
        
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
        );
        const data = await response.json();
        
        const temp = Math.round(data.current.temperature_2m);
        const humidity = data.current.relative_humidity_2m;
        const windSpeed = data.current.wind_speed_10m;
        const weatherCode = data.current.weather_code;
        
        let condition = "Clear";
        let rainInfo = "No rain expected today";
        if (weatherCode >= 80 && weatherCode <= 99) {
            condition = "Rainy";
            rainInfo = "Rain expected today";
        } else if (weatherCode >= 61 && weatherCode <= 77) {
            condition = "Rainy";
            rainInfo = "Light rain possible";
        } else if (weatherCode >= 2 && weatherCode <= 3) {
            condition = "Partly cloudy";
        } else if (weatherCode >= 45 && weatherCode <= 48) {
            condition = "Foggy";
        }
        
        return {
            temp,
            humidity,
            windSpeed,
            condition,
            rainInfo,
            location: locationName
        };
    } catch (error) {
        console.error("Weather API error:", error);
        return {
            temp: 32,
            humidity: 80,
            windSpeed: 0.8,
            condition: "Partly cloudy",
            rainInfo: "Weather data unavailable",
            location: "Subang Jaya"
        };
    }
};


// --- Enhanced Local Intelligence ---
const generateLocalResponse = async (query, hasImage = false, imageValidation = null) => {
    await new Promise(resolve => setTimeout(resolve, 800));

    if (hasImage) {
        if (imageValidation && !imageValidation.hasCropColors) {
            return "⚠️ I couldn't detect any crop in this image. Please make sure your photo includes plants with visible green leaves or yellow/golden crops. Try capturing the image in good lighting with the crop filling most of the frame.";
        }
        return "I've analyzed the photo. It looks like Early Blight on a Tomato leaf. You should remove the infected leaves immediately and apply a copper-based fungicide.";
    }

    const q = query.toLowerCase();

    for (const [crop, data] of Object.entries(CROP_DB)) {
        if (q.includes(crop)) {
            if (q.includes('price') || q.includes('market') || q.includes('cost')) {
                return `Current market price for ${crop} is ${data.price}. The trend is ${data.trend}.`;
            }
            if (q.includes('pest') || q.includes('bug') || q.includes('disease')) {
                return `For ${crop}, watch out for ${data.pest}. ${data.advice}`;
            }
            return `${crop.charAt(0).toUpperCase() + crop.slice(1)} is trading at ${data.price}. ${data.advice}`;
        }
    }

    if (q.includes('weather') || q.includes('rain') || q.includes('temperature') || q.includes('forecast')) {
        let cityName = null;
        
        const patterns = [
            /weather (?:in|for|at) ([a-z\s]+?)(?:\?|$)/i,
            /(?:how|what)(?:'s| is) (?:the )?weather in ([a-z\s]+?)(?:\?|$)/i,
            /forecast (?:in|for) ([a-z\s]+?)(?:\?|$)/i,
            /temperature in ([a-z\s]+?)(?:\?|$)/i,
            /rain in ([a-z\s]+?)(?:\?|$)/i,
        ];
        
        for (const pattern of patterns) {
            const match = q.match(pattern);
            if (match) {
                cityName = match[1].trim();
                break;
            }
        }
        
        const weatherData = await fetchWeatherData(cityName);
        
        if (weatherData.error) {
            return weatherData.rainInfo;
        }
        
        return `The forecast for ${weatherData.location} is ${weatherData.condition.toLowerCase()} with a temperature of ${weatherData.temp}°C. Humidity is ${weatherData.humidity}%. ${weatherData.rainInfo}.`;
    }

    if (q.includes('hello') || q.includes('hi')) {
        return "Hello farmer! I am ready to help. You can ask me about Corn prices, Tomato pests, or the weather.";
    }
    
    return "I'm not sure about that. Try asking: 'What is the price of Chili?' or 'How is the weather?'";
};

// --- Simulated Mobile Keyboard ---
const MobileKeyboard = ({ onHide, onKeyPress, onDelete, onGo }) => (
    <div className="fixed bottom-0 left-0 right-0 h-[280px] bg-[#d1d5db] z-[60] flex flex-col animate-slideUp shadow-2xl">
        <div className="bg-[#f3f4f6] h-10 flex items-center justify-between px-4 border-b border-gray-300">
             <div className="text-gray-400 text-xs">Simulated Keyboard</div>
            <button onClick={onHide} className="text-[#007AFF] font-bold text-sm">Done</button>
        </div>
        <div className="flex-1 p-1.5 flex flex-col gap-2 pb-4 pt-2">
            <div className="flex gap-1.5 justify-center h-12">
                {['q','w','e','r','t','y','u','i','o','p'].map(k => (
                    <button key={k} onClick={() => onKeyPress(k)} className="flex-1 bg-white rounded-md shadow-sm flex items-center justify-center text-xl font-medium text-gray-900 active:bg-gray-200 active:scale-95 transition-transform">{k}</button>
                ))}
            </div>
            <div className="flex gap-1.5 justify-center h-12 px-4">
                {['a','s','d','f','g','h','j','k','l'].map(k => (
                    <button key={k} onClick={() => onKeyPress(k)} className="flex-1 bg-white rounded-md shadow-sm flex items-center justify-center text-xl font-medium text-gray-900 active:bg-gray-200 active:scale-95 transition-transform">{k}</button>
                ))}
            </div>
            <div className="flex gap-1.5 justify-center h-12 px-10">
                <button className="w-10 bg-[#acb3bf] rounded-md shadow-sm flex items-center justify-center active:bg-white active:scale-95 transition-transform"><ArrowUp size={18}/></button>
                {['z','x','c','v','b','n','m'].map(k => (
                    <button key={k} onClick={() => onKeyPress(k)} className="flex-1 bg-white rounded-md shadow-sm flex items-center justify-center text-xl font-medium text-gray-900 active:bg-gray-200 active:scale-95 transition-transform">{k}</button>
                ))}
                <button onClick={onDelete} className="w-10 bg-[#acb3bf] rounded-md shadow-sm flex items-center justify-center active:bg-white active:scale-95 transition-transform"><X size={18}/></button>
            </div>
            <div className="flex gap-1.5 justify-center h-12 px-1 mt-1">
                <button onClick={() => onKeyPress(' ')} className="w-20 bg-[#acb3bf] rounded-md shadow-sm flex items-center justify-center text-xs font-bold text-gray-700 active:bg-white">123</button>
                <button onClick={() => onKeyPress(' ')} className="flex-1 bg-white rounded-md shadow-sm active:bg-gray-200 flex items-center justify-center text-gray-400 text-sm">Space</button>
                <button onClick={onGo} className="w-20 bg-[#007AFF] rounded-md shadow-sm flex items-center justify-center text-white font-bold text-sm active:bg-blue-600 active:scale-95 transition-transform">Go</button>
            </div>
        </div>
    </div>
);

// --- Main Application Component ---
const VACA_App = () => {
  const [currentView, setCurrentView] = useState('home');
  const [activeTab, setActiveTab] = useState('home');
  
  // --- LIFTED STATE FOR PERSISTENCE ---
  const [chatHistory, setChatHistory] = useState([]); 
  const [cameraOrigin, setCameraOrigin] = useState('diagnosis'); // 'diagnosis' | 'voice'
  const [capturedPhoto, setCapturedPhoto] = useState(null); 
  const [uploadedDiagnosisPhoto, setUploadedDiagnosisPhoto] = useState(null); // NEW: Handle file upload to diagnosis
  const [voiceContext, setVoiceContext] = useState(null); 

  const navigateTab = (tabName) => {
      setActiveTab(tabName);
      setCurrentView(tabName);
  };

  // --- Bottom Navigation ---
  const BottomNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 flex justify-between items-end pb-6 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-50">
        <button onClick={() => navigateTab('home')} className={`flex-1 flex flex-col items-center gap-1 pb-2 ${activeTab === 'home' ? 'text-green-800' : 'text-gray-400'}`}>
            <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Home</span>
        </button>
        <button className="flex-1 flex flex-col items-center gap-1 pb-2 text-gray-300 cursor-not-allowed">
            <Calendar size={24} />
            <span className="text-[10px] font-medium">Calendar</span>
        </button>
        <div className="relative -top-6 flex-1 flex justify-center">
            <button onClick={() => navigateTab('ai-advisory')} className={`w-16 h-16 rounded-full flex flex-col items-center justify-center border-4 border-white shadow-xl transition-transform active:scale-95 ${activeTab === 'ai-advisory' ? 'bg-[#1B4D3E] text-white' : 'bg-green-700 text-white'}`}>
                <BrainCircuit size={28} />
            </button>
        </div>
        <button className="flex-1 flex flex-col items-center gap-1 pb-2 text-gray-300 cursor-not-allowed">
            <Leaf size={24} />
            <span className="text-[10px] font-medium">Field</span>
        </button>
        <button className="flex-1 flex flex-col items-center gap-1 pb-2 text-gray-300 cursor-not-allowed">
            <Settings size={24} />
            <span className="text-[10px] font-medium">Profile</span>
        </button>
    </div>
  );

  // 1. Home Screen
  const HomeScreen = () => (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col animate-fadeIn pb-32 font-sans">
      <div className="bg-[#FDFBF7] p-4 flex justify-between items-center pt-8">
        <div className="w-8"></div> 
        <div className="flex items-center gap-2">
           <h1 className="text-3xl font-black text-green-900 tracking-wider drop-shadow-sm">VACA</h1>
           <div className="bg-green-100 p-2 rounded-full"><Mic size={20} className="text-green-700"/></div>
        </div>
        <button className="flex items-center text-green-800 font-bold text-sm gap-1">Help <ChevronRight size={16}/></button>
      </div>

      <div className="px-4 space-y-5">
        <div className="relative">
            <input type="text" placeholder="Search crops, pests, or help..." className="w-full bg-white rounded-full py-4 px-6 pr-12 shadow-sm border border-green-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/20" />
            <Mic className="absolute right-5 top-4 text-green-700" size={20} />
        </div>

        <div 
            onClick={() => setCurrentView('tasks-management')}
            className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-4 shadow-sm relative overflow-hidden cursor-pointer transition active:scale-98"
        >
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-200/20 rounded-full -mr-10 -mt-10 blur-xl"></div>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-orange-700 text-xs font-bold uppercase mb-1 tracking-wide">Notifications</h3>
                    <h2 className="text-gray-900 font-bold text-lg">Upcoming Harvest</h2>
                </div>
                <div className="bg-orange-100 p-1.5 rounded-full text-orange-600">
                    <ChevronRight size={18} />
                </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-orange-900 font-bold bg-white/60 p-2 rounded-lg w-fit shadow-sm">
                <Star size={18} className="text-orange-500 fill-orange-500" />
                <span className="text-sm">Carrot field Harvesting in 3 days</span>
            </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-emerald-800 rounded-[30px] p-6 text-white shadow-lg shadow-green-900/10 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-400/20 rounded-full -ml-8 -mb-8 blur-xl"></div>
            
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex flex-col">
                    <div className="flex items-center gap-1 font-bold text-lg">
                        <MapPin size={18} className="text-yellow-300" /> Subang jaya
                    </div>
                    <span className="text-xs font-medium opacity-80 ml-5">13/12/2025</span>
                </div>
            </div>
            
            <div className="flex justify-between items-center text-center relative z-10">
                <div className="flex flex-col items-center gap-1">
                    <span className="text-sm font-bold">30%</span>
                    <Droplets size={24} className="text-blue-200 fill-blue-200" />
                    <span className="text-[10px] font-medium opacity-90">Humidity</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <span className="text-sm font-bold"><ArrowRight size={14}/></span>
                    <Wind size={24} className="text-white" />
                    <span className="text-[10px] font-medium opacity-90">Wind</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <span className="text-sm font-bold">27°</span>
                    <CloudSun size={28} className="text-yellow-300" />
                    <span className="text-[10px] font-medium opacity-90">Temp</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <span className="text-sm font-bold">0.8 km</span>
                    <Zap size={24} className="text-white" />
                    <span className="text-[10px] font-medium opacity-90">UV</span>
                </div>
            </div>
        </div>

        <button 
            onClick={() => { setActiveTab('ai-advisory'); setCurrentView('ai-advisory'); }}
            className="w-full bg-[#FFC107] hover:bg-[#FFB300] text-green-900 font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-yellow-500/20 transition-all active:scale-95 border border-yellow-400 mt-2"
        >
            <Mic size={28} className="text-green-900" strokeWidth={2.5} />
            <span className="text-xl tracking-tight">Ask Your Ai Advisory</span>
        </button>

      </div>
      <BottomNavigation />
    </div>
  );

  // 1.1 Task Management Subpage
  const TaskManagementScreen = () => {
      const [tasks, setTasks] = useState([
          { id: 1, title: 'Inspect Irrigation System', date: 'Today', time: '7:00 AM', priority: 'High', color: 'red' },
          { id: 2, title: 'Apply Organic Fertilizer', date: 'Tomorrow', time: '10:00 AM', priority: 'Medium', color: 'orange' },
          { id: 3, title: 'Check Weather Forecast', date: 'Oct 28, 2024', time: '8:00 AM', priority: 'Low', color: 'green' },
      ]);

      const getPriorityColor = (priority) => {
          switch(priority) {
              case 'High': return 'bg-red-400 text-white';
              case 'Medium': return 'bg-[#FBBF24] text-white';
              case 'Low': return 'bg-[#4ADE80] text-white';
              default: return 'bg-gray-400 text-white';
          }
      };

      return (
        <div className="min-h-screen bg-white flex flex-col animate-fadeIn relative font-sans">
            <div className="bg-white px-6 pt-10 pb-4 flex items-center gap-4 sticky top-0 z-30">
                <button onClick={() => setCurrentView('home')} className="flex items-center text-black font-bold text-sm hover:text-green-700 transition">
                    <ArrowLeft size={24}/>
                </button>
                <h1 className="text-2xl font-black text-black tracking-tight">Farm Tasks</h1>
            </div>

            <div className="flex-1 px-5 space-y-4 overflow-y-auto pb-32">
                {tasks.map(task => (
                    <div key={task.id} className="bg-gray-100 rounded-[20px] p-5 relative">
                        <div className={`absolute top-5 right-5 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                        </div>
                        <div className="pr-16">
                            <h3 className="font-bold text-black text-lg leading-tight mb-2">{task.title}</h3>
                            <div className="text-gray-600 text-sm font-medium flex items-center gap-2 mb-4">
                                <Clock size={14} /> <span>{task.date} • {task.time}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 mt-2">
                             <button className="flex items-center gap-1.5 text-black font-bold text-sm hover:opacity-70 transition">
                                <Pencil size={16} /> Edit
                            </button>
                             <button className="flex items-center gap-1.5 text-red-400 font-bold text-sm hover:opacity-70 transition">
                                <span className="text-red-400">Delete</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white z-20">
                <button className="w-full bg-[#2E5C31] text-white font-bold text-lg py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition">
                    Add New Task
                    <Sparkles size={20} className="text-green-200" />
                </button>
            </div>
        </div>
      );
  };

  // 2. AI Advisory Main Screen
  const AiAdvisoryScreen = () => {
    const [activeModal, setActiveModal] = useState(null); 
    const fileInputRef = useRef(null);

    const theme = {
        bg: '#FFFBF0', 
        banner: '#DD6E55', 
        cardBg: '#F9F4E8', 
        darkGreen: '#1A4331', 
    };

    const prompts = [
      { id: 1, title: 'Quick Prompts', icon: Zap, color: 'text-yellow-600', iconBg: 'bg-yellow-100', action: () => setActiveModal('quick-prompts') },
      { id: 2, title: 'Quick Chips', icon: Clock, color: 'text-orange-600', iconBg: 'bg-orange-100', action: () => setActiveModal('quick-chips') },
      { id: 3, title: 'Past Data', icon: Store, color: 'text-blue-600', iconBg: 'bg-blue-100', action: () => setActiveModal('past-data') },
      { id: 4, title: 'Farm Stats', icon: Settings, color: 'text-green-600', iconBg: 'bg-green-100', action: () => alert("Stats") },
    ];

    const handlePhotoOption = (type) => {
        if (type === 'upload') {
            fileInputRef.current.click();
        } else {
            // Camera Mode
            setActiveModal(null);
            setCameraOrigin('diagnosis');
            setCurrentView('photo-advisory');
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setUploadedDiagnosisPhoto(url);
            setCameraOrigin('diagnosis');
            setActiveModal(null);
            setCurrentView('photo-advisory');
        }
    };

    return (
      <div className="min-h-screen flex flex-col pb-24 animate-fadeIn" style={{ backgroundColor: theme.bg }}>
        
        <div className="flex justify-between items-center p-6 pt-8">
            <div className="w-8"></div>
            <h1 className="text-xl font-bold" style={{ color: theme.darkGreen }}>AI-Advisory Main</h1>
            <button className="w-8 h-8 flex items-center justify-center rounded-full border border-green-900/20 text-green-900">
                <HelpCircle size={18} />
            </button>
        </div>

        <div className="flex-1 px-6 space-y-8 flex flex-col">
            
            <div className="rounded-3xl p-5 relative overflow-hidden shrink-0 flex items-start gap-4 shadow-sm" style={{ backgroundColor: theme.banner }}>
                <div className="bg-black/10 p-2 rounded-xl shrink-0 mt-1"><AlertTriangle className="text-black/60" size={24} /></div>
                <div>
                    <h3 className="text-black/80 font-bold mb-1 text-base">Storm Alert</h3>
                    <p className="text-black/60 text-xs leading-relaxed font-medium pr-2">Heavy rains expected. Check drainage.</p>
                </div>
            </div>

            <div>
                <h3 className="font-bold text-lg mb-4" style={{ color: theme.darkGreen }}>Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                    {prompts.map((prompt) => (
                        <div key={prompt.id} onClick={prompt.action} className="rounded-[24px] flex flex-col items-center justify-center p-6 gap-3 shadow-sm hover:opacity-90 transition active:scale-95 h-36 cursor-pointer" style={{ backgroundColor: theme.cardBg }}>
                            <div className={`w-12 h-12 ${prompt.iconBg} rounded-full flex items-center justify-center border border-black/5`}>
                                <prompt.icon size={22} className={prompt.color} strokeWidth={2.5} />
                            </div>
                            <span className="font-bold text-sm" style={{ color: theme.darkGreen }}>{prompt.title}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-auto">
                <button 
                    onClick={() => setCurrentView('voice-advisory')}
                    className="h-40 rounded-[32px] flex flex-col items-center justify-center gap-4 text-white shadow-lg active:scale-95 transition hover:opacity-90"
                    style={{ backgroundColor: theme.darkGreen }}
                >
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                        <Mic size={32} strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-lg tracking-wide">Voice</span>
                </button>

                <button 
                    onClick={() => setActiveModal('photo-options')}
                    className="h-40 rounded-[32px] flex flex-col items-center justify-center gap-4 text-white shadow-lg active:scale-95 transition hover:opacity-90"
                    style={{ backgroundColor: theme.darkGreen }}
                >
                     <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                        <Camera size={32} strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-lg tracking-wide">Photo</span>
                </button>
            </div>
        </div>

        {activeModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" onClick={() => setActiveModal(null)}>
                <div className="bg-[#FFF8E7] w-full max-w-sm rounded-[30px] p-6 relative shadow-2xl" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 bg-black/5 rounded-full hover:bg-black/10 transition">
                        <X size={20} className="text-[#422006]" />
                    </button>

                    {/* Photo Options Modal */}
                    {activeModal === 'photo-options' && (
                        <>
                            <h3 className="text-xl font-bold text-[#1B4D3E] mb-4 text-center">Select Image Source</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => handlePhotoOption('camera')} className="bg-white border-2 border-green-600 rounded-2xl p-6 flex flex-col items-center gap-3 active:scale-95 transition hover:bg-green-50">
                                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-green-700">
                                        <Aperture size={32} />
                                    </div>
                                    <span className="font-bold text-[#1B4D3E]">Capture</span>
                                </button>
                                
                                <label className="bg-white border-2 border-[#EAB308] rounded-2xl p-6 flex flex-col items-center gap-3 active:scale-95 transition hover:bg-yellow-50 cursor-pointer">
                                    <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center text-[#EAB308]">
                                        <Upload size={32} />
                                    </div>
                                    <span className="font-bold text-[#422006]">Upload</span>
                                    {/* Hidden File Input Logic */}
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                                </label>
                            </div>
                        </>
                    )}

                    {activeModal === 'quick-prompts' && (
                        <>
                           <h3 className="text-xl font-bold text-[#1B4D3E] mb-4">Try Asking...</h3>
                           <div className="space-y-3">
                                {["Why are my tomato leaves curling?", "Current market price for Red Chili?", "Is it going to rain?"].map((q, i) => (
                                    <button key={i} className="w-full text-left p-4 bg-white rounded-2xl border border-yellow-200 text-[#422006] font-bold text-sm hover:bg-yellow-50 active:scale-98 transition flex items-center gap-3">
                                        <MessageCircle size={18} className="text-yellow-500 shrink-0" /> {q}
                                    </button>
                                ))}
                           </div>
                        </>
                    )}
                </div>
            </div>
        )}

        <BottomNavigation />
      </div>
    );
  };

  // 2.2 Voice Advisory
  const VoiceAdvisory = ({ chatHistory, setChatHistory }) => {
    const [status, setStatus] = useState('idle'); 
    const [inputMode, setInputMode] = useState('voice');
    const [textInput, setTextInput] = useState('');
    const [playingMessageId, setPlayingMessageId] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const chatEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const recognitionErrorRef = useRef(false);
    const fileInputRef = useRef(null);
    const processedPhotoRef = useRef(null); // Track processed photos to prevent duplicates

    // Initial load logic
    useEffect(() => {
    if ('speechSynthesis' in window) {
        // Cancel any existing speech first
        window.speechSynthesis.cancel();
        
        // Force load voices
        const voices = window.speechSynthesis.getVoices();
        console.log('🎵 Initial voices:', voices.length);
        
        // Retry loading if no voices yet
        if (voices.length === 0) {
            setTimeout(() => {
                const v = window.speechSynthesis.getVoices();
                console.log('🎵 Voices after delay:', v.length);
            }, 100);
        }
        
        window.speechSynthesis.onvoiceschanged = () => {
            const v = window.speechSynthesis.getVoices();
            console.log('🎵 Voices changed:', v.length);
        };
    }
        const init = async () => {
            if (voiceContext) {
                const newId = Date.now();
                setChatHistory(prev => [...prev, { type: 'user', text: voiceContext.text, id: newId }]);
                setVoiceContext(null);
                await processQuery(voiceContext.text);
            }
            else if (capturedPhoto && processedPhotoRef.current !== capturedPhoto) {
                // Mark this photo as processed to prevent duplicate processing
                processedPhotoRef.current = capturedPhoto;
                
                // Check if this image is already in chat history
                const alreadyInChat = chatHistory.some(msg => msg.image === capturedPhoto);
                if (!alreadyInChat) {
                    // Image NOT in chat yet (from diagnosis flow), add it
                    const userMsgId = Date.now();
                    setChatHistory(prev => [...prev, { 
                        type: 'user', 
                        text: "Analyze this image", 
                        image: capturedPhoto, 
                        id: userMsgId 
                    }]);
                }
                // Process the query (only once)
                const imgSrc = capturedPhoto;
                setCapturedPhoto(null);
                await processQuery("Analyze this image", true, imgSrc);
            }
        };
        init();
    }, []);

    const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(scrollToBottom, [chatHistory, status]);

    // --- ROBUST TTS Logic with Stop Control ---
    const speakText = (text, voiceType = 'female', msgId) => {
        console.log('🎵 speakText called for message:', msgId, 'current playing:', playingMessageId);
        
        if (!('speechSynthesis' in window)) {
            console.warn('Speech Synthesis not supported in this browser');
            return;
        }
        
        // CRITICAL: If clicking the same message that's playing, STOP it and EXIT
        if (playingMessageId === msgId && window.speechSynthesis.speaking) {
            console.log('🛑 STOP - Red button clicked, stopping audio');
            window.speechSynthesis.cancel();
            setPlayingMessageId(null);
            return; // STOP HERE
        }
        
        // Cancel any OTHER message's speech
        if (window.speechSynthesis.speaking) {
            console.log('⏹️ Canceling previous audio');
            window.speechSynthesis.cancel();
        }
        
        console.log('▶️ Starting audio playback for message:', msgId);
        
        // Small delay to ensure cancel completes before starting new speech
        setTimeout(() => {
            setPlayingMessageId(msgId);
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            utterance.lang = 'en-US';
            
            // Function to set voice and speak
            const speakWithVoice = () => {
                const voices = window.speechSynthesis.getVoices();
                console.log('Available voices:', voices.length);
                
                if (voices.length > 0) {
                    let selectedVoice = null;
                    
                    if (voiceType === 'female') {
                        // Try multiple female voice options
                        selectedVoice = voices.find(v => 
                            v.name.includes('Samantha') || 
                            v.name.includes('Victoria') ||
                            v.name.includes('Karen') ||
                            v.name.includes('Google US English Female') ||
                            v.name.includes('Moria') ||
                            v.name.includes('Fiona') ||
                            
                            (v.name.toLowerCase().includes('female') && v.lang.startsWith('en'))
                        );
                        
                        // Fallback to any US English voice
                        if (!selectedVoice) {
                            selectedVoice = voices.find(v => v.lang === 'en-US' || v.lang.startsWith('en'));
                        }
                    } else {
                        // Male voice options
                        selectedVoice = voices.find(v => 
                            v.name.includes('Daniel') || 
                            v.name.includes('Alex') ||
                            v.name.includes('Google US English Male') ||
                            v.name.includes('Microsoft David') ||
                            (v.name.toLowerCase().includes('male') && v.lang.startsWith('en'))
                        );
                        
                        // Fallback
                        if (!selectedVoice) {
                            selectedVoice = voices.find(v => v.lang === 'en-US' || v.lang.startsWith('en'));
                        }
                    }
                    
                    if (selectedVoice) {
                        utterance.voice = selectedVoice;
                        console.log('🎤 Using voice:', selectedVoice.name);
                    } else {
                        console.log('🎤 Using default system voice');
                    }
                }
                
                utterance.onstart = () => {
                    console.log('🔊 Speech started for:', voiceType);
                    setPlayingMessageId(msgId);
                };
                
                utterance.onend = () => {
                    console.log('✅ Speech ended');
                    setPlayingMessageId(null);
                };
                
                utterance.onerror = (event) => {
                    console.error('❌ Speech error:', event.error);
                    setPlayingMessageId(null);
                    
                    // Retry once if error is 'interrupted'
                    if (event.error === 'interrupted') {
                        setTimeout(() => {
                            window.speechSynthesis.speak(utterance);
                        }, 200);
                    }
                };
                
                // Keep reference to prevent garbage collection
                window.currentUtterance = utterance;
                
                // Speak the text
                try {
                    window.speechSynthesis.speak(utterance);
                    console.log('📢 Speech command issued');
                } catch (error) {
                    console.error('Failed to speak:', error);
                    setPlayingMessageId(null);
                }
            };
            
            // Check if voices are loaded
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                speakWithVoice();
            } else {
                // Wait for voices to load
                window.speechSynthesis.onvoiceschanged = () => {
                    speakWithVoice();
                };
                // Also try after a short delay as fallback
                setTimeout(speakWithVoice, 100);
            }
        }, 150);
    };

    const processQuery = async (userText, hasImage = false, imageSrc = null) => {
        setStatus('processing');
        
        let imageValidation = null;
        if (hasImage && imageSrc) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = imageSrc;
            await new Promise((resolve) => { img.onload = resolve; });
            imageValidation = await validateCropImage(img);
        }
        
        const aiText = await generateLocalResponse(userText, hasImage, imageValidation);
        const aiMsgId = Date.now() + 1;
        setChatHistory(prev => [...prev, { type: 'ai', text: aiText, id: aiMsgId }]);
        setStatus('idle');
        
        // Autoplay: Small delay to ensure voices are loaded and ready
        setTimeout(() => {
            speakText(aiText, 'female', aiMsgId);
        }, 200);
    };

    const handleGalleryUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setShowUploadModal(false);
            const imageUrl = URL.createObjectURL(file);
            const userMsgId = Date.now();
            setChatHistory(prev => [...prev, { 
                type: 'user', 
                text: "Analyze this image", 
                image: imageUrl, 
                id: userMsgId 
            }]);
            processQuery("Analyze this image", true, imageUrl);
        }
    };

    const handleCameraAction = () => {
        setShowUploadModal(false);
        setCameraOrigin('voice'); 
        setCurrentView('photo-advisory');
    };

    const toggleListening = () => {
        // Stop any playing audio when starting to listen
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            setPlayingMessageId(null);
        }
        
        if (status === 'listening') {
            if (recognitionRef.current) recognitionRef.current.stop();
            setStatus('idle');
        } else {
            recognitionErrorRef.current = false;
            if (!navigator.onLine) {
                 setStatus('processing'); 
                 setTimeout(() => {
                     const q = "What is the price of Chili?";
                     setChatHistory(prev => [...prev, { type: 'user', text: q, id: Date.now() }]);
                     processQuery(q);
                 }, 1000); 
                 return;
            }
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                setStatus('listening');
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                const recognition = new SpeechRecognition();
                recognitionRef.current = recognition;
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'en-US';
                recognition.onresult = (e) => {
                    const transcript = e.results[0][0].transcript;
                    setChatHistory(prev => [...prev, { type: 'user', text: transcript, id: Date.now() }]);
                    processQuery(transcript);
                };
                recognition.onerror = () => {
                    recognitionErrorRef.current = true;
                    recognition.abort();
                    setStatus('processing');
                    setTimeout(() => {
                        const q = "How do I prevent root rot?";
                        setChatHistory(prev => [...prev, { type: 'user', text: q, id: Date.now() }]);
                        processQuery(q);
                    }, 1000);
                };
                recognition.onend = () => { if(status === 'listening' && !recognitionErrorRef.current) setStatus('idle'); }
                try { recognition.start(); } catch (e) { /* Fallback */ }
            } else {
                const q = "Is it a good time to plant Rice?";
                setChatHistory(prev => [...prev, { type: 'user', text: q, id: Date.now() }]);
                processQuery(q);
            }
        }
    };

    const handleGo = () => {
        if (textInput.trim()) {
            setInputMode('voice');
            setChatHistory(prev => [...prev, { type: 'user', text: textInput, id: Date.now() }]);
            processQuery(textInput);
            setTextInput('');
        }
    };

    return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col animate-fadeIn relative">
        <div className="flex items-center p-6 pt-8 gap-4 z-10">
            <button onClick={() => setCurrentView('ai-advisory')} className="text-green-900 bg-white/50 p-2 rounded-full hover:bg-white transition"><ArrowLeft size={24} /></button>
            <h1 className="text-xl font-bold text-green-900">AI Assistant</h1>
        </div>

        <div className={`flex-1 px-4 overflow-y-auto space-y-4 pt-2 pb-60 transition-all duration-300 scroll-smooth`} style={{maxHeight: 'calc(100vh - 450px)'}}>
             <div className="bg-white border border-green-100 p-5 rounded-2xl rounded-tl-none max-w-[90%] text-gray-800 text-sm leading-relaxed shadow-sm">
                <p className="font-bold text-green-800 mb-1 flex items-center gap-2 text-xs uppercase tracking-wide"><Bot size={14}/> VACA AI</p>
                Hello! I'm ready to help. You can upload a photo or ask me about your farm.
            </div>

            {chatHistory.map((msg, index) => (
                <div key={index} className={`flex w-full ${msg.type === 'user' ? 'justify-end' : 'justify-start items-end gap-2'}`}>
                    <div className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm ${msg.type === 'user' ? 'bg-[#2D5A27] text-white rounded-tr-none' : 'bg-white border border-green-100 rounded-tl-none text-gray-800'}`}>
                        <p className={`font-bold mb-1 flex items-center gap-2 text-xs uppercase tracking-wide ${msg.type === 'ai' ? 'text-green-800' : 'text-green-200'}`}>
                            {msg.type === 'ai' ? <><Bot size={14}/> VACA AI</> : <><User size={14}/> YOU</>}
                        </p>
                        {msg.image && (
                            <div className="mb-2 rounded-lg overflow-hidden border-2 border-white/30">
                                <img src={msg.image} alt="User Upload" className="w-full h-32 object-cover" />
                            </div>
                        )}
                        {msg.text}
                    </div>
                    
                    <button 
                        onClick={() => speakText(msg.text, msg.type === 'ai' ? 'female' : 'male', msg.id)} 
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg shrink-0 transition-all duration-300 ${
                            playingMessageId === msg.id 
                                ? 'bg-red-500 text-white animate-pulse scale-110' 
                                : 'bg-white text-green-700 hover:bg-green-50 hover:scale-105'
                        } ${msg.type === 'user' ? 'order-first mr-2' : ''}`}
                    >
                        {playingMessageId === msg.id ? (
                            <StopCircle size={20} className="animate-pulse" />
                        ) : (
                            <PlayCircle size={20} />
                        )}
                    </button>
                </div>
            ))}
            
            {status === 'processing' && (
                <div className="flex justify-start w-full">
                     <div className="bg-white border border-green-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                         <Loader2 className="animate-spin text-green-600" size={18} /><span className="text-xs text-gray-400 font-bold">Thinking...</span>
                     </div>
                </div>
            )}
            <div ref={chatEndRef} />
        </div>

        {/* Input UI */}
        <div className={`fixed left-0 right-0 bg-white rounded-t-[40px] shadow-[0_-10px_60px_rgba(0,0,0,0.15)] transition-all duration-500 z-30 flex flex-col items-center justify-center ${inputMode === 'text' ? 'bottom-[280px] h-[100px] rounded-t-none border-b border-gray-200' : (status === 'listening' ? 'bottom-0 h-[45vh]' : 'bottom-0 h-[28vh]')}`}>
            {inputMode === 'voice' && (
                <>
                    <div className="flex-1 flex flex-col items-center justify-center w-full relative">
                        {status === 'listening' ? (
                            <div className="flex items-center justify-center gap-1.5 mb-6 h-12">
                                {[...Array(5)].map((_, i) => <div key={i} className="w-3 bg-[#4ADE80] rounded-full animate-pulse" style={{height: '100%', animationDuration: `${0.6 + i * 0.1}s`}}></div>)}
                            </div>
                        ) : (
                            <h3 className="text-2xl font-black text-[#1B4D3E] mb-2 tracking-tight">Tap to Speak</h3>
                        )}
                        <p className="text-gray-400 text-sm text-center max-w-xs px-6">{status === 'listening' ? "I'm listening..." : "Tap the mic or upload a photo."}</p>
                    </div>

                    <div className="pb-10 pt-2 w-full flex flex-col items-center relative">
                        <button onClick={toggleListening} className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 z-20 ${status === 'listening' ? 'bg-[#EF8989] text-white animate-pulse' : 'bg-[#EF8989] text-white hover:opacity-90'}`}>
                            <Mic size={36} />
                        </button>
                        <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between px-12 pointer-events-none">
                            <button onClick={() => setInputMode('text')} className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center pointer-events-auto hover:bg-gray-200 transition active:scale-95"><Keyboard size={20} /></button>
                            <button onClick={() => setShowUploadModal(true)} className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center pointer-events-auto hover:bg-gray-200 transition active:scale-95"><Camera size={20} /></button>
                        </div>
                    </div>
                </>
            )}

            {inputMode === 'text' && (
                <div className="w-full h-full flex items-center px-4 bg-gray-50">
                    <button onClick={() => setInputMode('voice')} className="p-2 mr-2 text-gray-500 hover:text-green-700 bg-gray-200 rounded-full transition"><X size={20} /></button>
                    <button onClick={() => setShowUploadModal(true)} className="p-2 mr-2 text-gray-500 hover:text-green-700 bg-gray-200 rounded-full transition"><Camera size={20} /></button>
                    <div className="flex-1 bg-white border-2 border-green-600 rounded-xl px-4 py-3 text-lg font-bold text-gray-900 shadow-sm flex items-center h-14">
                        {textInput}<span className="w-0.5 h-6 bg-green-600 ml-1 animate-pulse"></span>
                    </div>
                    <button onClick={handleGo} className="ml-3 w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-md active:scale-95 transition"><Send size={20} /></button>
                </div>
            )}
        </div>

        {/* Upload/Camera Selection Modal */}
        {showUploadModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" onClick={() => setShowUploadModal(false)}>
                <div className="bg-[#FFF8E7] w-full max-w-sm rounded-[30px] p-6 relative shadow-2xl" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowUploadModal(false)} className="absolute top-4 right-4 p-2 bg-black/5 rounded-full hover:bg-black/10 transition"><X size={20} className="text-[#422006]" /></button>
                    <h3 className="text-xl font-bold text-[#1B4D3E] mb-4 text-center">Add to Chat</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={handleCameraAction} className="bg-white border-2 border-green-600 rounded-2xl p-6 flex flex-col items-center gap-3 active:scale-95 transition hover:bg-green-50 cursor-pointer">
                            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-green-700"><Aperture size={32} /></div>
                            <span className="font-bold text-[#1B4D3E]">Camera</span>
                        </button>
                        
                        <label className="bg-white border-2 border-[#EAB308] rounded-2xl p-6 flex flex-col items-center gap-3 active:scale-95 transition hover:bg-yellow-50 cursor-pointer">
                            <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center text-[#EAB308]"><Upload size={32} /></div>
                            <span className="font-bold text-[#422006]">Gallery</span>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleGalleryUpload} />
                        </label>
                    </div>
                </div>
            </div>
        )}
        
        {inputMode === 'text' && <MobileKeyboard onHide={() => setInputMode('voice')} onKeyPress={(k) => setTextInput(prev => prev + k)} onDelete={() => setTextInput(prev => prev.slice(0, -1))} onGo={handleGo} />}
    </div>
    );
  };

  // 2.1 Photo Advisory (Unified Camera & Result)
  const PhotoAdvisory = () => {
    // Phases: 'live' (camera view), 'preview' (review shot), 'scanning' (anim), 'result' (diagnosis)
    const [phase, setPhase] = useState('live'); 
    const [activeTab, setActiveTab] = useState('diagnosis');
    
    // Camera States
    const [isScanning, setIsScanning] = useState(false);
    const [imgSrc, setImgSrc] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // Initial effect to handle direct uploads vs camera start
    useEffect(() => {
        if (uploadedDiagnosisPhoto) {
            setImgSrc(uploadedDiagnosisPhoto);
            setPhase('preview');
            setUploadedDiagnosisPhoto(null); // Consume the upload so it doesn't persist
        } else if (phase === 'live') {
            startCamera();
        }
        return () => stopCamera();
    }, [phase]); // Re-run if phase changes back to 'live'

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "environment" } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera access denied:", err);
            setImgSrc("https://images.unsplash.com/photo-1591857177580-dc82b9e4e119?w=800&q=80");
            setPhase('preview');
        }
    };

    const stopCamera = () => {
        const stream = videoRef.current?.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            const imgUrl = canvas.toDataURL('image/png');
            
            setImgSrc(imgUrl);
            setPhase('preview'); 
            stopCamera();
        }
    };

    const handleRetake = () => {
        setImgSrc(null);
        setPhase('live');
    };

    const handleUsePhoto = () => {
        if (cameraOrigin === 'voice') {
            // Add image to chat history
            const userMsgId = Date.now();
            setChatHistory(prev => [...prev, { 
                type: 'user', 
                text: "Analyze this image", 
                image: imgSrc, 
                id: userMsgId 
            }]);
            // Hand off to Voice Chat for processing
            setCapturedPhoto(imgSrc);
            setCurrentView('voice-advisory');
        } else {
            // Start Diagnosis Flow
            setPhase('scanning');
            setIsScanning(true);
            setTimeout(() => {
                setIsScanning(false);
                setPhase('result');
            }, 2500);
        }
    };

    const handleCancel = () => {
        if (cameraOrigin === 'voice') {
            setCurrentView('voice-advisory');
        } else {
            setCurrentView('ai-advisory');
        }
    };

    const handleAskAI = () => {
        setVoiceContext({
            type: 'diagnosis_followup',
            text: "I found a problem with my tomato plant. It has Early Blight. What are the organic treatments?"
        });
        setCurrentView('voice-advisory');
    };

    const handleNewScan = () => {
        setImgSrc(null);
        setPhase('live');
        setIsScanning(false);
    };

    return (
      <div className="min-h-screen bg-black flex flex-col animate-fadeIn relative overflow-hidden">
        {/* Visual Layer */}
        <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
            {phase === 'live' ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : (
                <img src={imgSrc} alt="Captured Crop" className="w-full h-full object-cover opacity-90"/>
            )}
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none"></div>
            
            {(phase === 'live' || phase === 'scanning') && (
                <div className="absolute top-1/4 left-8 right-8 bottom-1/3 border-2 border-white/50 rounded-3xl overflow-hidden transition-all duration-500" style={{ opacity: 1 }}>
                    {phase === 'scanning' && <div className="absolute top-0 left-0 right-0 h-1 bg-green-400 shadow-[0_0_20px_rgba(74,222,128,0.8)] animate-[scan_3s_infinite_linear]"></div>}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl"></div>
                    <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                        <span className="bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-md animate-pulse">
                            {phase === 'scanning' ? "Analyzing..." : "Align crop within frame"}
                        </span>
                    </div>
                </div>
            )}
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-6 pt-10">
            <button onClick={handleCancel} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition"><X size={24} /></button>
            <div className="bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"><span className="text-white font-bold text-sm tracking-wide">{cameraOrigin === 'voice' ? 'Chat Camera' : 'AI Diagnosis'}</span></div>
            <div className="w-10"></div> 
        </div>

        <div className="flex-1"></div>

        {/* Live Phase Controls */}
        {phase === 'live' && (
            <div className="relative z-20 pb-12 flex justify-center items-center">
                <button onClick={takePhoto} className="w-20 h-20 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-95 transition shadow-lg">
                    <div className="w-14 h-14 bg-white rounded-full"></div>
                </button>
            </div>
        )}

        {/* Preview Phase Controls */}
        {phase === 'preview' && (
             <div className="relative z-20 pb-12 px-8 flex justify-between items-center w-full gap-4">
                 <button onClick={handleRetake} className="flex-1 bg-white/20 backdrop-blur-md text-white font-bold py-4 rounded-2xl active:scale-95 transition flex items-center justify-center gap-2 border border-white/20">
                    <RefreshCw size={20} /> Retake
                </button>
                 <button onClick={handleUsePhoto} className="flex-[1.5] bg-[#2D5A27] text-white font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition flex items-center justify-center gap-2 border border-green-400/50">
                    {cameraOrigin === 'voice' ? <Send size={20} /> : <Sparkles size={20} />}
                    {cameraOrigin === 'voice' ? 'Send to Chat' : 'Analyze'}
                </button>
             </div>
        )}

        {/* Result Sheet */}
        <div className={`relative z-20 bg-[#FDFBF7] rounded-t-[32px] p-6 pb-8 shadow-[0_-10px_60px_rgba(0,0,0,0.5)] max-h-[60vh] overflow-y-auto transition-transform duration-700 cubic-bezier(0.19, 1, 0.22, 1) ${phase === 'result' ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1"><span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border border-red-200">High Confidence 98%</span></div>
                    <h2 className="text-2xl font-black text-gray-900 leading-tight">Early Blight</h2>
                    <p className="text-sm text-gray-500 font-medium">Fungal Infection • Alternaria solani</p>
                </div>
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100"><AlertTriangle size={28} className="text-red-500" /></div>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                <button onClick={() => setActiveTab('diagnosis')} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'diagnosis' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Diagnosis</button>
                <button onClick={() => setActiveTab('treatment')} className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'treatment' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Treatment</button>
            </div>
            {activeTab === 'diagnosis' && (
                <div className="space-y-4 animate-fadeIn">
                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100"><h4 className="font-bold text-orange-900 text-sm mb-2 flex items-center gap-2"><Eye size={16}/> Symptoms</h4><p className="text-xs text-orange-800/80 leading-relaxed font-medium">Concentric rings on lower leaves, yellowing tissue around spots.</p></div>
                </div>
            )}
            {activeTab === 'treatment' && (
                <div className="space-y-4 animate-fadeIn">
                     <div className="p-4 bg-green-50 rounded-2xl border border-green-100"><h4 className="font-bold text-green-900 text-sm mb-2 flex items-center gap-2"><Sprout size={16}/> Organic Solution</h4><p className="text-xs text-green-800/80 leading-relaxed font-medium mb-2">Remove infected leaves immediately. Apply Neem oil spray.</p></div>
                </div>
            )}
             <div className="flex gap-3 mt-6">
                 <button onClick={handleNewScan} className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl active:scale-95 transition flex items-center justify-center gap-2">
                    <RefreshCw size={20} /> New Scan
                </button>
                 <button onClick={handleAskAI} className="flex-[2] bg-[#2D5A27] text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition flex items-center justify-center gap-2">
                    <Sparkles size={20} className="text-yellow-300" />
                    Ask Assistant
                </button>
             </div>
        </div>
      </div>
    );
  };

  // --- Bottom Navigation ---
  return (
    <div className="font-sans text-gray-900 max-w-md mx-auto shadow-2xl relative min-h-screen bg-white overflow-hidden">
      {currentView === 'home' && <HomeScreen />}
      {currentView === 'ai-advisory' && <AiAdvisoryScreen />}
      {currentView === 'tasks-management' && <TaskManagementScreen />}
      
      {/* Pass persistent state props to VoiceAdvisory */}
      {currentView === 'voice-advisory' && <VoiceAdvisory chatHistory={chatHistory} setChatHistory={setChatHistory} />}
      
      {/* Photo Advisory handles its own camera logic but shares global 'setCapturedPhoto' */}
      {currentView === 'photo-advisory' && <PhotoAdvisory />}
      
      <style>{`
        
        
        .scroll-smooth { scroll-behavior: smooth; }
        .scroll-smooth::-webkit-scrollbar { width: 6px; }
        .scroll-smooth::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .scroll-smooth::-webkit-scrollbar-thumb { background: #4ade80; border-radius: 10px; }
        .scroll-smooth::-webkit-scrollbar-thumb:hover { background: #22c55e; }
        .scroll-smooth { scroll-behavior: smooth; }
        .scroll-smooth::-webkit-scrollbar { width: 6px; }
        .scroll-smooth::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .scroll-smooth::-webkit-scrollbar-thumb { background: #4ade80; border-radius: 10px; }
        .scroll-smooth::-webkit-scrollbar-thumb:hover { background: #22c55e; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
        @keyframes wave { 0%, 100% { height: 30%; } 50% { height: 100%; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes scan { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
      `}</style>
    </div>
  );
};

export default VACA_App;