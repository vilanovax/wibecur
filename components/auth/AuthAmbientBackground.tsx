import { AUTH_AMBIENT_COVERS } from '@/lib/auth/ambient-covers';

export default function AuthAmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {AUTH_AMBIENT_COVERS.map(({ src, className }) => (
        <div key={src} className={`absolute ${className}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            className="h-full w-full scale-110 object-cover opacity-[0.14] blur-3xl"
            loading="eager"
            decoding="async"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-[#f7f8fa]/88 backdrop-blur-[2px]" />
    </div>
  );
}
