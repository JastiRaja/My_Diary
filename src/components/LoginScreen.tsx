import React, { useState } from 'react';
import { User } from '../types';
import { ArrowLeft, Eye, EyeOff, HelpCircle } from 'lucide-react';
import SecureStorage from '../utils/storage';

interface LoginScreenProps {
  user: User | null;
  onLogin: (secretCode: string) => void;
  onBack: () => void;
  isCreating?: boolean;
  onCreateUser?: (name: string, secretCode: string, securityQuestion: string, securityAnswer: string) => void;
  onPasscodeReset?: (user: User, newSecretCode: string) => void;
}

const SECURITY_QUESTIONS = [
  "What was your favorite teacher's name?",
  "What is your best friend's name?",
  "What is your vehicle number?",
  "What was your favorite subject in school?",
  "What is your hall ticket number?"
];

const LoginScreen: React.FC<LoginScreenProps> = ({
  user,
  onLogin,
  onBack,
  isCreating = false,
  onCreateUser,
  onPasscodeReset
}) => {
  const [secretCode, setSecretCode] = useState('');
  const [userName, setUserName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newSecretCode, setNewSecretCode] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Security question fields
  const [selectedQuestion, setSelectedQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [showSecurityAnswer, setShowSecurityAnswer] = useState(false);
  
  // Reset flow fields
  const [resetStep, setResetStep] = useState<'name' | 'question' | 'newpasscode'>('name');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [userSecurityAnswer, setUserSecurityAnswer] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isResetMode) {
        console.log('Reset mode, step:', resetStep);
        if (resetStep === 'name') {
          if (!userName.trim()) {
            setError('Please enter your name');
            return;
          }
          
          const foundUser = SecureStorage.findUserByName(userName.trim());
          console.log('Found user:', foundUser);
          if (!foundUser) {
            setError('No profile found with that name');
            return;
          }
          
          setFoundUser(foundUser);
          setResetStep('question');
        } else if (resetStep === 'question') {
          if (!userSecurityAnswer.trim()) {
            setError('Please answer the security question');
            return;
          }
          
          console.log('Verifying security answer for user:', foundUser?.id);
          console.log('User security answer:', foundUser?.securityAnswer);
          console.log('Provided answer:', userSecurityAnswer);
          
          const isValid = SecureStorage.verifySecurityAnswer(foundUser!.id, userSecurityAnswer);
          console.log('Security answer valid:', isValid);
          
          if (!isValid) {
            setError('Incorrect answer to security question');
            return;
          }
          
          setResetStep('newpasscode');
        } else if (resetStep === 'newpasscode') {
          if (newSecretCode.length < 4) {
            setError('New secret code must be at least 4 characters');
            return;
          }
          
          console.log('Resetting passcode for user:', foundUser?.id);
          setResetUser(foundUser);
          onPasscodeReset?.(foundUser!, newSecretCode);
        }
      } else if (isCreating) {
        if (!userName.trim()) {
          setError('Please enter a name');
          return;
        }
        if (secretCode.length < 4) {
          setError('Secret code must be at least 4 characters');
          return;
        }
        if (!securityAnswer.trim()) {
          setError('Please answer the security question');
          return;
        }
        onCreateUser?.(userName.trim(), secretCode, selectedQuestion, securityAnswer.trim());
      } else {
        if (secretCode.length < 4) {
          setError('Please enter your secret code');
          return;
        }
        onLogin(secretCode);
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetMode = () => {
    setIsResetMode(true);
    setResetStep('name');
    setError('');
    setSecretCode('');
    setUserName('');
    setNewSecretCode('');
    setFoundUser(null);
    setUserSecurityAnswer('');
  };

  const handleBackToLogin = () => {
    setIsResetMode(false);
    setResetStep('name');
    setResetUser(null);
    setFoundUser(null);
    setError('');
    setSecretCode('');
    setUserName('');
    setNewSecretCode('');
    setUserSecurityAnswer('');
  };

  const handleBackInReset = () => {
    if (resetStep === 'question') {
      setResetStep('name');
      setFoundUser(null);
      setUserName('');
    } else if (resetStep === 'newpasscode') {
      setResetStep('question');
      setUserSecurityAnswer('');
    }
    setError('');
  };

  if (isResetMode && resetUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <button
            onClick={handleBackToLogin}
            className="mb-8 flex items-center text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Login
          </button>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
            <div className="text-center mb-8">
              <div className="mb-6">
                <HelpCircle className="w-20 h-20 mx-auto text-yellow-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Passcode Reset
              </h2>
              <p className="text-purple-200">
                Your passcode has been reset successfully!
              </p>
              <p className="text-green-200 text-sm mt-2">
                Your diary entries have been preserved and are now secured with your new passcode.
              </p>
            </div>

            <button
              onClick={handleBackToLogin}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Continue to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getTitle = () => {
    if (isResetMode) {
      switch (resetStep) {
        case 'name': return 'Reset Passcode';
        case 'question': return 'Security Question';
        case 'newpasscode': return 'New Passcode';
        default: return 'Reset Passcode';
      }
    }
    return isCreating ? 'Create Profile' : `Welcome${user ? `, ${user.name}` : ''}`;
  };

  const getSubtitle = () => {
    if (isResetMode) {
      switch (resetStep) {
        case 'name': return 'Enter your name to find your profile';
        case 'question': return `Answer: ${foundUser?.securityQuestion}`;
        case 'newpasscode': return 'Create a new secret code';
        default: return '';
      }
    }
    return isCreating ? 'Set up your new profile' : 'Enter your secret code to continue';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={isResetMode ? handleBackInReset : onBack}
          className="mb-8 flex items-center text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {isResetMode ? 'Back' : 'Back to Profiles'}
        </button>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <div className="mb-6">
              <img 
                src="https://images.pexels.com/photos/1925536/pexels-photo-1925536.jpeg?auto=compress&cs=tinysrgb&w=400" 
                alt="Open diary" 
                className="w-20 h-20 mx-auto rounded-full object-cover shadow-lg"
              />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {getTitle()}
            </h2>
            <p className="text-purple-200">
              {getSubtitle()}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name field for creation or reset step 1 */}
            {(isCreating || (isResetMode && resetStep === 'name')) && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="Enter your name"
                  maxLength={20}
                />
              </div>
            )}

            {/* Security question selection for creation */}
            {isCreating && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Security Question
                </label>
                <select
                  value={selectedQuestion}
                  onChange={(e) => setSelectedQuestion(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                >
                  {SECURITY_QUESTIONS.map((question, index) => (
                    <option key={index} value={question} className="bg-gray-800 text-white">
                      {question}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Security answer for creation */}
            {isCreating && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Security Answer
                </label>
                <div className="relative">
                  <input
                    type={showSecurityAnswer ? 'text' : 'password'}
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    placeholder="Enter your answer"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecurityAnswer(!showSecurityAnswer)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    {showSecurityAnswer ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-purple-200 mt-1">
                  Remember this answer - you'll need it to reset your passcode
                </p>
              </div>
            )}

            {/* Security answer verification for reset */}
            {isResetMode && resetStep === 'question' && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Security Answer
                </label>
                <div className="relative">
                  <input
                    type={showSecurityAnswer ? 'text' : 'password'}
                    value={userSecurityAnswer}
                    onChange={(e) => setUserSecurityAnswer(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    placeholder="Enter your answer"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecurityAnswer(!showSecurityAnswer)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    {showSecurityAnswer ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Secret code field for normal login or creation */}
            {!isResetMode && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Secret Code
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    placeholder={isCreating ? 'Create a secret code' : 'Enter your secret code'}
                    minLength={4}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {isCreating && (
                  <p className="text-xs text-purple-200 mt-1">
                    Remember this code - you'll need it to access your diary
                  </p>
                )}
              </div>
            )}

            {/* New secret code for reset */}
            {isResetMode && resetStep === 'newpasscode' && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  New Secret Code
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newSecretCode}
                    onChange={(e) => setNewSecretCode(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    placeholder="Create a new secret code"
                    minLength={4}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-yellow-200 mt-1">
                  ⚠️ Warning: Resetting your passcode will clear all existing diary entries
                </p>
              </div>
            )}

            {error && (
              <div className="text-red-300 text-sm bg-red-500/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Please wait...' : 
               isResetMode ? 
                 (resetStep === 'name' ? 'Find Profile' : 
                  resetStep === 'question' ? 'Verify Answer' : 'Reset Passcode') :
               isCreating ? 'Create Profile' : 'Enter My Diary'}
            </button>

            {!isCreating && !isResetMode && (
              <button
                type="button"
                onClick={handleResetMode}
                className="w-full py-2 text-purple-200 hover:text-white text-sm transition-colors"
              >
                Forgot your passcode?
              </button>
            )}

            {isResetMode && resetStep === 'name' && (
              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full py-2 text-purple-200 hover:text-white text-sm transition-colors"
              >
                Back to login
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;