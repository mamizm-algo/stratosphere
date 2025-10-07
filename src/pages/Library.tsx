import { useState, useMemo } from "react";
import { ChartHeader } from "@/components/chart/ChartHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookmarkCheck,
  Search,
  ArrowUpDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useCollections } from "@/hooks/useCollections";
import { CollectionCard } from "@/components/library/CollectionCard";
import { CollectionDetail } from "@/components/library/CollectionDetail";
import { Collection } from "@/types/collection";

const Library = () => {
  const { collections, deleteCollection } = useCollections();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "date-newest" | "date-oldest">("date-newest");

  const filteredAndSortedCollections = useMemo(() => {
    let filtered = collections.filter((collection) => {
      const matchesSearch =
        collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        new Date(collection.createdAt).toLocaleDateString().includes(searchQuery);
      return matchesSearch;
    });

    // Sort collections
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "date-newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date-oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

    return sorted;
  }, [collections, searchQuery, sortBy]);

  const handleDelete = (id: string) => {
    deleteCollection(id);
    toast.success("Collection removed from library");
  };

  const handleOpenCollection = (collection: Collection) => {
    setSelectedCollection(collection);
  };

  if (selectedCollection) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <ChartHeader />
        <div className="flex-1 overflow-hidden">
          <CollectionDetail
            collection={selectedCollection}
            onBack={() => setSelectedCollection(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <ChartHeader />

      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Pattern Library
              </h1>
              <p className="text-muted-foreground">
                Your saved trading patterns and similar situations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <BookmarkCheck className="w-8 h-8 text-primary" />
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {collections.length} Collections
              </Badge>
            </div>
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search collections by name or date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 min-w-[200px]">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-newest">Newest First</SelectItem>
                  <SelectItem value="date-oldest">Oldest First</SelectItem>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Collections Grid */}
          {filteredAndSortedCollections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <BookmarkCheck className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No collections found
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Save similarity search results as collections to build your library"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedCollections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  onOpen={handleOpenCollection}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default Library;
