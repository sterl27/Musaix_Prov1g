import React, { useState } from 'react';
import { Music, X } from 'lucide-react';

interface SignUpProps {
  onSignUp: () => void;
  onSwitchToLogin: () => void;
  onClose: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onSignUp, onSwitchToLogin, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate sign up
    onSignUp();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-musaix-dark">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-musaix-purple/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-musaix-cyan/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="bg-musaix-card border border-white/10 rounded-2xl p-8 w-full max-w-md relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 justify-center mb-4">
             <Music className="w-8 h-8 text-musaix-accent" />
          </div>
          <h2 className="text-2xl font-bold font-sans">Create Account</h2>
          <p className="text-gray-400">Join the future of music creation</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-musaix-accent transition-colors"
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-musaix-accent transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-musaix-accent transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button 
            type="submit"
            className="w-full py-3 bg-musaix-accent text-white rounded-lg font-bold hover:bg-musaix-accentHover transition-colors mt-2 shadow-lg"
          >
            Sign Up
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account? <button onClick={onSwitchToLogin} className="text-white hover:text-musaix-accent hover:underline font-medium">Sign In</button>
        </div>
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SignUp;