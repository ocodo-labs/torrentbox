import { ExternalLinkProvider } from "@/contexts/external-link-provider";

export const ListingProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ExternalLinkProvider>
      {children}
    </ExternalLinkProvider>
  );
};
