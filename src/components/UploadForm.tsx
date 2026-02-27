import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UploadCloud, FileImage, Loader2, CheckCircle, Sparkles, MessageSquare } from 'lucide-react';

export function UploadForm({ onUploadSuccess }: { onUploadSuccess: () => void }) {
    console.log("--- UPLOAD FORM V2.1 LOADED ---");
    const [companies, setCompanies] = useState<{ id: string, name: string }[]>([]);
    const [selectedCompany, setSelectedCompany] = useState('');
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // AI State
    const [isScanningImage, setIsScanningImage] = useState(false);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        const { data } = await supabase.from('companies').select('id, name').order('name');
        if (data) setCompanies(data);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            setFile(selected);
            // Create preview URL
            const objectUrl = URL.createObjectURL(selected);
            setPreview(objectUrl);

            // Automatically scan the receipt with AI
            await scanReceiptWithAI(selected);
        }
    };

    const scanReceiptWithAI = async (fileToScan: File) => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        console.log("--- AI SCAN DIAGNOSTIC ---");
        console.log("API Key loaded:", !!apiKey);

        if (!apiKey) {
            console.error("Gemini API key missing in environment variables.");
            return;
        }

        setIsScanningImage(true);
        setError(null);

        try {
            const base64Image = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(fileToScan);
                reader.onload = () => {
                    const result = reader.result as string;
                    const base64Data = result.split(',')[1];
                    console.log("Base64 string ready. Length:", base64Data.length);
                    resolve(base64Data);
                };
                reader.onerror = error => reject(error);
            });

            const mimeType = fileToScan.type;
            console.log("Image MimeType:", mimeType);

            // Using stable Gemini 1.5 Flash
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

            // Build a list of companies to help the AI match
            const companyList = companies.map(c => c.name).join(", ");

            console.log("Sending request to Gemini...");
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            {
                                text: `You are an expert data extractor. Look at this receipt. 
                            1. Find the TOTAL amount (just the number, eg 1500.50). 
                            2. Identify which of these companies it belongs to: ${companyList}. 
                            
                            Return the result EXACTLY as this JSON object and nothing else, without markdown formatting:
                            {"amount": 1500.50, "company": "Exact Company Name or UNKNOWN"}` },
                            { inlineData: { mimeType, data: base64Image } }
                        ]
                    }],
                    generationConfig: { temperature: 0.1, maxOutputTokens: 100 }
                })
            });

            console.log("HTTP Response Status:", response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Gemini API Error details:", errorData);
                throw new Error("Failed to communicate with Google Gemini");
            }

            const data = await response.json();
            console.log("Gemini JSON Response:", JSON.stringify(data, null, 2));

            let extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

            if (extractedText) {
                console.log("AI Extracted Text:", extractedText);

                // Strip markdown code blocks if Gemini ignores the instruction and adds them anyway
                extractedText = extractedText.replace(/```json/g, '').replace(/```/g, '').trim();

                let parsedObj: any = null;
                try {
                    parsedObj = JSON.parse(extractedText);
                    console.log("Successfully parsed AI output as JSON:", parsedObj);
                } catch (e) {
                    console.warn("AI output was not valid JSON, trying fallback regex...", e);
                }

                if (parsedObj) {
                    // 1. Handle Amount
                    if (parsedObj.amount) {
                        const cleanAmount = String(parsedObj.amount).replace(/,/g, '');
                        setAmount(parseFloat(cleanAmount).toString());
                    }
                    // 2. Handle Company
                    if (parsedObj.company) {
                        const guessedName = String(parsedObj.company).trim();
                        if (guessedName.toUpperCase() !== 'UNKNOWN') {
                            const found = companies.find(c =>
                                c.name.toLowerCase().includes(guessedName.toLowerCase()) ||
                                guessedName.toLowerCase().includes(c.name.toLowerCase())
                            );
                            if (found) {
                                setSelectedCompany(found.id);
                            }
                        }
                    }
                } else {
                    // Fallback Regex if JSON failed utterly
                    console.log("Applying regex fallback...");
                    const amountMatch = extractedText.match(/(?:amount|"amount"\s*:\s*)[\s$]*([\d,.]+)/i);
                    if (amountMatch) {
                        const cleanAmount = amountMatch[1].replace(/,/g, '');
                        setAmount(parseFloat(cleanAmount).toString());
                    }

                    const companyMatch = extractedText.match(/(?:company|"company"\s*:\s*)"?([^"\n]+)"?/i);
                    if (companyMatch) {
                        const guessedName = companyMatch[1].replace(/\*/g, '').trim();
                        if (guessedName.toUpperCase() !== 'UNKNOWN') {
                            const found = companies.find(c =>
                                c.name.toLowerCase().includes(guessedName.toLowerCase()) ||
                                guessedName.toLowerCase().includes(c.name.toLowerCase())
                            );
                            if (found) {
                                setSelectedCompany(found.id);
                            }
                        }
                    }
                }
            } else {
                console.warn("Candidate content or parts missing in Gemini response.");
            }
        } catch (err) {
            console.error("Full AI Scanning error report:", err);
            // Non-blocking error for UI
        } finally {
            console.log("--- AI SCAN DIAGNOSTIC END ---");
            setIsScanningImage(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !selectedCompany || !amount) {
            setError('Please fill all fields');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Upload file to Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${selectedCompany}-${Date.now()}.${fileExt}`;
            const filePath = `receipts/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('receipts')
                .getPublicUrl(filePath);

            // 2. Create Transaction Record
            const today = new Date().toISOString().split('T')[0];

            const { data: transaction, error: txError } = await supabase
                .from('transactions')
                .insert({
                    company_id: selectedCompany,
                    amount: parseFloat(amount),
                    receipt_url: publicUrl,
                    date_expected: today,
                    status: 'pending',
                    notes: notes // Save the notes to the DB
                })
                .select()
                .single();

            if (txError) throw txError;

            // 3. Update Daily Tracking
            const { error: trackError } = await supabase
                .from('daily_tracking')
                .upsert({
                    company_id: selectedCompany,
                    tracking_date: today,
                    has_uploaded: true,
                    transaction_id: transaction.id
                }, { onConflict: 'company_id, tracking_date' });

            if (trackError) throw trackError;

            // Success Reset
            setSuccess(true);
            setFile(null);
            setPreview(null);
            setAmount('');
            setNotes('');
            setSelectedCompany('');
            onUploadSuccess(); // Trigger checklist refresh

            setTimeout(() => setSuccess(false), 3000);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error uploading receipt');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[var(--color-dark-card)] border border-[var(--color-dark-border)] rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-6 text-gray-100 flex items-center justify-between">
                <span>Upload New Receipt</span>
                {isScanningImage && (
                    <span className="text-sm font-normal text-[var(--color-brand-400)] flex items-center gap-2 animate-pulse bg-[var(--color-brand-500)]/10 px-3 py-1.5 rounded-full border border-[var(--color-brand-500)]/20">
                        <Sparkles className="w-4 h-4" /> AI Auto-scanning...
                    </span>
                )}
            </h2>

            {success && (
                <div className="mb-6 bg-[var(--color-accent-green)]/10 border border-[var(--color-accent-green)]/30 text-green-400 p-4 rounded-xl flex items-center gap-3">
                    <CheckCircle className="w-5 h-5" />
                    <p>Receipt uploaded and registered successfully!</p>
                </div>
            )}

            {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/50 text-[var(--color-accent-red)] p-4 rounded-xl">
                    {error}
                </div>
            )}

            <form onSubmit={handleUpload} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">LLC Company</label>
                    <select
                        className="w-full bg-[#0e1420] border border-[var(--color-dark-border)] rounded-xl p-3 text-gray-200 focus:ring-1 focus:ring-[var(--color-brand-500)] outline-none"
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        required
                    >
                        <option value="">Select a company...</option>
                        {companies.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center justify-between">
                        Deposit Amount ($)
                        {isScanningImage && <span className="text-xs text-[var(--color-brand-500)]">Extracting automatically...</span>}
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-3 text-gray-500 font-medium">$</span>
                        <input
                            type="number"
                            step="0.01"
                            required
                            placeholder="0.00"
                            className={`w-full bg-[#0e1420] border rounded-xl py-3 pl-8 pr-4 text-gray-200 focus:ring-1 focus:outline-none transition-colors ${isScanningImage
                                ? 'border-[var(--color-brand-500)] ring-1 ring-[var(--color-brand-500)] shadow-[0_0_15px_rgba(0,210,255,0.1)]'
                                : 'border-[var(--color-dark-border)] focus:ring-[var(--color-brand-500)]'
                                }`}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={isScanningImage}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Receipt (Screenshot)</label>

                    <label className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-xl cursor-pointer transition-all bg-[#0e1420] overflow-hidden relative ${isScanningImage
                        ? 'border-[var(--color-brand-500)] opacity-80'
                        : 'border-[var(--color-dark-border)] hover:bg-[var(--color-dark-border)]/30'
                        }`}>
                        {preview ? (
                            <>
                                <img src={preview} alt="Preview" className={`w-full h-full object-contain p-2 transition-opacity ${isScanningImage ? 'opacity-50' : 'opacity-100'}`} />
                                {isScanningImage && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-full h-1 bg-[var(--color-brand-500)]/50 shadow-[0_0_10px_rgba(0,210,255,0.8)] absolute animate-[scan_2s_ease-in-out_infinite]"></div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-10 h-10 mb-3 text-gray-500" />
                                <p className="mb-2 text-sm text-gray-400"><span className="font-semibold text-[var(--color-brand-500)]">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-gray-500">PNG, JPG, JPEG</p>
                            </div>
                        )}
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={isScanningImage}
                        />
                    </label>
                    {file && !preview && ( // Fallback to filename if preview fails
                        <div className="mt-2 text-sm text-[var(--color-brand-500)] flex items-center gap-2">
                            <FileImage className="w-4 h-4" /> {file.name}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-500" /> Administrative Notes (Optional)
                    </label>
                    <textarea
                        rows={3}
                        placeholder="E.g. Paid in two different transfers because of bank limits..."
                        className="w-full bg-[#0e1420] border border-[var(--color-dark-border)] rounded-xl py-3 px-4 text-sm text-gray-200 focus:ring-1 focus:ring-[var(--color-brand-500)] outline-none resize-none"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || !file || !selectedCompany || !amount || isScanningImage}
                    className="w-full py-4 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-[var(--color-dark-bg)] font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                    {loading ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Processing payment...</>
                    ) : isScanningImage ? (
                        <><Sparkles className="w-5 h-5 animate-pulse" /> Scanning Image...</>
                    ) : (
                        <><UploadCloud className="w-5 h-5" /> Submit Receipt</>
                    )}
                </button>
            </form>
        </div>
    );
}
