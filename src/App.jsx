import React, { useState } from 'react';
import {
  Settings,
  ChevronRight,
  Flame,
  Target,
  Trophy,
  Activity,
  Home,
  Dumbbell,
  Compass,
  User,
  Plus,
} from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const activityData = [
    { day: 'M', height: '40%' },
    { day: 'T', height: '60%' },
    { day: 'W', height: '45%' },
    { day: 'T', height: '85%' },
    { day: 'F', height: '30%' },
    { day: 'S', height: '70%' },
    { day: 'S', height: '50%' },
  ];

  const volumeData = [
    { label: 'Chest', value: '4.2k', height: '70%', color: 'bg-blue-500' },
    { label: 'Back', value: '5.8k', height: '90%', color: 'bg-green-500' },
    { label: 'Legs', value: '3.1k', height: '55%', color: 'bg-orange-500' },
    { label: 'Arms', value: '2.4k', height: '40%', color: 'bg-pink-500' },
  ];

  return (
    <div className="flex justify-center bg-black min-h-screen font-sans text-white">
      <div className="w-full max-w-md bg-[#0D0D0D] min-h-screen relative flex flex-col shadow-2xl overflow-hidden">
        <div className="px-6 pt-12 pb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <button className="p-2 bg-[#1A1A1A] rounded-full hover:bg-[#252525] transition-colors">
            <Settings size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="px-6 flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-2 border-blue-500 p-1">
              <img
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200&auto=format&fit=crop"
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 border-2 border-[#0D0D0D]">
              <Plus size={14} strokeWidth={3} />
            </div>
          </div>
          <h2 className="mt-4 text-xl font-bold">Alex Johnson</h2>
          <p className="text-gray-500 text-sm">Pro Member since 2023</p>
        </div>

        <div className="px-6 mt-8 grid grid-cols-3 gap-4">
          <StatCard icon={<Flame size={18} className="text-orange-500" />} label="Calories" value="1,240" unit="kcal" />
          <StatCard icon={<Target size={18} className="text-blue-500" />} label="Weight" value="75.4" unit="kg" />
          <StatCard icon={<Trophy size={18} className="text-yellow-500" />} label="Workouts" value="48" unit="total" />
        </div>

        <div className="px-6 mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Total Volume</h3>
            <span className="text-gray-500 text-[10px] font-medium uppercase tracking-wider">Lbs per Group</span>
          </div>
          <div className="bg-[#1A1A1A] rounded-3xl p-6">
            <div className="flex justify-around items-end h-32 gap-2">
              {volumeData.map((item, index) => (
                <div key={item.label} className="flex flex-col items-center flex-1 h-full">
                  <span className="text-[10px] mb-1 font-bold text-white/90">{item.value}</span>
                  <div className="w-full max-w-[32px] bg-[#252525] rounded-t-lg h-24 relative overflow-hidden">
                    <div
                      className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-700 ease-out ${item.color}`}
                      style={{ height: item.height }}
                    />
                  </div>
                  <span className="text-[10px] mt-2 font-medium text-gray-500">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Weekly Activity</h3>
            <button className="text-blue-500 text-xs font-medium">See Details</button>
          </div>
          <div className="bg-[#1A1A1A] rounded-3xl p-6">
            <div className="flex justify-between items-end h-24 gap-2">
              {activityData.map((item, index) => (
                <div key={`${item.day}-${index}`} className="flex flex-col items-center flex-1 h-full">
                  <div className="w-3 bg-[#252525] rounded-full h-16 relative overflow-hidden">
                    <div
                      className={`absolute bottom-0 left-0 right-0 rounded-full transition-all duration-700 ease-out ${
                        index === 3 ? 'bg-blue-500' : 'bg-gray-600'
                      }`}
                      style={{ height: item.height }}
                    />
                  </div>
                  <span
                    className={`text-[10px] mt-2 font-medium ${index === 3 ? 'text-blue-500' : 'text-gray-500'}`}
                  >
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 mt-8 space-y-3 pb-36">
          <MenuItem icon={<Activity size={20} />} label="Training History" />
          <MenuItem icon={<User size={20} />} label="Personal Records" />
          <MenuItem icon={<Flame size={20} />} label="Badges & Achievements" badge="3 New" />
        </div>

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#1A1A1A]/90 backdrop-blur-xl px-8 py-6 flex justify-between items-center border-t border-white/5 z-20">
          <NavIcon active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home size={24} />} />
          <NavIcon
            active={activeTab === 'workout'}
            onClick={() => setActiveTab('workout')}
            icon={<Dumbbell size={24} />}
          />
          <div className="relative -top-10">
            <button className="bg-blue-600 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/20 hover:scale-110 transition-transform active:scale-95">
              <Plus size={28} />
            </button>
          </div>
          <NavIcon
            active={activeTab === 'explore'}
            onClick={() => setActiveTab('explore')}
            icon={<Compass size={24} />}
          />
          <NavIcon
            active={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
            icon={<User size={24} />}
          />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, unit }) => (
  <div className="bg-[#1A1A1A] p-4 rounded-2xl flex flex-col items-center justify-center">
    <div className="mb-2">{icon}</div>
    <span className="text-xs text-gray-500 mb-1">{label}</span>
    <div className="flex items-baseline gap-0.5">
      <span className="text-sm font-bold">{value}</span>
      <span className="text-[10px] text-gray-400 font-medium">{unit}</span>
    </div>
  </div>
);

const MenuItem = ({ icon, label, badge }) => (
  <div className="bg-[#1A1A1A] px-5 py-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-[#252525] transition-colors group">
    <div className="flex items-center gap-4">
      <div className="text-blue-500">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {badge && <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{badge}</span>}
      <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />
    </div>
  </div>
);

const NavIcon = ({ icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`transition-all duration-300 flex flex-col items-center ${
      active ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'
    }`}
  >
    {icon}
    {active && <div className="w-1 h-1 bg-blue-500 rounded-full mt-1" />}
  </button>
);

export default App;
