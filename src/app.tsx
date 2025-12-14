import { ThemeProvider } from "@/contexts/theme-provider";
import { TorrentBox } from "@/components/torrent-box";
import { Toaster } from "sonner";
import { Modals } from "@/app/modals";
import { ListingProviders } from "@/app/link-providers";
import { LogicProviders } from "@/app/logic-providers";


export default function App() {
  return (
    <ThemeProvider>
      <LogicProviders>
        <ListingProviders>
          <TorrentBox />
          <Modals />
          <Toaster
            position="bottom-center"
            theme='dark'
            richColors />
        </ListingProviders>
      </LogicProviders>
    </ThemeProvider >
  );
}




