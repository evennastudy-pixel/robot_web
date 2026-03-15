/**
 * 历史记录管理工具
 * 用于保存和恢复workshop的历史记录
 */

export interface WorkshopHistory {
  id: string;
  timestamp: number;
  date: string;
  theme: any | null;
  solution: any | null;
  chatHistory: any[];
  report: string | null;
  visualAssets: any | null;
}

const HISTORY_KEY = 'workshopHistory';
const MAX_HISTORY_COUNT = 20; // 最多保存20条历史记录

/**
 * 保存当前workshop状态到历史记录
 */
export function saveCurrentToHistory(): void {
  try {
    // 获取当前所有数据
    const theme = localStorage.getItem('selectedTheme');
    const solution = localStorage.getItem('completeSolution');
    const chatHistory = sessionStorage.getItem('solutionConversation');
    const report = sessionStorage.getItem('generatedReport');
    const visualAssets = localStorage.getItem('visualAssets');
    
    // 只有当有实际内容时才保存
    if (!theme && !solution && !chatHistory && !report && !visualAssets) {
      console.log('📝 没有内容需要保存到历史记录');
      return;
    }
    
    // 创建历史记录
    const historyRecord: WorkshopHistory = {
      id: `history_${Date.now()}`,
      timestamp: Date.now(),
      date: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      theme: theme ? JSON.parse(theme) : null,
      solution: solution ? JSON.parse(solution) : null,
      chatHistory: chatHistory ? JSON.parse(chatHistory) : [],
      report: report,
      visualAssets: visualAssets ? JSON.parse(visualAssets) : null
    };
    
    // 获取现有历史记录
    const existingHistory = getHistory();
    
    // 添加新记录到开头
    const newHistory = [historyRecord, ...existingHistory];
    
    // 限制历史记录数量
    const limitedHistory = newHistory.slice(0, MAX_HISTORY_COUNT);
    
    // 保存到localStorage
    localStorage.setItem(HISTORY_KEY, JSON.stringify(limitedHistory));
    
    console.log(`📝 已保存历史记录，当前共 ${limitedHistory.length} 条`);
  } catch (error) {
    console.error('保存历史记录失败:', error);
  }
}

/**
 * 获取所有历史记录
 */
export function getHistory(): WorkshopHistory[] {
  try {
    const historyStr = localStorage.getItem(HISTORY_KEY);
    if (!historyStr) return [];
    
    const history = JSON.parse(historyStr);
    return Array.isArray(history) ? history : [];
  } catch (error) {
    console.error('获取历史记录失败:', error);
    return [];
  }
}

/**
 * 恢复历史记录
 */
export function restoreHistory(historyId: string): boolean {
  try {
    const history = getHistory();
    const record = history.find(h => h.id === historyId);
    
    if (!record) {
      console.error('未找到历史记录:', historyId);
      return false;
    }
    
    // 恢复数据
    if (record.theme) {
      localStorage.setItem('selectedTheme', JSON.stringify(record.theme));
      localStorage.setItem('selectedFutureSignal', JSON.stringify(record.theme));
    }
    
    if (record.solution) {
      localStorage.setItem('completeSolution', JSON.stringify(record.solution));
    }
    
    if (record.chatHistory && record.chatHistory.length > 0) {
      sessionStorage.setItem('solutionConversation', JSON.stringify(record.chatHistory));
    }
    
    if (record.report) {
      sessionStorage.setItem('generatedReport', record.report);
    }
    
    if (record.visualAssets) {
      localStorage.setItem('visualAssets', JSON.stringify(record.visualAssets));
    }
    
    // 更新进度
    const progress = ['theme'];
    if (record.solution) progress.push('collaboration');
    if (record.report) progress.push('review');
    if (record.visualAssets) progress.push('headline');
    localStorage.setItem('workshopProgress', JSON.stringify(progress));
    
    console.log('✅ 历史记录已恢复:', historyId);
    return true;
  } catch (error) {
    console.error('恢复历史记录失败:', error);
    return false;
  }
}

/**
 * 删除历史记录
 */
export function deleteHistory(historyId: string): boolean {
  try {
    const history = getHistory();
    const newHistory = history.filter(h => h.id !== historyId);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    console.log('🗑️ 历史记录已删除:', historyId);
    return true;
  } catch (error) {
    console.error('删除历史记录失败:', error);
    return false;
  }
}

/**
 * 清空所有历史记录
 */
export function clearAllHistory(): boolean {
  try {
    localStorage.removeItem(HISTORY_KEY);
    console.log('🗑️ 所有历史记录已清空');
    return true;
  } catch (error) {
    console.error('清空历史记录失败:', error);
    return false;
  }
}

/**
 * 重置当前workshop（刷新后调用）
 */
export function resetCurrentWorkshop(): void {
  try {
    // 先保存当前内容到历史
    saveCurrentToHistory();
    
    // 清空当前数据
    localStorage.removeItem('selectedTheme');
    localStorage.removeItem('selectedFutureSignal');
    localStorage.removeItem('completeSolution');
    localStorage.removeItem('visualAssets');
    localStorage.removeItem('workshopProgress');
    
    sessionStorage.removeItem('solutionConversation');
    sessionStorage.removeItem('generatedReport');
    sessionStorage.removeItem('selectedStyle');
    sessionStorage.removeItem('customStyleInput');
    sessionStorage.removeItem('userFeedback');
    
    console.log('🔄 Workshop已重置');
  } catch (error) {
    console.error('重置workshop失败:', error);
  }
}

