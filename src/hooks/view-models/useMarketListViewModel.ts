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

  // 获取参与人数
  useEffect(() => {
    const fetchAllParticipants = async () => {
        if (events.length === 0) return;
        const map: Record<string, number> = {};
        for (const ev of events) {
            const count = await getParticipants(ev.account.yesMint, ev.account.noMint);
            map[ev.publicKey.toString()] = count;
        }
        setParticipantsMap(map);
    };
    fetchAllParticipants();
  }, [events, getParticipants]);

  // 转换数据
  const markets = useMemo(() => {
    return events.map(event => transformEventToMarket(event, participantsMap[event.publicKey.toString()] || 0));
  }, [events, participantsMap]);

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
