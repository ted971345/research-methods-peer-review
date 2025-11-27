import React, { useState, useRef } from 'react';
import { BookOpen, CheckCircle, User, Award, Send, AlertCircle, Loader, ShieldCheck, GitMerge, FileText } from 'lucide-react';

/**
 * ==========================================
 * 老師的特別叮嚀：Google 表單設定區
 * ==========================================
 * 請確認你的表單 ID 與 entry ID 是否正確對應。
 */

const GOOGLE_FORM_ACTION_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfAAhNDUlwnqoyTNA6NcXG78UwcLT1mW90ln4zzFawOzheLgQ/formResponse";

const FORM_FIELDS = {
  reviewer: "entry.1730151782",   // 評論人姓名
  presenter: "entry.1088651803",  // 被評人姓名
  totalScore: "entry.823041206",  // 總分
  details: "entry.1311753104"     // 完整評分細節 (JSON)
};

// ==========================================

// 依據賴老師教材重新設計的五大指標 (v3.0)
const CRITERIA = [
  {
    id: 'c1',
    category: '緒論與變項定義',
    weight: 20,
    icon: <FileText className="w-5 h-5 text-blue-500" />,
    description: '研究動機是否採用「漏斗型架構」聚焦？變項定義是否具體？',
    details: '檢核重點：是否展現「變項式思考」（清楚界定自變項X與依變項Y）？「名詞釋義」是否包含具體的「操作型定義」（如何測量），而不僅是解釋名詞？'
  },
  {
    id: 'c2',
    category: '文獻探討與研究缺口',
    weight: 20,
    icon: <BookOpen className="w-5 h-5 text-blue-500" />,
    description: '是否避免「流水帳」式的陳述？是否明確指出「研究缺口」(Research Gap)？',
    details: '檢核重點：文獻回顧應具備批判性與對話性，而非單純摘要。是否從過去研究的不足（如：對象不同、理論觀點不同、方法限制）推導出本研究的必要性？'
  },
  {
    id: 'c3',
    category: '研究架構與抽樣設計',
    weight: 25,
    icon: <GitMerge className="w-5 h-5 text-blue-500" />,
    description: '架構圖邏輯是否清晰？抽樣方法是否具代表性？',
    details: '檢核重點：研究架構圖的箭頭是否合理連結各變項？抽樣策略（如：分層、立意、滾雪球）是否符合研究目的？樣本數估算是否有依據？'
  },
  {
    id: 'c4',
    category: '研究工具與倫理防護',
    weight: 25,
    icon: <ShieldCheck className="w-5 h-5 text-blue-500" />,
    description: '信效度檢驗是否完整？是否落實研究倫理？',
    details: '檢核重點：工具是否說明預試程序及信效度標準（如 Cronbach\'s α）？倫理部分是否考量「易受傷害族群」？知情同意程序是否完整？風險與利益是否平衡？'
  },
  {
    id: 'c5',
    category: '發表邏輯與問題回應',
    weight: 10,
    icon: <User className="w-5 h-5 text-blue-500" />,
    description: '口頭發表是否條理分明？回應提問是否切中要點？',
    details: '檢核重點：簡報能否在12至15分鐘內有效傳達研究精髓？面對同儕或老師的提問，能否引用文獻或理論基礎進行得宜的回應？'
  }
];

const App = () => {
  const [step, setStep] = useState('login'); // login, grading, submitting, result
  const [reviewerName, setReviewerName] = useState('');
  const [presenterName, setPresenterName] = useState('');
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState({});
  
  // 用於提交表單的 hidden iframe ref
  const iframeRef = useRef(null);
  const formRef = useRef(null);

  // 處理分數變更
  const handleScoreChange = (criteriaId, value) => {
    setScores(prev => ({
      ...prev,
      [criteriaId]: parseInt(value)
    }));
  };

  // 處理評語變更
  const handleCommentChange = (criteriaId, value) => {
    setComments(prev => ({
      ...prev,
      [criteriaId]: value
    }));
  };

  // 開始評分
  const startReview = () => {
    if (!reviewerName.trim() || !presenterName.trim()) {
      alert('同學，做研究要嚴謹，基本資料請填寫完整。');
      return;
    }
    setStep('grading');
    window.scrollTo(0, 0);
  };

  // 計算總分
  const calculateTotal = () => {
    let total = 0;
    CRITERIA.forEach(c => {
      const score = scores[c.id] || 0;
      total += (score / 5) * c.weight;
    });
    return total.toFixed(1);
  };

  // 準備提交
  const handlePreSubmit = () => {
    // 檢查是否所有項目都已評分
    const allScored = CRITERIA.every(c => scores[c.id]);
    if (!allScored) {
      alert('還有項目沒打分數！請仔細檢查每一個評分環節。');
      return;
    }

    // 進入提交狀態
    setStep('submitting');
    
    // 等待一下確保 React 渲染出 hidden form 並且帶入數值，然後觸發提交
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.submit();
      }
    }, 500);
  };

  // Iframe 載入完成後的處理 (視為提交成功)
  const handleIframeLoad = () => {
    if (step === 'submitting') {
      setStep('result');
      window.scrollTo(0, 0);
    }
  };

  // 重置
  const resetForm = () => {
    setStep('login');
    setPresenterName('');
    setScores({});
    setComments({});
  };

  // 產生要送出的資料物件 (JSON string)
  const getDetailsJson = () => {
    const resultData = {
      details: CRITERIA.map(c => ({
        category: c.category,
        score: scores[c.id],
        comment: comments[c.id] || '無評語'
      })),
      timestamp: new Date().toISOString()
    };
    return JSON.stringify(resultData, null, 2);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-200">
      {/* Header */}
      <header className="bg-blue-900 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-yellow-400" />
            <h1 className="text-2xl font-bold tracking-wide">研究法-量化導向｜同儕互評系統</h1>
          </div>
          <p className="text-blue-200 text-sm">一一四學年度第一學期 • 授課老師：賴鼎富</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        
        {/* Step 1: Login / Info Entry */}
        {step === 'login' && (
          <div className="bg-white rounded-xl shadow-md p-8 border-l-4 border-blue-600 animate-fade-in">
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <User className="text-blue-600" />
                進入互評作業
              </h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                同學你好，這是期末報告的互評系統。請依照課堂所學的「變項式思考」、「研究倫理」到「研究工具」的原則，
                對同儕的研究計畫進行客觀與主觀評量。系統將自動將資料傳送至老師的資料庫。
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">你的姓名 (評論人)</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="例如：顏志琳"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">報告者姓名 (被評人)</label>
                <input
                  type="text"
                  value={presenterName}
                  onChange={(e) => setPresenterName(e.target.value)}
                  placeholder="例如：王大陸"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="mt-8 text-right">
              <button
                onClick={startReview}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition flex items-center gap-2 ml-auto shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                開始評分 <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Grading Form */}
        {step === 'grading' && (
          <div className="animate-fade-in">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6 flex justify-between items-center sticky top-0 z-10 bg-white/95 backdrop-blur shadow-sm">
              <div>
                <span className="text-sm text-slate-500">評論人</span>
                <div className="font-bold text-blue-900">{reviewerName}</div>
              </div>
              <div className="text-right">
                <span className="text-sm text-slate-500">正在評鑑</span>
                <div className="font-bold text-blue-900 text-lg">{presenterName} 的研究計畫</div>
              </div>
            </div>

            <div className="space-y-6">
              {CRITERIA.map((criteria, index) => (
                <div key={criteria.id} className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 hover:border-blue-200 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                        {criteria.icon}
                        <span>{index + 1}. {criteria.category}</span>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full ml-2">權重 {criteria.weight}%</span>
                      </h3>
                      <p className="text-slate-700 text-sm font-medium mt-2">{criteria.description}</p>
                      <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className="text-slate-500 text-xs leading-relaxed">
                          <span className="font-bold text-blue-600">評分指標：</span>
                          {criteria.details}
                        </p>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-blue-600 w-16 text-right pl-4">
                      {scores[criteria.id] ? scores[criteria.id] : '-'} <span className="text-sm text-slate-400 font-normal">/5</span>
                    </div>
                  </div>

                  {/* Score Selector */}
                  <div className="mb-6 px-1">
                    <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
                      <span>極待加強 (1)</span>
                      <span>表現優異 (5)</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={scores[criteria.id] || 0}
                      onChange={(e) => handleScoreChange(criteria.id, e.target.value)}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between mt-3 gap-2">
                      {[1, 2, 3, 4, 5].map(num => (
                        <button
                          key={num}
                          onClick={() => handleScoreChange(criteria.id, num)}
                          className={`flex-1 py-2 rounded-md text-sm font-bold transition transform active:scale-95 ${
                            scores[criteria.id] === num 
                              ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300 ring-offset-1' 
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment Area */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">具體建議與回饋</label>
                    <textarea
                      value={comments[criteria.id] || ''}
                      onChange={(e) => handleCommentChange(criteria.id, e.target.value)}
                      placeholder={`請針對「${criteria.category}」給予建設性的評語...`}
                      className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none h-24 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-between items-center pb-8">
              <button
                onClick={() => setStep('login')}
                className="text-slate-500 hover:text-slate-800 px-4 py-2 font-medium flex items-center gap-1 transition"
              >
                ← 返回修改姓名
              </button>
              <button
                onClick={handlePreSubmit}
                className="bg-green-600 hover:bg-green-700 text-white px-10 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition flex items-center gap-2"
              >
                提交到雲端 <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Submitting State */}
        {step === 'submitting' && (
          <div className="bg-white rounded-xl shadow-lg p-12 animate-fade-in max-w-xl mx-auto text-center mt-10">
            <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">資料傳輸中...</h2>
            <p className="text-slate-500">請稍候，系統正在將你的評分寫入資料庫。</p>
            <p className="text-slate-400 text-sm mt-4">請勿關閉視窗</p>
            
            {/* HIDDEN FORM for Google Submission */}
            <form 
              ref={formRef}
              action={GOOGLE_FORM_ACTION_URL}
              method="POST"
              target="hidden_iframe"
              className="hidden"
            >
              <input name={FORM_FIELDS.reviewer} value={reviewerName} type="hidden" />
              <input name={FORM_FIELDS.presenter} value={presenterName} type="hidden" />
              <input name={FORM_FIELDS.totalScore} value={calculateTotal()} type="hidden" />
              <input name={FORM_FIELDS.details} value={getDetailsJson()} type="hidden" />
            </form>
            
            {/* HIDDEN IFRAME to catch the response without page reload */}
            <iframe 
              ref={iframeRef}
              name="hidden_iframe" 
              title="hidden_iframe"
              style={{ display: 'none' }}
              onLoad={handleIframeLoad}
            />
          </div>
        )}

        {/* Step 4: Result Display */}
        {step === 'result' && (
          <div className="bg-white rounded-xl shadow-lg p-8 animate-fade-in max-w-2xl mx-auto text-center mt-10">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">評分提交成功！</h2>
            <p className="text-slate-600 mb-8">
              感謝你的認真評鑑，資料已成功存入雲端資料庫。
            </p>

            <div className="bg-slate-50 rounded-xl p-6 mb-8 text-left border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                本次評分摘要
              </h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs mb-1">評論人</span>
                  <span className="font-bold text-slate-900 text-base">{reviewerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs mb-1">被評人</span>
                  <span className="font-bold text-slate-900 text-base">{presenterName}</span>
                </div>
                <div className="col-span-2 bg-white p-3 rounded-lg border border-slate-100 mt-2">
                  <span className="text-slate-500 block text-xs mb-1">加權總分</span>
                  <span className="font-black text-blue-600 text-2xl">{calculateTotal()} <span className="text-sm font-normal text-slate-400">/ 100</span></span>
                </div>
              </div>
            </div>

            <button
              onClick={resetForm}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-md hover:shadow-lg transform transition active:scale-95"
            >
              評下一位同學
            </button>
            
            <div className="mt-8 bg-yellow-50 text-yellow-800 p-4 rounded-lg text-sm flex items-start gap-3 text-left border border-yellow-100">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-yellow-600" />
              <p>系統提示：若網頁一直停留在上傳中，可能是網路不穩或表單 ID 設定有誤，請截圖並聯繫助教。</p>
            </div>
          </div>
        )}

      </main>
      
      <footer className="text-center py-8 text-slate-400 text-sm">
        <p>&copy; 2025 臺北市立大學 運動教育研究所 研究法課程</p>
      </footer>
    </div>
  );
};

export default App;