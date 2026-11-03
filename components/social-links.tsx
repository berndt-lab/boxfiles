import { ArrowIcon } from "@/components/ui"
import { NETWORKS, type Socials } from "@/lib/socials"

/** A player's social handles as quiet pills; Discord has no profile URL, so it shows the handle to copy. */
export function SocialLinks({ socials, className = "" }: { socials: Socials; className?: string }) {
  const links = NETWORKS.flatMap((network) => {
    const handle = socials[network.key]
    return handle ? [{ ...network, handle }] : []
  })
  if (links.length === 0) return null
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`}>
      {links.map((link) => (
        <li key={link.key}>
          {link.url ? (
            <a
              href={link.url(link.handle)}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="group inline-flex h-8 items-center gap-2 rounded-full border border-line bg-white/[0.02] pl-3 pr-2.5 text-sm transition-colors hover:border-ambient/50 hover:text-foreground"
            >
              <span className="label-mono text-faint">{link.label}</span>
              <span className="text-foreground/85">{link.handle}</span>
              <ArrowIcon className="size-3 text-faint transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          ) : (
            <span className="inline-flex h-8 items-center gap-2 rounded-full border border-line bg-white/[0.02] px-3 text-sm">
              <span className="label-mono text-faint">{link.label}</span>
              <span className="select-all text-foreground/85">{link.handle}</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
