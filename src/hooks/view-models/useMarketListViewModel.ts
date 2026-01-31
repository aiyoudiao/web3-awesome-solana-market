import { useState, useEffect, useMemo } from 'react';
import { useSoldoraProgram } from '@/hooks/useSoldoraProgram';
import { transformEventToMarket } from '@/lib/formatters';

export const useMarketListViewModel = () => {
  const { events, fetchState, getParticipants, loading } = useSoldoraProgram();
  const [participantsMap, setParticipantsMap] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 初始加载
  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // 移除高频 RPC 调用：列表页不再自动获取所有参与人数，避免 429 错误
  // 如果需要显示热度，可以使用简单的链上数据（如总奖池）替代，或者在后端/Indexer层聚合数据
  
  // 转换数据
  const markets = useMemo(() => {
    return events.map(event => transformEventToMarket(event, 0));
  }, [events]);

  // 过滤数据
  const filteredMarkets = useMemo(() => {
    return markets.filter(market => {
        // 状态过滤
        if (filter === 'active' && !market.status.active) return false;
        if (filter === 'resolved' && !market.status.resolved) return false;

        // 搜索过滤
        if (searchQuery && !market.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

        return true;
    });
  }, [markets, filter, searchQuery]);

  return {
    markets: filteredMarkets, // 返回过滤后的列表
    allMarkets: markets,      // 返回所有列表（供 3D 视图使用，如果不需要过滤）
    isLoading: loading,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    refresh: fetchState
  };
};
