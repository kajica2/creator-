import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ContentStorage,
  Page,
  Persona,
  PromptType,
  StoredContentItem,
} from '../types';
import {
  initializeContentStorage,
  saveContentStorage,
  addContent as addContentLocal,
  createPersona as createPersonaLocal,
  deletePersona as deletePersonaLocal,
  updatePersona as updatePersonaLocal,
  deleteContentItem as deleteContentItemLocal,
} from '../utils/contentStorage';
import {
  createPersona,
  deletePersona as deletePersonaRemote,
  listPersonas,
  setDefaultPersona,
  updatePersona as updatePersonaRemote,
} from '../supabase/personas';
import {
  createPersonaContent,
  deletePersonaContent,
  listAllContent,
} from '../supabase/personaContent';
import { useSupabaseAuth } from './useSupabaseAuth';

type CreateContentInput = {
  personaId: string;
  personaName: string;
  page: Page;
  promptType: PromptType;
  content: unknown;
  hashtags?: string[];
  metadata?: Record<string, unknown>;
};

const personaKeys = {
  all: ['personas'] as const,
};

const personaContentKeys = {
  all: ['persona-content'] as const,
};

const ensureDefaultPersonaSetup = async (): Promise<Persona[]> => {
  let personas = await listPersonas();

  if (personas.length === 0) {
    await createPersona({
      name: 'Default Persona',
      context: '',
      isDefault: true,
    });
    personas = await listPersonas();
  }

  if (!personas.some(persona => persona.isDefault)) {
    const fallbackPersona = personas[0];
    if (fallbackPersona) {
      await setDefaultPersona(fallbackPersona.id);
      personas = await listPersonas();
    }
  }

  return personas;
};

export const usePersonaContentManager = () => {
  const { user, loading: authLoading } = useSupabaseAuth();
  const isAuthenticated = Boolean(user);
  const queryClient = useQueryClient();

  const [localStorageState, setLocalStorageState] = useState<ContentStorage>(() =>
    initializeContentStorage(),
  );
  const [currentPersonaId, setCurrentPersonaId] = useState<string | null>(
    initializeContentStorage().defaultPersonaId ?? null,
  );

  const personasQuery = useQuery({
    queryKey: personaKeys.all,
    queryFn: ensureDefaultPersonaSetup,
    enabled: isAuthenticated,
  });

  const contentQuery = useQuery({
    queryKey: personaContentKeys.all,
    queryFn: listAllContent,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setLocalStorageState(initializeContentStorage());
      setCurrentPersonaId(initializeContentStorage().defaultPersonaId ?? null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const personas = personasQuery.data ?? [];
    const defaultPersona = personas.find(persona => persona.isDefault) ?? personas[0] ?? null;

    if (defaultPersona && defaultPersona.id !== currentPersonaId) {
      setCurrentPersonaId(defaultPersona.id);
    }
  }, [isAuthenticated, personasQuery.data, currentPersonaId]);

  const localContentStorage = useMemo(() => localStorageState, [localStorageState]);

  const supabaseContentStorage = useMemo<ContentStorage | null>(() => {
    if (!isAuthenticated) {
      return null;
    }

    const personas = personasQuery.data ?? [];
    const content = contentQuery.data ?? [];
    const defaultPersona =
      personas.find(persona => persona.isDefault) ?? personas[0] ?? null;

    return {
      personas,
      content,
      defaultPersonaId: defaultPersona?.id ?? '',
    };
  }, [isAuthenticated, personasQuery.data, contentQuery.data]);

  const contentStorage = isAuthenticated
    ? supabaseContentStorage ?? { personas: [], content: [], defaultPersonaId: '' }
    : localContentStorage;

  const currentPersona: Persona | null = useMemo(() => {
    if (!contentStorage.personas.length) {
      return null;
    }

    const persona =
      contentStorage.personas.find(p => p.id === currentPersonaId) ??
      contentStorage.personas.find(p => p.isDefault) ??
      contentStorage.personas[0];

    return persona ?? null;
  }, [contentStorage.personas, currentPersonaId]);

  const createPersonaMutation = useMutation({
    mutationFn: createPersona,
    onSuccess: async createdPersona => {
      await queryClient.invalidateQueries({ queryKey: personaKeys.all });
      setCurrentPersonaId(createdPersona.id);
    },
  });

const updatePersonaMutation = useMutation({
  mutationFn: ({
    personaId,
    updates,
  }: {
    personaId: string;
    updates: { name?: string; context?: string; isDefault?: boolean };
  }) => updatePersonaRemote(personaId, updates),
  onSuccess: async updatedPersona => {
    await queryClient.invalidateQueries({ queryKey: personaKeys.all });
    if (updatedPersona.isDefault) {
      setCurrentPersonaId(updatedPersona.id);
    }
  },
});

  const deletePersonaMutation = useMutation({
    mutationFn: deletePersonaRemote,
    onSuccess: async (_, personaId) => {
      await queryClient.invalidateQueries({ queryKey: personaKeys.all });
      await queryClient.invalidateQueries({ queryKey: personaContentKeys.all });

      if (currentPersonaId === personaId) {
        const personas = await ensureDefaultPersonaSetup();
        const defaultPersona =
          personas.find(persona => persona.isDefault) ?? personas[0] ?? null;
        setCurrentPersonaId(defaultPersona?.id ?? null);
      }
    },
  });

  const createContentMutation = useMutation({
    mutationFn: createPersonaContent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: personaContentKeys.all });
      await queryClient.invalidateQueries({ queryKey: personaKeys.all });
    },
  });

  const deleteContentMutation = useMutation({
    mutationFn: deletePersonaContent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: personaContentKeys.all });
      await queryClient.invalidateQueries({ queryKey: personaKeys.all });
    },
  });

  const handleCreatePersona = useCallback(
    async (name: string, context: string): Promise<Persona | void> => {
      if (!name.trim()) {
        return;
      }

      if (!isAuthenticated) {
        let createdPersona: Persona | undefined;
        setLocalStorageState(prev => {
          const updated = createPersonaLocal(prev, name, context);
          saveContentStorage(updated);
          createdPersona = updated.personas[updated.personas.length - 1];
          setCurrentPersonaId(createdPersona?.id ?? null);
          return updated;
        });
        return createdPersona;
      }

      const persona = await createPersonaMutation.mutateAsync({
        name,
        context,
      });

      return persona;
    },
    [createPersonaMutation, isAuthenticated],
  );

  const handleDeletePersona = useCallback(
    async (personaId: string): Promise<void> => {
      if (!personaId) {
        return;
      }

      if (!isAuthenticated) {
        setLocalStorageState(prev => {
          const updated = deletePersonaLocal(prev, personaId);
          saveContentStorage(updated);
          const personas = updated.personas;
          const nextPersona =
            personas.find(persona => persona.id === updated.defaultPersonaId) ??
            personas[0] ??
            null;
          setCurrentPersonaId(nextPersona?.id ?? null);
          return updated;
        });
        return;
      }

      await deletePersonaMutation.mutateAsync(personaId);
    },
    [deletePersonaMutation, isAuthenticated],
  );

  const handleAddContent = useCallback(
    async ({
      personaId,
      personaName,
      page,
      promptType,
      content,
      hashtags,
      metadata,
    }: CreateContentInput): Promise<void> => {
      if (!personaId) {
        return;
      }

      if (!isAuthenticated) {
        setLocalStorageState(prev => {
          const updated = addContentLocal(
            prev,
            content,
            page,
            promptType,
            personaId,
            personaName,
            hashtags ?? [],
            metadata ?? {},
          );
          saveContentStorage(updated);
          return updated;
        });
        return;
      }

      await createContentMutation.mutateAsync({
        personaId,
        tool: page,
        promptType,
        content,
        hashtags,
        metadata,
      });
    },
    [createContentMutation, isAuthenticated],
  );

  const handleDeleteContent = useCallback(
    async (contentId: string): Promise<void> => {
      if (!contentId) {
        return;
      }

      if (!isAuthenticated) {
        setLocalStorageState(prev => {
          const updated = deleteContentItemLocal(prev, contentId);
          saveContentStorage(updated);
          return updated;
        });
        return;
      }

      await deleteContentMutation.mutateAsync(contentId);
    },
    [deleteContentMutation, isAuthenticated],
  );

  const handleUpdatePersona = useCallback(
    async (
      personaId: string,
      updates: { name?: string; context?: string; isDefault?: boolean },
    ): Promise<Persona | void> => {
      if (!personaId) {
        return;
      }

      if (!isAuthenticated) {
        let updatedPersona: Persona | undefined;
        setLocalStorageState(prev => {
          const updated = updatePersonaLocal(prev, personaId, updates);
          saveContentStorage(updated);
          updatedPersona = updated.personas.find(persona => persona.id === personaId);
          if (updates.isDefault) {
            setCurrentPersonaId(personaId);
          }
          return updated;
        });
        return updatedPersona;
      }

      const persona = await updatePersonaMutation.mutateAsync({
        personaId,
        updates,
      });

      if (updates.isDefault) {
        setCurrentPersonaId(persona.id);
      }

      return persona;
    },
    [isAuthenticated, updatePersonaMutation],
  );

  const handleSetCurrentPersona = useCallback(
    async (persona: Persona): Promise<void> => {
      setCurrentPersonaId(persona.id);

      if (isAuthenticated) {
        await setDefaultPersona(persona.id);
        await queryClient.invalidateQueries({ queryKey: personaKeys.all });
      } else {
        setLocalStorageState(prev => {
          const updated = {
            ...prev,
            defaultPersonaId: persona.id,
            personas: prev.personas.map(p => ({
              ...p,
              isDefault: p.id === persona.id,
            })),
          };
          saveContentStorage(updated);
          return updated;
        });
      }
    },
    [isAuthenticated, queryClient],
  );

  const isLoading =
    authLoading ||
    (isAuthenticated && (personasQuery.isLoading || contentQuery.isLoading));

  return {
    contentStorage,
    currentPersona,
    setCurrentPersona: handleSetCurrentPersona,
    createPersona: handleCreatePersona,
    deletePersona: handleDeletePersona,
    updatePersona: handleUpdatePersona,
    addContent: handleAddContent,
    deleteContent: handleDeleteContent,
    isLoading,
    isAuthenticated,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: personaKeys.all });
      queryClient.invalidateQueries({ queryKey: personaContentKeys.all });
    },
  };
};

