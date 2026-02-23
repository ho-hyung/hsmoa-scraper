"use client"

import { Tag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CategoryInfo {
  readonly name: string
  readonly count: number
}

interface CategoryFilterProps {
  readonly categories: readonly CategoryInfo[]
  readonly selectedCategories: ReadonlySet<string>
  readonly onToggleCategory: (category: string) => void
  readonly onSelectAll: () => void
  readonly onDeselectAll: () => void
}

export function CategoryFilter({
  categories,
  selectedCategories,
  onToggleCategory,
  onSelectAll,
  onDeselectAll,
}: CategoryFilterProps) {
  const allSelected = categories.length === selectedCategories.size
  const noneSelected = selectedCategories.size === 0
  const selectedCount = selectedCategories.size

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Tag className="h-4 w-4" />
          <span>카테고리</span>
          {!allSelected && (
            <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
              {selectedCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">
            카테고리 ({selectedCount}/{categories.length})
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={onSelectAll}
              disabled={allSelected}
            >
              전체
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={onDeselectAll}
              disabled={noneSelected}
            >
              해제
            </Button>
          </div>
        </div>
        <ScrollArea className="h-72">
          <div className="space-y-1 p-2">
            {categories.map((cat) => (
              <label
                key={cat.name}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
              >
                <Checkbox
                  checked={selectedCategories.has(cat.name)}
                  onCheckedChange={() => onToggleCategory(cat.name)}
                />
                <span className="text-sm">{cat.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {cat.count}
                </span>
              </label>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
