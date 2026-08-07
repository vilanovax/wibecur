import AuthAmbientBackground from './AuthAmbientBackground';

interface AuthShellProps {
  children: React.ReactNode;
}

export default function AuthShell({ children }: AuthShellProps) {
  return (
    <div
      className="relative flex min-h-screen flex-col px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]"
      dir="rtl"
    >
      <AuthAmbientBackground />
      <div className="relative z-10 mx-auto flex w-full max-w-[22rem] flex-1 flex-col sm:max-w-[24rem]">
        <div className="flex flex-1 flex-col justify-center">{children}</div>
      </div>
    </div>
  );
}
