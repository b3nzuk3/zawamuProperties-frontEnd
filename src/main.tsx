import { createRoot } from 'react-dom/client'
import { captureSavedSearchAccessLink } from './lib/savedSearchApi'
import App from './App.tsx'
import './index.css'

// Remove the one-time bearer from the URL before React mounts any API consumers.
captureSavedSearchAccessLink()

createRoot(document.getElementById("root")!).render(<App />);
