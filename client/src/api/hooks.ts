import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type {
  Board,
  BoardWithDetails,
  Card,
  Column,
  Label,
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  CreateBoardRequest,
  CreateColumnRequest,
  CreateCardRequest,
  UpdateCardRequest,
  MoveCardRequest,
  CreateLabelRequest,
  AddMemberRequest,
  UserSettings,
  WebhookSettings,
  Invite,
} from '../types'
import { useAuthStore } from '../stores/authStore'
import { useBoardStore } from '../stores/boardStore'
import { useSettingsStore } from '../stores/settingsStore'

// Auth hooks
export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
    onSuccess: (data) => {
      setAuth(data.token, data.user)
    },
  })
}

export function useRegister() {
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: (data: RegisterRequest) => api.post<AuthResponse>('/auth/register', data),
    onSuccess: (data) => {
      setAuth(data.token, data.user)
    },
  })
}

export function useCurrentUser() {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.get<User>('/auth/me'),
    enabled: !!token,
  })
}

// Setup status hook
interface SetupStatus {
  isSetupComplete: boolean
}

export function useSetupStatus() {
  return useQuery({
    queryKey: ['setupStatus'],
    queryFn: () => api.get<SetupStatus>('/auth/setup-status'),
    staleTime: 30000, // Cache for 30 seconds
  })
}

// Invite hooks
export function useInvites() {
  return useQuery({
    queryKey: ['invites'],
    queryFn: () => api.get<{ invites: Invite[] }>('/invites').then((res) => res.invites),
  })
}

export function useCreateInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post<{ invite: Invite }>('/invites').then((res) => res.invite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] })
    },
  })
}

export function useRevokeInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (inviteId: number) => api.delete(`/invites/${inviteId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] })
    },
  })
}

// Board hooks
export function useBoards() {
  return useQuery({
    queryKey: ['boards'],
    queryFn: () => api.get<Board[]>('/boards'),
  })
}

export function useBoard(boardId: number) {
  const setCurrentBoard = useBoardStore((state) => state.setCurrentBoard)

  return useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      const board = await api.get<BoardWithDetails>(`/boards/${boardId}`)
      setCurrentBoard(board)
      return board
    },
    enabled: !!boardId,
  })
}

export function useCreateBoard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBoardRequest) => api.post<Board>('/boards', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
    },
  })
}

export function useDeleteBoard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (boardId: number) => api.delete(`/boards/${boardId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
    },
  })
}

// Column hooks
export function useCreateColumn(boardId: number) {
  const queryClient = useQueryClient()
  const addColumn = useBoardStore((state) => state.addColumn)

  return useMutation({
    mutationFn: (data: CreateColumnRequest) => api.post<Column>(`/boards/${boardId}/columns`, data),
    onSuccess: (column) => {
      addColumn(column)
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })
}

export function useUpdateColumn() {
  const queryClient = useQueryClient()
  const updateColumn = useBoardStore((state) => state.updateColumn)

  return useMutation({
    mutationFn: ({ columnId, data }: { columnId: number; data: Partial<Column> }) =>
      api.put<Column>(`/columns/${columnId}`, data),
    onSuccess: (column) => {
      updateColumn(column)
      queryClient.invalidateQueries({ queryKey: ['board'] })
    },
  })
}

export function useDeleteColumn() {
  const queryClient = useQueryClient()
  const removeColumn = useBoardStore((state) => state.removeColumn)

  return useMutation({
    mutationFn: (columnId: number) => api.delete(`/columns/${columnId}`),
    onSuccess: (_, columnId) => {
      removeColumn(columnId)
      queryClient.invalidateQueries({ queryKey: ['board'] })
    },
  })
}

export function useReorderColumns(boardId: number) {
  const queryClient = useQueryClient()
  const reorderColumns = useBoardStore((state) => state.reorderColumns)

  return useMutation({
    mutationFn: (columnIds: number[]) =>
      api.put<{ success: boolean }>(`/boards/${boardId}/columns/reorder`, { columnIds }),
    onMutate: async (columnIds) => {
      // Optimistic update
      reorderColumns(columnIds)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })
}

// Card hooks
export function useCreateCard(columnId: number) {
  const queryClient = useQueryClient()
  const addCard = useBoardStore((state) => state.addCard)

  return useMutation({
    mutationFn: (data: CreateCardRequest) => api.post<Card>(`/columns/${columnId}/cards`, data),
    onSuccess: (card) => {
      addCard(card)
      queryClient.invalidateQueries({ queryKey: ['board'] })
    },
  })
}

export function useUpdateCard() {
  const queryClient = useQueryClient()
  const updateCard = useBoardStore((state) => state.updateCard)

  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: number; data: UpdateCardRequest }) =>
      api.put<Card>(`/cards/${cardId}`, data),
    onSuccess: (card) => {
      updateCard(card)
      queryClient.invalidateQueries({ queryKey: ['board'] })
    },
  })
}

export function useMoveCard() {
  const queryClient = useQueryClient()
  const moveCardInStore = useBoardStore((state) => state.moveCard)

  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: number; data: MoveCardRequest }) =>
      api.put<Card>(`/cards/${cardId}/move`, data),
    onMutate: async ({ cardId, data }) => {
      // Optimistic update
      moveCardInStore(cardId, data.columnId, data.position)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] })
    },
  })
}

export function useDeleteCard() {
  const queryClient = useQueryClient()
  const removeCard = useBoardStore((state) => state.removeCard)

  return useMutation({
    mutationFn: (cardId: number) => api.delete(`/cards/${cardId}`),
    onSuccess: (_, cardId) => {
      removeCard(cardId)
      queryClient.invalidateQueries({ queryKey: ['board'] })
    },
  })
}

// Label hooks
export function useLabels(boardId: number) {
  return useQuery({
    queryKey: ['labels', boardId],
    queryFn: () => api.get<Label[]>(`/boards/${boardId}/labels`),
    enabled: !!boardId,
  })
}

export function useCreateLabel(boardId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateLabelRequest) => api.post<Label>(`/boards/${boardId}/labels`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels', boardId] })
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })
}

export function useDeleteLabel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (labelId: number) => api.delete(`/labels/${labelId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] })
      queryClient.invalidateQueries({ queryKey: ['board'] })
    },
  })
}

// Member hooks
export function useAddMember(boardId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AddMemberRequest) => api.post(`/boards/${boardId}/members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })
}

export function useRemoveMember(boardId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: number) => api.delete(`/boards/${boardId}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
  })
}

// Settings hooks
export function useSettings() {
  const setSettings = useSettingsStore((state) => state.setSettings)

  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const settings = await api.get<UserSettings>('/settings')
      setSettings(settings)
      return settings
    },
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  const setSettings = useSettingsStore((state) => state.setSettings)

  return useMutation({
    mutationFn: (data: Partial<UserSettings>) => api.put<UserSettings>('/settings', data),
    onSuccess: (settings) => {
      setSettings(settings)
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export function useResetSettings() {
  const queryClient = useQueryClient()
  const resetSettings = useSettingsStore((state) => state.resetSettings)

  return useMutation({
    mutationFn: () => api.delete('/settings'),
    onSuccess: () => {
      resetSettings()
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

// Version hook
interface VersionInfo {
  version: string
  name: string
  buildTime: string
}

export function useVersion() {
  return useQuery({
    queryKey: ['version'],
    queryFn: () => api.get<VersionInfo>('/version'),
    staleTime: Infinity, // Version doesn't change during runtime
  })
}

// Webhook test hook
interface WebhookTestResult {
  success: boolean
  error?: string
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: (webhook: WebhookSettings) =>
      api.post<WebhookTestResult>('/settings/webhook/test', webhook),
  })
}
