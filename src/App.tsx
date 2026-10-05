import { useState, useEffect, useCallback } from 'react';
import { ScreenView, ShoppingLine, ShoppingList } from './types';
import {
  addProductToCatalog,
  generateId,
  getInitialTheme,
  loadCatalog,
  loadLists,
  saveCatalog,
  saveLists,
  saveThemePreference,
  ThemeMode,
} from './utils/storage';
import {
  isSupabaseConfigured,
  fetchAllDataFromSupabase,
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

export default function App() {
  const [lists, setLists] = useState<ShoppingList[]>(() => loadLists());
  const [catalog, setCatalog] = useState<string[]>(() => loadCatalog());
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());
  const [view, setView] = useState<ScreenView>({ type: 'home' });

  // Si Supabase está configurado, cargamos las listas y el catálogo desde la base de datos al iniciar
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    fetchAllDataFromSupabase()
      .then(({ lists: remoteLists, catalog: remoteCatalog }) => {
        setLists(remoteLists);
        setCatalog((prev) => {
          let merged = [...prev];
          for (const item of remoteCatalog) {
            merged = addProductToCatalog(merged, item);
          }
          return merged;
        });
      })
      .catch((err) => {
        console.error('Error al cargar datos desde Supabase:', err);
      });
  }, []);

  // Persistir listas en localStorage como copia local inmediata
  useEffect(() => {
    saveLists(lists);
  }, [lists]);

  // Persistir catálogo de productos en localStorage
  useEffect(() => {
    saveCatalog(catalog);
  }, [catalog]);

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

  const handleAddCatalogProduct = useCallback((productName: string) => {
    setCatalog((prev) => addProductToCatalog(prev, productName));
    if (isSupabaseConfigured) {
      insertCatalogProductInSupabase(productName).catch((err) =>
        console.error('Error guardando producto en catálogo Supabase:', err)
      );
    }
  }, []);

  const handleCreateList = useCallback(
    (data: { nombre: string; fechaCompra: string; lineas: ShoppingLine[] }) => {
      const newList: ShoppingList = {
        id: generateId(),
        nombre: data.nombre,
        fechaCompra: data.fechaCompra,
        estado: 'pendiente',
        lineas: data.lineas,
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
      data: { nombre: string; fechaCompra: string; lineas: ShoppingLine[] }
    ) => {
      setLists((prev) =>
        prev.map((item) =>
          item.id === listId
            ? {
                ...item,
                nombre: data.nombre,
                fechaCompra: data.fechaCompra,
                lineas: data.lineas,
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

  if (view.type === 'create') {
    return (
      <ListEditorScreen
        catalog={catalog}
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
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onNewList={() => setView({ type: 'create' })}
          onOpenHistory={() => setView({ type: 'history' })}
          onStartShopping={handleStartShopping}
          onEditList={(id) => setView({ type: 'edit', listId: id })}
          onDeleteList={handleDeleteList}
        />
      );
    }

    return (
      <ListEditorScreen
        initialList={targetList}
        catalog={catalog}
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
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onNewList={() => setView({ type: 'create' })}
          onOpenHistory={() => setView({ type: 'history' })}
          onStartShopping={handleStartShopping}
          onEditList={(id) => setView({ type: 'edit', listId: id })}
          onDeleteList={handleDeleteList}
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
      theme={theme}
      onToggleTheme={handleToggleTheme}
      onNewList={() => setView({ type: 'create' })}
      onOpenHistory={() => setView({ type: 'history' })}
      onStartShopping={handleStartShopping}
      onEditList={(id) => setView({ type: 'edit', listId: id })}
      onDeleteList={handleDeleteList}
    />
  );
}
