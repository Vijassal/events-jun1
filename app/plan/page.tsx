"use client";
import { useState, useRef, ChangeEvent, FormEvent, useEffect } from "react";
import { supabase } from '../../src/lib/supabase';
import TopToolbar from '../../src/components/TopToolbar';

const LOCAL_STORAGE_KEY = 'planPageSettings';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-4">
      <div className="bg-white text-gray-900 rounded-lg shadow-xl w-full max-w-lg max-h-[95vh] relative overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold">Add Itinerary Item</h2>
          <button className="text-gray-400 hover:text-gray-700 text-2xl" onClick={onClose}>&times;</button>
        </div>
        <div className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-semibold text-sm sm:text-base">Title<span className="text-red-500">*</span></label>
              <input className="border rounded px-3 py-2 w-full text-sm sm:text-base" value={title} onChange={e => setTitle(e.target.value)} required maxLength={60} />
            </div>
            <div>
              <label className="block font-semibold text-sm sm:text-base">Date</label>
              <input className="border rounded px-3 py-2 w-full bg-gray-100 text-sm sm:text-base" value={date} readOnly />
            </div>
            <div>
              <label className="block font-semibold text-sm sm:text-base">Notes</label>
              <textarea className="border rounded px-3 py-2 w-full text-sm sm:text-base" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
            </div>
            <div>
              <label className="block font-semibold text-sm sm:text-base">Assignee</label>
              <input className="border rounded px-3 py-2 w-full text-sm sm:text-base" value={assignee} onChange={e => setAssignee(e.target.value)} />
            </div>
            <div>
              <label className="block font-semibold text-sm sm:text-base">Budget</label>
              <input className="border rounded px-3 py-2 w-full text-sm sm:text-base" value={budget} onChange={e => setBudget(e.target.value)} />
            </div>
            <div>
              <label className="block font-semibold text-sm sm:text-base">Tag</label>
              <input className="border rounded px-3 py-2 w-full text-sm sm:text-base" value={tag} onChange={e => setTag(e.target.value)} />
            </div>
            <div>
              <label className="block font-semibold text-sm sm:text-base">Reminder</label>
              <input type="datetime-local" className="border rounded px-3 py-2 w-full bg-white text-gray-900 text-sm sm:text-base" value={reminder} onChange={e => setReminder(e.target.value)} />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <label className="block font-semibold text-sm sm:text-base">Start Time</label>
                <input type="time" className="border rounded px-3 py-2 w-full text-sm sm:text-base" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="block font-semibold text-sm sm:text-base">End Time</label>
                <input type="time" className="border rounded px-3 py-2 w-full text-sm sm:text-base" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-sm sm:text-base">Location</label>
              <input className="border rounded px-3 py-2 w-full text-sm sm:text-base" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div>
              <label className="block font-semibold text-sm sm:text-base">Attach Files</label>
              <input type="file" className="border rounded px-3 py-2 w-full text-sm sm:text-base" onChange={handleFileChange} multiple />
              <div className="text-xs text-gray-500 mt-1">(File upload is a placeholder, files are not saved)</div>
            </div>
            <div>
              <label className="block font-semibold text-sm sm:text-base">To Do List</label>
              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <input className="border rounded px-3 py-2 flex-1 text-sm sm:text-base" value={todoInput} onChange={e => setTodoInput(e.target.value)} placeholder="Add to-do item" />
                <button className="px-3 py-2 bg-blue-600 text-white rounded text-sm sm:text-base" onClick={handleAddTodo}>Add</button>
              </div>
              <ul className="space-y-1">
                {todoList.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="flex-1 text-sm sm:text-base">{item}</span>
                    <button type="button" className="text-red-500 text-sm sm:text-base" onClick={() => handleRemoveTodo(idx)}>Remove</button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6 pt-4 border-t">
              <button type="button" className="px-4 py-2 bg-gray-200 rounded text-sm sm:text-base" onClick={onClose}>Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-semibold text-sm sm:text-base">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function TaskDetailModal({ task, onClose }: { task: Task; onClose: () => void }) {
  if (!task) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-4">
      <div className="bg-white text-gray-900 rounded-lg shadow-xl w-full max-w-lg max-h-[95vh] relative overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold">Itinerary Item Details</h2>
          <button className="text-gray-400 hover:text-gray-700 text-2xl" onClick={onClose}>&times;</button>
        </div>
        <div className="p-4 sm:p-6">
          <div className="space-y-3">
            <div><span className="font-semibold text-sm sm:text-base">Title:</span> <span className="text-sm sm:text-base">{task.title}</span></div>
            <div><span className="font-semibold text-sm sm:text-base">Date:</span> <span className="text-sm sm:text-base">{task.date}</span></div>
            {task.notes && <div><span className="font-semibold text-sm sm:text-base">Notes:</span> <span className="text-sm sm:text-base">{task.notes}</span></div>}
            {task.assignee && <div><span className="font-semibold text-sm sm:text-base">Assignee:</span> <span className="text-sm sm:text-base">{task.assignee}</span></div>}
            {task.budget && <div><span className="font-semibold text-sm sm:text-base">Budget:</span> <span className="text-sm sm:text-base">{task.budget}</span></div>}
            {task.tag && <div><span className="font-semibold text-sm sm:text-base">Tag:</span> <span className="text-sm sm:text-base">{task.tag}</span></div>}
            {task.reminder && <div><span className="font-semibold text-sm sm:text-base">Reminder:</span> <span className="text-sm sm:text-base">{task.reminder}</span></div>}
            {task.startTime && <div><span className="font-semibold text-sm sm:text-base">Start Time:</span> <span className="text-sm sm:text-base">{task.startTime}</span></div>}
            {task.endTime && <div><span className="font-semibold text-sm sm:text-base">End Time:</span> <span className="text-sm sm:text-base">{task.endTime}</span></div>}
            {task.location && <div><span className="font-semibold text-sm sm:text-base">Location:</span> <span className="text-sm sm:text-base">{task.location}</span></div>}
            {task.todoList.length > 0 && (
              <div>
                <span className="font-semibold text-sm sm:text-base">To Do List:</span>
                <ul className="list-disc ml-6 mt-1">
                  {task.todoList.map((item, idx) => <li key={idx} className="text-sm sm:text-base">{item}</li>)}
                </ul>
              </div>
            )}
          </div>
          <div className="flex justify-end mt-6 pt-4 border-t">
            <button className="px-4 py-2 bg-blue-600 text-white rounded font-semibold text-sm sm:text-base" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface VendorData {
  id: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  type: string;
  category: string;
  account_instance_id?: string;
}

interface EventData {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: string;
  category: string;
  participantLimit?: string;
  tags?: string;
  account_instance_id?: string;
}

interface SubEventData {
  id: string;
  parent_event_id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: string;
  category: string;
  participantLimit?: string;
  tags?: string;
  account_instance_id?: string;
}

// Modern BlockTooltip component
function BlockTooltip({ item, x, y }: { item: any, x?: number, y?: number }) {
  if (!item) return null;
  
  const style: React.CSSProperties = {
    position: 'fixed',
    zIndex: 99999,
    left: x ? x + 10 : '50%',
    top: y ? y - 10 : '50%',
    transform: x && y ? 'none' : 'translate(-50%, -100%)',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
    maxWidth: '300px',
    fontSize: '14px',
    lineHeight: '1.4',
  };

  return (
    <div style={style} className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
      <div className="font-semibold text-gray-900 mb-1">{item.title}</div>
      <div className="text-sm text-gray-600 mb-2">
        {item.startTime} - {item.endTime}
        {item.location && ` • ${item.location}`}
      </div>
      <div className="flex items-center gap-2">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: item.color || '#3b82f6' }}
        />
        <span className="text-xs text-gray-500 capitalize">
          {item.blockType === 'event' ? 'Event' : 
           item.blockType === 'subevent' ? 'Sub-Event' : 
           item.blockType === 'vendor' ? 'Vendor' : 'Item'}
        </span>
      </div>
    </div>
  );
}

function isColorDark(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
}

// Modern SectionFilter component
function SectionFilter({ title, items, selectedIds, onToggle, colors, onColorChange, filterSearch, showMoreLimit }: any) {
  const [showMore, setShowMore] = useState(false);
  const filteredItems = items.filter((item: any) => 
    item.name.toLowerCase().includes(filterSearch.toLowerCase())
  );
  const displayItems = showMore ? filteredItems : filteredItems.slice(0, showMoreLimit);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
        {title} ({filteredItems.length})
      </h3>
      <div className="space-y-2">
        {displayItems.map((item: any) => (
          <div key={item.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedIds.includes(item.id)}
              onChange={() => onToggle(item.id)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <input
              type="color"
              value={colors[item.id] || '#3b82f6'}
              onChange={(e) => onColorChange(item.id, e.target.value)}
              className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
            />
            <span className="text-sm text-gray-700 flex-1 truncate">{item.name}</span>
          </div>
        ))}
      </div>
      {filteredItems.length > showMoreLimit && (
        <button
          onClick={() => setShowMore(!showMore)}
          className="text-blue-600 text-sm hover:text-blue-800 mt-2"
        >
          {showMore ? 'Show Less' : `Show ${filteredItems.length - showMoreLimit} More`}
        </button>
      )}
    </div>
  );
}

function EventFilterGroup({
  events,
  subEvents,
  selectedEventIds,
  onToggleEvent,
  eventColors,
  onEventColorChange,
  selectedSubEventIds,
  onToggleSubEvent,
  subEventColors,
  onSubEventColorChange,
  filterSearch,
}: any) {
  const [openEventIds, setOpenEventIds] = useState<string[]>([]);

  const toggleEventCollapse = (eventId: string) => {
    setOpenEventIds(ids =>
      ids.includes(eventId) ? ids.filter(id => id !== eventId) : [...ids, eventId]
    );
  };

  const filteredEvents = events.filter((event: any) =>
    event.name.toLowerCase().includes(filterSearch.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
        Events & Sub-Events ({filteredEvents.length})
      </h3>
      <div className="space-y-3">
        {filteredEvents.map((event: any) => {
          const eventSubEvents = subEvents.filter((se: any) => se.parent_event_id === event.id);
          const isOpen = openEventIds.includes(event.id);

          return (
            <div key={event.id}>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedEventIds.includes(event.id)}
                  onChange={() => onToggleEvent(event.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <input
                  type="color"
                  value={eventColors[event.id] || '#3b82f6'}
                  onChange={(e) => onEventColorChange(event.id, e.target.value)}
                  className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
                />
                <span className="text-sm text-gray-700 flex-1 truncate">{event.name}</span>
                {eventSubEvents.length > 0 && (
                  <button
                    onClick={() => toggleEventCollapse(event.id)}
                    className="p-1 rounded-full hover:bg-gray-100"
                    aria-label={isOpen ? "Collapse" : "Expand"}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>
              {isOpen && eventSubEvents.length > 0 && (
                <div className="ml-8 mt-2 space-y-2 pl-4 border-l-2 border-gray-200">
                  {eventSubEvents.map((subEvent: any) => (
                    <div key={subEvent.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedSubEventIds.includes(subEvent.id)}
                        onChange={() => onToggleSubEvent(subEvent.id)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <input
                        type="color"
                        value={subEventColors[subEvent.id] || '#8b5cf6'}
                        onChange={(e) => onSubEventColorChange(subEvent.id, e.target.value)}
                        className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
                      />
                      <span className="text-sm text-gray-600 flex-1 truncate">{subEvent.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Moved helper function out of the component
function getDaysInRange(start: string, end: string) {
    const days = [];
    let currentDate = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');
    while (currentDate <= endDate) {
        days.push(currentDate.toISOString().slice(0, 10));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
};

// Moved ItineraryPanel out of ItineraryView to be a standalone component
const ItineraryPanel = ({ 
  itemType, 
  scrollRef, 
  onScroll,
  visibleDays,
  getTodayDateString,
  timeLabels,
  getItemsForDay,
  currentTime,
  eventColors,
  subEventColors,
  vendorColors,
  isColorDark,
  setHoveredBlockId,
  setTooltipPos,
  setSelectedTask
}: { 
  itemType: 'event' | 'vendor', 
  scrollRef: React.RefObject<HTMLDivElement>, 
  onScroll: () => void,
  visibleDays: string[],
  getTodayDateString: () => string,
  timeLabels: string[],
  getItemsForDay: (day: string, itemType: 'event' | 'vendor') => any[],
  currentTime: Date,
  eventColors: Record<string, string>,
  subEventColors: Record<string, string>,
  vendorColors: Record<string, string>,
  isColorDark: (hex: string) => boolean,
  setHoveredBlockId: (id: string | null) => void,
  setTooltipPos: (pos: { x: number; y: number } | null) => void,
  setSelectedTask: (task: any) => void
}) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex sticky top-0 z-20 bg-white border-b border-gray-300 flex-shrink-0">
        <div className="w-20 flex-shrink-0 border-r border-gray-300" />
        <div className="flex-1 flex">
          {visibleDays.map(day => {
            const isToday = day === getTodayDateString();
            return (
              <div key={`${itemType}-header-${day}`} className="flex-1 min-w-[200px] border-l border-gray-300 text-center py-2">
                <div className="text-sm text-gray-500">{new Date(day + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })}</div>
                <div className={`text-2xl font-bold ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>{new Date(day + 'T00:00:00').getDate()}</div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Scrolling Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide" ref={scrollRef} onScroll={onScroll}>
        <div className="flex relative pb-8" style={{ height: '1920px' }}>
          {/* Time Gutter */}
          <div className="w-20 flex-shrink-0 text-right text-xs text-gray-400 select-none pt-4 sticky left-0 bg-white z-10 border-r border-gray-300">
            {timeLabels.map(label => (
              <div key={label} className="relative h-[80px]">
                <span className="absolute -top-2 right-2">{label}</span>
              </div>
            ))}
          </div>
          {/* Day Columns */}
          <div className="flex-1 flex">
            {visibleDays.map(day => {
              const isToday = day === getTodayDateString();
              const itemsForDay = getItemsForDay(day, itemType);
              return (
                <div key={`${itemType}-col-${day}`} className="flex-1 min-w-[200px] border-l border-gray-300 relative">
                  <div className="absolute inset-0 z-0">
                    {timeLabels.map((_, i) => (
                      <div key={i} className="h-[80px] border-t border-gray-300"></div>
                    ))}
                  </div>
                  {isToday && <div className="absolute inset-0 bg-blue-50 opacity-50 z-0"></div>}
                  {isToday && (
                    <div className="absolute w-full flex items-center z-10" style={{ top: `${(currentTime.getHours() * 60 + currentTime.getMinutes()) / 1440 * 1920}px` }}>
                      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 z-10"></div>
                      <div className="flex-grow h-0.5 bg-red-500"></div>
                    </div>
                  )}
                  <div className="absolute inset-0 z-10">
                    {itemsForDay.map((item: any) => {
                      const width = 100 / item.numCols;
                      const left = item.colIndex * width;
                      const top = (item.relativeStartMinutes / 1440) * 1920;
                      const height = (item.duration / 1440) * 1920;
                      const isSmall = height < 40;
                      const isTiny = height < 25;
                      const getTypeIcon = () => {
                        switch (item.blockType) {
                          case 'event': return '🎉';
                          case 'subevent': return '📅';
                          case 'vendor': return '👥';
                          default: return '📋';
                        }
                      };
                      const getColor = () => {
                        const id = item.id.split('-').slice(1).join('-');
                        if (item.blockType === 'event') return eventColors[id] || '#3B82F6';
                        if (item.blockType === 'subevent') return subEventColors[id] || '#10B981';
                        if (item.blockType === 'vendor') return vendorColors[id] || '#F59E0B';
                        return '#6B7280';
                      };
                      const color = getColor();
                      const isDarkColor = isColorDark(color);
                      return (
                        <div
                          key={item.id}
                          className="absolute rounded-lg shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] border border-white/20 p-1"
                          style={{ top: `${top}px`, left: `${left}%`, width: `${width}%`, height: `${height}px`, backgroundColor: color, color: isDarkColor ? 'white' : 'black' }}
                          onMouseEnter={(e) => { setHoveredBlockId(item.id); setTooltipPos({ x: e.clientX, y: e.clientY }); }}
                          onMouseLeave={() => { setHoveredBlockId(null); setTooltipPos(null); }}
                          onClick={() => setSelectedTask(item)}
                        >
                          <div className="h-full flex flex-col">
                            <div className="flex items-start gap-1 flex-shrink-0">
                              <span className="text-xs">{getTypeIcon()}</span>
                              {!isTiny && <span className="text-xs font-medium truncate flex-1">{item.name}</span>}
                            </div>
                            {!isSmall && (
                              <>
                                <div className="text-xs opacity-90 mt-1">{item.startTime} - {item.endTime}</div>
                                {item.location && !isTiny && <div className="text-xs opacity-75 truncate mt-1">📍 {item.location}</div>}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Modern day view component - moved out of PlanPage
const ItineraryView = ({ 
  type, 
  agendaStartTime,
  dateRange,
  getFilteredItems,
  eventColors,
  subEventColors,
  vendorColors,
  setHoveredBlockId,
  setTooltipPos,
  setSelectedTask
}: { 
  type: 'event' | 'vendor' | 'both', 
  agendaStartTime: number,
  dateRange: { from: string, to: string },
  getFilteredItems: (itemType: 'event' | 'vendor') => any[],
  eventColors: Record<string, string>,
  subEventColors: Record<string, string>,
  vendorColors: Record<string, string>,
  setHoveredBlockId: (id: string | null) => void,
  setTooltipPos: (pos: { x: number, y: number } | null) => void,
  setSelectedTask: (task: any) => void
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const eventScrollRef = useRef<HTMLDivElement>(null);
  const vendorScrollRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = (scroller: 'event' | 'vendor') => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    const sourceRef = scroller === 'event' ? eventScrollRef : vendorScrollRef;
    const targetRef = scroller === 'event' ? vendorScrollRef : eventScrollRef;

    if (sourceRef.current && targetRef.current && Math.abs(sourceRef.current.scrollTop - targetRef.current.scrollTop) > 1) {
      targetRef.current.scrollTop = sourceRef.current.scrollTop;
    }
    
    scrollTimeout.current = setTimeout(() => {
      // Clear timeout after a short delay
    }, 50); 
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // agendaStartTime is in minutes. Each hour is 80px high.
    const hour = agendaStartTime / 60;
    const initialScrollTop = hour * 80;

    if (eventScrollRef.current) {
      eventScrollRef.current.scrollTop = initialScrollTop;
    }
    if (vendorScrollRef.current) {
      vendorScrollRef.current.scrollTop = initialScrollTop;
    }
  }, [type, agendaStartTime]);

  const visibleDays = dateRange.from && dateRange.to ? getDaysInRange(dateRange.from, dateRange.to) : [];

  if (visibleDays.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center text-center py-8 text-gray-500 bg-white">
        <div>
          <div className="text-4xl mb-2">📅</div>
          <p>Please select a valid date range to display the itinerary.</p>
        </div>
      </div>
    );
  }

  const timeLabels = Array.from({ length: 24 }, (_, i) => {
    const startHour = agendaStartTime / 60;
    const hour = (startHour + i) % 24;
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    if (hour === 0) return `12 AM`;
    if (hour === 12) return '12 PM';
    return `${hour12} ${ampm}`;
  });

  const getItemsForDay = (day: string, itemType: 'event' | 'vendor') => {
      const filteredItems = getFilteredItems(itemType);
      const dayItems = filteredItems
          .filter((item: any) => item.date === day)
          .map((item: any) => {
              const [startH, startM] = item.startTime.split(':').map(Number);
              const [endH, endM] = (item.endTime || '23:59').split(':').map(Number);
              
              const startMinutes = startH * 60 + startM;
              let endMinutes = endH * 60 + endM;

              // Handle events ending at midnight for correct duration
              if (endMinutes === 0 && startMinutes !== 0) endMinutes = 24 * 60;
              
              let duration = endMinutes - startMinutes;
              // Handle overnight events
              if (duration < 0) {
                duration += 1440;
              }

              // Calculate position relative to the view's start time
              let relativeStartMinutes;
              if (startMinutes >= agendaStartTime) {
                  relativeStartMinutes = startMinutes - agendaStartTime;
              } else {
                  relativeStartMinutes = (1440 - agendaStartTime) + startMinutes;
              }
              const relativeEndMinutes = relativeStartMinutes + duration;
              
              return { ...item, startMinutes, endMinutes, duration, relativeStartMinutes, relativeEndMinutes };
          })
          .sort((a: any, b: any) => a.relativeStartMinutes - b.relativeStartMinutes);

      // Overlap detection must now use the relative start/end times
      const eventGroups: any[][] = [];
      if (dayItems.length > 0) {
        let currentGroup = [dayItems[0]];
        for (let i = 1; i < dayItems.length; i++) {
          const event = dayItems[i];
          const groupEndTime = Math.max(...currentGroup.map(e => e.relativeEndMinutes));
          if (event.relativeStartMinutes < groupEndTime) {
            currentGroup.push(event);
          } else {
            eventGroups.push(currentGroup);
            currentGroup = [event];
          }
        }
        eventGroups.push(currentGroup);
      }

      eventGroups.forEach(group => {
        const columns: any[][] = [];
        group.sort((a,b) => a.relativeStartMinutes - b.relativeStartMinutes);
        
        group.forEach(event => {
          let placed = false;
          for (let i = 0; i < columns.length; i++) {
            if (columns[i][columns[i].length - 1].relativeEndMinutes <= event.relativeStartMinutes) {
              columns[i].push(event);
              placed = true;
              break;
            }
          }
          if (!placed) columns.push([event]);
        });
        
        const numCols = columns.length;
        columns.forEach((col, colIndex) => {
          col.forEach((event: any) => {
            event.numCols = numCols;
            event.colIndex = colIndex;
          });
        });
      });
      
      return dayItems;
  };
  
  const panelProps = {
    visibleDays,
    getTodayDateString: () => {
      const today = new Date();
      return today.toISOString().slice(0, 10);
    },
    timeLabels,
    getItemsForDay,
    currentTime,
    eventColors,
    subEventColors,
    vendorColors,
    isColorDark,
    setHoveredBlockId,
    setTooltipPos,
    setSelectedTask
  };

  if (type === 'both') {
    return (
      <div className="flex flex-col h-full border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        {/* Main Header */}
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-300 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">Shared View - Events & Vendors</h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span>Events</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span>Vendors</span></div>
          </div>
        </div>
        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          <ItineraryPanel itemType="event" scrollRef={eventScrollRef} onScroll={() => handleScroll('event')} {...panelProps} />
          <div className="w-px bg-gray-300" /> {/* Divider */}
          <ItineraryPanel itemType="vendor" scrollRef={vendorScrollRef} onScroll={() => handleScroll('vendor')} {...panelProps} />
        </div>
      </div>
    );
  }
  
  // Single View
  return (
    <div className="flex flex-col h-full border border-gray-300 rounded-lg overflow-hidden shadow-sm">
      <ItineraryPanel
        itemType={type === 'event' ? 'event' : 'vendor'}
        scrollRef={eventScrollRef}
        onScroll={() => {}}
        {...panelProps}
      />
    </div>
  );
};

export default function PlanPage() {
  const [tab, setTab] = useState("agenda");
  const [view, setView] = useState<"day" | "week" | "month" | "year">("month");
  const [current, setCurrent] = useState(getToday());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modal, setModal] = useState<{ open: boolean; date: string }>({ open: false, date: '' });
  const [agendaViewType, setAgendaViewType] = useState<'event' | 'vendor' | 'both'>('both');
  const [agendaViewDate, setAgendaViewDate] = useState(getTodayDateString());
  const [agendaStartTime, setAgendaStartTime] = useState(6 * 60); // 6 AM
  const [columnsToShow, setColumnsToShow] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filterSearch, setFilterSearch] = useState("");
  const [filterDay, setFilterDay] = useState<number | null>(null);
  const [filterMonth, setFilterMonth] = useState<number | null>(null);
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [selectedSubEventIds, setSelectedSubEventIds] = useState<string[]>([]);
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [eventColors, setEventColors] = useState<Record<string, string>>({});
  const [subEventColors, setSubEventColors] = useState<Record<string, string>>({});
  const [vendorColors, setVendorColors] = useState<Record<string, string>>({});
  const [events, setEvents] = useState<EventData[]>([]);
  const [subEvents, setSubEventData] = useState<SubEventData[]>([]);
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [collapsedEvents, setCollapsedEvents] = useState<Record<string, boolean>>({});
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      from: today.toISOString().slice(0, 10),
      to: tomorrow.toISOString().slice(0, 10),
    };
  });
  
  // Load settings from localStorage on initial render
  useEffect(() => {
    const savedSettings = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.dateRange) setDateRange(parsed.dateRange);
        if (parsed.agendaViewType) setAgendaViewType(parsed.agendaViewType);
        if (parsed.filterSearch) setFilterSearch(parsed.filterSearch);
        if (parsed.selectedEventIds) setSelectedEventIds(parsed.selectedEventIds);
        if (parsed.selectedSubEventIds) setSelectedSubEventIds(parsed.selectedSubEventIds);
        if (parsed.selectedVendorIds) setSelectedVendorIds(parsed.selectedVendorIds);
        if (parsed.eventColors) setEventColors(parsed.eventColors);
        if (parsed.subEventColors) setSubEventColors(parsed.subEventColors);
        if (parsed.vendorColors) setVendorColors(parsed.vendorColors);
        if (parsed.collapsedEvents) setCollapsedEvents(parsed.collapsedEvents);
        if ('agendaStartTime' in parsed && parsed.agendaStartTime !== null) {
          setAgendaStartTime(parsed.agendaStartTime);
        }
      } catch (error) {
        console.error("Failed to parse plan page settings from localStorage", error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    const settingsToSave = {
      dateRange,
      agendaViewType,
      filterSearch,
      selectedEventIds,
      selectedSubEventIds,
      selectedVendorIds,
      eventColors,
      subEventColors,
      vendorColors,
      collapsedEvents,
      agendaStartTime,
    };
    // Debounce saving to avoid excessive writes
    const handler = setTimeout(() => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settingsToSave));
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [
    dateRange,
    agendaViewType,
    filterSearch,
    selectedEventIds,
    selectedSubEventIds,
    selectedVendorIds,
    eventColors,
    subEventColors,
    vendorColors,
    collapsedEvents,
    agendaStartTime,
  ]);
  
  const today = getToday();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const yearRange = Array.from({ length: 10 }, (_, i) => today.year - 5 + i);
  const daysInActiveMonth = getDaysInMonth(current.year, current.month);

  // Time options for start time dropdown
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const minute = 0;
    let hour12 = hour % 12 === 0 ? 12 : hour % 12;
    let ampm = hour < 12 ? "AM" : "PM";
    let label = `${hour12}:${minute === 0 ? "00" : "30"} ${ampm}`;
    return { value: hour * 60 + minute, label };
  });

  function handlePrev() {
    if (view === "month") {
      setCurrent(c => {
        if (c.month === 0) return { year: c.year - 1, month: 11, date: c.date };
        return { year: c.year, month: c.month - 1, date: c.date };
      });
    } else if (view === "year") {
      setCurrent(c => ({ year: c.year - 1, month: c.month, date: c.date }));
    }
  }
  function handleNext() {
    if (view === "month") {
      setCurrent(c => {
        if (c.month === 11) return { year: c.year + 1, month: 0, date: c.date };
        return { year: c.year, month: c.month + 1, date: c.date };
      });
    } else if (view === "year") {
      setCurrent(c => ({ year: c.year + 1, month: c.month, date: c.date }));
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
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return date;
    });

    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((date, i) => {
          const dateStr = date.toISOString().slice(0, 10);
          const dayTasks = tasks.filter(t => t.date === dateStr);
          const dayEvents = events.filter(ev => ev.date === dateStr);
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={i}
              className={`p-4 rounded-lg border ${
                isToday ? "bg-blue-50 border-blue-600" : "bg-white border-gray-200"
              }`}
            >
              <div className={`font-bold text-center mb-2 ${
                isToday ? "text-blue-700" : "text-gray-900"
              }`}>
                {WEEKDAYS[i]}
              </div>
              <div className={`text-center mb-3 ${
                isToday ? "text-blue-600" : "text-gray-600"
              }`}>
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.map((ev, idx) => (
                  <div key={"event-" + idx} className="text-xs bg-blue-100 text-blue-800 rounded px-2 py-1 truncate">
                    {ev.name}
                  </div>
                ))}
                {dayTasks.map((t, idx) => (
                  <div key={"task-" + idx} className="text-xs bg-gray-100 text-gray-700 rounded px-2 py-1 truncate cursor-pointer" onClick={() => setSelectedTask(t)}>
                    {t.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function getVisibleTasks() {
    if (view === "month") {
      return tasks.filter(t => {
        const taskDate = new Date(t.date);
        return taskDate.getMonth() === current.month && taskDate.getFullYear() === current.year;
      });
    }
    return tasks;
  }

  function getTodayDateString() {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  }

  function getSelectedDateString() {
    return getDateString(current.year, current.month, today.date);
  }

  function getAgendaTimelineData() {
    const allData: any[] = [];

    events.forEach(ev => {
        allData.push({
            ...ev,
            title: ev.name,
            blockType: 'event',
            color: eventColors[ev.id] || '#3b82f6',
            id: `event-${ev.id}`,
            startTime: (ev as any).start_time || '00:00',
            endTime: (ev as any).end_time || '01:00',
        });
    });
    
    subEvents.forEach(se => {
        allData.push({
            ...se,
            title: se.name,
            blockType: 'subevent',
            color: subEventColors[se.id] || '#8b5cf6',
            id: `subevent-${se.id}`,
            startTime: (se as any).start_time || '00:00',
            endTime: (se as any).end_time || '01:00',
        });
    });
    
    vendors.forEach(v => {
        allData.push({
            ...v,
            title: v.name,
            blockType: 'vendor',
            color: vendorColors[v.id] || '#10b981',
            id: `vendor-${v.id}`,
            startTime: v.start_time || '00:00',
            endTime: v.end_time || '01:00',
        });
    });
    
    return allData;
  }

  useEffect(() => {
    async function fetchAll() {
      try {
        const { data: eventsData } = await supabase.from('events').select('*');
        const { data: subEventsData } = await supabase.from('sub_events').select('*');
        const { data: vendorsData } = await supabase.from('vendors').select('*');
        
        if (eventsData) setEvents(eventsData);
        if (subEventsData) setSubEventData(subEventsData);
        if (vendorsData) setVendors(vendorsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    
    fetchAll();
  }, []);

  function setAndPersistSelectedEventIds(ids: string[]) {
    setSelectedEventIds(ids);
    localStorage.setItem('selectedEventIds', JSON.stringify(ids));
  }

  function setAndPersistSelectedSubEventIds(ids: string[]) {
    setSelectedSubEventIds(ids);
    localStorage.setItem('selectedSubEventIds', JSON.stringify(ids));
  }

  function setAndPersistSelectedVendorIds(ids: string[]) {
    setSelectedVendorIds(ids);
    localStorage.setItem('selectedVendorIds', JSON.stringify(ids));
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (tooltipPos) setTooltipPos(null);
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape' && tooltipPos) setTooltipPos(null);
    }
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [tooltipPos]);

  function getAgendaTimelineDataFiltered(typeOverride?: 'event' | 'vendor') {
    const allData = getAgendaTimelineData();
    const type = typeOverride || agendaViewType;
    
    if (type === 'event') {
      return allData.filter(item => item.blockType === 'event' || item.blockType === 'subevent');
    } else if (type === 'vendor') {
      return allData.filter(item => item.blockType === 'vendor');
    }
    
    return allData;
  }

  function getBlockLayout(blocks: any[]): { width: string; left: number }[] {
    if (blocks.length === 0) return [];
    
    const sortedBlocks = [...blocks].sort((a, b) => {
      const aStart = a.startTime.split(':').map(Number);
      const bStart = b.startTime.split(':').map(Number);
      return (aStart[0] * 60 + aStart[1]) - (bStart[0] * 60 + bStart[1]);
    });
    
    const layouts: { width: string; left: number }[] = [];
    const overlappingGroups: any[][] = [];
    
    sortedBlocks.forEach(block => {
      let addedToGroup = false;
      for (const group of overlappingGroups) {
        const lastBlock = group[group.length - 1];
        const lastEnd = lastBlock.endTime.split(':').map(Number);
        const blockStart = block.startTime.split(':').map(Number);
        const lastEndMinutes = lastEnd[0] * 60 + lastEnd[1];
        const blockStartMinutes = blockStart[0] * 60 + blockStart[1];
        
        if (blockStartMinutes < lastEndMinutes) {
          group.push(block);
          addedToGroup = true;
          break;
        }
      }
      
      if (!addedToGroup) {
        overlappingGroups.push([block]);
      }
    });
    
    sortedBlocks.forEach(block => {
      for (let i = 0; i < overlappingGroups.length; i++) {
        const group = overlappingGroups[i];
        const blockIndex = group.findIndex(b => b.id === block.id);
        if (blockIndex !== -1) {
          const width = group.length > 1 ? `${100 / group.length}%` : '100%';
          const left = group.length > 1 ? (blockIndex * 100) / group.length : 0;
          layouts.push({ width, left });
          break;
        }
      }
    });
    
    return layouts;
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

  const navItems = [
    { label: 'Plan', href: '/plan', active: tab === 'agenda', onClick: () => setTab('agenda') },
  ];
  const tempButtons = [
    { label: 'Calendar', onClick: () => setTab('calendar'), active: tab === 'calendar' },
    { label: 'Upcoming Events', onClick: () => setTab('upcoming'), active: tab === 'upcoming' },
    { label: 'Past Events', onClick: () => setTab('past'), active: tab === 'past' },
  ];

  // Add responsive container style
  const containerStyle = {
    width: '100%',
    marginTop: 32,
    marginBottom: 32,
    paddingLeft: 'max(16px, 2vw)',
    paddingRight: 'max(16px, 2vw)',
    boxSizing: 'border-box' as const,
    maxWidth: '100vw',
    overflowX: 'hidden' as const,
  };

  const getFilteredItems = (itemType: 'event' | 'vendor') => {
    const allItems = getAgendaTimelineDataFiltered(itemType);
    return allItems.filter(item => {
      const id = item.id.split('-').slice(1).join('-');
      if (item.blockType === 'event') return selectedEventIds.includes(id);
      if (item.blockType === 'subevent') return selectedSubEventIds.includes(id);
      if (item.blockType === 'vendor') return selectedVendorIds.includes(id);
      return false;
    });
  };

  return (
    <>
      <TopToolbar
        navItems={navItems}
        tempButtons={tempButtons}
        searchButton={{ onClick: () => alert('Search clicked!') }}
      />
      <div style={containerStyle}>
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 w-full">
            {tab === "calendar" && (
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                  <div className="flex gap-2 order-2 sm:order-1">
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
                  <div className="flex flex-wrap gap-2 order-3 sm:order-2">
                    {VIEW_OPTIONS.map(opt => (
                      <button
                        key={opt.key}
                        className={`px-2 py-1 rounded text-sm ${view === opt.key ? "bg-blue-600 text-white" : "bg-white text-black hover:bg-gray-100"}`}
                        onClick={() => setView(opt.key as any)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="font-bold text-lg order-1 sm:order-3 text-center sm:text-left">
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
                {/* Modern Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-6 mb-6 text-white">
                  <h1 className="text-2xl font-bold mb-2">Event Planning Dashboard</h1>
                  <p className="text-blue-100">Manage your event timeline and vendor schedules</p>
                </div>

                {/* View Controls */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          agendaViewType === 'event' 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={() => setAgendaViewType('event')}
                      >
                        📅 Events Only
                      </button>
                      <button
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          agendaViewType === 'vendor' 
                            ? 'bg-green-600 text-white shadow-md' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={() => setAgendaViewType('vendor')}
                      >
                        👥 Vendors Only
                      </button>
                      <button
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          agendaViewType === 'both' 
                            ? 'bg-purple-600 text-white shadow-md' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={() => setAgendaViewType('both')}
                      >
                        📊 Shared View
                      </button>
                    </div>
                    {!showFilters ? (
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-md hover:bg-blue-700 transition-colors duration-200"
                        onClick={() => setShowFilters(true)}
                      >
                        ⚙️ Filters
                      </button>
                    ) : (
                      <button
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium shadow-md hover:bg-gray-700 transition-colors duration-200"
                        onClick={() => setShowFilters(false)}
                      >
                        ✕ Hide Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Date Navigation */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                      <label htmlFor="startDate" className="text-sm font-medium text-gray-700">From:</label>
                      <input
                        type="date"
                        id="startDate"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        value={dateRange.from}
                        onChange={e => setDateRange(dr => ({ ...dr, from: e.target.value }))}
                        aria-label="Start date"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label htmlFor="endDate" className="text-sm font-medium text-gray-700">To:</label>
                      <input
                        type="date"
                        id="endDate"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        value={dateRange.to}
                        onChange={e => setDateRange(dr => ({ ...dr, to: e.target.value }))}
                        aria-label="End date"
                      />
                    </div>
                    <button
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors duration-200"
                      onClick={() => setDateRange({ from: getTodayDateString(), to: getTodayDateString() })}
                    >
                      Today
                    </button>
                  </div>
                </div>

                {/* Modern Timeline View */}
                <div className="h-[70vh] flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm">
                    <ItineraryView 
                      key={agendaStartTime}
                      type={agendaViewType} 
                      agendaStartTime={agendaStartTime} 
                      dateRange={dateRange}
                      getFilteredItems={getFilteredItems}
                      eventColors={eventColors}
                      subEventColors={subEventColors}
                      vendorColors={vendorColors}
                      setHoveredBlockId={setHoveredBlockId}
                      setTooltipPos={setTooltipPos}
                      setSelectedTask={setSelectedTask}
                    />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Modern Filters Sidebar */}
        {showFilters && (
          <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white border-l shadow-lg z-40 p-4 sm:p-6 flex flex-col gap-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filters & Settings</h2>
              <button
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-600 hover:text-gray-800"
                onClick={() => setShowFilters(false)}
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <input
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="🔍 Search events, sub-events, vendors..."
                value={filterSearch}
                onChange={e => setFilterSearch(e.target.value)}
              />
            </div>

            {/* Agenda Filters */}
            {tab === 'agenda' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Agenda Filters</h3>
                <EventFilterGroup
                  events={events}
                  subEvents={subEvents}
                  selectedEventIds={selectedEventIds}
                  onToggleEvent={(id: any) => setSelectedEventIds(selectedEventIds.includes(id) ? selectedEventIds.filter((eid: any) => eid !== id) : [...selectedEventIds, id])}
                  eventColors={eventColors}
                  onEventColorChange={(id: any, color: any) => setEventColors((c: any) => ({ ...c, [id]: color }))}
                  selectedSubEventIds={selectedSubEventIds}
                  onToggleSubEvent={(id: any) => setSelectedSubEventIds(selectedSubEventIds.includes(id) ? selectedSubEventIds.filter((sid: any) => sid !== id) : [...selectedSubEventIds, id])}
                  subEventColors={subEventColors}
                  onSubEventColorChange={(id: any, color: any) => setSubEventColors((c: any) => ({ ...c, [id]: color }))}
                  filterSearch={filterSearch}
                />
                <SectionFilter
                  title="Vendors"
                  items={vendors}
                  selectedIds={selectedVendorIds}
                  onToggle={(id: any) => setSelectedVendorIds(selectedVendorIds.includes(id) ? selectedVendorIds.filter((vid: any) => vid !== id) : [...selectedVendorIds, id])}
                  colors={vendorColors}
                  onColorChange={(id: any, color: any) => setVendorColors((c: any) => ({ ...c, [id]: color }))}
                  filterSearch={filterSearch}
                  showMoreLimit={5}
                />
                
                {/* Settings */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Display Settings</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        value={agendaStartTime}
                        onChange={e => setAgendaStartTime(Number(e.target.value))}
                      >
                        {timeOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-auto space-y-3 pt-4 border-t border-gray-200">
              <button
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
                onClick={() => { setFilterDay(null); setFilterMonth(null); setFilterYear(null); setSelectedEventIds([]); setSelectedSubEventIds([]); setSelectedVendorIds([]); }}
              >
                Clear All Filters
              </button>
              <button
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                onClick={() => setShowFilters(false)}
              >
                Close Filters
              </button>
            </div>
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
      {tooltipPos && hoveredBlockId && (
        <BlockTooltip
          item={getAgendaTimelineData().find(item => item.id === hoveredBlockId)}
          x={tooltipPos.x}
          y={tooltipPos.y}
        />
      )}
    </>
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