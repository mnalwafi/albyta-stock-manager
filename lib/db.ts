// src/lib/db.ts
import Dexie, { type EntityTable } from 'dexie';

export interface Customer {
    id: number;
    name: string;
    phone: string;
    totalDebt: number; // The current running balance
    updatedAt: Date;
}

export interface DebtPayment {
    id: number;
    customerId: number;
    amount: number;
    date: Date;
}

// 1. Define the shape of your data (TypeScript Interface)
export interface StockItem {
    id: number;
    name: string;
    sku: string;
    category: string;
    quantity: number;
    unit: string; // Added the unit here
    price: number;      // Selling Price
    costPrice: number;  // New: Capital Price (HPP)
    minStock: number;
    updatedAt: Date;
}

export interface Transaction {
    id: number;
    date: Date;
    total: number;
    payment: number;
    change: number;
    items: {
        stockId: number;
        name: string;
        qty: number;
        price: number; // Price snapshot at time of sale
        costPrice: number;
    }[];
    customerId?: number; // Optional: Link sale to a person
    isDebt: boolean;
}

export interface ConsignmentItem {
    stockId: number;
    name: string;
    initialQty: number; // How many she took (e.g., 30)
    costPrice: number;
    price: number;
}

export interface Consignment {
    id: number;
    date: Date;
    customerId: number; // Bu Ani
    items: ConsignmentItem[];
    status: 'OPEN' | 'SETTLED'; // OPEN = She has items. SETTLED = She reported back.
    settledAt?: Date;
}

// 2. Initialize the Database
const db = new Dexie('StockManagementDB') as Dexie & {
    stocks: EntityTable<StockItem, 'id'>;
    transactions: EntityTable<Transaction, 'id'>;
    customers: EntityTable<Customer, 'id'>;          // NEW
    debt_payments: EntityTable<DebtPayment, 'id'>;
    consignments: EntityTable<Consignment, 'id'>
};

// 3. Define the Schema (The syntax is specific to Dexie)
// We only index fields we want to search or sort by.
db.version(1).stores({
    stocks: '++id, name, sku, category, unit, price, updatedAt'
});

db.version(2).stores({
    stocks: '++id, name, sku, category, unit, price, updatedAt',
    transactions: '++id, date' // We only need to index fields we search/sort by
});

db.version(3).stores({
    stocks: '++id, name, sku, category, unit, price, costPrice, updatedAt',
    transactions: '++id, date'
}).upgrade(trans => {
    // Migration: Set default costPrice to 0 for existing items so app doesn't crash
    return trans.table("stocks").toCollection().modify(stock => {
        stock.costPrice = stock.costPrice || 0;
    });
});

db.version(4).stores({
    stocks: '++id, name, sku, category, unit, price, costPrice, updatedAt',
    transactions: '++id, date, customerId, isDebt', // Added indices
    customers: '++id, name, totalDebt',
    debt_payments: '++id, customerId, date'
}).upgrade(trans => {
    // Migration for existing transactions
    return trans.table("transactions").toCollection().modify(tx => {
        tx.customerId = tx.customerId || null;
        tx.isDebt = false;
    });
});

db.version(5).stores({
    stocks: '++id, name, sku, category, unit, price, costPrice, minStock, updatedAt', // Add minStock
    transactions: '++id, date, customerId, isDebt',
    customers: '++id, name, totalDebt',
    debt_payments: '++id, customerId, date'
}).upgrade(trans => {
    // Migration: Set default threshold to 5 for existing items
    return trans.table("stocks").toCollection().modify(stock => {
        stock.minStock = stock.minStock || 5;
    });
});

db.version(6).stores({
    stocks: '++id, name, sku, category, unit, price, costPrice, minStock, updatedAt',
    transactions: '++id, date, customerId, isDebt',
    customers: '++id, name, totalDebt',
    debt_payments: '++id, customerId, date',
    consignments: '++id, customerId, status, date' // NEW TABLE
});

export { db };