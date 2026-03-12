import Image from "next/image";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/assets/logo/manufacto.png"
      alt="Manufacto"
      width={260}
      height={62}
      className={`object-contain object-left ${className}`}
      priority
      unoptimized
    />
  );
}
