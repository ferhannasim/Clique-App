import React, { useEffect } from 'react';
import {
    TextField,
    IndexTable,
    LegacyCard,
    IndexFilters,
    useSetIndexFiltersMode,
    useIndexResourceState,
    Text,
    ChoiceList,
    RangeSlider,
    Badge,
    Box,
    Card,
} from '@shopify/polaris';
import { useState, useCallback } from 'react';
import { createApp } from '@shopify/app-bridge';
import { AppLink, NavigationMenu } from '@shopify/app-bridge/actions';
import './IndexTableComponent.css'

export default function IndexTableComponent() {
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

            // Create Navigation Menu with items and make settings active
            NavigationMenu.create(app, {
                items: [productsLink, ordersLink, customersLink, settingsLink],
                active: productsLink,
            });
        }, []);

        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const [itemStrings, setItemStrings] = useState([
        'All',
        'Unpaid',
        'Open',
        'Closed',
        'Local delivery',
        'Local pickup',
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
                            duplicateView(value);
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

    const [selected, setSelected] = useState(0);
    const onCreateNewView = async (value) => {
        await sleep(500);
        setItemStrings([...itemStrings, value]);
        setSelected(itemStrings.length);
        return true;
    };

    const sortOptions = [
        { label: 'Order', value: 'order asc', directionLabel: 'Ascending' },
        { label: 'Order', value: 'order desc', directionLabel: 'Descending' },
        { label: 'Customer', value: 'customer asc', directionLabel: 'A-Z' },
        { label: 'Customer', value: 'customer desc', directionLabel: 'Z-A' },
        { label: 'Date', value: 'date asc', directionLabel: 'A-Z' },
        { label: 'Date', value: 'date desc', directionLabel: 'Z-A' },
        { label: 'Total', value: 'total asc', directionLabel: 'Ascending' },
        { label: 'Total', value: 'total desc', directionLabel: 'Descending' },
    ];

    const [sortSelected, setSortSelected] = useState(['order asc']);
    const { mode, setMode } = useSetIndexFiltersMode();
    const onHandleCancel = () => {};

    const onHandleSave = async () => {
        await sleep(1);
        return true;
    };

    const primaryAction = selected === 0
        ? {
            type: 'save-as',
            onAction: onCreateNewView,
            disabled: false,
            loading: false,
        }
        : {
            type: 'save',
            onAction: onHandleSave,
            disabled: false,
            loading: false,
        };

    const [accountStatus, setAccountStatus] = useState();
    const [moneySpent, setMoneySpent] = useState();
    const [taggedWith, setTaggedWith] = useState('');
    const [queryValue, setQueryValue] = useState('');

    const handleAccountStatusChange = useCallback((value) => setAccountStatus(value), []);
    const handleMoneySpentChange = useCallback((value) => setMoneySpent(value), []);
    const handleTaggedWithChange = useCallback((value) => setTaggedWith(value), []);
    const handleFiltersQueryChange = useCallback((value) => setQueryValue(value), []);
    const handleAccountStatusRemove = useCallback(() => setAccountStatus(undefined), []);
    const handleMoneySpentRemove = useCallback(() => setMoneySpent(undefined), []);
    const handleTaggedWithRemove = useCallback(() => setTaggedWith(''), []);
    const handleQueryValueRemove = useCallback(() => setQueryValue(''), []);
    const handleFiltersClearAll = useCallback(() => {
        handleAccountStatusRemove();
        handleMoneySpentRemove();
        handleTaggedWithRemove();
        handleQueryValueRemove();
    }, [handleAccountStatusRemove, handleMoneySpentRemove, handleQueryValueRemove, handleTaggedWithRemove]);

    const filters = [
        {
            key: 'accountStatus',
            label: 'Account status',
            filter: (
                <ChoiceList
                    title="Account status"
                    titleHidden
                    choices={[
                        { label: 'Enabled', value: 'enabled' },
                        { label: 'Not invited', value: 'not invited' },
                        { label: 'Invited', value: 'invited' },
                        { label: 'Declined', value: 'declined' },
                    ]}
                    selected={accountStatus || []}
                    onChange={handleAccountStatusChange}
                    allowMultiple
                />
            ),
            shortcut: true,
        },
        {
            key: 'taggedWith',
            label: 'Tagged with',
            filter: (
                <TextField
                    label="Tagged with"
                    value={taggedWith}
                    onChange={handleTaggedWithChange}
                    autoComplete="off"
                    labelHidden
                />
            ),
            shortcut: true,
        },
        {
            key: 'moneySpent',
            label: 'Money spent',
            filter: (
                <RangeSlider
                    label="Money spent is between"
                    labelHidden
                    value={moneySpent || [0, 500]}
                    prefix="$"
                    output
                    min={0}
                    max={2000}
                    step={1}
                    onChange={handleMoneySpentChange}
                />
            ),
        },
    ];

    const appliedFilters = [];
    if (accountStatus && accountStatus.length > 0) {
        const key = 'accountStatus';
        appliedFilters.push({
            key,
            label: disambiguateLabel(key, accountStatus),
            onRemove: handleAccountStatusRemove,
        });
    }
    if (moneySpent) {
        const key = 'moneySpent';
        appliedFilters.push({
            key,
            label: disambiguateLabel(key, moneySpent),
            onRemove: handleMoneySpentRemove,
        });
    }
    if (taggedWith !== '') {
        const key = 'taggedWith';
        appliedFilters.push({
            key,
            label: disambiguateLabel(key, taggedWith),
            onRemove: handleTaggedWithRemove,
        });
    }

    const orders = [
        {
            id: '1020',
            order: (
                <Text as="span" variant="bodyMd" fontWeight="semibold">
                    #1020
                </Text>
            ),
            date: 'Jul 20 at 4:34pm',
            customer: 'Jaydon Stanton',
            total: '$969.44',
            paymentStatus: <Badge progress="complete">Paid</Badge>,
            fulfillmentStatus: <Badge progress="incomplete">Unfulfilled</Badge>,
        },
        {
            id: '1019',
            order: (
                <Text as="span" variant="bodyMd" fontWeight="semibold">
                    #1019
                </Text>
            ),
            date: 'Jul 20 at 3:46pm',
            customer: 'Ruben Westerfelt',
            total: '$701.19',
            paymentStatus: <Badge progress="partiallyComplete">Partially paid</Badge>,
            fulfillmentStatus: <Badge progress="incomplete">Unfulfilled</Badge>,
        },
        {
            id: '1018',
            order: (
                <Text as="span" variant="bodyMd" fontWeight="semibold">
                    #1018
                </Text>
            ),
            date: 'Jul 20 at 3.44pm',
            customer: 'Leo Carder',
            total: '$798.24',
            paymentStatus: <Badge progress="complete">Paid</Badge>,
            fulfillmentStatus: <Badge progress="incomplete">Unfulfilled</Badge>,
        },
    ];
    const resourceName = {
        singular: 'order',
        plural: 'orders',
    };

    const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(orders);

    const rowMarkup = orders.map(
        (
            { id, order, date, customer, total, paymentStatus, fulfillmentStatus },
            index
        ) => (
            <IndexTable.Row
                id={id}
                key={id}
                selected={selectedResources.includes(id)}
                position={index}
            >
                <IndexTable.Cell>
                    <Text variant="bodyMd" fontWeight="bold" as="span">
                        {order}
                    </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>{date}</IndexTable.Cell>
                <IndexTable.Cell>{customer}</IndexTable.Cell>
                <IndexTable.Cell>
                    <Text as="span" alignment="end" numeric>
                        {total}
                    </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>{paymentStatus}</IndexTable.Cell>
                <IndexTable.Cell>{fulfillmentStatus}</IndexTable.Cell>
            </IndexTable.Row>
        ),
    );

    return (
        <>
            <Text as={"h1"} fontWeight={"bold"}>#2048</Text>
            {/* Custom Card Component Above LegacyCard */}
            <Box>
                <div style={{width: '55%', marginBottom: '20px'}}>
                    <Card sectioned>
                        <Box padding="4">
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '10px 20px',
                                borderRadius: '50px',
                                width: '100%'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <Text as="h1" fontWeight={"bold"}>Suppliers</Text>
                                    <Text as="p">2</Text>
                                </div>
                                <div style={{ borderLeft: '1px solid #D3D3D3', paddingLeft: '20px', textAlign: 'center', alignItems: "center", justifyContent: "center" }}>
                                    <Text as="h1" fontWeight={"bold"}>No. Brands</Text>
                                    <Text as="p">200</Text>
                                </div>
                                <div style={{ borderLeft: '1px solid #D3D3D3', paddingLeft: '20px', textAlign: 'center', alignItems: "center", justifyContent: "center" }}>
                                    <Text as="h1" fontWeight={"bold"}>Inventory</Text>
                                    <Text as="p">80,000</Text>
                                </div>
                                <div style={{ borderLeft: '1px solid #D3D3D3', paddingLeft: '20px', textAlign: 'center', alignItems: "center", justifyContent: "center" }}>
                                    <Text as="h1" fontWeight={"bold"}>Warehouse Locations</Text>
                                    <Text as="p">12</Text>
                                </div>
                                <div style={{ borderLeft: '1px solid #D3D3D3', paddingLeft: '20px', textAlign: 'center', alignItems: "center", justifyContent: "center" }}>
                                    <Text as="h1" fontWeight={"bold"}>Potential Revenue</Text>
                                    <Text as="p">10,500,000 EGP</Text>
                                </div>
                                <div style={{ borderLeft: '1px solid #D3D3D3', paddingLeft: '20px', textAlign: 'center', alignItems: "center", justifyContent: "center" }}>
                                    <Text as="h1" fontWeight={"bold"}>Potential Gross Profit</Text>
                                    <Text as="p">10,500,000 EGP</Text>
                                </div>
                            </div>
                        </Box>
                    </Card>
                </div>
            </Box>

            {/* Legacy Card Component */}
            <LegacyCard>
                <IndexFilters
                    sortOptions={sortOptions}
                    sortSelected={sortSelected}
                    queryValue={queryValue}
                    queryPlaceholder="Searching in all"
                    onQueryChange={handleFiltersQueryChange}
                    onQueryClear={() => setQueryValue('')}
                    onSort={setSortSelected}
                    primaryAction={primaryAction}
                    cancelAction={{
                        onAction: onHandleCancel,
                        disabled: false,
                        loading: false,
                    }}
                    tabs={tabs}
                    selected={selected}
                    onSelect={setSelected}
                    canCreateNewView
                    onCreateNewView={onCreateNewView}
                    filters={filters}
                    appliedFilters={appliedFilters}
                    onClearAll={handleFiltersClearAll}
                    mode={mode}
                    setMode={setMode}
                />
                <IndexTable
                    resourceName={resourceName}
                    itemCount={orders.length}
                    selectedItemsCount={
                        allResourcesSelected ? 'All' : selectedResources.length
                    }
                    onSelectionChange={handleSelectionChange}
                    headings={[
                        {title: 'Order'},
                        {title: 'Date'},
                        {title: 'Customer'},
                        {title: 'Total', alignment: 'end'},
                        {title: 'Payment status'},
                        {title: 'Fulfillment status'},
                    ]}
                >
                    {rowMarkup}
                </IndexTable>
            </LegacyCard>
        </>
    );



    function disambiguateLabel(key, value) {
        switch (key) {
            case 'moneySpent':
                return `Money spent is between $${value[0]} and $${value[1]}`;
            case 'taggedWith':
                return `Tagged with ${value}`;
            case 'accountStatus':
                return value?.map((val) => `Customer ${val}`).join(', ');
            default:
                return value;
        }
    }

    function isEmpty(value) {
        if (Array.isArray(value)) {
            return value.length === 0;
        } else {
            return value === '' || value == null;
        }
    }
}