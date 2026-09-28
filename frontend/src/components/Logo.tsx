/** Lagos State crest is the supplied asset, used unmodified (responsive WebP renditions of public/brand/lagos-state-crest.png). Never redrawn. */
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <img
        src="/brand/lagos-state-crest-96.webp"
        srcSet="/brand/lagos-state-crest-96.webp 96w, /brand/lagos-state-crest-192.webp 192w, /brand/lagos-state-crest-384.webp 384w"
        sizes="44px"
        width={44}
        height={44}
        alt="Lagos State Government crest"
        className="h-11 w-11 shrink-0 object-contain"
        decoding="async"
      />
      <span className="leading-tight">
        <span className={`block text-xl font-extrabold tracking-tight ${light ? "text-white" : "text-navy-900"}`}>LASBAG</span>
        <span className={`block text-[0.68rem] font-medium ${light ? "text-white/75" : "text-navy-700"}`}>Lagos State Building Approval Gateway</span>
      </span>
    </span>
  );
}
