import React, { useState, useRef } from 'react';
import { BookOpen, CheckCircle, User, Award, Send, AlertCircle, Loader } from 'lucide-react';

/**
 * ==========================================
 * 老師的特別叮嚀：Google 表單設定區 (已更新)
 * ==========================================
 * 根據你提供的連結，參數已設定完成。
 * 表單 ID: 1FAIpQLSfAAhNDUlwnqoyTNA6NcXG78UwcLT1mW90ln4zzFawOzheLgQ
 */

const GOOGLE_FORM_ACTION_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfAAhNDUlwnqoyTNA6NcXG78UwcLT1mW90ln4zzFawOzheLgQ/formResponse";

const FORM_FIELDS = {
  reviewer: "entry.1730151782",   // 評論人姓名
  presenter: "entry.1088651803",  // 被評人姓名
  totalScore: "entry.823041206",  // 總分
  details: "entry.1311753104"     // 完整評分細節 (JSON)
};

// ==========================================

// 根據課綱設計的評分量表
const CRITERIA = [
  {
    id: 'c1',
    category: '研究問題與價值',
    weight: 20,
    description: '研究動機是否明確？研究問題是否具備學術或實務價值？是否符合研究倫理？',
    details: '檢視是否從運動教育現象中提煉出具體問題，而非空泛論述。'
  },
  {
    id: 'c2',
    category: '文獻探討與假設',
    weight: 20,
    description: '文獻回顧是否具備批判性與整合性？研究假設推論是否合乎邏輯？',
    details: '是否不僅是條列文獻，而是能整合前人研究作為理論基礎。'
  },
  {
    id: 'c3',
    category: '研究方法與設計',
    weight: 30,
    description: '研究架構、對象、工具與程序是否規劃嚴謹？變項定義是否清晰？',
    details: '針對量化取向：取樣是否具代表性？信效度檢驗是否提及？統計分析方法是否適當？'
  },
  {
    id: 'c4',
    category: '報告邏輯與表達',
    weight: 15,
    description: '口頭發表是否流暢？時間控制是否得宜（12分鐘）？APA格式是否正確？',
    details: '簡報製作是否清晰，是否能引導聽眾理解研究全貌。'
  },
  {
    id: 'c5',
    category: '問題回答與互動',
    weight: 15,
    description: '面對提問能否精確回應？邏輯是否一致？',
    details: '針對3分鐘評論時間的表現，是否展現對自己研究的掌握度。'
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
      alert('同學，連名字都不填，這是做研究的態度嗎？請填寫完整。');
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
      alert('還有項目沒打分數！做研究不能有遺漏值，請檢查。');
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
          <p className="text-blue-200 text-sm">一一四學年度第一學期 • 指導教授：賴鼎富</p>
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
                同學你好，這是期末報告的互評環節。系統將自動將你的評分傳送至老師的資料庫。
                請秉持學術倫理，客觀評分。
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">你的姓名 (評論人)</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="例如：王小明"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">報告者姓名 (被評人)</label>
                <input
                  type="text"
                  value={presenterName}
                  onChange={(e) => setPresenterName(e.target.value)}
                  placeholder="例如：陳大同"
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
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6 flex justify-between items-center">
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
                <div key={criteria.id} className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">權重 {criteria.weight}%</span>
                        {index + 1}. {criteria.category}
                      </h3>
                      <p className="text-slate-600 text-sm mt-1">{criteria.description}</p>
                      <p className="text-slate-400 text-xs mt-1 italic">{criteria.details}</p>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 w-12 text-right">
                      {scores[criteria.id] ? scores[criteria.id] : '-'} <span className="text-sm text-slate-400 font-normal">/5</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1 px-1">
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
                    <div className="flex justify-between mt-2 gap-2">
                      {[1, 2, 3, 4, 5].map(num => (
                        <button
                          key={num}
                          onClick={() => handleScoreChange(criteria.id, num)}
                          className={`flex-1 py-2 rounded text-sm font-medium transition ${
                            scores[criteria.id] === num 
                              ? 'bg-blue-600 text-white shadow-md' 
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    value={comments[criteria.id] || ''}
                    onChange={(e) => handleCommentChange(criteria.id, e.target.value)}
                    placeholder="請給予具體的建設性回饋..."
                    className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition resize-none h-24"
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-between items-center">
              <button
                onClick={() => setStep('login')}
                className="text-slate-500 hover:text-slate-700 px-4 py-2"
              >
                ← 返回修改姓名
              </button>
              <button
                onClick={handlePreSubmit}
                className="bg-green-600 hover:bg-green-700 text-white px-10 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition flex items-center gap-2"
              >
                提交到雲端 <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Submitting State */}
        {step === 'submitting' && (
          <div className="bg-white rounded-xl shadow-lg p-12 animate-fade-in max-w-xl mx-auto text-center">
            <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800">正在上傳資料...</h2>
            <p className="text-slate-500 mt-2">請稍候，不要關閉視窗。</p>
            
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
          <div className="bg-white rounded-xl shadow-lg p-8 animate-fade-in max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">提交成功！</h2>
            <p className="text-slate-600 mb-6">
              資料已成功寫入老師的 Google 表單資料庫。
            </p>

            <div className="bg-slate-50 rounded-lg p-6 mb-6 text-left border border-slate-200">
              <h3 className="font-bold text-slate-700 mb-4 border-b pb-2">本次評分摘要</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">評論人：</span>
                  <span className="font-medium text-slate-900">{reviewerName}</span>
                </div>
                <div>
                  <span className="text-slate-500">被評人：</span>
                  <span className="font-medium text-slate-900">{presenterName}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">總分：</span>
                  <span className="font-bold text-blue-600 text-lg">{calculateTotal()} 分</span>
                </div>
              </div>
            </div>

            <button
              onClick={resetForm}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium shadow transition"
            >
              評下一位同學
            </button>
            
            <div className="mt-6 bg-yellow-50 text-yellow-800 p-3 rounded text-sm flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>系統提示：若網頁一直停留在上傳中，可能是網路問題或表單 ID 設定錯誤，請聯繫助教。</p>
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