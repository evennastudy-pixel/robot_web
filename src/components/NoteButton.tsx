"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useLanguage, t } from '@/hooks/useLanguage';
import { 
  getHistory, 
  restoreHistory, 
  deleteHistory, 
  clearAllHistory,
  type WorkshopHistory 
} from "@/lib/historyManager";

export default function NoteButton() {
  const router = useRouter();
  const lang = useLanguage();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [history, setHistory] = useState<WorkshopHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'history' | 'notes'>('history');

  useEffect(() => {
    const saved = localStorage.getItem("my_note") || "";
    setNote(saved);
    
    // 加载历史记录
    if (open) {
      setHistory(getHistory());
    }
  }, [open]);

  const handleSave = () => {
    localStorage.setItem("my_note", note);
    alert(t('Note saved!', '笔记已保存！', lang));
  };

  const handleRestoreHistory = (historyId: string) => {
    if (confirm(t('Are you sure you want to restore this history? Current unsaved content will be lost.', '确定要恢复此历史记录吗？当前未保存的内容将会丢失。', lang))) {
      const success = restoreHistory(historyId);
      if (success) {
        setOpen(false);
        alert(t('History restored! Redirecting to workshop...', '历史记录已恢复！正在跳转到 workshop...', lang));
        router.push('/workshop');
        setTimeout(() => window.location.reload(), 100);
      } else {
        alert(t('Restore failed, please try again.', '恢复失败，请重试。', lang));
      }
    }
  };

  const handleDeleteHistory = (historyId: string) => {
    if (confirm(t('Are you sure you want to delete this history?', '确定要删除此历史记录吗？', lang))) {
      const success = deleteHistory(historyId);
      if (success) {
        setHistory(getHistory());
        alert(t('Deleted', '已删除', lang));
      } else {
        alert(t('Delete failed', '删除失败', lang));
      }
    }
  };

  const handleClearAll = () => {
    if (confirm(t('Are you sure you want to clear all history? This action cannot be undone!', '确定要清空所有历史记录吗？此操作不可恢复！', lang))) {
      const success = clearAllHistory();
      if (success) {
        setHistory([]);
        alert(t('All history cleared', '已清空所有历史记录', lang));
      }
    }
  };

  return (
    <>
      <button
        className="flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-md rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-white/10 hover:border-[#5157E8] group"
        title={t('My Notes', '我的笔记', lang)}
        onClick={() => setOpen(true)}
      >
        <img src="/images/image_workshop/note.png" alt="My Notes" className="w-5 h-5 group-hover:opacity-80 transition-opacity" />
        <span className="text-sm font-medium text-white group-hover:text-[#5157E8] transition-colors">
          {t('Notes', '笔记', lang)}
        </span>
      </button>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute right-0 top-0 h-full w-[480px] bg-gray-900/95 backdrop-blur-lg shadow-lg flex flex-col border-l border-gray-800">
            <div className="p-6 flex-1 flex flex-col overflow-hidden">
              {/* 顶部标题和关闭按钮 */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#5157E8]">{t('Workshop Management', 'Workshop 管理', lang)}</h2>
                <button 
                  className="text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center"
                  onClick={() => setOpen(false)}
                >
                  ×
                </button>
              </div>
              
              {/* Tab切换 */}
              <div className="flex gap-2 mb-4 border-b border-gray-700">
                <button
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'history'
                      ? 'text-[#5157E8] border-b-2 border-[#5157E8]'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                  onClick={() => setActiveTab('history')}
                >
                  📚 {t('History', '历史记录', lang)} ({history.length})
                </button>
                <button
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'notes'
                      ? 'text-[#5157E8] border-b-2 border-[#5157E8]'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                  onClick={() => setActiveTab('notes')}
                >
                  📝 {t('My Notes', '我的笔记', lang)}
                </button>
              </div>
              
              {/* 历史记录区域 */}
              {activeTab === 'history' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-400">{t('Auto-saved on refresh, restore anytime', '刷新页面后自动保存，可随时恢复', lang)}</p>
                    {history.length > 0 && (
                      <button
                        onClick={handleClearAll}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        {t('Clear All', '清空全部', lang)}
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-3">
                    {history.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        <div className="text-4xl mb-2">📂</div>
                        <p>{t('No history yet', '暂无历史记录', lang)}</p>
                        <p className="text-xs mt-1">{t('Auto-saved when you refresh', '刷新页面时会自动保存', lang)}</p>
                      </div>
                    ) : (
                      history.map((record) => (
                        <div
                          key={record.id}
                          className="border border-gray-700 bg-gray-800/50 rounded-lg p-3 hover:border-[#5157E8] transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-white">
                                {(lang === 'zh' ? record.theme?.title : record.theme?.titleEn) || record.theme?.title || t('Untitled Project', '未命名项目', lang)}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {record.date}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteHistory(record.id)}
                              className="text-red-400 hover:text-red-300 text-sm ml-2"
                              title={t('Delete', '删除', lang)}
                            >
                              🗑️
                            </button>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mb-2">
                            {record.theme && (
                              <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                                {t('Theme', '主题', lang)}
                              </span>
                            )}
                            {record.solution && (
                              <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-300 rounded">
                                {t('Solution', '方案', lang)}
                              </span>
                            )}
                            {record.chatHistory && record.chatHistory.length > 0 && (
                              <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                                {t('Chat', '对话', lang)}({record.chatHistory.length})
                              </span>
                            )}
                            {record.report && (
                              <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded">
                                {t('Report', '报告', lang)}
                              </span>
                            )}
                            {record.visualAssets && (
                              <span className="text-xs px-2 py-0.5 bg-pink-500/20 text-pink-300 rounded">
                                {t('Assets', '素材', lang)}
                              </span>
                            )}
                          </div>
                          
                          <button
                            onClick={() => handleRestoreHistory(record.id)}
                            className="w-full py-2 bg-[#5157E8] text-white text-sm rounded hover:bg-[#373cb6] transition-colors"
                          >
                            {t('Restore', '恢复此记录', lang)}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              
              {/* 笔记区域 */}
              {activeTab === 'notes' && (
                <div className="flex-1 flex flex-col">
                  <p className="text-sm text-gray-400 mb-3">{t('Record your thoughts and inspirations', '记录您的想法和灵感', lang)}</p>
                  <textarea
                    className="border border-gray-700 bg-gray-800/50 text-white rounded-lg p-3 flex-1 resize-none focus:outline-none focus:ring-2 focus:ring-[#5157E8] focus:border-transparent"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder={t('Write your thoughts here...', '在这里写下您的想法...', lang)}
                  />
                  <div className="flex gap-3 justify-end mt-4">
                    <button 
                      className="px-5 py-2 border border-gray-600 rounded-lg hover:bg-gray-800/50 transition-colors text-white" 
                      onClick={() => setOpen(false)}
                    >
                      {t('Cancel', '取消', lang)}
                    </button>
                    <button 
                      className="bg-[#5157E8] text-white px-5 py-2 rounded-lg hover:bg-[#373cb6] transition-colors" 
                      onClick={handleSave}
                    >
                      {t('Save Note', '保存笔记', lang)}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 