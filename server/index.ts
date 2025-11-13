import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating data directory:', error);
    }
}

// Helper functions for file operations
const getFilePath = (key: string) => path.join(DATA_DIR, `${key}.json`);

async function readData<T>(key: string, defaultValue: T): Promise<T> {
    try {
        const filePath = getFilePath(key);
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data) as T;
    } catch (error) {
        return defaultValue;
    }
}

async function writeData<T>(key: string, data: T): Promise<void> {
    const filePath = getFilePath(key);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

app.use(cors());
app.use(express.json());

// Initialize data directory
await ensureDataDir();

// Default categories
const defaultCategories = [
    { id: 'cat-exp-1', name: 'Food', type: 'expense', emoji: '🍔' },
    { id: 'cat-exp-2', name: 'Transport', type: 'expense', emoji: '🚗' },
    { id: 'cat-exp-3', name: 'Entertainment', type: 'expense', emoji: '🎬' },
    { id: 'cat-exp-4', name: 'Shopping', type: 'expense', emoji: '🛍️' },
    { id: 'cat-exp-5', name: 'Health', type: 'expense', emoji: '❤️‍🩹' },
    { id: 'cat-exp-6', name: 'Utilities', type: 'expense', emoji: '💡' },
    { id: 'cat-inc-1', name: 'Salary', type: 'income', emoji: '💰' },
    { id: 'cat-inc-2', name: 'Gift', type: 'income', emoji: '🎁' },
    { id: 'cat-inc-3', name: 'Payback', type: 'income', emoji: '🤝' },
];

// Transactions endpoints
app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await readData('transactions', []);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

app.post('/api/transactions', async (req, res) => {
    try {
        const transactions = await readData('transactions', []);
        const newTransaction = { ...req.body, id: `txn-${Date.now()}` };
        transactions.push(newTransaction);
        await writeData('transactions', transactions);
        res.json(newTransaction);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create transaction' });
    }
});

app.put('/api/transactions/:id', async (req, res) => {
    try {
        const transactions = await readData('transactions', []);
        const index = transactions.findIndex((t: any) => t.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        transactions[index] = req.body;
        await writeData('transactions', transactions);
        res.json(req.body);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});

app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const transactions = await readData('transactions', []);
        const filtered = transactions.filter((t: any) => t.id !== req.params.id);
        await writeData('transactions', filtered);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});

// Categories endpoints
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await readData('categories', []);
        if (categories.length === 0) {
            await writeData('categories', defaultCategories);
            return res.json(defaultCategories);
        }
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

app.post('/api/categories', async (req, res) => {
    try {
        const categories = await readData('categories', []);
        const newCategory = { ...req.body, id: `cat-${Date.now()}` };
        categories.push(newCategory);
        await writeData('categories', categories);
        res.json(newCategory);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create category' });
    }
});

// Credit Cards endpoints
app.get('/api/cards', async (req, res) => {
    try {
        const cards = await readData('cards', []);
        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch cards' });
    }
});

app.post('/api/cards', async (req, res) => {
    try {
        const cards = await readData('cards', []);
        const newCard = { ...req.body, id: `card-${Date.now()}`, balance: 0, archived: false };
        cards.push(newCard);
        await writeData('cards', cards);
        res.json(newCard);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create card' });
    }
});

app.put('/api/cards/:id', async (req, res) => {
    try {
        const cards = await readData('cards', []);
        const index = cards.findIndex((c: any) => c.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Card not found' });
        }
        cards[index] = req.body;
        await writeData('cards', cards);
        res.json(req.body);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update card' });
    }
});

// Goals endpoints
app.get('/api/goals', async (req, res) => {
    try {
        const goals = await readData('goals', []);
        res.json(goals);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch goals' });
    }
});

app.post('/api/goals', async (req, res) => {
    try {
        const goals = await readData('goals', []);
        const newGoal = { ...req.body, id: `goal-${Date.now()}` };
        goals.push(newGoal);
        await writeData('goals', goals);
        res.json(newGoal);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create goal' });
    }
});

app.put('/api/goals/:id', async (req, res) => {
    try {
        const goals = await readData('goals', []);
        const index = goals.findIndex((g: any) => g.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Goal not found' });
        }
        goals[index] = req.body;
        await writeData('goals', goals);
        res.json(req.body);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update goal' });
    }
});

app.delete('/api/goals/:id', async (req, res) => {
    try {
        const goals = await readData('goals', []);
        const filtered = goals.filter((g: any) => g.id !== req.params.id);
        await writeData('goals', filtered);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete goal' });
    }
});

// Assets endpoints
app.get('/api/assets', async (req, res) => {
    try {
        const assets = await readData('assets', []);
        res.json(assets);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch assets' });
    }
});

app.post('/api/assets', async (req, res) => {
    try {
        const assets = await readData('assets', []);
        const newAsset = { ...req.body, id: `asset-${Date.now()}`, lastUpdated: new Date().toISOString() };
        assets.push(newAsset);
        await writeData('assets', assets);
        res.json(newAsset);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create asset' });
    }
});

app.put('/api/assets/:id', async (req, res) => {
    try {
        const assets = await readData('assets', []);
        const index = assets.findIndex((a: any) => a.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Asset not found' });
        }
        assets[index] = req.body;
        await writeData('assets', assets);
        res.json(req.body);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update asset' });
    }
});

app.delete('/api/assets/:id', async (req, res) => {
    try {
        const assets = await readData('assets', []);
        const filtered = assets.filter((a: any) => a.id !== req.params.id);
        await writeData('assets', filtered);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete asset' });
    }
});

// Settings endpoints
app.get('/api/settings', async (req, res) => {
    try {
        const settings = await readData('settings', {
            privacyMode: false,
            userName: 'User',
            monthlyIncome: 0,
            totalSavings: 0,
            theme: 'dark',
        });
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

app.put('/api/settings', async (req, res) => {
    try {
        const currentSettings = await readData('settings', {
            privacyMode: false,
            userName: 'User',
            monthlyIncome: 0,
            totalSavings: 0,
            theme: 'dark',
        });
        const updatedSettings = { ...currentSettings, ...req.body };
        await writeData('settings', updatedSettings);
        res.json(updatedSettings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

