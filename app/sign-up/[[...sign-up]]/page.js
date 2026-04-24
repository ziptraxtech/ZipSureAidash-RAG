import { SignUp } from '@clerk/nextjs';
import { Zap } from 'lucide-react';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)' }}>

      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/20">
          <Zap className="text-white fill-white" size={28} />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">ZipSureAI</h1>
          <p className="text-blue-200 text-sm mt-1">Create your account</p>
        </div>
      </div>

      <SignUp
        appearance={{
          elements: {
            rootBox: 'shadow-2xl',
            card: 'rounded-2xl border border-white/10',
          },
        }}
      />

      <p className="mt-6 text-blue-300 text-xs">© 2025 ZipSure AI. All rights reserved.</p>
    </div>
  );
}
