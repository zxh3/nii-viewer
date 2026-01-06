import { ThemeProvider } from "@/components/theme-provider";
import NiiViewer from "@/components/NiiViewer";

function App() {
  return (
    <ThemeProvider>
      <div>
        <NiiViewer />
      </div>
    </ThemeProvider>
  );
}

export default App;
