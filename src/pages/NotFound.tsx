import { Empty, LayerCard, LinkButton } from "@cloudflare/kumo";
import { CompassIcon } from "@phosphor-icons/react";
import { useTitle } from "../lib/useTitle.ts";

export function NotFoundPage({
  title = "Page not found",
  description = "The page you are looking for does not exist or has moved.",
  backHref = "/",
  backLabel = "Go to account home",
}: {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}) {
  useTitle(title);
  return (
    <>
      <h1 className="sr-only">{title}</h1>
      <LayerCard>
        <LayerCard.Primary className="px-6 py-16">
          <Empty
            size="lg"
            icon={<CompassIcon size={40} aria-hidden="true" />}
            title={title}
            description={description}
            contents={
              <LinkButton href={backHref} variant="primary">
                {backLabel}
              </LinkButton>
            }
          />
        </LayerCard.Primary>
      </LayerCard>
    </>
  );
}
