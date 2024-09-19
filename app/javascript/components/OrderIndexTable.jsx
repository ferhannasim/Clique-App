import React, { useState, useEffect, useCallback } from 'react';
import './IndexTableComponent.css'
import {
    Page,
    Card,
    IndexTable,
    ChoiceList,
    Badge,
    IndexFilters,
    LegacyCard,
    useSetIndexFiltersMode,
    useIndexResourceState,
    Avatar,
    TextContainer,
    Text,
    Box,
    LegacyStack, Divider
} from '@shopify/polaris';

function OrderIndexTableComponent() {
    const [selected, setSelected] = useState(0);
    const [summaryData, setSummaryData] = useState({
        suppliers: 0,
        vendors: 0,
        inventory: 0,
        warehouseLocations: 0,
        potentialRevenue: 0,
        potentialGrossProfit: 0,
    });

    //  real-time data fetching
    useEffect(() => {
        const fetchData = async () => {

            const response = await fetch('/api/summary-data');
            const data = await response.json();

            setSummaryData({
                suppliers: data.suppliers,
                vendors: data.vendors,
                inventory: data.inventory,
                warehouseLocations: data.warehouseLocations,
                potentialRevenue: data.potentialRevenue,
                potentialGrossProfit: data.potentialGrossProfit,
            });
        };

        fetchData(); // Fetch initial data
        const intervalId = setInterval(fetchData, 60000);

        return () => clearInterval(intervalId);
    }, []);

    const disambiguateLabel = (key, value) => {
        switch (key) {
            case "type":
                return value.map((val) => `type: ${val}`).join(", ");
            case "tone":
                return value.map((val) => `tone: ${val}`).join(", ");
            default:
                return value;
        }
    };

    const isEmpty = (value) => {
        if (Array.isArray(value)) {
            return value.length === 0;
        } else {
            return value === "" || value == null;
        }
    };

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const [itemStrings, setItemStrings] = useState([
        "All",
        "Active",
        "Draft",
        "Due",
    ]);

    const deleteView = (index) => {
        const newItemStrings = [...itemStrings];
        newItemStrings.splice(index, 1);
        setItemStrings(newItemStrings);
        setSelected(0);
    };

    const duplicateView = async (name) => {
        setItemStrings([...itemStrings, name]);
        setSelected(itemStrings.length);
        await sleep(1);
        return true;
    };

    const tabs = itemStrings.map((item, index) => ({
        content: item,
        index,
        onAction: () => {},
        id: `${item}-${index}`,
        isLocked: index === 0,
        actions:
            index === 0
                ? []
                : [
                    {
                        type: 'rename',
                        onAction: () => {},
                        onPrimaryAction: async (value) => {
                            const newItemsStrings = tabs.map((item, idx) => {
                                if (idx === index) {
                                    return value;
                                }
                                return item.content;
                            });
                            await sleep(1);
                            setItemStrings(newItemsStrings);
                            return true;
                        },
                    },
                    {
                        type: 'duplicate',
                        onPrimaryAction: async (value) => {
                            await sleep(1);
                            await duplicateView(value);
                            return true;
                        },
                    },
                    {
                        type: 'edit',
                    },
                    {
                        type: 'delete',
                        onPrimaryAction: async () => {
                            await sleep(1);
                            deleteView(index);
                            return true;
                        },
                    },
                ],
    }));

    const onCreateNewView = async (value) => {
        await sleep(500);
        setItemStrings([...itemStrings, value]);
        setSelected(itemStrings.length);
        return true;
    };

    const sortOptions = [
        { label: "Product", value: "product asc", directionLabel: "Ascending" },
        { label: "Product", value: "product desc", directionLabel: "Descending" },
        { label: "Status", value: "tone asc", directionLabel: "A-Z" },
        { label: "Status", value: "tone desc", directionLabel: "Z-A" },
        { label: "Type", value: "type asc", directionLabel: "A-Z" },
        { label: "Type", value: "type desc", directionLabel: "Z-A" },
        { label: "Vendor", value: "vendor asc", directionLabel: "Ascending" },
        { label: "Vendor", value: "vendor desc", directionLabel: "Descending" },
    ];

    const [sortSelected, setSortSelected] = useState(["product asc"]);
    const { mode, setMode } = useSetIndexFiltersMode();

    const onHandleCancel = () => {};
    const onHandleSave = async () => {
        await sleep(1);
        return true;
    };

    const primaryAction = selected === 0
        ? {
            type: "save-as",
            onAction: onCreateNewView,
            disabled: false,
            loading: false,
        }
        : {
            type: "save",
            onAction: onHandleSave,
            disabled: false,
            loading: false,
        };

    const [tone, setStatus] = useState(undefined);
    const [type, setType] = useState(undefined);
    const [queryValue, setQueryValue] = useState("");

    const handleStatusChange = useCallback((value) => setStatus(value), []);
    const handleTypeChange = useCallback((value) => setType(value), []);
    const handleFiltersQueryChange = useCallback((value) => setQueryValue(value), []);
    const handleStatusRemove = useCallback(() => setStatus(undefined), []);
    const handleTypeRemove = useCallback(() => setType(undefined), []);
    const handleQueryValueRemove = useCallback(() => setQueryValue(""), []);
    const handleFiltersClearAll = useCallback(() => {
        handleStatusRemove();
        handleTypeRemove();
        handleQueryValueRemove();
    }, [handleStatusRemove, handleQueryValueRemove, handleTypeRemove]);

    const filters = [
        {
            key: "tone",
            label: "Status",
            filter: (
                <ChoiceList
                    title="tone"
                    titleHidden
                    choices={[
                        { label: "Active", value: "active" },
                        { label: "Draft", value: "draft" },
                        { label: "Archived", value: "archived" },
                    ]}
                    selected={tone || []}
                    onChange={handleStatusChange}
                    allowMultiple
                />
            ),
            shortcut: true,
        },
        {
            key: "type",
            label: "Type",
            filter: (
                <ChoiceList
                    title="Type"
                    titleHidden
                    choices={[
                        { label: "Brew Gear", value: "brew-gear" },
                        { label: "Brew Merch", value: "brew-merch" },
                    ]}
                    selected={type || []}
                    onChange={handleTypeChange}
                    allowMultiple
                />
            ),
            shortcut: true,
        },
    ];

    const appliedFilters = [];
    if (tone && !isEmpty(tone)) {
        const key = "tone";
        appliedFilters.push({
            key,
            label: disambiguateLabel(key, tone),
            onRemove: handleStatusRemove,
        });
    }
    if (type && !isEmpty(type)) {
        const key = "type";
        appliedFilters.push({
            key,
            label: disambiguateLabel(key, type),
            onRemove: handleTypeRemove,
        });
    }

    const products = [
        {
            id: "1020",
            product: "1ZPRESSO | J-MAX Manual Coffee Grinder",
            tone: <Badge tone="success">Active</Badge>,
            inventory: "20 in stock",
            type: "Brew Gear",
            vendor: "Espresso Shot Coffee",
            dropshipsupplier: 'Steeler',
            warehouseLocation: 'Pakistan',
            subcategory: 'T-Shirt',
            quentity: '30',
            unitcosteur: '30 EUR',
            costofdropshippingcarriereur: '9.8 EUR',
            unitcostEGP: '300 EGP',
            unitcostusd: '40 USD',
            costofkgusd: '25.98 USD',
            costofgramUSD: '0.03 USD',
            unitweightGR: '185 gm',
            unitcostincludingweightusd: '9.8 USD',
            unitcostincludingweightegp: '12.3 EGP',
            crossmargin: '50%',
            finalprice: '80 USD'
        },
    ];

    const { allResourcesSelected, selectedResources, handleSelectionChange } = useIndexResourceState(products);

    const resourceName = {
        singular: "Product",
        plural: "Products",
    };

    const rowMarkup = products.map(
        (
            {
                id,
                product,
                tone,
                inventory,
                type,
                vendor,
                dropshipsupplier,
                warehouseLocation,
                subcategory,
                quentity,
                unitcosteur,
                costofdropshippingcarriereur,
                unitcostusd,
                unitcostEGP,
                costofkgusd,
                costofgramUSD,
                unitweightGR,
                unitcostincludingweightusd,
                unitcostincludingweightegp,
                crossmargin,
                finalprice
            },
            index
        ) => (
            <IndexTable.Row id={id} key={id} selected={selectedResources.includes(id)}>
                <IndexTable.Cell>
                    <div style={{ display: "flex", alignItems: "center", gap: '10px' }}>
                        <Avatar source={'https://static4.depositphotos.com/1013245/356/i/950/depositphotos_3561159-stock-photo-luxuru-black-leather-jacket-isolated.jpg'} />{product}
                    </div>
                </IndexTable.Cell>
                <IndexTable.Cell>{tone}</IndexTable.Cell>
                <IndexTable.Cell>{inventory}</IndexTable.Cell>
                <IndexTable.Cell>{type}</IndexTable.Cell>
                <IndexTable.Cell>{vendor}</IndexTable.Cell>
                <IndexTable.Cell>{dropshipsupplier}</IndexTable.Cell>
                <IndexTable.Cell>{warehouseLocation}</IndexTable.Cell>
                <IndexTable.Cell>{subcategory}</IndexTable.Cell>
                <IndexTable.Cell>{quentity}</IndexTable.Cell>
                <IndexTable.Cell>{unitcosteur}</IndexTable.Cell>
                <IndexTable.Cell>{costofdropshippingcarriereur}</IndexTable.Cell>
                <IndexTable.Cell>{unitcostusd}</IndexTable.Cell>
                <IndexTable.Cell>{unitcostEGP}</IndexTable.Cell>
                <IndexTable.Cell>{costofkgusd}</IndexTable.Cell>
                <IndexTable.Cell>{costofgramUSD}</IndexTable.Cell>
                <IndexTable.Cell>{unitweightGR}</IndexTable.Cell>
                <IndexTable.Cell>{unitcostincludingweightusd}</IndexTable.Cell>
                <IndexTable.Cell>{unitcostincludingweightegp}</IndexTable.Cell>
                <IndexTable.Cell>{crossmargin}</IndexTable.Cell>
                <IndexTable.Cell>{finalprice}</IndexTable.Cell>
            </IndexTable.Row>
        )
    );

    return (
        <Box>
            <Box paddingBlockEnd={'800'}>
                <Text variant="headingXl"  alignment={"start"} as="h1" fontWeight="bold">Product</Text>
            </Box>
            <Box  maxWidth="90%" paddingBlockEnd='600' textAlign="center">
                <LegacyCard  sectioned>
                    <TextContainer >

                        <div>
                            <LegacyStack distribution="equalSpacing" vertical={false} alignment="center">
                                <LegacyStack.Item fill>
                                    <Text variant="headingMd" as="h2" fontWeight="bold">Suppliers</Text>
                                    <Text variant="headingMd" fontWeight="bold">{summaryData.suppliers}</Text>
                                </LegacyStack.Item>

                                <LegacyStack.Item fill>
                                    <Box borderInlineStartWidth="025" paddingInlineStart={'500'} borderColor="border-subdued">
                                        <Text variant="headingMd" as="h2" fontWeight="bold">No. Brands</Text>
                                        <Text variant="headingMd" fontWeight="bold">{summaryData.vendors}</Text>
                                    </Box>
                                </LegacyStack.Item>

                                <LegacyStack.Item fill>
                                    <Box borderInlineStartWidth="025" paddingInlineStart={'500'}  borderColor="border-subdued">
                                        <Text variant="headingMd" as="h2" fontWeight="bold">Inventory</Text>
                                        <Text variant="headingMd" fontWeight="bold">{summaryData.inventory}</Text>
                                    </Box>
                                </LegacyStack.Item>

                                <LegacyStack.Item fill>
                                    <Box borderInlineStartWidth="025" paddingInlineStart={'500'}  borderColor="border-subdued">
                                        <Text variant="headingMd" as="h2" fontWeight="bold">Warehouse Locations</Text>
                                        <Text variant="headingMd" fontWeight="bold">{summaryData.warehouseLocations}</Text>
                                    </Box>
                                </LegacyStack.Item>

                                <LegacyStack.Item fill>
                                    <Box borderInlineStartWidth="025" paddingInlineStart={'500'}  borderColor="border-subdued">
                                        <Text variant="headingMd" as="h2" fontWeight="bold">Potential Revenue</Text>
                                        <Text variant="headingMd" fontWeight="bold">{summaryData.potentialRevenue} EGP</Text>
                                    </Box>
                                </LegacyStack.Item>

                                <LegacyStack.Item fill>
                                    <Box borderInlineStartWidth="025" paddingInlineStart={'500'} borderColor="border-subdued">
                                        <Text variant="headingMd" as="h2" fontWeight="bold">Potential Gross Profit</Text>
                                        <Text variant="headingMd" fontWeight="bold">{summaryData.potentialGrossProfit} EGP</Text>
                                    </Box>
                                </LegacyStack.Item>
                            </LegacyStack>

                        </div>
                    </TextContainer>
                </LegacyCard>
            </Box>

            <LegacyCard sectioned>
                <IndexFilters
                    sortOptions={sortOptions}
                    sortSelected={sortSelected}
                    queryValue={queryValue}
                    queryPlaceholder="Searching in all"
                    onQueryChange={handleFiltersQueryChange}
                    onQueryClear={handleQueryValueRemove}
                    primaryAction={primaryAction}
                    cancelAction={{
                        onAction: onHandleCancel,
                        disabled: false,
                    }}
                    tabs={tabs}
                    selected={selected}
                    onSortChange={setSortSelected}
                    onSelect={setSelected}
                    canCreateNewView={true}
                    filters={filters}
                    appliedFilters={appliedFilters}
                    onClearAll={handleFiltersClearAll}
                    mode={mode}
                    setMode={setMode}
                />
            </LegacyCard>
            <Card>
                <IndexTable
                    resourceName={resourceName}
                    itemCount={products.length}
                    selectedItemsCount={
                        allResourcesSelected ? "All" : selectedResources.length
                    }
                    onSelectionChange={handleSelectionChange}
                    headings={[
                        { title: "Product" },
                        { title: "Status" },
                        { title: "Inventory" },
                        { title: "Type" },
                        { title: "Vendor" },
                        { title: "DropShip Supplier" },
                        { title: 'Warehouse Location' },
                        { title: 'Subcategory' },
                        { title: 'Quantity' },
                        { title: 'Unit Cost' },
                        { title: 'Cost of Dropshipping Carrier (EUR)' },
                        { title: 'Unit Cost (USD)' },
                        { title: 'Unit Cost (EGP)' },
                        { title: 'Cost of Kg (USD)' },
                        { title: 'Cost of Gram (USD )' },
                        { title: 'Unit WeightSupplier (GR)' },
                        { title: 'Unit Cost Including Weight (USD)' },
                        { title: 'Unit Cost Including Weight (EGP)' },
                        { title: 'Cross Margin' },
                        { title: 'Final Price' }
                    ]}
                >
                    {rowMarkup}
                </IndexTable>
            </Card>
        </Box>
    );
}

export default OrderIndexTableComponent;
