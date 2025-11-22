import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import type { Category, Transaction } from '@/types';

// Increase timeout for this route (Next.js default is 10s, we need more for PDF processing)
export const maxDuration = 180; // 3 minutes

// Helper to convert ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
        }

        // Convert PDF to Base64 for inline transfer
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = arrayBufferToBase64(arrayBuffer);

        // Get categories and existing transactions from FormData (passed from client-side storage)
        const categoriesJson = formData.get('categories') as string;
        const existingTransactionsJson = formData.get('existingTransactions') as string;
        
        let categories: Category[] = [];
        let existingTransactions: Transaction[] = [];
        
        if (categoriesJson) {
            try {
                categories = JSON.parse(categoriesJson);
                console.log(`Received ${categories.length} categories from client`);
            } catch (err) {
                console.error('Failed to parse categories from request:', err);
            }
        } else {
            console.warn('No categories received from client!');
        }
        
        if (existingTransactionsJson) {
            try {
                existingTransactions = JSON.parse(existingTransactionsJson);
                console.log(`Received ${existingTransactions.length} existing transactions for duplicate check`);
            } catch (err) {
                console.error('Failed to parse existing transactions from request:', err);
            }
        }
        
        // Fallback to default categories if none provided (shouldn't happen, but safety net)
        if (categories.length === 0) {
            console.warn('No categories available, using defaults');
            categories = [
                { id: 'cat-exp-1', name: 'Food', type: 'expense', emoji: '🍔', order: 1 },
                { id: 'cat-exp-2', name: 'Transport', type: 'expense', emoji: '🚗', order: 2 },
                { id: 'cat-exp-3', name: 'Entertainment', type: 'expense', emoji: '🎬', order: 3 },
                { id: 'cat-exp-4', name: 'Shopping', type: 'expense', emoji: '🛍️', order: 4 },
                { id: 'cat-exp-5', name: 'Health', type: 'expense', emoji: '❤️‍🩹', order: 5 },
                { id: 'cat-exp-6', name: 'Utilities', type: 'expense', emoji: '💡', order: 6 },
                { id: 'cat-inc-1', name: 'Salary', type: 'income', emoji: '💰', order: 1 },
                { id: 'cat-inc-2', name: 'Gift', type: 'income', emoji: '🎁', order: 2 },
                { id: 'cat-inc-3', name: 'Payback', type: 'income', emoji: '🤝', order: 3 },
            ];
        }
        
        const expenseCategories = categories.filter(c => c.type === 'expense').map(c => c.name);
        const incomeCategories = categories.filter(c => c.type === 'income').map(c => c.name);
        
        console.log(`Using ${expenseCategories.length} expense categories and ${incomeCategories.length} income categories`);
        
        const categoriesList = `Expense Categories: ${expenseCategories.join(', ')}\nIncome Categories: ${incomeCategories.join(', ')}`;

        // Initialize Gemini using the new API
        const ai = new GoogleGenAI({
            apiKey: apiKey,
        });

        const prompt = `
            You are a financial assistant. I have attached a credit card statement PDF.
            Your task is to extract all transactions from the statement and return them as a JSON array.
            
            For each transaction, extract:
            - date: The transaction date in YYYY-MM-DD format. Use the current year (2025) if not specified, but infer from context if possible. If the statement has a statement date, use that as reference.
            - description: The description of the transaction.
            - amount: The amount as a number. 
              - If it is a credit (payment or refund, usually marked with 'CR' or in a credits column), make it negative. 
              - If it is a debit (purchase), make it positive.
            - currency: The currency code (e.g., HKD). Defaults to HKD if not specified.
            - category: REQUIRED FIELD - You MUST include a category field for EVERY transaction. Assign a category from the existing categories list below. Analyze the transaction description carefully and match it to the most appropriate category. Try really hard to fit each transaction into one of the existing categories. If you absolutely cannot match it, use "Uncategorized". For payments/credits (negative amounts), use "Credit Card Payment" if available in the list, otherwise use the most appropriate category.

            Available Categories:
            ${categoriesList}

            Category Assignment Rules:
            1. EVERY transaction MUST have a category field - this is mandatory
            2. Analyze the merchant name, transaction description, and amount to determine the best category match
            3. Use fuzzy matching - for example, "Starbucks" or "Coffee Shop" should match "Food" or "Food & Dining" if available
            4. "Grab", "Uber", "Taxi" should match "Transport" or "Transportation" if available
            5. "Netflix", "Spotify", "Amazon Prime" should match "Entertainment" or "Subscriptions" if available
            6. "Supermarket", "Grocery" should match "Food" or "Shopping" if available
            7. Restaurants, cafes, food delivery should match "Food"
            8. For payments/refunds (negative amounts), prefer "Credit Card Payment" if it exists in the list, otherwise use the most appropriate category
            9. If no category matches, use "Uncategorized" (but try very hard to find a match first)

            Ignore "Opening Balance", "Closing Balance", "Payment Received" (unless it's a transaction you can process, but usually we want to track expenses, so maybe keep payments as negative amounts?), "Total", etc. primarily focus on individual transactions.
            Do include payments as negative amounts so I can see them.
            
            Return ONLY the JSON array. No markdown formatting, no code blocks. Just the raw JSON string.
            CRITICAL: Each transaction object MUST include ALL fields: date, description, amount, currency, category. The category field is REQUIRED and cannot be omitted.
        `;

        const contents = [
            {
                role: 'user' as const,
                parts: [
                    {
                        text: prompt,
                    },
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: 'application/pdf'
                        }
                    }
                ],
            },
        ];

        // Use generateContentStream with proper timeout handling
        // Increased timeout to 180 seconds (3 minutes) for large PDFs
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout after 180 seconds')), 180000)
        );

        const responseStreamPromise = (async () => {
            console.log('Starting Gemini API request...');
            const responseStream = await ai.models.generateContentStream({
                model: 'gemini-flash-latest',
                contents,
            });

            let jsonString = '';
            let chunkCount = 0;
            const startTime = Date.now();
            
            for await (const chunk of responseStream) {
                if (chunk.text) {
                    jsonString += chunk.text;
                    chunkCount++;
                    
                    // Log progress every 5 chunks or every 10 seconds
                    const elapsed = (Date.now() - startTime) / 1000;
                    if (chunkCount % 5 === 0 || elapsed > 10) {
                        console.log(`Progress: Received ${chunkCount} chunks, ${jsonString.length} characters, ${elapsed.toFixed(1)}s elapsed`);
                    }
                }
            }
            
            const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`Completed: ${chunkCount} chunks, ${jsonString.length} characters, ${totalTime}s total`);
            
            return jsonString;
        })();

        // Race between the stream and timeout
        let jsonString = await Promise.race([responseStreamPromise, timeoutPromise]) as string;

        // Clean up markdown if present
        jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();

        const transactions = JSON.parse(jsonString);

        // Ensure every transaction has a category field (post-processing)
        const transactionsWithCategories = transactions.map((transaction: any) => {
            // If category is missing or empty, try to infer it or use "Uncategorized"
            if (!transaction.category || transaction.category.trim() === '') {
                const description = (transaction.description || '').toLowerCase();
                const amount = transaction.amount || 0;
                
                // Try to infer category from description
                let inferredCategory = 'Uncategorized';
                
                if (amount < 0) {
                    // Payment/credit - check if "Credit Card Payment" exists
                    inferredCategory = expenseCategories.includes('Credit Card Payment') 
                        ? 'Credit Card Payment' 
                        : (expenseCategories[0] || 'Uncategorized');
                } else if (description.includes('grab') || description.includes('uber') || description.includes('taxi') || description.includes('transport')) {
                    inferredCategory = expenseCategories.find(c => c.toLowerCase().includes('transport')) || 'Uncategorized';
                } else if (description.includes('restaurant') || description.includes('cafe') || description.includes('food') || description.includes('gelato') || description.includes('dining')) {
                    inferredCategory = expenseCategories.find(c => c.toLowerCase().includes('food')) || 'Uncategorized';
                } else if (description.includes('netflix') || description.includes('spotify') || description.includes('entertainment')) {
                    inferredCategory = expenseCategories.find(c => c.toLowerCase().includes('entertainment')) || 'Uncategorized';
                } else if (description.includes('shop') || description.includes('store') || description.includes('mall')) {
                    inferredCategory = expenseCategories.find(c => c.toLowerCase().includes('shop')) || 'Uncategorized';
                } else {
                    // Default to first expense category or "Uncategorized"
                    inferredCategory = expenseCategories[0] || 'Uncategorized';
                }
                
                console.log(`Missing category for "${transaction.description}", inferred: ${inferredCategory}`);
                transaction.category = inferredCategory;
            }
            
            return transaction;
        });

        // Check for duplicates by comparing date and amount with existing transactions
        const transactionsWithDuplicates = transactionsWithCategories.map((transaction: any) => {
            // Normalize date format (handle YYYY-MM-DD)
            const transactionDate = transaction.date;
            const transactionAmount = Math.abs(transaction.amount); // Compare absolute values
            
            // Check if there's a matching existing transaction
            const isDuplicate = existingTransactions.some((existing: Transaction) => {
                // Normalize dates for comparison (handle different formats)
                const existingDate = existing.date;
                const existingAmount = Math.abs(existing.amount);
                
                // Check if dates match (exact match)
                const datesMatch = existingDate === transactionDate;
                
                // Check if amounts match (within 0.01 tolerance for floating point)
                const amountsMatch = Math.abs(existingAmount - transactionAmount) < 0.01;
                
                return datesMatch && amountsMatch;
            });
            
            return {
                ...transaction,
                isDuplicate: isDuplicate
            };
        });

        return NextResponse.json({ transactions: transactionsWithDuplicates });

    } catch (error: any) {
        console.error('Error processing statement:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            cause: error.cause,
            name: error.name
        });
        return NextResponse.json({ 
            error: error.message || 'Failed to process statement',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
