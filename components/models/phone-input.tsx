"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { COUNTRIES, flagEmoji, type Country } from "@/lib/countries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type PhoneInputProps = {
  country: Country
  onCountryChange: (c: Country) => void
  number: string
  onNumberChange: (v: string) => void
  pillClassName?: string
}

/**
 * Phone field with a searchable country/dial-code picker (search by country
 * name OR dial code) plus a number input. Flags are emoji derived from ISO2.
 */
export function PhoneInput({
  country,
  onCountryChange,
  number,
  onNumberChange,
  pillClassName,
}: PhoneInputProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "h-12 shrink-0 gap-1.5 rounded-full border-white/15 bg-white/5 px-4 text-sm text-white hover:bg-white/10 hover:text-white",
              pillClassName
            )}
          >
            <span className="text-base leading-none">
              {flagEmoji(country.iso2)}
            </span>
            <span className="tabular-nums">{country.dial}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[280px] border-white/10 bg-[#101010] p-0 text-white"
        >
          <Command className="bg-transparent [&_[cmdk-input-wrapper]]:border-white/10">
            <CommandInput
              placeholder="Search country or code…"
              className="text-white placeholder:text-white/40"
            />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {COUNTRIES.map((c) => (
                  <CommandItem
                    key={c.iso2}
                    // value is what cmdk filters on — include name + dial.
                    value={`${c.name} ${c.dial} ${c.iso2}`}
                    onSelect={() => {
                      onCountryChange(c)
                      setOpen(false)
                    }}
                    className="gap-2 text-white data-[selected=true]:bg-[#39FF14]/15 data-[selected=true]:text-white"
                  >
                    <span className="text-base leading-none">
                      {flagEmoji(c.iso2)}
                    </span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="tabular-nums text-white/50">{c.dial}</span>
                    <Check
                      className={cn(
                        "h-4 w-4 text-[#39FF14]",
                        c.iso2 === country.iso2 ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Input
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="Phone number"
        value={number}
        onChange={(e) => onNumberChange(e.target.value)}
        className={cn("flex-1", pillClassName)}
      />
    </div>
  )
}
