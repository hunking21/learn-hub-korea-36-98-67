import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EnhancedDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function EnhancedDatePicker({
  value,
  onChange,
  placeholder = "생년월일 선택",
  disabled,
  className
}: EnhancedDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [textInput, setTextInput] = React.useState(
    value ? format(value, "yyyy-MM-dd") : ""
  );
  const [year, setYear] = React.useState<string>(
    value ? value.getFullYear().toString() : ""
  );
  const [month, setMonth] = React.useState<string>(
    value ? (value.getMonth() + 1).toString() : ""
  );
  const [day, setDay] = React.useState<string>(
    value ? value.getDate().toString() : ""
  );

  // Update internal state when value changes
  React.useEffect(() => {
    if (value) {
      setTextInput(format(value, "yyyy-MM-dd"));
      setYear(value.getFullYear().toString());
      setMonth((value.getMonth() + 1).toString());
      setDay(value.getDate().toString());
    } else {
      setTextInput("");
      setYear("");
      setMonth("");
      setDay("");
    }
  }, [value]);

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow only digits and hyphens, format as YYYY-MM-DD
    let formatted = inputValue.replace(/[^\d-]/g, '');
    
    // Add hyphens automatically
    if (formatted.length >= 4 && formatted.charAt(4) !== '-') {
      formatted = formatted.slice(0, 4) + '-' + formatted.slice(4);
    }
    if (formatted.length >= 7 && formatted.charAt(7) !== '-') {
      formatted = formatted.slice(0, 7) + '-' + formatted.slice(7);
    }
    
    // Limit to YYYY-MM-DD format
    if (formatted.length > 10) {
      formatted = formatted.slice(0, 10);
    }
    
    setTextInput(formatted);
    
    // Try to parse as date if it looks complete
    if (formatted.length === 10 && formatted.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parsedDate = new Date(formatted);
      if (!isNaN(parsedDate.getTime()) && parsedDate >= new Date('1900-01-01') && parsedDate <= new Date()) {
        onChange(parsedDate);
      }
    }
  };

  const handleDropdownChange = () => {
    if (year && month && day) {
      const selectedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(selectedDate.getTime()) && selectedDate >= new Date('1900-01-01') && selectedDate <= new Date()) {
        onChange(selectedDate);
        setOpen(false);
      }
    }
  };

  React.useEffect(() => {
    handleDropdownChange();
  }, [year, month, day]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };
  
  const days = year && month 
    ? Array.from({ length: getDaysInMonth(parseInt(year), parseInt(month)) }, (_, i) => i + 1)
    : Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Direct text input */}
      <Input
        type="text"
        value={textInput}
        onChange={handleTextInputChange}
        placeholder="YYYY-MM-DD 직접 입력"
        disabled={disabled}
        className="font-mono"
      />
      
      {/* Calendar and dropdown picker */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "yyyy년 MM월 dd일") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Tabs defaultValue="dropdown" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dropdown">드롭다운 선택</TabsTrigger>
              <TabsTrigger value="calendar">달력 선택</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dropdown" className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="연도" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      {years.map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Select value={month} onValueChange={setMonth} disabled={!year}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="월" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m} value={m.toString()}>
                          {m}월
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Select value={day} onValueChange={setDay} disabled={!year || !month}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="일" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      {days.map((d) => (
                        <SelectItem key={d} value={d.toString()}>
                          {d}일
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="calendar" className="p-0">
              <Calendar
                mode="single"
                selected={value}
                onSelect={(date) => {
                  onChange(date);
                  setOpen(false);
                }}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
}