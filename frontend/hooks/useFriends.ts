import { useCallback, useEffect, useState } from 'react';

import {
  type ApiFriend,
  approveFriendRequest,
  getFriendRequests,
  getFriends,
  rejectFriendRequest,
  searchFriends,
  sendFriendRequest,
} from '@/lib/api';

export interface Friend {
  id: string;
  friendId: string;
  name: string;
  avatar: string | null;
  rank: string;
  consecutiveDays: number;
  totalTime: number;
  achievementCount: number;
  recentActivity: string[];
}

export interface FriendRequest {
  id: string;
  userId: string;
  friendId: string;
  name: string;
  avatar: string | null;
  rank: string;
}

function toFriend(friend: ApiFriend): Friend {
  return {
    id: friend.userId,
    friendId: friend.friendId,
    name: friend.name,
    avatar: friend.avatar ?? null,
    rank: friend.rank ?? '',
    consecutiveDays: friend.consecutiveDays ?? 0,
    totalTime: friend.totalTime ?? 0,
    achievementCount: friend.achievementCount ?? 0,
    recentActivity: friend.recentActivity ?? [],
  };
}

function toFriendRequest(friend: ApiFriend): FriendRequest {
  return {
    id: friend.userId,
    userId: friend.userId,
    friendId: friend.friendId,
    name: friend.name,
    avatar: friend.avatar ?? null,
    rank: friend.rank ?? '',
  };
}

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshFriends = useCallback(async () => {
    setIsLoading(true);
    try {
      const [friendsResponse, requestsResponse] = await Promise.all([
        getFriends(),
        getFriendRequests(),
      ]);
      setFriends(friendsResponse.map(toFriend));
      setRequests(requestsResponse.map(toFriendRequest));
    } catch (error) {
      console.warn('Failed to load friends:', error);
      setFriends([]);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshFriends();
  }, [refreshFriends]);

  const getFriendById = useCallback(
    (id: string) => friends.find((friend) => friend.id === id),
    [friends],
  );

  const searchUsers = useCallback(async (query: string): Promise<Friend[]> => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 3) {
      return [];
    }

    setIsLoading(true);
    try {
      const response = await searchFriends(trimmedQuery);
      return response.map(toFriend);
    } catch (error) {
      console.warn('Failed to search friends:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendRequest = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      await sendFriendRequest(userId);
      setSentRequests((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const approveRequest = useCallback(async (requestId: string) => {
    setIsLoading(true);
    try {
      await approveFriendRequest(requestId);
      await refreshFriends();
    } finally {
      setIsLoading(false);
    }
  }, [refreshFriends]);

  const rejectRequest = useCallback(async (requestId: string) => {
    setIsLoading(true);
    try {
      await rejectFriendRequest(requestId);
      await refreshFriends();
    } finally {
      setIsLoading(false);
    }
  }, [refreshFriends]);

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
    refreshFriends,
    getFriendById,
    searchUsers,
    sendRequest,
    approveRequest,
    rejectRequest,
    getRankingByTotalTime,
    getRankingByConsecutiveDays,
  };
}
