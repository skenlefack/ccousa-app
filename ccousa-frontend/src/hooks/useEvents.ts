import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { toast } from '../components/ui';
import { handleApiError } from '../services/api';
import {
  eventsService,
  eventCommentsService,
  eventAttachmentsService,
  eventTasksService,
  eventTimelineService,
  EventQueryParams,
  EventFilters,
  CreateEventData,
  UpdateEventData,
  CreateTaskData,
  UpdateTaskData,
  EventDetails,
  EventTask,
} from '../services/events.service';
import type { Event } from '../types';

// ===========================================
// Query Keys
// ===========================================

export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (params?: EventQueryParams) => [...eventKeys.lists(), params] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
  stats: (params?: Pick<EventFilters, 'dateFrom' | 'dateTo' | 'organizationalUnitId'>) =>
    [...eventKeys.all, 'stats', params] as const,
  comments: (eventId: string) => [...eventKeys.all, 'comments', eventId] as const,
  attachments: (eventId: string) => [...eventKeys.all, 'attachments', eventId] as const,
  tasks: (eventId: string) => [...eventKeys.all, 'tasks', eventId] as const,
  task: (eventId: string, taskId: string) => [...eventKeys.tasks(eventId), taskId] as const,
  timeline: (eventId: string) => [...eventKeys.all, 'timeline', eventId] as const,
};

// ===========================================
// Events Hooks
// ===========================================

export function useEvents(params?: EventQueryParams) {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: () => eventsService.getAll(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useInfiniteEvents(params?: Omit<EventQueryParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: [...eventKeys.lists(), 'infinite', params],
    queryFn: ({ pageParam = 1 }) => eventsService.getAll({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    getPreviousPageParam: (firstPage) => (firstPage.hasPrevious ? firstPage.page - 1 : undefined),
  });
}

export function useEvent(id: string, options?: { includeDetails?: boolean; enabled?: boolean }) {
  const { includeDetails = true, enabled = true } = options ?? {};

  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => eventsService.getById(id, includeDetails),
    enabled: !!id && enabled,
  });
}

export function useEventStats(params?: Pick<EventFilters, 'dateFrom' | 'dateTo' | 'organizationalUnitId'>) {
  return useQuery({
    queryKey: eventKeys.stats(params),
    queryFn: () => eventsService.getStats(params),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEventData) => eventsService.create(data),
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventKeys.stats() });
      toast.success('Événement créé', `L'événement "${newEvent.title}" a été créé avec succès.`);
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventData }) => eventsService.update(id, data),
    onSuccess: (updatedEvent) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(updatedEvent.id) });
      queryClient.invalidateQueries({ queryKey: eventKeys.stats() });
      toast.success('Événement mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => eventsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventKeys.stats() });
      toast.success('Événement supprimé');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useChangeEventStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: Event['status']; reason?: string }) =>
      eventsService.changeStatus(id, status, reason),
    onSuccess: (updatedEvent) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(updatedEvent.id) });
      queryClient.invalidateQueries({ queryKey: eventKeys.stats() });
      queryClient.invalidateQueries({ queryKey: eventKeys.timeline(updatedEvent.id) });
      toast.success('Statut mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useAssignEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, assignedToId }: { id: string; assignedToId: string | null }) =>
      eventsService.assign(id, assignedToId),
    onSuccess: (updatedEvent) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(updatedEvent.id) });
      queryClient.invalidateQueries({ queryKey: eventKeys.timeline(updatedEvent.id) });
      toast.success(updatedEvent.assignedToId ? 'Événement assigné' : 'Assignation retirée');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

// Bulk operations
export function useBulkUpdateEventStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: Event['status'] }) =>
      eventsService.bulkUpdateStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventKeys.details() });
      queryClient.invalidateQueries({ queryKey: eventKeys.stats() });
      toast.success('Statuts mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useBulkAssignEvents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, assignedToId }: { ids: string[]; assignedToId: string }) =>
      eventsService.bulkAssign(ids, assignedToId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventKeys.details() });
      toast.success('Événements assignés');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useBulkDeleteEvents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => eventsService.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventKeys.stats() });
      toast.success('Événements supprimés');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

// ===========================================
// Comments Hooks
// ===========================================

export function useEventComments(eventId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: eventKeys.comments(eventId),
    queryFn: () => eventCommentsService.getAll(eventId),
    enabled: !!eventId && (options?.enabled ?? true),
  });
}

export function useAddEventComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, content }: { eventId: string; content: string }) =>
      eventCommentsService.create(eventId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.comments(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.timeline(variables.eventId) });
      toast.success('Commentaire ajouté');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useUpdateEventComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, commentId, content }: { eventId: string; commentId: string; content: string }) =>
      eventCommentsService.update(eventId, commentId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.comments(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.eventId) });
      toast.success('Commentaire modifié');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useDeleteEventComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, commentId }: { eventId: string; commentId: string }) =>
      eventCommentsService.delete(eventId, commentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.comments(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.eventId) });
      toast.success('Commentaire supprimé');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

// ===========================================
// Attachments Hooks
// ===========================================

export function useEventAttachments(eventId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: eventKeys.attachments(eventId),
    queryFn: () => eventAttachmentsService.getAll(eventId),
    enabled: !!eventId && (options?.enabled ?? true),
  });
}

export function useUploadEventAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, file, documentTypeId }: { eventId: string; file: File; documentTypeId?: string }) =>
      eventAttachmentsService.upload(eventId, file, documentTypeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.attachments(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.timeline(variables.eventId) });
      toast.success('Fichier téléchargé');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useUploadMultipleAttachments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, files, documentTypeId }: { eventId: string; files: File[]; documentTypeId?: string }) =>
      eventAttachmentsService.uploadMultiple(eventId, files, documentTypeId),
    onSuccess: (attachments, variables) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.attachments(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.timeline(variables.eventId) });
      toast.success(`${attachments.length} fichier(s) téléchargé(s)`);
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useDeleteEventAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, attachmentId }: { eventId: string; attachmentId: string }) =>
      eventAttachmentsService.delete(eventId, attachmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.attachments(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.eventId) });
      toast.success('Fichier supprimé');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

// ===========================================
// Tasks Hooks
// ===========================================

export function useEventTasks(eventId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: eventKeys.tasks(eventId),
    queryFn: () => eventTasksService.getAll(eventId),
    enabled: !!eventId && (options?.enabled ?? true),
  });
}

export function useEventTask(eventId: string, taskId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: eventKeys.task(eventId, taskId),
    queryFn: () => eventTasksService.getById(eventId, taskId),
    enabled: !!eventId && !!taskId && (options?.enabled ?? true),
  });
}

export function useCreateEventTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: CreateTaskData }) =>
      eventTasksService.create(eventId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.tasks(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.timeline(variables.eventId) });
      toast.success('Tâche créée');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useUpdateEventTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, taskId, data }: { eventId: string; taskId: string; data: UpdateTaskData }) =>
      eventTasksService.update(eventId, taskId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.tasks(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.task(variables.eventId, variables.taskId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.eventId) });
      toast.success('Tâche mise à jour');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useChangeEventTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, taskId, status }: { eventId: string; taskId: string; status: EventTask['status'] }) =>
      eventTasksService.changeStatus(eventId, taskId, status),
    onSuccess: (updatedTask, variables) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.tasks(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.task(variables.eventId, variables.taskId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.timeline(variables.eventId) });

      if (updatedTask.status === 'COMPLETED') {
        toast.success('Tâche terminée');
      } else {
        toast.success('Statut de la tâche mis à jour');
      }
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

export function useDeleteEventTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, taskId }: { eventId: string; taskId: string }) =>
      eventTasksService.delete(eventId, taskId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.tasks(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.eventId) });
      toast.success('Tâche supprimée');
    },
    onError: (error) => {
      toast.error('Erreur', handleApiError(error));
    },
  });
}

// ===========================================
// Timeline Hook
// ===========================================

export function useEventTimeline(eventId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: eventKeys.timeline(eventId),
    queryFn: () => eventTimelineService.getAll(eventId),
    enabled: !!eventId && (options?.enabled ?? true),
  });
}

// ===========================================
// Utility Hooks
// ===========================================

// Prefetch event details (useful for hover previews)
export function usePrefetchEvent() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: eventKeys.detail(id),
      queryFn: () => eventsService.getById(id, true),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
}

// Optimistic update helper for status changes
export function useOptimisticEventUpdate() {
  const queryClient = useQueryClient();

  const updateEventInCache = (id: string, updates: Partial<EventDetails>) => {
    queryClient.setQueryData<EventDetails>(eventKeys.detail(id), (old) => {
      if (!old) return old;
      return { ...old, ...updates };
    });
  };

  const rollbackEventInCache = (id: string, previousData: EventDetails | undefined) => {
    if (previousData) {
      queryClient.setQueryData(eventKeys.detail(id), previousData);
    }
  };

  return { updateEventInCache, rollbackEventInCache };
}
