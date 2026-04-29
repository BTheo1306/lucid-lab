import type { MDXComponents } from "mdx/types";
import Link from "next/link";

import { AuditFlashCTA } from "@/components/blog/AuditFlashCTA";

/**
 * Components made available to MDX post bodies.
 * Authors can drop `<AuditFlashCTA />` mid-post for contextual conversion.
 */
export const mdxComponents: MDXComponents = {
  AuditFlashCTA,
  a: ({ href, children, ...rest }) => {
    if (!href) return <a {...rest}>{children}</a>;
    if (href.startsWith("/") || href.startsWith("#")) {
      return (
        <Link href={href} {...rest}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  },
};
