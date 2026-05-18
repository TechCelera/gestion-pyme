import Link from 'next/link'

type AuthFooterLinkProps = {
  prompt: string
  href: string
  linkLabel: string
}

export function AuthFooterLink({ prompt, href, linkLabel }: AuthFooterLinkProps) {
  return (
    <p className="text-center text-sm text-muted-foreground">
      {prompt}{' '}
      <Link href={href} className="font-medium text-primary hover:underline">
        {linkLabel}
      </Link>
    </p>
  )
}
