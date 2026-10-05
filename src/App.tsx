import { useState, useEffect, useCallback } from 'react';
import { AppUser, ScreenView, ShoppingLine, ShoppingList } from './types';
import {
  addProductToCatalog,
  generateId,
  getInitialTheme,
  loadCatalog,
  loadLists,
  loadUsers,
  saveCatalog,
  saveLists,
  saveThemePreference,
  saveUsers,
  ThemeMode,
} from './utils/storage';
import {
  isSupabaseConfigured,
  fetchAllDataFromSupabase,
  createUserInSupabase,
  updateUserProfileInSupabase,
  updateUserPasswordInSupabase,
  insertCatalogProductInSupabase,
  createShoppingListInSupabase,
  updateShoppingListInSupabase,
  deleteShoppingListInSupabase,
  updateListStatusInSupabase,
  toggleLineCheckInSupabase,
} from './lib/supabase';
import { HomeScreen } from './components/HomeScreen';
import { ListEditorScreen } from './components/ListEditorScreen';
import { ShoppingModeScreen } from './components/ShoppingModeScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { UsersManagementScreen } from './components/UsersManagementScreen';
import { EditUserScreen } from './components/EditUserScreen';

export default function App() {
  const [lists, setLists] = useState<ShoppingList[]>(() => loadLists());
  const [catalog, setCatalog] = useState<string[]>(() => loadCatalog());
  const [users, setUsers] = useState<AppUser[]>(() => loadUsers());
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());
  const [view, setView] = useState<ScreenView>({ type: 'home' });

  // Si Supabase está configurado, cargamos las listas, el catálogo y los usuarios al iniciar
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    fetchAllDataFromSupabase()
      .then(
        ({
          lists: remoteLists,
          catalog: remoteCatalog,
          users: remoteUsers,
        }) => {
          setLists(remoteLists);
          setCatalog((prev) => {
            let merged = [...prev];
            for (const item of remoteCatalog) {
              merged = addProductToCatalog(merged, item);
            }
            return merged;
          });
          if (remoteUsers.length > 0) {
            setUsers((prev) => {
              const map = new Map<string, AppUser>();
              for (const u of prev) map.set(u.id, u);
              for (const u of remoteUsers) map.set(u.id, u);
              return Array.from(map.values());
            });
          }
        }
      )
      .catch((err) => {
        console.error('Error al cargar datos desde Supabase:', err);
      });
  }, []);

  // Persistir listas en localStorage
  useEffect(() => {
    saveLists(lists);
  }, [lists]);

  // Persistir catálogo de productos en localStorage
  useEffect(() => {
    saveCatalog(catalog);
  }, [catalog]);

  // Persistir usuarios en localStorage
  useEffect(() => {
    saveUsers(users);
  }, [users]);

  // Aplicar clase dark en <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      saveThemePreference(next);
      return next;
    });
  }, []);

  const handleCreateUser = useCallback((newUser: AppUser) => {
    setUsers((prev) => [...prev, newUser]);
    if (isSupabaseConfigured) {
      createUserInSupabase(newUser).catch((err) =>
        console.error('Error creando usuario en Supabase:', err)
      );
    }
  }, []);

  const handleUpdateUserProfile = useCallback(
    (userId: string, data: { nombre: string; email: string }) => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                nombre: data.nombre,
                ...(data.email ? { email: data.email } : { email: undefined }),
              }
            : u
        )
      );
      setLists((prev) =>
        prev.map((l) =>
          l.usuarioId === userId ? { ...l, usuarioNombre: data.nombre } : l
        )
      );

      if (isSupabaseConfigured) {
        updateUserProfileInSupabase(userId, data).catch((err) =>
          console.error('Error actualizando usuario en Supabase:', err)
        );
      }

      setView({ type: 'users' });
    },
    []
  );

  const handleUpdateUserPassword = useCallback(
    (userId: string, newPassword: string) => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, password: newPassword } : u
        )
      );
      if (isSupabaseConfigured) {
        updateUserPasswordInSupabase(userId, newPassword).catch((err) =>
          console.error('Error actualizando contraseña en Supabase:', err)
        );
      }
    },
    []
  );

  const handleAddCatalogProduct = useCallback((productName: string) => {
    setCatalog((prev) => addProductToCatalog(prev, productName));
    if (isSupabaseConfigured) {
      insertCatalogProductInSupabase(productName).catch((err) =>
        console.error('Error guardando producto en catálogo Supabase:', err)
      );
    }
  }, []);

  const handleCreateList = useCallback(
    (data: {
      nombre: string;
      fechaCompra: string;
      lineas: ShoppingLine[];
      usuarioId: string;
      usuarioNombre: string;
    }) => {
      const newList: ShoppingList = {
        id: generateId(),
        nombre: data.nombre,
        fechaCompra: data.fechaCompra,
        estado: 'pendiente',
        lineas: data.lineas,
        usuarioId: data.usuarioId,
        usuarioNombre: data.usuarioNombre,
      };
      setLists((prev) => [...prev, newList]);
      setView({ type: 'home' });

      if (isSupabaseConfigured) {
        createShoppingListInSupabase(newList).catch((err) =>
          console.error('Error creando lista en Supabase:', err)
        );
      }
    },
    []
  );

  const handleUpdateList = useCallback(
    (
      listId: string,
      data: {
        nombre: string;
        fechaCompra: string;
        lineas: ShoppingLine[];
        usuarioId: string;
        usuarioNombre: string;
      }
    ) => {
      setLists((prev) =>
        prev.map((item) =>
          item.id === listId
            ? {
                ...item,
                nombre: data.nombre,
                fechaCompra: data.fechaCompra,
                lineas: data.lineas,
                usuarioId: data.usuarioId,
                usuarioNombre: data.usuarioNombre,
              }
            : item
        )
      );
      setView({ type: 'home' });

      if (isSupabaseConfigured) {
        updateShoppingListInSupabase(listId, data).catch((err) =>
          console.error('Error actualizando lista en Supabase:', err)
        );
      }
    },
    []
  );

  const handleDeleteList = useCallback((listId: string) => {
    setLists((prev) => prev.filter((item) => item.id !== listId));

    if (isSupabaseConfigured) {
      deleteShoppingListInSupabase(listId).catch((err) =>
        console.error('Error borrando lista en Supabase:', err)
      );
    }
  }, []);

  const handleStartShopping = useCallback((listId: string) => {
    setLists((prev) =>
      prev.map((item) =>
        item.id === listId
          ? {
              ...item,
              estado: 'en curso',
            }
          : item
      )
    );
    setView({ type: 'shopping', listId });

    if (isSupabaseConfigured) {
      updateListStatusInSupabase(listId, 'en curso').catch((err) =>
        console.error('Error iniciando compra en Supabase:', err)
      );
    }
  }, []);

  const handleToggleLineCheck = useCallback(
    (listId: string, lineId: string) => {
      let nextChecked = false;
      setLists((prev) =>
        prev.map((item) => {
          if (item.id !== listId) return item;
          return {
            ...item,
            estado: 'en curso',
            lineas: item.lineas.map((line) => {
              if (line.id === lineId) {
                nextChecked = !line.marcado;
                return { ...line, marcado: nextChecked };
              }
              return line;
            }),
          };
        })
      );

      if (isSupabaseConfigured) {
        toggleLineCheckInSupabase(listId, lineId, nextChecked).catch((err) =>
          console.error('Error marcando producto en Supabase:', err)
        );
      }
    },
    []
  );

  const handleExitShopping = useCallback((listId: string) => {
    setLists((prev) =>
      prev.map((item) =>
        item.id === listId
          ? {
              ...item,
              estado: 'en curso',
            }
          : item
      )
    );
    setView({ type: 'home' });

    if (isSupabaseConfigured) {
      updateListStatusInSupabase(listId, 'en curso').catch((err) =>
        console.error('Error guardando estado en curso en Supabase:', err)
      );
    }
  }, []);

  const handleFinishShopping = useCallback((listId: string) => {
    const completedAt = new Date().toISOString();
    setLists((prev) =>
      prev.map((item) =>
        item.id === listId
          ? {
              ...item,
              estado: 'realizada',
              fechaFinalizacion: completedAt,
            }
          : item
      )
    );
    setView({ type: 'home' });

    if (isSupabaseConfigured) {
      updateListStatusInSupabase(listId, 'realizada', completedAt).catch(
        (err) => console.error('Error finalizando compra en Supabase:', err)
      );
    }
  }, []);

  if (view.type === 'settings') {
    return (
      <SettingsScreen
        theme={theme}
        usersCount={users.length}
        onToggleTheme={handleToggleTheme}
        onOpenUsersManagement={() => setView({ type: 'users' })}
        onBack={() => setView({ type: 'home' })}
      />
    );
  }

  if (view.type === 'users') {
    return (
      <UsersManagementScreen
        users={users}
        onSelectVerifiedUserForEdit={(userId) =>
          setView({ type: 'editUser', userId })
        }
        onUpdateUserPassword={handleUpdateUserPassword}
        onPasswordChangeComplete={() => setView({ type: 'home' })}
        onBack={() => setView({ type: 'settings' })}
      />
    );
  }

  if (view.type === 'editUser') {
    const targetUser = users.find((u) => u.id === view.userId);
    if (!targetUser) {
      return (
        <UsersManagementScreen
          users={users}
          onSelectVerifiedUserForEdit={(userId) =>
            setView({ type: 'editUser', userId })
          }
          onUpdateUserPassword={handleUpdateUserPassword}
          onPasswordChangeComplete={() => setView({ type: 'home' })}
          onBack={() => setView({ type: 'settings' })}
        />
      );
    }

    return (
      <EditUserScreen
        user={targetUser}
        onSaveUser={handleUpdateUserProfile}
        onBack={() => setView({ type: 'users' })}
      />
    );
  }

  if (view.type === 'create') {
    return (
      <ListEditorScreen
        users={users}
        catalog={catalog}
        onCreateUser={handleCreateUser}
        onUpdateUserPassword={handleUpdateUserPassword}
        onAddCatalogProduct={handleAddCatalogProduct}
        onSaveList={handleCreateList}
        onBack={() => setView({ type: 'home' })}
      />
    );
  }

  if (view.type === 'edit') {
    const targetList = lists.find((l) => l.id === view.listId);
    if (!targetList) {
      return (
        <HomeScreen
          lists={lists}
          users={users}
          onOpenSettings={() => setView({ type: 'settings' })}
          onNewList={() => setView({ type: 'create' })}
          onOpenHistory={() => setView({ type: 'history' })}
          onStartShopping={handleStartShopping}
          onEditList={(id) => setView({ type: 'edit', listId: id })}
          onDeleteList={handleDeleteList}
          onUpdateUserPassword={handleUpdateUserPassword}
        />
      );
    }

    return (
      <ListEditorScreen
        initialList={targetList}
        users={users}
        catalog={catalog}
        onCreateUser={handleCreateUser}
        onUpdateUserPassword={handleUpdateUserPassword}
        onAddCatalogProduct={handleAddCatalogProduct}
        onSaveList={(data) => handleUpdateList(targetList.id, data)}
        onBack={() => setView({ type: 'home' })}
      />
    );
  }

  if (view.type === 'shopping') {
    const targetList = lists.find((l) => l.id === view.listId);
    if (!targetList) {
      return (
        <HomeScreen
          lists={lists}
          users={users}
          onOpenSettings={() => setView({ type: 'settings' })}
          onNewList={() => setView({ type: 'create' })}
          onOpenHistory={() => setView({ type: 'history' })}
          onStartShopping={handleStartShopping}
          onEditList={(id) => setView({ type: 'edit', listId: id })}
          onDeleteList={handleDeleteList}
          onUpdateUserPassword={handleUpdateUserPassword}
        />
      );
    }

    return (
      <ShoppingModeScreen
        list={targetList}
        onToggleLineCheck={handleToggleLineCheck}
        onFinishShopping={handleFinishShopping}
        onExitShopping={handleExitShopping}
      />
    );
  }

  if (view.type === 'history') {
    return (
      <HistoryScreen
        lists={lists}
        onDeleteList={handleDeleteList}
        onBack={() => setView({ type: 'home' })}
      />
    );
  }

  return (
    <HomeScreen
      lists={lists}
      users={users}
      onOpenSettings={() => setView({ type: 'settings' })}
      onNewList={() => setView({ type: 'create' })}
      onOpenHistory={() => setView({ type: 'history' })}
      onStartShopping={handleStartShopping}
      onEditList={(id) => setView({ type: 'edit', listId: id })}
      onDeleteList={handleDeleteList}
      onUpdateUserPassword={handleUpdateUserPassword}
    />
  );
}
