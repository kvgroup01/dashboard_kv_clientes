"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface CalendarRangeProps {
  className?: string;
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
}

export function CalendarRange({
  className,
  date,
  onDateChange,
}: CalendarRangeProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-100 h-9 shadow-lg",
              !date && "text-zinc-500"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-zinc-400" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd 'de' MMM", { locale: ptBR })} -{" "}
                  {format(date.to, "dd 'de' MMM", { locale: ptBR })}
                </>
              ) : (
                format(date.from, "dd 'de' MMM", { locale: ptBR })
              )
            ) : (
              <span>Selecionar período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-transparent border-none shadow-2xl" align="end" sideOffset={8}>
          <Card className="mx-auto w-fit p-0 bg-zinc-950 border-zinc-800 overflow-hidden">
            <CardContent className="p-0">
              <Calendar
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={onDateChange}
                numberOfMonths={2}
                locale={ptBR}
                disabled={(d) =>
                  d > new Date() || d < new Date("1900-01-01")
                }
                classNames={{
                  months: "flex flex-row gap-4 relative",
                }}
              />
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  )
}
