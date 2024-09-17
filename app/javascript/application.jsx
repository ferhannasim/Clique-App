import { Application } from "@hotwired/stimulus";
const application = Application.start();

export { application };

import React from "react";
import { createRoot } from "react-dom/client";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";
import IndexTableComponent from "./components/IndexTable";
const container = document.getElementById("index-table");
const root = createRoot(container);
root.render(
    <AppProvider i18n={en}>
        <IndexTableComponent />
    </AppProvider>
);
