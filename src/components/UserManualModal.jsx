import React from 'react';

export default function UserManualModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-indigo-50">
                    <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477-4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                        </svg>
                        คู่มือการใช้งาน (User Manual)
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <div className="prose prose-indigo max-w-none text-sm text-slate-700">
                        <h3>ยินดีต้อนรับสู่ Heim Force Analyzer</h3>
                        <p>
                            ระบบวิเคราะห์และจำลองแรงทางวิศวกรรมสำหรับโครงสร้าง Modular (Heim) แบบ 3 มิติ 
                            ช่วยให้คุณสามารถจัดวาง Unit และประเมินความปลอดภัยจากแรงลมและแรงแผ่นดินไหวได้อย่างแม่นยำ
                        </p>

                        <hr className="my-6 border-slate-200" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-slate-800">🎮 การควบคุมมุมมอง 3 มิติ</h4>
                                <ul className="text-slate-600">
                                    <li><strong>คลิกซ้ายค้างแล้วลาก:</strong> หมุนมุมกล้อง (Rotate)</li>
                                    <li><strong>คลิกขวาค้างแล้วลาก:</strong> เลื่อนมุมกล้อง (Pan)</li>
                                    <li><strong>เลื่อนลูกกลิ้งเมาส์:</strong> ซูมเข้า-ออก (Zoom In/Out)</li>
                                    <li><strong>ปุ่ม ISO / TOP / FRONT:</strong> เปลี่ยนมุมมองอัตโนมัติ</li>
                                </ul>
                            </div>
                            
                            <div>
                                <h4 className="text-slate-800">🏗️ การเพิ่มและจัดการ Unit</h4>
                                <ul className="text-slate-600">
                                    <li>เลือกขนาด <strong>TSMA</strong> (ความกว้าง) และ <strong>KATE</strong> (ความยาว) จากเมนูด้านซ้าย</li>
                                    <li>กดปุ่ม <strong>"Add Unit"</strong> เพื่อสร้างกล่องโครงสร้างใหม่ (ระบบจะจำค่าขนาดล่าสุดไว้ให้)</li>
                                    <li>ใช้แถบเลื่อน (Slider) หรือปุ่มลูกศร ◀️ ▶️ ในการขยับตำแหน่ง (X, Z)</li>
                                    <li>กด <strong>↻ หมุน 90°</strong> เพื่อปรับทิศทางการวางของกล่อง</li>
                                </ul>
                                <div className="bg-yellow-50 p-3 rounded border border-yellow-200 mt-2 text-xs text-yellow-800">
                                    <strong>💡 Tip:</strong> ระบบมีระบบ Snap ให้วางกล่องได้พอดีเป๊ะทีละ 22.5 cm (ระยะช่อง Grid) เพื่อความแม่นยำในการออกแบบ
                                </div>
                            </div>
                        </div>

                        <hr className="my-6 border-slate-200" />

                        <h4 className="text-slate-800">🔗 การคำนวณรอยต่อโครงสร้าง (Connections)</h4>
                        <p className="text-slate-600">
                            ระบบจำลองรอยต่อทางโครงสร้างอัตโนมัติ โดยอ้างอิงจากระยะพิกัด <strong>"รูน็อตชนรูน็อต"</strong> 100%:
                        </p>
                        <ul className="text-slate-600">
                            <li><strong className="text-blue-600">Top Tie (หมัดสีน้ำเงิน):</strong> จะปรากฏขึ้นเมื่อมีส่วนที่เกยกันของ 2 กล่องในแนวแกน X (ด้านยาวประกบกัน)  
<strong>หมายเหตุ</strong> ระบบจะสร้างหมัดให้ 2 จุดที่ขอบของส่วนที่เกยกันเสมอ เพื่อรับแรงเฉือน</li>
                            <li><strong className="text-red-600">Cross Beam (คานสีแดง):</strong> ใช้ยึดโครงสร้างเสริม จะปรากฏขึ้นเมื่อมีส่วนที่เกยกันของ 2 กล่องในแนวแกน X (ด้านยาวประกบกัน (TSMA) เท่านั้น)</li>
                            <li><strong>จุดยึด (Bolt):</strong> จุดสีเหลืองบนพื้นฐานราก เมื่อเอาเมาส์ไปชี้ (Hover) จะเห็นสถานะว่าปลอดภัย (SAFE) หรืออันตราย (FAIL)</li>
                            <li><strong>Tooltip อัจฉริยะ:</strong> เอาเมาส์ไปชี้ที่โครงสร้างกล่อง จะมีป้ายกำกับบอกหมายเลข Unit และขนาด</li>
                        </ul>

                        <hr className="my-6 border-slate-200" />

                        <h4 className="text-slate-800">📊 รายงานวิเคราะห์เชิงลึก (Detailed Analysis)</h4>
                        <p className="text-slate-600">
                            กดปุ่ม <strong>"Detailed Analysis"</strong> ด้านล่างเพื่อดูแดชบอร์ดสรุปผล:
                        </p>
                        <ul className="text-slate-600">
                            <li><strong>Structure Forces:</strong> กราฟสรุปน้ำหนัก (Dead/Live Load) และแรงกระทำ (Uplift/Lateral)</li>
                            <li><strong>Stability (การพลิกคว่ำ):</strong> เช็คว่าน้ำหนักของโครงสร้างเอาชนะแรงลมที่ทำให้คว่ำได้หรือไม่</li>
                            <li><strong>Bolt Tension (แรงดึงในสลักเกลียว):</strong> ตาราง 5 จุดที่รับแรงสูงสุด (Top 5 Worst-case) หากจุดใดเกินความสามารถในการรับแรง (Capacity) จะแสดงเป็น FAIL</li>
                        </ul>

                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 mt-6 flex gap-4 items-start">
                            <div className="text-indigo-600 mt-1">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </div>
                            <div>
                                <h5 className="mt-0 text-indigo-900 font-bold mb-1">🤖 AI Structural Analyst (ผู้ช่วยวิเคราะห์)</h5>
                                <p className="mb-0 text-xs text-indigo-800">
                                    แอปนี้รองรับ AI ประมวลผลขั้นสูง<br/>
                                    <strong>วิธีทดสอบ:</strong> ให้กด "Edit API Key" แล้วใส่คำว่า <code className="bg-indigo-100 px-1 rounded">test</code> ลงไป จากนั้นกด Generate Report เพื่อจำลองการตอบกลับของ AI โดยไม่ต้องเสียค่าใช้จ่ายใดๆ!
                                </p>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6 flex items-start gap-3">
                            <div className="text-amber-500 mt-0.5 flex-shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                </svg>
                            </div>
                            <div className="text-sm text-amber-900">
                                <strong className="block mb-2 font-bold text-amber-800">⚠️ ข้อควรระวัง (Disclaimer ที่สำคัญมาก)</strong>
                                <p className="mb-2 leading-relaxed">แอปพลิเคชันนี้เป็นเครื่องมือระดับ <strong>"Preliminary Design (การประเมินและออกแบบเบื้องต้น)"</strong> ที่ทรงพลังมาก ช่วยให้คุณวางแผน จัดเรียงกล่อง Heim และรู้แนวโน้มโครงสร้างได้ทันที ช่วยประหยัดเวลาคำนวณมือไปได้มหาศาล</p>
                                <p className="mb-2 leading-relaxed">แต่ใน <strong>"การก่อสร้างจริง"</strong> จะต้องนำผลลัพธ์และการจัดวางนี้ ไปให้ <strong>วิศวกรโครงสร้างโยธา (มีใบประกอบวิชาชีพ กว.)</strong> เป็นผู้ตรวจสอบขั้นสุดท้ายและเซ็นรับรองเสมอครับ เพราะในหน้างานจริงจะมีตัวแปรที่ระบบไม่ได้มองเห็น เช่น สภาพความแข็งของดินดาน, แรงบิดสะสม (Torsion) จากแผ่นดินไหวแบบไดนามิก, และการทำงานหน้างานจริงครับ</p>
                                <p className="mb-0 font-medium">สรุปคือ ใช้งานได้จริงและเชื่อถือได้ในแง่ของการประเมินวางแผนครับ! คุณสามารถใช้แอปนี้เป็นเครื่องมือประจำตัวเพื่อหา Layout ที่ปลอดภัยที่สุด ก่อนส่งแบบให้วิศวกรทำงานต่อได้เลยครับ 🚀✨</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
