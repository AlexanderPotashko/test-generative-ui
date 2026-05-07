"use client";

import type { PageConfig, Widget, WidgetType } from "@/types/page-config";
import { create } from "zustand";

interface PageStore {
  pages: Record<string, PageConfig>;
  activePageId: string | null;

  // Page actions
  setPages: (pages: PageConfig[]) => void;
  setActivePage: (pageId: string) => void;
  addPage: (page: PageConfig) => void;
  removePage: (pageId: string) => void;
  updatePageTitle: (pageId: string, title: string) => void;

  // Widget actions (called by AI tool invocations)
  addWidget: (pageId: string, widget: Omit<Widget, "id">) => Widget;
  clearWidgets: (pageId: string) => void;
  setPageConfig: (config: PageConfig) => void;

  // Filters (shared across widgets on same page)
  filters: Record<string, Record<string, string>>; // pageId → { field: value }
  setFilter: (pageId: string, field: string, value: string) => void;
  clearFilters: (pageId: string) => void;
}

export const usePageStore = create<PageStore>((set, get) => ({
  pages: {},
  activePageId: null,
  filters: {},

  setPages: (pagesList) => {
    const pagesMap: Record<string, PageConfig> = {};
    for (const p of pagesList) pagesMap[p.pageId] = p;
    set({ pages: pagesMap });
  },

  setActivePage: (pageId) => set({ activePageId: pageId }),

  addPage: (page) =>
    set((s) => ({ pages: { ...s.pages, [page.pageId]: page } })),

  removePage: (pageId) =>
    set((s) => {
      const next = { ...s.pages };
      delete next[pageId];
      const ids = Object.keys(next);
      return { pages: next, activePageId: ids[0] ?? null };
    }),

  updatePageTitle: (pageId, title) =>
    set((s) => ({
      pages: {
        ...s.pages,
        [pageId]: { ...s.pages[pageId], title },
      },
    })),

  addWidget: (pageId, widgetDef) => {
    const uuid = globalThis.crypto?.randomUUID?.() ??
      ([1e7,-1e3,-4e3,-8e3,-1e11] as number[]).join('').replace(/[018]/g, (c) =>
        (parseInt(c) ^ (Math.random() * 16 >> parseInt(c) / 4)).toString(16));
    const widget: Widget = { ...widgetDef, id: uuid };
    set((s) => {
      const page = s.pages[pageId];
      if (!page) return s;
      return {
        pages: {
          ...s.pages,
          [pageId]: { ...page, widgets: [...(page.widgets ?? []), widget] },
        },
      };
    });
    return widget;
  },

  clearWidgets: (pageId) =>
    set((s) => {
      const page = s.pages[pageId];
      if (!page) return s;
      return {
        pages: {
          ...s.pages,
          [pageId]: { ...page, widgets: [] },
        },
      };
    }),

  setPageConfig: (config) =>
    set((s) => ({
      pages: { ...s.pages, [config.pageId]: config },
    })),

  setFilter: (pageId, field, value) =>
    set((s) => ({
      filters: {
        ...s.filters,
        [pageId]: { ...(s.filters[pageId] ?? {}), [field]: value },
      },
    })),

  clearFilters: (pageId) =>
    set((s) => {
      const next = { ...s.filters };
      delete next[pageId];
      return { filters: next };
    }),
}));
