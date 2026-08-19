"use client";

import { uid } from "@/lib/ids";
import { formatMoney, lineAmount } from "@/lib/money";
import type { Country, LineItem, LineKind } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "./Button";
import { Input, Select } from "./Field";

export function LineItemsEditor({
  items,
  country,
  onChange,
}: {
  items: LineItem[];
  country: Country;
  onChange: (items: LineItem[]) => void;
}) {
  function update(id: string, patch: Partial<LineItem>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-line bg-card p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <Select
              value={item.kind}
              onChange={(event) => update(item.id, { kind: event.target.value as LineKind })}
              className="max-w-40 py-1.5 text-xs"
            >
              <option value="labour">Labour</option>
              <option value="materials">Materials</option>
              <option value="other">Other</option>
            </Select>
            <button
              type="button"
              className="text-steel hover:text-red-700"
              onClick={() => onChange(items.filter((row) => row.id !== item.id))}
              aria-label="Remove line"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <Input
            value={item.description}
            onChange={(event) => update(item.id, { description: event.target.value })}
            className="mb-2"
          />
          <div className="grid grid-cols-3 gap-2">
            <Input
              type="number"
              min={0}
              step={0.1}
              value={item.quantity}
              onChange={(event) => update(item.id, { quantity: Number(event.target.value) })}
            />
            <Input
              value={item.unit}
              onChange={(event) => update(item.id, { unit: event.target.value })}
              placeholder="hour / m / lot"
            />
            <Input
              type="number"
              min={0}
              step={0.01}
              value={item.unitPrice}
              onChange={(event) => update(item.id, { unitPrice: Number(event.target.value) })}
            />
          </div>
          <p className="mt-2 text-right text-sm font-semibold">
            {formatMoney(lineAmount(item), country)}
          </p>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() =>
          onChange([
            ...items,
            {
              id: uid("li"),
              kind: "labour",
              description: "",
              quantity: 1,
              unit: "hour",
              unitPrice: 0,
            },
          ])
        }
      >
        <Plus className="h-4 w-4" /> Add labour or materials
      </Button>
    </div>
  );
}
