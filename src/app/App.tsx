import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./contexts/AuthContext";
import { PMSProvider } from "./contexts/PMSContext";
import TitleBar from "./components/TitleBar";

const isElectron = typeof window !== "undefined" && typeof window.electronAPI !== "undefined";

export default function App() {
  return (
    <AuthProvider>
      <PMSProvider>
        <TitleBar />
        <div className="flex flex-col h-screen overflow-hidden" style={{ paddingTop: 0 }}>
          <div className="flex-1 overflow-hidden relative">
            <RouterProvider router={router} />
          </div>
        </div>
      </PMSProvider>
    </AuthProvider>
  );
}
