"use client";
import { useState, useRef, ChangeEvent, FormEvent, useEffect } from "react";
import { supabase } from '../../src/lib/supabase';
import { Panel, PanelGroup } from 'react-resizable-panels';

const TABS = [
  { key: "agenda", label: "Agenda" },
  { key: "calendar", label: "Calendar" },
  { key: "upcoming", label: "Upcoming Events" },
  { key: "past", label: "Past Events" },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const VIEW_OPTIONS = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function getToday() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth(), date: now.getDate() };
}

type Task = {
  title: string;
  date: string;
  notes: string;
  assignee: string;
  budget: string;
  tag: string;
  reminder: string;
  startTime: string;
  endTime: string;
  location: string;
  files: FileList | null;
  todoList: string[];
};

type TaskModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  date: string;
};

function TaskModal({ open, onClose, onSave, date }: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [assignee, setAssignee] = useState("");
  const [budget, setBudget] = useState("");
  const [tag, setTag] = useState("");
  const [reminder, setReminder] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [todoList, setTodoList] = useState<string[]>([]);
  const [todoInput, setTodoInput] = useState("");

  function handleAddTodo(e: FormEvent) {
    e.preventDefault();
    if (todoInput.trim()) {
      setTodoList(list => [...list, todoInput.trim()]);
      setTodoInput("");
    }
  }
  function handleRemoveTodo(idx: number) {
    setTodoList(list => list.filter((_, i) => i !== idx));
  }
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFiles(e.target.files);
  }
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title,
      date,
      notes,
      assignee,
      budget,
      tag,
      reminder,
      startTime,
      endTime,
      location,
      files,
      todoList,
    });
    setTitle(""); setNotes(""); setAssignee(""); setBudget(""); setTag(""); setReminder(""); setStartTime(""); setEndTime(""); setLocation(""); setFiles(null); setTodoList([]); setTodoInput("");
  }
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white text-gray-900 rounded-lg shadow-xl w-full max-w-lg p-6 relative overflow-y-auto max-h-[90vh]">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4">Add Itinerary Item</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-semibold">Title<span className="text-red-500">*</span></label>
            <input className="border rounded px-2 py-1 w-full" value={title} onChange={e => setTitle(e.target.value)} required maxLength={60} />
          </div>
          <div>
            <label className="block font-semibold">Date</label>
            <input className="border rounded px-2 py-1 w-full bg-gray-100" value={date} readOnly />
          </div>
          <div>
            <label className="block font-semibold">Notes</label>
            <textarea className="border rounded px-2 py-1 w-full" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          <div>
            <label className="block font-semibold">Assignee</label>
            <input className="border rounded px-2 py-1 w-full" value={assignee} onChange={e => setAssignee(e.target.value)} />
          </div>
          <div>
            <label className="block font-semibold">Budget</label>
            <input className="border rounded px-2 py-1 w-full" value={budget} onChange={e => setBudget(e.target.value)} />
          </div>
          <div>
            <label className="block font-semibold">Tag</label>
            <input className="border rounded px-2 py-1 w-full" value={tag} onChange={e => setTag(e.target.value)} />
          </div>
          <div>
            <label className="block font-semibold">Reminder</label>
            <input type="datetime-local" className="border rounded px-2 py-1 w-full bg-white text-gray-900" value={reminder} onChange={e => setReminder(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block font-semibold">Start Time</label>
              <input type="time" className="border rounded px-2 py-1 w-full" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="block font-semibold">End Time</label>
              <input type="time" className="border rounded px-2 py-1 w-full" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block font-semibold">Location</label>
            <input className="border rounded px-2 py-1 w-full" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          <div>
            <label className="block font-semibold">Attach Files</label>
            <input type="file" className="border rounded px-2 py-1 w-full" onChange={handleFileChange} multiple />
            <div className="text-xs text-gray-500 mt-1">(File upload is a placeholder, files are not saved)</div>
          </div>
          <div>
            <label className="block font-semibold">To Do List</label>
            <div className="flex gap-2 mb-2">
              <input className="border rounded px-2 py-1 flex-1" value={todoInput} onChange={e => setTodoInput(e.target.value)} placeholder="Add to-do item" />
              <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={handleAddTodo}>Add</button>
            </div>
            <ul className="space-y-1">
              {todoList.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="flex-1">{item}</span>
                  <button type="button" className="text-red-500" onClick={() => handleRemoveTodo(idx)}>Remove</button>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="px-4 py-2 bg-gray-200 rounded" onClick={onClose}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-semibold">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskDetailModal({ task, onClose }: { task: Task; onClose: () => void }) {
  if (!task) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white text-gray-900 rounded-lg shadow-xl w-full max-w-lg p-6 relative overflow-y-auto max-h-[90vh]">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4">Itinerary Item Details</h2>
        <div className="space-y-2">
          <div><span className="font-semibold">Title:</span> {task.title}</div>
          <div><span className="font-semibold">Date:</span> {task.date}</div>
          {task.notes && <div><span className="font-semibold">Notes:</span> {task.notes}</div>}
          {task.assignee && <div><span className="font-semibold">Assignee:</span> {task.assignee}</div>}
          {task.budget && <div><span className="font-semibold">Budget:</span> {task.budget}</div>}
          {task.tag && <div><span className="font-semibold">Tag:</span> {task.tag}</div>}
          {task.reminder && <div><span className="font-semibold">Reminder:</span> {task.reminder}</div>}
          {task.startTime && <div><span className="font-semibold">Start Time:</span> {task.startTime}</div>}
          {task.endTime && <div><span className="font-semibold">End Time:</span> {task.endTime}</div>}
          {task.location && <div><span className="font-semibold">Location:</span> {task.location}</div>}
          {task.todoList.length > 0 && (
            <div>
              <span className="font-semibold">To Do List:</span>
              <ul className="list-disc ml-6">
                {task.todoList.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded font-semibold" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

interface VendorData {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  type: string;
  category: string;
}

// Add event and sub-event types
interface EventData {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  type: string;
  category: string;
  participantLimit?: string;
  tags?: string;
}
interface SubEventData {
  id: string;
  parentEventId: string;
  name: string;
  date: string;
  time: string;
  location: string;
  type: string;
  category: string;
  participantLimit?: string;
  tags?: string;
}

// Update BlockTooltip to accept x/y and use position: fixed, z-index: 99999
function BlockTooltip({ item, x, y }: { item: any, x?: number, y?: number }) {
  const style: React.CSSProperties = {
    position: 'fixed',
    zIndex: 99999,
    left: x !== undefined ? x + 12 : undefined,
    top: y !== undefined ? y + 12 : undefined,
    minWidth: 180,
    maxWidth: 320,
    pointerEvents: 'none',
    background: '#111827',
    color: 'white',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    boxShadow: '0 4px 24px 0 rgba(0,0,0,0.18)',
    ...((x === undefined || y === undefined) ? { position: 'absolute', left: '100%', top: 0, zIndex: 99999 } : {}),
  };
  return (
    <div style={style} className="pointer-events-none">
      <div className="font-bold mb-1">{item.blockType === 'event' ? 'Event' : item.blockType === 'subevent' ? 'Sub-Event' : 'Vendor'}</div>
      <div><span className="font-semibold">Title:</span> {item.title}</div>
      <div><span className="font-semibold">Time:</span> {item.startTime} - {item.endTime}</div>
      {item.location && <div><span className="font-semibold">Location:</span> {item.location}</div>}
      {item.notes && <div><span className="font-semibold">Notes:</span> {item.notes}</div>}
    </div>
  );
}

// Utility to determine if a color is light or dark
function isColorDark(hex: string) {
  // Remove hash if present
  hex = hex.replace('#', '');
  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex.split('').map(x => x + x).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Perceived brightness formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
}

// SectionFilter: props = { title, items, selectedIds, onToggle, colors, onColorChange, filterSearch, showMoreLimit }
// Handles show more/less, scrollable list, and flex row for each item.
function SectionFilter({ title, items, selectedIds, onToggle, colors, onColorChange, filterSearch, showMoreLimit }: any) {
  const [showMore, setShowMore] = useState(false);

  const filteredItems = items.filter((item: any) => item.name.toLowerCase().includes(filterSearch.toLowerCase()));
  const visibleItems = showMore ? filteredItems : filteredItems.slice(0, showMoreLimit);

  return (
    <div className="flex flex-col gap-2">
      <div className="font-bold text-base mb-1">{title}</div>
      <div className="flex flex-col gap-1">
        {visibleItems.map((item: any) => (
          <div key={item.id} className="flex items-center justify-between group px-1 py-1 rounded hover:bg-gray-100 transition-colors">
            <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={e => onToggle(item.id)}
              />
              <span
                className="truncate text-sm"
                style={{ maxWidth: 140 }}
                title={item.name}
              >
                {item.name}
              </span>
            </label>
            <input
              type="color"
              value={colors[item.id] || '#cccccc'}
              onChange={e => onColorChange(item.id, e.target.value)}
              style={{ width: 24, height: 24, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4 }}
              title="Pick color"
            />
          </div>
        ))}
      </div>
      {filteredItems.length > showMoreLimit && (
        <button
          className="text-blue-500 text-xs mt-1 self-start"
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

export default function PlanningPage() {
  const [tab, setTab] = useState("agenda");
  const today = getToday();
  const [view, setView] = useState<"day" | "week" | "month" | "year">("month");
  const [current, setCurrent] = useState({ year: today.year, month: today.month });
  const [showFilters, setShowFilters] = useState(false);
  const [filterDay, setFilterDay] = useState<number | null>(null);
  const [filterMonth, setFilterMonth] = useState<number | null>(null);
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modal, setModal] = useState<{ open: boolean; date: string }>({ open: false, date: '' });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [agendaViewType, setAgendaViewType] = useState<'event' | 'vendor' | 'both'>('event');
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [agendaStartTime, setAgendaStartTime] = useState(() => {
    const stored = localStorage.getItem('agendaStartTime');
    return stored !== null ? Number(stored) : 0;
  });
  const [events, setEvents] = useState<EventData[]>([]);
  const [subEvents, setSubEvents] = useState<SubEventData[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>(
    () => {
      try {
        return JSON.parse(localStorage.getItem('selectedEventIds') || '[]');
      } catch {
        return [];
      }
    }
  );
  const [selectedSubEventIds, setSelectedSubEventIds] = useState<string[]>(
    () => {
      try {
        return JSON.parse(localStorage.getItem('selectedSubEventIds') || '[]');
      } catch {
        return [];
      }
    }
  );
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>(
    () => {
      try {
        return JSON.parse(localStorage.getItem('selectedVendorIds') || '[]');
      } catch {
        return [];
      }
    }
  );
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const [eventColors, setEventColors] = useState<{ [id: string]: string }>(() => {
    try {
      return JSON.parse(localStorage.getItem('eventColors') || '{}');
    } catch {
      return {};
    }
  });
  const [subEventColors, setSubEventColors] = useState<{ [id: string]: string }>(() => {
    try {
      return JSON.parse(localStorage.getItem('subEventColors') || '{}');
    } catch {
      return {};
    }
  });
  const [vendorColors, setVendorColors] = useState<{ [id: string]: string }>(() => {
    try {
      return JSON.parse(localStorage.getItem('vendorColors') || '{}');
    } catch {
      return {};
    }
  });
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number, y: number } | null>(null);
  const [filterSearch, setFilterSearch] = useState("");
  const [agendaViewDate, setAgendaViewDate] = useState(() => {
    const stored = localStorage.getItem('agendaViewDate');
    return stored || getTodayDateString();
  });
  const [columnsToShow, setColumnsToShow] = useState(() => {
    const stored = localStorage.getItem('columnsToShow');
    return stored ? Number(stored) : 1;
  });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInActiveMonth = getDaysInMonth(current.year, current.month);
  const yearRange = Array.from({ length: 101 }, (_, i) => today.year - 50 + i);

  // Helper to generate all 30-min time options
  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? 0 : 30;
    let hour12 = hour % 12 === 0 ? 12 : hour % 12;
    let ampm = hour < 12 ? "AM" : "PM";
    let label = `${hour12}:${minute === 0 ? "00" : "30"} ${ampm}`;
    return { value: hour * 60 + minute, label };
  });

  function handlePrev() {
    if (view === "month") {
      setCurrent(c => {
        if (c.month === 0) return { year: c.year - 1, month: 11 };
        return { year: c.year, month: c.month - 1 };
      });
    } else if (view === "year") {
      setCurrent(c => ({ year: c.year - 1, month: c.month }));
    }
  }
  function handleNext() {
    if (view === "month") {
      setCurrent(c => {
        if (c.month === 11) return { year: c.year + 1, month: 0 };
        return { year: c.year, month: c.month + 1 };
      });
    } else if (view === "year") {
      setCurrent(c => ({ year: c.year + 1, month: c.month }));
    }
  }

  function getDateString(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function renderMonthView() {
    const daysInMonth = getDaysInMonth(current.year, current.month);
    const firstDay = getFirstDayOfMonth(current.year, current.month);
    const prevMonthDays = getDaysInMonth(current.year, (current.month + 11) % 12);
    const days: { date: number, thisMonth: boolean, isToday: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: prevMonthDays - i,
        thisMonth: false,
        isToday: false,
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: d,
        thisMonth: true,
        isToday:
          d === today.date &&
          current.month === today.month &&
          current.year === today.year,
      });
    }
    while (days.length % 7 !== 0) {
      days.push({ date: days.length % 7, thisMonth: false, isToday: false });
    }
    return (
      <div className="rounded-lg bg-gray-50 p-4 shadow-inner max-w-6xl mx-auto">
        <div className="grid grid-cols-7 mb-2 text-center font-semibold text-gray-600">
          {WEEKDAYS.map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((d, i) => {
            const isFiltered =
              (filterDay ? d.date === filterDay : true) &&
              (filterMonth !== null ? current.month === filterMonth : true) &&
              (filterYear !== null ? current.year === filterYear : true) &&
              d.thisMonth;
            const dateStr = getDateString(current.year, current.month, d.date);
            const dayTasks = tasks.filter(t => t.date === dateStr);
            const dayEvents = events.filter(ev => ev.date === dateStr);
            const daySubEvents = subEvents.filter(se => se.date === dateStr);
            return (
              <div
                key={i}
                className={`relative h-32 min-w-[10rem] rounded-lg flex flex-col items-center justify-start border transition-colors shadow-sm
                  ${d.thisMonth ? "bg-white" : "bg-gray-100 text-gray-400"}
                  ${d.isToday ? "border-blue-600" : "border-gray-200"}
                  hover:shadow-md hover:z-10 group`}
                style={{ minWidth: 0 }}
              >
                <div className="flex items-center justify-between w-full px-2 pt-2">
                  <div className={`font-bold text-lg ${d.isToday ? "text-white bg-blue-600 rounded-full w-7 h-7 flex items-center justify-center" : d.thisMonth ? "text-gray-900" : "text-gray-400"}`}>{d.date}</div>
                  {d.thisMonth && (
                    <button
                      className="opacity-100 transition-opacity text-blue-500 text-xl font-bold px-1 py-0.5 rounded hover:bg-blue-100"
                      title="Add itinerary item"
                      onClick={() => setModal({ open: true, date: dateStr })}
                    >
                      +
                    </button>
                  )}
                </div>
                <div className="flex-1 w-full overflow-y-auto px-2 pb-1">
                  {/* Show events for this day */}
                  {dayEvents.map((ev, idx) => (
                    <div key={"event-" + idx} className="truncate text-xs rounded px-1 my-0.5 font-semibold bg-blue-200 text-blue-900">
                      {ev.name}
                    </div>
                  ))}
                  {/* Show tasks for this day */}
                  {dayTasks.map((t, idx) => (
                    <div key={"task-" + idx} className="truncate text-xs text-gray-700 bg-blue-50 rounded px-1 my-0.5 cursor-pointer" onClick={() => setSelectedTask(t)}>
                      {t.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderYearView() {
    return (
      <div className="grid grid-cols-3 gap-4">
        {months.map((m, idx) => (
          <div
            key={m}
            className={`rounded border p-4 text-center cursor-pointer select-none transition-colors
              ${idx === current.month ? "bg-blue-50 border-blue-600 text-blue-700" : "bg-white border-gray-200 hover:bg-blue-100"}`}
            onClick={() => {
              setCurrent(c => ({ ...c, month: idx }));
              setView("month");
            }}
          >
            {m} {current.year}
          </div>
        ))}
      </div>
    );
  }

  function renderDayView() {
    // Generate 48 intervals (30 min each)
    const intervals = Array.from({ length: 48 }, (_, i) => {
      const hour = Math.floor(i / 2);
      const minute = i % 2 === 0 ? 0 : 30;
      const date = new Date();
      date.setHours(hour, minute, 0, 0);
      // Format time label
      let hour12 = hour % 12 === 0 ? 12 : hour % 12;
      let ampm = hour < 12 ? "AM" : "PM";
      let label = `${hour12}:${minute === 0 ? "00" : "30"} ${ampm}`;
      return { label, hour, minute, index: i };
    });

    // Current time indicator
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const indicatorTop = (nowMinutes / 1440) * (48 * 48); // 48px per slot

    return (
      <div className="relative max-h-[80vh] overflow-y-auto border rounded-lg bg-white shadow-inner" style={{ minWidth: 350 }}>
        {/* Current time indicator */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${indicatorTop}px`,
            height: 0,
            borderTop: "2px solid #ef4444",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
          }}
        >
          <span style={{
            display: "inline-block",
            width: 10,
            height: 10,
            background: "#ef4444",
            borderRadius: "50%",
            marginLeft: 60,
            marginTop: -5,
          }} />
        </div>
        <div>
          {intervals.map((interval, idx) => (
            <div
              key={idx}
              className="flex items-center border-b border-gray-200 h-12 relative px-2"
              style={{ minHeight: 48 }}
            >
              <div className="w-20 text-right pr-4 text-gray-500 text-sm select-none" style={{ flexShrink: 0 }}>
                {interval.label}
              </div>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderWeekView() {
    const now = new Date(current.year, current.month, today.date);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const days: { date: number, month: number, year: number, isToday: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push({
        date: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        isToday:
          d.getDate() === today.date &&
          d.getMonth() === today.month &&
          d.getFullYear() === today.year,
      });
    }
    return (
      <div className="rounded-lg bg-gray-50 p-4 shadow-inner max-w-6xl mx-auto">
        <div className="grid grid-cols-7 mb-2 text-center font-semibold text-gray-600">
          {WEEKDAYS.map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((d, i) => (
            <div
              key={i}
              className={`relative h-32 min-w-[10rem] rounded-lg flex flex-col items-center justify-start border transition-colors shadow-sm bg-white
                ${d.isToday ? "border-blue-600" : "border-gray-200"}
                hover:shadow-md hover:z-10 group`}
              style={{ minWidth: 0 }}
            >
              <div className="flex items-center justify-between w-full px-2 pt-2">
                <div className={`font-bold text-lg ${d.isToday ? "text-white bg-blue-600 rounded-full w-7 h-7 flex items-center justify-center" : "text-gray-900"}`}>{d.date}</div>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 text-xl font-bold px-1 py-0.5 rounded hover:bg-blue-100"
                  title="Add event (coming soon)"
                  disabled
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function getVisibleTasks() {
    if (view === "month") {
      const monthStr = String(current.month + 1).padStart(2, '0');
      const yearStr = String(current.year);
      return tasks.filter(t => t.date.startsWith(`${yearStr}-${monthStr}-`));
    }
    if (view === "week") {
      const now = new Date(current.year, current.month, today.date);
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      const weekDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return getDateString(d.getFullYear(), d.getMonth(), d.getDate());
      });
      return tasks.filter(t => weekDates.includes(t.date));
    }
    if (view === "day") {
      const dateStr = getDateString(current.year, current.month, today.date);
      return tasks.filter(t => t.date === dateStr);
    }
    if (view === "year") {
      const yearStr = String(current.year);
      return tasks.filter(t => t.date.startsWith(`${yearStr}-`));
    }
    return [];
  }

  function getTodayDateString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  // Helper to get the selected date string based on view
  function getSelectedDateString() {
    if (view === "month") {
      // Use filterDay if set, otherwise today
      const day = filterDay ?? today.date;
      return getDateString(current.year, current.month, day);
    }
    if (view === "day") {
      return getDateString(current.year, current.month, today.date);
    }
    // Add logic for week/year if needed
    return getTodayDateString();
  }

  function getAgendaTimelineData() {
    // Map events and sub-events to a common shape
    const eventBlocks = events.map(ev => ({
      ...ev,
      blockType: 'event',
      startTime: (ev as any).startTime || (ev as any).start_time || (ev as any).time, // fallback for legacy
      endTime: (ev as any).endTime || (ev as any).end_time || (ev as any).time,     // fallback for legacy
      title: (ev as any).name,
      color: eventColors[ev.id] || '#3b82f6', // blue-500 default
    }));
    const subEventBlocks = subEvents.map(se => ({
      ...se,
      blockType: 'subevent',
      startTime: (se as any).startTime || (se as any).start_time || (se as any).time,
      endTime: (se as any).endTime || (se as any).end_time || (se as any).time,
      title: (se as any).name,
      color: subEventColors[se.id] || '#a21caf', // purple-700 default
    }));
    const vendorBlocks = vendors.map(v => ({
      ...v,
      blockType: 'vendor',
      startTime: (v as any).startTime || (v as any).start_time || (v as any).time,
      endTime: (v as any).endTime || (v as any).end_time || (v as any).time,
      title: (v as any).name,
      color: vendorColors[v.id] || '#059669', // green-600 default
    }));
    return [...eventBlocks, ...subEventBlocks, ...vendorBlocks];
  }

  // Fetch events, sub-events, and vendors on mount
  useEffect(() => {
    async function fetchAll() {
      const { data: eventsData } = await supabase.from('events').select('*').order('date', { ascending: true });
      if (eventsData) setEvents(eventsData);
      const { data: subEventsData } = await supabase.from('sub_events').select('*');
      if (subEventsData) setSubEvents(subEventsData.map(se => ({ ...se, parentEventId: se.parent_event_id })));
      // Vendors already fetched elsewhere, but ensure it's up to date
      const { data: vendorsData } = await supabase.from('vendors').select('*').order('date', { ascending: true });
      if (vendorsData) setVendors(vendorsData);
    }
    fetchAll();
  }, []);

  // Helper to update state and localStorage together
  function setAndPersistSelectedEventIds(ids: string[]) {
    setSelectedEventIds(ids);
    localStorage.setItem('selectedEventIds', JSON.stringify(ids));
    localStorage.setItem('eventColors', JSON.stringify(eventColors));
  }
  function setAndPersistSelectedSubEventIds(ids: string[]) {
    setSelectedSubEventIds(ids);
    localStorage.setItem('selectedSubEventIds', JSON.stringify(ids));
    localStorage.setItem('subEventColors', JSON.stringify(subEventColors));
  }
  function setAndPersistSelectedVendorIds(ids: string[]) {
    setSelectedVendorIds(ids);
    localStorage.setItem('selectedVendorIds', JSON.stringify(ids));
    localStorage.setItem('vendorColors', JSON.stringify(vendorColors));
  }

  // Close dropdown on outside click or Escape
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setFilterDropdownOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setFilterDropdownOpen(false);
    }
    if (filterDropdownOpen) {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [filterDropdownOpen]);

  // Filter agenda data by selected IDs
  function getAgendaTimelineDataFiltered(typeOverride?: 'event' | 'vendor') {
    let data = getAgendaTimelineData();
    data = data.filter(item => {
      if (item.blockType === 'event') return selectedEventIds.includes(item.id);
      if (item.blockType === 'subevent') return selectedSubEventIds.includes(item.id);
      if (item.blockType === 'vendor') return selectedVendorIds.includes(item.id);
      return false;
    });
    if (typeOverride === 'event') return data.filter(item => item.blockType === 'event' || item.blockType === 'subevent');
    if (typeOverride === 'vendor') return data.filter(item => item.blockType === 'vendor');
    return data;
  }

  // Helper to detect overlaps and assign width/offset
  function getBlockLayout(blocks: any[]): { width: string; left: number }[] {
    // Sort by start time
    const sorted = blocks.map((b: any, i: number) => ({ ...b, _origIndex: i })).sort((a: any, b: any) => {
      const [aH, aM] = a.startTime.split(":").map(Number);
      const [bH, bM] = b.startTime.split(":").map(Number);
      return (aH * 60 + aM) - (bH * 60 + bM);
    });
    const layout = Array(blocks.length).fill(null);
    for (let i = 0; i < sorted.length; i++) {
      const a: any = sorted[i];
      const [aStartH, aStartM] = a.startTime.split(":").map(Number);
      const [aEndH, aEndM] = a.endTime.split(":").map(Number);
      const aStart = aStartH * 60 + aStartM;
      const aEnd = aEndH * 60 + aEndM;
      let overlapIdx = null;
      for (let j = 0; j < i; j++) {
        const b: any = sorted[j];
        const [bStartH, bStartM] = b.startTime.split(":").map(Number);
        const [bEndH, bEndM] = b.endTime.split(":").map(Number);
        const bStart = bStartH * 60 + bStartM;
        const bEnd = bEndH * 60 + bEndM;
        // If overlap
        if (aStart < bEnd && aEnd > bStart) {
          overlapIdx = j;
          break;
        }
      }
      if (overlapIdx !== null) {
        // Overlap: both get 80% width, offset 0px and 20px
        layout[a._origIndex] = { width: '80%', left: 20 };
        layout[sorted[overlapIdx]._origIndex] = { width: '80%', left: 0 };
      } else {
        layout[a._origIndex] = { width: '100%', left: 0 };
      }
    }
    return layout;
  }

  function renderAgendaDayView(typeOverride?: 'event' | 'vendor') {
    // Generate 48 intervals (30 min each) starting from agendaStartTime
    const intervals = Array.from({ length: 48 }, (_, i) => {
      const totalMinutes = (agendaStartTime + i * 30) % 1440;
      const hour = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;
      let hour12 = hour % 12 === 0 ? 12 : hour % 12;
      let ampm = hour < 12 ? "AM" : "PM";
      let label = `${hour12}:${minute === 0 ? "00" : "30"} ${ampm}`;
      return { label, hour, minute, index: i, totalMinutes };
    });
    // Get agenda data
    const agendaData = getAgendaTimelineDataFiltered(typeOverride);
    // Find all unique dates in the filtered data, sorted
    const uniqueDates = Array.from(new Set(agendaData.map(item => item.date))).filter(Boolean).sort();
    // If no items, fallback to today
    const todayStr = getTodayDateString();
    const dateColumns = Array.from({ length: columnsToShow }, (_, i) => addDays(agendaViewDate, i));

    // Helper: get blocks for a date
    function getBlocksForDate(date: string) {
      return agendaData.filter(item => item.date === date && item.startTime && item.endTime);
    }

    // Calculate block position/height for a given block
    function getBlockPosition(item: any) {
      const [startH, startM] = item.startTime.split(":").map(Number);
      const [endH, endM] = item.endTime.split(":").map(Number);
      let itemStart = startH * 60 + startM;
      let itemEnd = endH * 60 + endM;
      const gridStart = agendaStartTime;
      const gridMinutes = 48 * 30;
      // Clamp to grid
      let blockStart = ((itemStart - gridStart + 1440) % 1440) / gridMinutes * (48 * 48);
      let blockEnd = ((itemEnd - gridStart + 1440) % 1440) / gridMinutes * (48 * 48);
      if (itemEnd <= itemStart) blockEnd = (48 * 48); // overnight
      if (blockEnd > 48 * 48) blockEnd = 48 * 48;
      if (blockStart < 0) blockStart = 0;
      const blockHeight = Math.max(blockEnd - blockStart, 16);
      return { blockStart, blockHeight };
    }

    // Determine if we are in split view (Both)
    const isSplitView = agendaViewType === 'both';

    return (
      <div className="relative max-h-[80vh] overflow-x-auto border rounded-lg bg-white shadow-inner" style={{ minWidth: 350, position: 'relative', background: '#fff' }}>
        {/* Grid lines spanning the entire itinerary (always visible) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0, // align with the very top of the block area
            height: 48 * 48,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          {intervals.map((interval, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: idx * 48 + 40, // offset for sticky headers
                height: 0,
                borderTop: '1px solid #e5e7eb',
              }}
            />
          ))}
        </div>
        <div className="flex" style={{ minWidth: 90 + dateColumns.length * (isSplitView ? 180 : 1), position: 'relative', zIndex: 2 }}>
          {/* Time grid column */}
          <div style={{ width: 90, flexShrink: 0, position: 'relative', zIndex: 2, background: '#f9fafb' }}>
            <div className="sticky top-0 bg-white z-10 font-bold text-center border-b py-2" style={{ whiteSpace: 'nowrap' }}>Time</div>
            {intervals.map((interval, idx) => (
              <div
                key={idx}
                className="flex items-center border-b border-gray-200 h-12 relative px-2"
                style={{ minHeight: 48 }}
              >
                <div
                  className="w-full text-right pr-2 text-gray-500 text-sm select-none"
                  style={{ flexShrink: 0, whiteSpace: 'nowrap', overflow: 'visible' }}
                >
                  {interval.label}
                </div>
              </div>
            ))}
          </div>
          {/* Date columns */}
          {dateColumns.map(date => (
            <div
              key={date}
              style={{ flex: 1, minWidth: 120, position: 'relative', borderLeft: '1px solid #e5e7eb', background: '#fff', zIndex: 2 }}
            >
              <div className="sticky top-0 bg-white z-10 font-bold text-center border-b py-2 border-l" style={{ borderColor: '#e5e7eb' }}>{date}</div>
              {/* Blocks for this date */}
              <div style={{ position: 'relative', height: 48 * 48, zIndex: 2, marginTop: 0 }}>
                {getBlocksForDate(date).map((item, i, arr) => {
                  const { blockStart, blockHeight } = getBlockPosition(item);
                  const isEvent = item.blockType === 'event';
                  const isSubEvent = item.blockType === 'subevent';
                  const isVendor = item.blockType === 'vendor';
                  const blockKey = item.id || `${date}-${i}`;
                  // Get layout for all blocks in this column
                  const blockLayouts = getBlockLayout(getBlocksForDate(date));
                  const { width, left } = blockLayouts[i] || { width: '100%', left: 0 };
                  const isHovered = hoveredBlockId === blockKey;
                  function handleMouseMove(e: React.MouseEvent) {
                    setTooltipPos({ x: e.clientX, y: e.clientY });
                  }
                  function handleMouseEnter() {
                    setHoveredBlockId(blockKey);
                  }
                  function handleMouseLeave() {
                    setHoveredBlockId(null);
                    setTooltipPos(null);
                  }
                  // Custom style for subevent and vendor blocks
                  if (isSubEvent) {
                    return (
                      <div
                        key={blockKey}
                        className={`absolute rounded shadow-md cursor-pointer flex items-stretch transition-all duration-150`}
                        style={{
                          top: blockStart,
                          height: blockHeight,
                          zIndex: isHovered ? 100 : 11,
                          minHeight: 32,
                          display: 'flex',
                          alignItems: 'stretch',
                          fontWeight: 500,
                          opacity: 1,
                          position: 'absolute',
                          overflow: 'visible',
                          width: `72%`,
                          left: `26%`,
                          border: '1px solid #e5e7eb',
                          boxSizing: 'border-box',
                          background: 'transparent',
                        }}
                        title={item.title}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onMouseMove={isHovered ? handleMouseMove : undefined}
                      >
                        {/* Left color bar */}
                        <div
                          style={{
                            width: '6.66%',
                            minWidth: 4,
                            maxWidth: 8,
                            background: item.color,
                            borderTopLeftRadius: 6,
                            borderBottomLeftRadius: 6,
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                            display: 'block',
                          }}
                        />
                        {/* Content area with text */}
                        <div
                          style={{
                            width: '93.34%',
                            background: '#f3f4f6',
                            borderTopRightRadius: 6,
                            borderBottomRightRadius: 6,
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                            padding: '4px 8px',
                            fontSize: isSplitView ? 13 : 15,
                            color: '#222',
                            flex: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                          }}
                        >
                          <span style={{ fontWeight: 700, fontSize: isSplitView ? 13 : 15, marginBottom: 2 }}>{item.title}</span>
                          <span style={{ fontSize: isSplitView ? 11 : 12, color: '#666' }}>Sub-event &bull; {item.startTime} - {item.endTime}{item.location ? ` @ ${item.location}` : ''}</span>
                        </div>
                      </div>
                    );
                  }
                  if (isVendor) {
                    return (
                      <div
                        key={blockKey}
                        className={`absolute left-2 right-2 rounded shadow-md cursor-pointer flex items-stretch transition-all duration-150`}
                        style={{
                          top: blockStart,
                          height: blockHeight,
                          zIndex: isHovered ? 100 : 8,
                          minHeight: 32,
                          display: 'flex',
                          alignItems: 'stretch',
                          fontWeight: 500,
                          opacity: 1,
                          position: 'absolute',
                          overflow: 'visible',
                          width,
                          left,
                          border: '1px solid #e5e7eb',
                          boxSizing: 'border-box',
                          background: 'transparent',
                        }}
                        title={item.title}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onMouseMove={isHovered ? handleMouseMove : undefined}
                      >
                        {/* Left color bar */}
                        <div
                          style={{
                            width: '6.66%',
                            minWidth: 4,
                            maxWidth: 8,
                            background: item.color,
                            borderTopLeftRadius: 6,
                            borderBottomLeftRadius: 6,
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                            display: 'block',
                          }}
                        />
                        {/* Content area with text */}
                        <div
                          style={{
                            width: '93.34%',
                            background: '#f3f4f6',
                            borderTopRightRadius: 6,
                            borderBottomRightRadius: 6,
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                            padding: '4px 8px',
                            fontSize: isSplitView ? 13 : 15,
                            color: '#222',
                            flex: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                          }}
                        >
                          <span style={{ fontWeight: 700, fontSize: isSplitView ? 13 : 15, marginBottom: 2 }}>{item.title}</span>
                          <span style={{ fontSize: isSplitView ? 11 : 12, color: '#666' }}>Vendor &bull; {item.startTime} - {item.endTime}{item.location ? ` @ ${item.location}` : ''}</span>
                        </div>
                      </div>
                    );
                  }
                  // ... existing code for event blocks ...
                  return (
                    <div
                      key={blockKey}
                      className={`absolute rounded shadow-md cursor-pointer flex items-center transition-all duration-150`}
                      style={{
                        top: blockStart,
                        height: blockHeight,
                        background: item.color,
                        zIndex: isHovered ? 100 : 10,
                        minHeight: 32,
                        display: 'flex',
                        alignItems: 'center',
                        fontWeight: 700,
                        boxShadow: '0 2px 12px 0 rgba(30,64,175,0.22)',
                        opacity: 1,
                        position: 'absolute',
                        border: '1px solid #e5e7eb',
                        boxSizing: 'border-box',
                        overflow: 'visible',
                        width: `25%`,
                        left: 0,
                        borderRadius: 6,
                        padding: 0,
                      }}
                      title={item.title}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                      onMouseMove={isHovered ? handleMouseMove : undefined}
                    >
                      {/* Content area with text */}
                      <div
                        style={{
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          justifyContent: 'center',
                          padding: '4px 8px',
                          fontSize: isSplitView ? 13 : 15,
                          color: '#222',
                          minWidth: 0,
                          overflow: 'hidden',
                          borderRadius: 6,
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: isSplitView ? 13 : 15, marginBottom: 2 }}>{item.title}</span>
                        <span style={{ fontSize: isSplitView ? 11 : 12, color: '#666' }}>Event &bull; {item.startTime} - {item.endTime}{item.location ? ` @ ${item.location}` : ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Add useEffect to persist agendaStartTime whenever it changes
  useEffect(() => {
    localStorage.setItem('agendaStartTime', String(agendaStartTime));
  }, [agendaStartTime]);

  // Helper to format date
  function formatDateString(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Helper to go to previous/next day
  function addDays(dateStr: string, days: number) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  // Persist agendaViewDate and columnsToShow to localStorage
  useEffect(() => {
    localStorage.setItem('agendaViewDate', agendaViewDate);
  }, [agendaViewDate]);
  useEffect(() => {
    localStorage.setItem('columnsToShow', String(columnsToShow));
  }, [columnsToShow]);

  return (
    <div
      style={{
        width: '100%',
        marginTop: 32,
        marginBottom: 32,
        paddingLeft: 32,
        paddingRight: 32,
        boxSizing: 'border-box',
      }}
    >
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#7c3aed', marginTop: 0, marginBottom: 8, letterSpacing: 0.2 }}>
        Plan
      </h2>
      <div className="flex gap-6 items-start">
        <div className="flex-1">
          <div className="flex gap-2 mb-6 border-b">
            {TABS.map(t => (
              <button
                key={t.key}
                className={`px-4 py-2 font-semibold border-b-2 transition-colors ${tab === t.key ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:text-blue-600"}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab === "calendar" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <button
                    className="px-2 py-1 rounded hover:bg-gray-100 border text-black bg-white"
                    onClick={handlePrev}
                    title="Previous"
                  >
                    &#8592;
                  </button>
                  <button
                    className="px-2 py-1 rounded hover:bg-gray-100 border text-black bg-white"
                    onClick={handleNext}
                    title="Next"
                  >
                    &#8594;
                  </button>
                </div>
                <div className="flex gap-2">
                  {VIEW_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      className={`px-2 py-1 rounded ${view === opt.key ? "bg-blue-600 text-white" : "bg-white text-black hover:bg-gray-100"}`}
                      onClick={() => setView(opt.key as any)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="font-bold text-lg">
                  {view === "month" && `${months[current.month]} ${current.year}`}
                  {view === "year" && current.year}
                  {view === "day" && `${months[current.month]} ${today.date}, ${current.year}`}
                  {view === "week" && `Week of ${months[current.month]} ${today.date}, ${current.year}`}
                </div>
              </div>
              <div>
                {view === "month" && renderMonthView()}
                {view === "year" && renderYearView()}
                {view === "day" && renderDayView()}
                {view === "week" && renderWeekView()}
              </div>
              <div className="mt-8">
                <div className="font-bold mb-2 text-lg">Itinerary Items for this view</div>
                <div className="space-y-1">
                  {getVisibleTasks().length === 0 && <div className="text-gray-500">No items for this view.</div>}
                  {getVisibleTasks().map((t, idx) => (
                    <div key={idx} className="bg-white rounded border px-3 py-2 flex items-center gap-2 shadow-sm cursor-pointer" onClick={() => setSelectedTask(t)}>
                      <span className="font-mono text-xs text-gray-500">{t.date}</span>
                      <span className="text-gray-800">{t.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {tab === "upcoming" && (
            <div className="space-y-2">
              <div className="font-bold mb-2 text-lg">Upcoming Events & Sub-Events (next 90 days)</div>
              {(() => {
                const now = new Date();
                const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
                const upcomingEvents = events.filter(ev => {
                  const evDate = new Date(ev.date);
                  return evDate >= now && evDate <= in90Days;
                });
                const upcomingSubEvents = subEvents.filter(se => {
                  const seDate = new Date(se.date);
                  return seDate >= now && seDate <= in90Days;
                });
                if (upcomingEvents.length === 0 && upcomingSubEvents.length === 0) {
                  return <div className="text-gray-500">No upcoming events or sub-events.</div>;
                }
                return <>
                  {upcomingEvents.map((ev, idx) => (
                    <div key={"event-"+idx} className="bg-white rounded border px-3 py-2 flex items-center gap-2 shadow-sm">
                      <span className="font-mono text-xs text-blue-700">Event</span>
                      <span className="font-mono text-xs text-gray-500">{ev.date}</span>
                      <span className="text-gray-800">{ev.name}</span>
                    </div>
                  ))}
                  {upcomingSubEvents.map((se, idx) => (
                    <div key={"subevent-"+idx} className="bg-white rounded border px-3 py-2 flex items-center gap-2 shadow-sm">
                      <span className="font-mono text-xs text-purple-700">Sub-Event</span>
                      <span className="font-mono text-xs text-gray-500">{se.date}</span>
                      <span className="text-gray-800">{se.name}</span>
                    </div>
                  ))}
                </>;
              })()}
            </div>
          )}
          {tab === "past" && (
            <div className="space-y-2">
              <div className="font-bold mb-2 text-lg">Past Events</div>
              {(() => {
                const now = new Date();
                const pastEvents = events.filter(ev => new Date(ev.date) < now);
                if (pastEvents.length === 0) {
                  return <div className="text-gray-500">No past events.</div>;
                }
                return pastEvents.map((ev, idx) => (
                  <div key={idx} className="bg-white rounded border px-3 py-2 flex items-center gap-2 shadow-sm">
                    <span className="font-mono text-xs text-blue-700">Event</span>
                    <span className="font-mono text-xs text-gray-500">{ev.date}</span>
                    <span className="text-gray-800">{ev.name}</span>
                  </div>
                ));
              })()}
            </div>
          )}
          {tab === "agenda" && (
            <div>
              <div className="flex items-center justify-between mb-4 w-full">
                {/* Centered itinerary view buttons */}
                <div className="flex-1 flex justify-center">
                  <div className="flex gap-2 ml-20">
                    <button
                      className={`px-3 py-1 rounded font-semibold border ${agendaViewType === 'event' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200'}`}
                      onClick={() => setAgendaViewType('event')}
                    >
                      Event Itinerary
                    </button>
                    <button
                      className={`px-3 py-1 rounded font-semibold border ${agendaViewType === 'vendor' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-600 border-green-200'}`}
                      onClick={() => setAgendaViewType('vendor')}
                    >
                      Vendor Itinerary
                    </button>
                    <button
                      className={`px-3 py-1 rounded font-semibold border ${agendaViewType === 'both' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-600 border-purple-200'}`}
                      onClick={() => setAgendaViewType('both')}
                    >
                      Both
                    </button>
                  </div>
                </div>
                {/* Show Filters button on the right */}
                {!showFilters && (
                  <button
                    className="ml-2 px-4 py-2 bg-blue-600 text-white rounded font-semibold shadow-lg hover:bg-blue-700 whitespace-nowrap"
                    onClick={() => setShowFilters(true)}
                  >
                    Show Filters
                  </button>
                )}
              </div>
              {['event', 'vendor', 'both'].includes(agendaViewType) && (
                <div className="sticky top-0 z-20 bg-white flex items-center justify-center gap-3 py-2 mb-2 shadow-sm rounded">
                  <button
                    className="rounded px-2 py-1 hover:bg-gray-100 text-lg"
                    onClick={() => setAgendaViewDate(addDays(agendaViewDate, -1))}
                    aria-label="Previous day"
                  >
                    &#8592;
                  </button>
                  <span className="font-bold text-base sm:text-lg px-2">
                    {columnsToShow === 1
                      ? formatDateString(addDays(agendaViewDate, 1))
                      : `${formatDateString(addDays(agendaViewDate, 1))} – ${formatDateString(addDays(agendaViewDate, columnsToShow))}`}
                  </span>
                  <button
                    className="rounded px-2 py-1 hover:bg-gray-100 text-lg"
                    onClick={() => setAgendaViewDate(addDays(agendaViewDate, 1))}
                    aria-label="Next day"
                  >
                    &#8594;
                  </button>
                  <input
                    type="date"
                    className="ml-2 border rounded px-2 py-1 text-sm"
                    value={agendaViewDate}
                    onChange={e => setAgendaViewDate(e.target.value)}
                    aria-label="Pick date"
                    style={{ maxWidth: 140 }}
                  />
                  <button
                    className="ml-2 px-2 py-1 rounded bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200"
                    onClick={() => setAgendaViewDate(getTodayDateString())}
                  >
                    Today
                  </button>
                </div>
              )}
              {agendaViewType === 'both' ? (
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column' }}>
                    <div className="font-semibold text-blue-700 mb-2 text-center">Event Itinerary</div>
                    {renderAgendaDayView('event')}
                  </div>
                  <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column' }}>
                    <div className="font-semibold text-green-700 mb-2 text-center">Vendor Itinerary</div>
                    {renderAgendaDayView('vendor')}
                  </div>
                </div>
              ) : (
                <div style={{ minWidth: 200 }}>
                  {renderAgendaDayView(agendaViewType)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {showFilters && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white border-l shadow-lg z-40 p-6 flex flex-col gap-6">
          <button
            className="absolute left-0 top-4 -translate-x-full px-3 py-1 bg-blue-600 text-white rounded-l font-semibold shadow-lg hover:bg-blue-700"
            onClick={() => setShowFilters(false)}
          >
            Hide Filters
          </button>
          {/* Modern search bar */}
          <input
            className="mb-4 px-3 py-2 rounded shadow border w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Search events, sub-events, vendors..."
            value={filterSearch}
            onChange={e => setFilterSearch(e.target.value)}
          />
          {/* Agenda Filters Card (only for agenda tab) */}
          {tab === 'agenda' && (
            <div className="bg-gray-50 rounded-xl shadow p-4 flex flex-col gap-4">
              <div className="font-bold text-lg mb-2">Agenda Filters</div>
              {/* Events Section */}
              <SectionFilter
                title="Events"
                items={events}
                selectedIds={selectedEventIds}
                onToggle={(id: any) => setAndPersistSelectedEventIds(selectedEventIds.includes(id) ? selectedEventIds.filter((eid: any) => eid !== id) : [...selectedEventIds, id])}
                colors={eventColors}
                onColorChange={(id: any, color: any) => setEventColors((c: any) => { const updated = { ...c, [id]: color }; localStorage.setItem('eventColors', JSON.stringify(updated)); return updated; })}
                filterSearch={filterSearch}
                showMoreLimit={5}
              />
              {/* Sub-Events Section */}
              <SectionFilter
                title="Sub-Events"
                items={subEvents}
                selectedIds={selectedSubEventIds}
                onToggle={(id: any) => setAndPersistSelectedSubEventIds(selectedSubEventIds.includes(id) ? selectedSubEventIds.filter((sid: any) => sid !== id) : [...selectedSubEventIds, id])}
                colors={subEventColors}
                onColorChange={(id: any, color: any) => setSubEventColors((c: any) => { const updated = { ...c, [id]: color }; localStorage.setItem('subEventColors', JSON.stringify(updated)); return updated; })}
                filterSearch={filterSearch}
                showMoreLimit={5}
              />
              {/* Vendors Section */}
              <SectionFilter
                title="Vendors"
                items={vendors}
                selectedIds={selectedVendorIds}
                onToggle={(id: any) => setAndPersistSelectedVendorIds(selectedVendorIds.includes(id) ? selectedVendorIds.filter((vid: any) => vid !== id) : [...selectedVendorIds, id])}
                colors={vendorColors}
                onColorChange={(id: any, color: any) => setVendorColors((c: any) => { const updated = { ...c, [id]: color }; localStorage.setItem('vendorColors', JSON.stringify(updated)); return updated; })}
                filterSearch={filterSearch}
                showMoreLimit={5}
              />
              {/* Start time dropdown */}
              <div className="flex gap-2 items-center mt-2">
                <span className="font-semibold text-gray-700">Start time:</span>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={agendaStartTime}
                  onChange={e => setAgendaStartTime(Number(e.target.value))}
                >
                  {timeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {/* Columns to Show dropdown */}
              <div className="flex gap-2 items-center mt-2">
                <span className="font-semibold text-gray-700">Columns to show:</span>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={columnsToShow}
                  onChange={e => setColumnsToShow(Number(e.target.value))}
                >
                  {[1,2,3,4,5,6,7].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {/* Divider */}
          <hr className="my-4" />
          {/* Calendar Filters Section (only for calendar tab) */}
          {tab === 'calendar' && (
            <div className="bg-gray-50 rounded-xl shadow p-4 flex flex-col gap-4">
              <div className="font-bold text-lg mb-2 flex items-center gap-2">📅 Calendar Filters</div>
              <div className="mb-2">
                <div className="font-semibold mb-1">Day</div>
                <select
                  className="border rounded bg-white text-black px-2 py-1 w-full"
                  value={filterDay ?? ""}
                  onChange={e => setFilterDay(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">All Days</option>
                  {Array.from({ length: daysInActiveMonth }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <div className="font-semibold mb-1">Month</div>
                <select
                  className="border rounded bg-white text-black px-2 py-1 w-full"
                  value={filterMonth ?? current.month}
                  onChange={e => setFilterMonth(Number(e.target.value))}
                >
                  {months.map((m, idx) => (
                    <option key={m} value={idx}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <div className="font-semibold mb-1">Year</div>
                <select
                  className="border rounded bg-white text-black px-2 py-1 w-full"
                  value={filterYear ?? current.year}
                  onChange={e => setFilterYear(Number(e.target.value))}
                >
                  {yearRange.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {/* Clear Filters Button */}
          <button
            className="mt-4 px-3 py-2 bg-gray-200 text-black rounded font-semibold hover:bg-gray-300 w-full"
            onClick={() => { setFilterDay(null); setFilterMonth(null); setFilterYear(null); setAndPersistSelectedEventIds([]); setAndPersistSelectedSubEventIds([]); setAndPersistSelectedVendorIds([]); }}
          >
            Clear Filters
          </button>
        </div>
      )}
      {modal.open && (
        <TaskModal
          open={modal.open}
          onClose={() => setModal({ open: false, date: '' })}
          onSave={task => {
            setTasks(tsk => [...tsk, task]);
            setModal({ open: false, date: '' });
          }}
          date={modal.date}
        />
      )}
      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}

// Define isInInterval helper if not already defined
function isInInterval(item: any, hour: number, minute: number) {
  if (!(item as any).startTime || !(item as any).endTime) return false;
  const [startH, startM] = (item as any).startTime.split(":").map(Number);
  const [endH, endM] = (item as any).endTime.split(":").map(Number);
  const start = startH * 60 + startM;
  const end = endH * 60 + endM;
  const slot = hour * 60 + minute;
  return slot >= start && slot < end;
} 