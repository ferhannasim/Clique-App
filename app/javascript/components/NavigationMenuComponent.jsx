// NavigationMenuComponent.jsx
import React, {useEffect} from "react";
import {createApp} from "@shopify/app-bridge";
import { AppLink, NavigationMenu } from '@shopify/app-bridge/actions';
import {useLocation} from "react-router-dom";

const NavigationMenuComponent = () => {
    const location = useLocation(); // This is to get the current location to mark the active link
    const ordersUrl = document.getElementById('app-root').getAttribute('data-orders-url');

    useEffect(() => {
        const config = {
            apiKey: "13cb39066c49258dd5f45ab029840428",
            host: new URLSearchParams(window.location.search).get('host'),
            forceRedirect: true,
        };

        const app = createApp(config);

        // Create App Links for Navigation Menu
        const productsLink = AppLink.create(app, {
            label: 'Products',
            destination: '/products',
        });

        const ordersLink = AppLink.create(app, {
            label: 'Orders',
            destination: ordersUrl,
        });

        const customersLink = AppLink.create(app, {
            label: 'Customers',
            destination: '/customers',
        });

        const settingsLink = AppLink.create(app, {
            label: 'Settings',
            destination: '/settings',
        });

        // Create Navigation Menu with items and make current active
        NavigationMenu.create(app, {
            items: [productsLink, ordersLink, customersLink, settingsLink],
            active: location.pathname.includes("products")
                ? productsLink
                : location.pathname.includes("orders")
                    ? ordersLink
                    : location.pathname.includes("customers")
                        ? customersLink
                        : settingsLink,
        });
    }, [location]); // Re-run the effect when location changes

    return null;
};

export default NavigationMenuComponent;
