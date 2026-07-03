import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { DirectoryProvider } from "./context/DirectoryContext.jsx";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
     <DirectoryProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </DirectoryProvider>
    </BrowserRouter>
  </React.StrictMode>
);