import { ThemeProvider } from "@/contexts/theme-provider";
import { TransmissionProvider } from "@/contexts/transmission-provider";
import { TorrentBox } from "@/components/torrent-box";
import { Toaster } from "sonner";

export default function App() {
  return (
    <ThemeProvider>
      <TransmissionProvider>
        <>
          <TorrentBox />
          <Toaster
            position="bottom-center"
            theme='dark'
            richColors />
        </>
      </TransmissionProvider>
    </ThemeProvider>
  );
}
