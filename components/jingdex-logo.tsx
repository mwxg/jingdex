import Image from "next/image";

type JingdexLogoProps = Readonly<{
  className?: string;
  priority?: boolean;
}>;

export function JingdexLogo({
  className = "",
  priority = false,
}: JingdexLogoProps) {
  return (
    <>
      <Image
        src="/logos/logo_rect.svg"
        alt="Jingdex"
        width={2176}
        height={1024}
        className={`theme-logo-light ${className}`}
        priority={priority}
      />
      <Image
        src="/logos/logo_rect_dark.svg"
        alt="Jingdex"
        width={2176}
        height={1024}
        className={`theme-logo-dark ${className}`}
        priority={priority}
      />
    </>
  );
}
