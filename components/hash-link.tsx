"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

type HashLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

export const HashLink = React.forwardRef<HTMLAnchorElement, HashLinkProps>(
  ({ href, onClick, target, ...props }, ref) => {
    const pathname = usePathname();
    const router = useRouter();

    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.altKey ||
        event.ctrlKey ||
        event.shiftKey ||
        target
      ) {
        return;
      }

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin || !url.hash) {
        return;
      }

      event.preventDefault();
      const nextUrl = `${url.pathname}${url.search}${url.hash}`;

      if (url.pathname === pathname) {
        const oldUrl = window.location.href;
        window.history.pushState(null, "", nextUrl);
        window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL: oldUrl, newURL: window.location.href }));
        return;
      }

      router.push(nextUrl, { scroll: false });
    };

    return <a ref={ref} href={href} target={target} onClick={handleClick} {...props} />;
  },
);

HashLink.displayName = "HashLink";
