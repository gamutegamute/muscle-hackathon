import { useState, useCallback } from 'react';

export interface Friend {
  id: string;
  name: string;
  avatar: string | null;
  rank: string;
  consecutiveDays: number;
  totalTime: number; // in minutes
  achievementCount: number;
  recentActivity: string[]; // e.g., ["ベンチプレス 3セット", "スクワット 30回"]
}

export interface FriendRequest {
  id: string;
  userId: string;
  name: string;
  avatar: string | null;
  rank: string;
}

// Dummy Data
const DUMMY_FRIENDS: Friend[] = [
  {
    id: 'f1',
    name: '筋肉太郎',
    avatar: 'https://i.pravatar.cc/150?img=11',
    rank: '🔥 マッスルマスター',
    consecutiveDays: 34,
    totalTime: 1250,
    achievementCount: 15,
    recentActivity: ['ベンチプレス 3セット', 'スクワット 30回', 'プランク 3分'],
  },
  {
    id: 'f2',
    name: 'マッチョマン',
    avatar: 'https://i.pravatar.cc/150?img=33',
    rank: '💪 鋼の肉体',
    consecutiveDays: 12,
    totalTime: 420,
    achievementCount: 5,
    recentActivity: ['ランニング 5km', '腕立て伏せ 50回'],
  },
  {
    id: 'f3',
    name: 'フィットネス花子',
    avatar: 'https://i.pravatar.cc/150?img=47',
    rank: '🏃‍♀️ スピードスター',
    consecutiveDays: 89,
    totalTime: 3600,
    achievementCount: 28,
    recentActivity: ['ヨガ 45分', '腹筋ローラー 20回'],
  },
];

const DUMMY_REQUESTS: FriendRequest[] = [
  {
    id: 'r1',
    userId: 'u99',
    name: 'プロテイン佐藤',
    avatar: 'https://i.pravatar.cc/150?img=12',
    rank: '🥚 はじまりの一歩',
  },
  {
    id: 'r2',
    userId: 'u100',
    name: 'ダンベル鈴木',
    avatar: 'https://i.pravatar.cc/150?img=60',
    rank: '🥉 ブロンズマッスル',
  },
];

const ALL_USERS: Friend[] = [
  ...DUMMY_FRIENDS,
  {
    id: 'u99',
    name: 'プロテイン佐藤',
    avatar: 'https://i.pravatar.cc/150?img=12',
    rank: '🥚 はじまりの一歩',
    consecutiveDays: 2,
    totalTime: 45,
    achievementCount: 1,
    recentActivity: ['ウォーキング 20分'],
  },
  {
    id: 'u100',
    name: 'ダンベル鈴木',
    avatar: 'https://i.pravatar.cc/150?img=60',
    rank: '🥉 ブロンズマッスル',
    consecutiveDays: 15,
    totalTime: 800,
    achievementCount: 8,
    recentActivity: ['デッドリフト 3セット'],
  },
  {
    id: 'u101',
    name: 'ジムの主',
    avatar: 'https://i.pravatar.cc/150?img=68',
    rank: '👑 ジムの主',
    consecutiveDays: 150,
    totalTime: 8500,
    achievementCount: 40,
    recentActivity: ['懸垂 100回', 'スクワット 100kg'],
  },
];

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>(DUMMY_FRIENDS);
  const [requests, setRequests] = useState<FriendRequest[]>(DUMMY_REQUESTS);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);

  // Get single friend
  const getFriendById = useCallback((id: string) => {
    return friends.find(f => f.id === id) || ALL_USERS.find(u => u.id === id);
  }, [friends]);

  // Search users
  const searchUsers = useCallback(async (query: string): Promise<Friend[]> => {
    setIsLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));
    setIsLoading(false);
    
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return ALL_USERS.filter(
      u => u.name.toLowerCase().includes(lowerQuery) || u.id.toLowerCase() === lowerQuery
    );
  }, []);

  // Send friend request
  const sendRequest = useCallback(async (userId: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setSentRequests(prev => [...prev, userId]);
    setIsLoading(false);
  }, []);

  // Approve request
  const approveRequest = useCallback(async (requestId: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const req = requests.find(r => r.id === requestId);
    if (req) {
      const newUser = ALL_USERS.find(u => u.id === req.userId);
      if (newUser && !friends.some(f => f.id === newUser.id)) {
        setFriends(prev => [...prev, newUser]);
      }
    }
    
    setRequests(prev => prev.filter(r => r.id !== requestId));
    setIsLoading(false);
  }, [requests, friends]);

  // Reject request
  const rejectRequest = useCallback(async (requestId: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setRequests(prev => prev.filter(r => r.id !== requestId));
    setIsLoading(false);
  }, []);

  // Rankings
  const getRankingByTotalTime = useCallback(() => {
    return [...friends].sort((a, b) => b.totalTime - a.totalTime);
  }, [friends]);

  const getRankingByConsecutiveDays = useCallback(() => {
    return [...friends].sort((a, b) => b.consecutiveDays - a.consecutiveDays);
  }, [friends]);

  return {
    friends,
    requests,
    sentRequests,
    isLoading,
    getFriendById,
    searchUsers,
    sendRequest,
    approveRequest,
    rejectRequest,
    getRankingByTotalTime,
    getRankingByConsecutiveDays,
  };
}
