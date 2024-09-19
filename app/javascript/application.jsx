import { Application } from "@hotwired/stimulus";
const application = Application.start();

export { application };

import React from "react";
import { createRoot } from "react-dom/client";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";
import IndexTableComponent from "./components/IndexTable";
import OrderIndexTableComponent from "./components/OrderIndexTable";
// import NavigationMenuComponent from "./components/NavigationMenuComponent";


document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById("index-table");
    if (container) {
        const root = createRoot(container);
        root.render(
            <AppProvider i18n={en}>
                <IndexTableComponent />
            </AppProvider>
        );
    }

    const order_container = document.getElementById("orders-index");
    if (order_container) {
        const orderRoot = createRoot(order_container);
        orderRoot.render(
            <AppProvider i18n={en}>
                <OrderIndexTableComponent />
            </AppProvider>
        );
    } else {
        console.error("Element with id 'orders-index' not found.");
    }
});
