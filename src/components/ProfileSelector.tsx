import React, { useState } from 'react';
import { User } from '../types';
import { Plus, User as UserIcon } from 'lucide-react';

interface ProfileSelectorProps {
  users: User[];
  onSelectUser: (user: User) => void;
  onCreateUser: () => void;
}

const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  users,
  onSelectUser,
  onCreateUser
}) => {
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);

  const avatarColors = [
    'bg-gradient-to-br from-purple-500 to-pink-500',
    'bg-gradient-to-br from-blue-500 to-cyan-500',
    'bg-gradient-to-br from-green-500 to-emerald-500',
    'bg-gradient-to-br from-orange-500 to-red-500',
    'bg-gradient-to-br from-indigo-500 to-purple-500',
    'bg-gradient-to-br from-teal-500 to-blue-500'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="mb-6">
            <img 
              src="https://images.pexels.com/photos/1925536/pexels-photo-1925536.jpeg?auto=compress&cs=tinysrgb&w=400" 
              alt="Diary and pen" 
              className="w-24 h-24 mx-auto rounded-full object-cover shadow-lg"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            My Diary
          </h1>
          <p className="text-xl text-purple-200">Choose your profile to continue</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-center">
          {users.map((user, index) => (
            <div
              key={user.id}
              className="flex flex-col items-center cursor-pointer transform transition-all duration-300 hover:scale-105"
              onClick={() => onSelectUser(user)}
              onMouseEnter={() => setHoveredUser(user.id)}
              onMouseLeave={() => setHoveredUser(null)}
            >
              <div className={`
                w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center
                ${avatarColors[index % avatarColors.length]}
                shadow-lg transition-all duration-300
                ${hoveredUser === user.id ? 'shadow-2xl ring-4 ring-white/30' : ''}
              `}>
                <UserIcon className="w-12 h-12 md:w-16 md:h-16 text-white" />
              </div>
              <p className="mt-4 text-lg font-semibold text-white text-center">
                {user.name}
              </p>
            </div>
          ))}
          
          {/* Add new user */}
          <div
            className="flex flex-col items-center cursor-pointer transform transition-all duration-300 hover:scale-105"
            onClick={onCreateUser}
            onMouseEnter={() => setHoveredUser('new')}
            onMouseLeave={() => setHoveredUser(null)}
          >
            <div className={`
              w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center
              bg-white/20 backdrop-blur-sm border-2 border-dashed border-white/40
              shadow-lg transition-all duration-300
              ${hoveredUser === 'new' ? 'shadow-2xl ring-4 ring-white/30 bg-white/30' : ''}
            `}>
              <Plus className="w-12 h-12 md:w-16 md:h-16 text-white" />
            </div>
            <p className="mt-4 text-lg font-semibold text-white text-center">
              Add Profile
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSelector;