import React, { useState } from 'react';
import { useForceStore } from '../store/forceStore';

export default function AiAdvisor({ results, boltCapacityN, onAiResponse }) {
    const { aiApiKey, setAiApiKey } = useForceStore();
    const [isEditingKey, setIsEditingKey] = useState(false);
    const [tempKey, setTempKey] = useState(aiApiKey || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const saveKey = () => {
        setAiApiKey(tempKey);
        setIsEditingKey(false);
        setError('');
    };

    const generateAnalysis = async () => {
        if (!aiApiKey) {
            setIsEditingKey(true);
            setError("Please enter your Gemini API Key first.");
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const maxBolt = (results.bolts || []).sort((a,b) => b.netTensionN - a.netTensionN)[0];
            const maxTension = maxBolt ? Math.max(0, maxBolt.netTensionN) : 0;
            const isStable = results.overturningMomentNm < (results.netDownwardForceN * 10);
            
            const promptData = {
                totalLateralForceN: results.totalLateralForceN,
                overturningMomentNm: results.overturningMomentNm,
                netDownwardForceN: results.netDownwardForceN,
                isStructureStable: isStable,
                maxBoltTensionForceN: maxTension,
                safeBoltCapacityLimitN: boltCapacityN,
                estimatedRoofTieShearN: results.estimatedTieForceN,
                estimatedFloorStrutShearN: results.estimatedStrutForceN,
            };

            const prompt = `You are a Senior Structural Engineer AI assistant evaluating a modular building structure.
Here are the analysis results for the current configuration:
${JSON.stringify(promptData, null, 2)}

Please write a brief, professional structural health summary in Thai (with English technical terms where appropriate). 
1. Comment on the overturning stability.
2. Comment on the bolt tension vs capacity (Safe limit is ${boltCapacityN} N).
3. Give a final recommendation or warning if it's failing.
Keep the response under 150 words. Format with Markdown. Do not include pleasantries. Use bullet points for readability.`;

            // Mock Testing Mode
            if (aiApiKey.trim().toLowerCase() === 'test') {
                setTimeout(() => {
                    const isSafe = isStable && maxTension <= boltCapacityN;
                    onAiResponse(`### 🤖 สรุปผลการวิเคราะห์จาก AI (Test Mode)\n\n**1. ความมั่นคงต่อการพลิกคว่ำ (Overturning Stability):**\nโครงสร้างอยู่ในเกณฑ์ **${isStable ? 'ปลอดภัย (Stable)' : 'อันตราย (Unstable)'}** โมเมนต์พลิกคว่ำ (Overturning Moment) ที่ ${Math.round(results.overturningMomentNm / 1000).toLocaleString()} kNm ${isStable ? 'ต้านทานได้ด้วย' : 'เอาชนะ'}น้ำหนักโครงสร้าง (Net Downward Force)\n\n**2. แรงดึงในจุดยึด (Bolt Tension):**\nแรงดึงสูงสุดเกิดขึ้นที่ **${Math.round(maxTension).toLocaleString()} N** ซึ่ง${maxTension <= boltCapacityN ? 'อยู่ภายใต้' : 'เกิน'}ขีดจำกัดความปลอดภัยที่กำหนดไว้ (${Math.round(boltCapacityN).toLocaleString()} N)\n\n**3. ข้อเสนอแนะ (Recommendation):**\n${isSafe ? '✅ โครงสร้างปัจจุบันมีความแข็งแรงและปลอดภัยต่อแรงลมที่ระบุ สามารถดำเนินการตามรูปแบบนี้ได้' : '⚠️ **คำเตือนระดับวิกฤต:** โครงสร้างมีความเสี่ยงต่อความเสียหาย แนะนำให้เพิ่มจำนวน Unit เพื่อเพิ่มน้ำหนักถ่วง หรือจัดวางโครงสร้างใหม่ให้ลดการต้านลม'}`);
                    setLoading(false);
                }, 1500);
                return;
            }

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${aiApiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
            onAiResponse(text);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative inline-block print:hidden">
            <button 
                onClick={generateAnalysis}
                disabled={loading}
                className="text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
                {loading ? (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                )}
                Ask AI Analyst
            </button>

            {isEditingKey && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white p-4 rounded-xl shadow-2xl border border-slate-200 z-50 animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Gemini API Key</h4>
                        <button onClick={() => setIsEditingKey(false)} className="text-slate-400 hover:text-slate-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    {error && <div className="bg-red-50 text-red-600 text-[10px] p-2 rounded mb-2 font-bold">{error}</div>}
                    <input 
                        type="password" 
                        value={tempKey} 
                        onChange={(e) => setTempKey(e.target.value)}
                        placeholder="Enter API Key or 'test'"
                        className="w-full border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-indigo-500 focus:border-indigo-500 mb-3"
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={saveKey} className="bg-indigo-600 text-white font-bold text-xs py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                            Save & Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
