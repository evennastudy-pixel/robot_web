"use client";
import { useEffect } from 'react';

/**
 * 历史记录自动保存组件
 * 已禁用自动保存功能，改为使用手动保存按钮
 */
export default function HistoryAutoSave() {
  useEffect(() => {
    // 标记当前会话为活跃（保留会话管理，但不自动保存）
    sessionStorage.setItem('workshopSessionActive', 'true');
  }, []);
  
  return null; // 这是一个无UI组件
}

