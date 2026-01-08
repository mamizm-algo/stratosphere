import { useState, useEffect } from "react";
import { Collection } from "@/types/collection";
import { CandleData } from "@/components/chart/MockChartDisplay";
import { SimilarPattern } from "@/components/chart/SimilarityResults";

const STORAGE_KEY = "pattern-collections";

export const useCollections = () => {
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCollections(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load collections:", e);
      }
    }
  }, []);

  const saveCollections = (newCollections: Collection[]) => {
    setCollections(newCollections);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCollections));
  };

  const addCollection = (
    name: string,
    representativeChart: CandleData[],
    results: SimilarPattern[]
  ) => {
    const newCollection: Collection = {
      name,
      representativeChart,
      results,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveCollections([...collections, newCollection]);
    return newCollection;
  };

  const updateCollection = (name: string, updates: Partial<Collection>) => {
    const updated = collections.map((c) =>
      c.name === name ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
    );
    saveCollections(updated);
  };

  const deleteCollection = (name: string) => {
    saveCollections(collections.filter((c) => c.name !== name));
  };

  const addResultToCollection = (collectionName: string, result: SimilarPattern) => {
    const collection = collections.find((c) => c.name === collectionName);
    if (!collection) return;

    const updatedResults = [...collection.results, result];
    updateCollection(collectionName, { results: updatedResults });
  };

  return {
    collections,
    addCollection,
    updateCollection,
    deleteCollection,
    addResultToCollection,
  };
};
