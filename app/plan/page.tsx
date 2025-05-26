"use client";
import { useState, useRef, ChangeEvent, FormEvent } from "react";

const TABS = [
  { key: "calendar", label: "Calendar" },
  { key: "upcoming", label: "Upcoming Events" },
  { key: "past", label: "Past Events" },
  { key: "agenda", label: "Agenda" },
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

export default function PlanningPage() {
  const [tab, setTab] = useState("calendar");
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

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInActiveMonth = getDaysInMonth(current.year, current.month);
  const yearRange = Array.from({ length: 101 }, (_, i) => today.year - 50 + i);

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
                  {dayTasks.map((t, idx) => (
                    <div key={idx} className="truncate text-xs text-gray-700 bg-blue-50 rounded px-1 my-0.5 cursor-pointer" onClick={() => setSelectedTask(t)}>
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
    return (
      <div className="text-lg text-center">[Day view coming soon]</div>
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

  return (
    <div className="w-full overflow-x-auto p-6">
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
              <div className="font-bold mb-2 text-lg">Upcoming Events (next 30 days)</div>
              {tasks.filter(t => {
                const now = new Date();
                const tDate = new Date(t.date);
                return tDate >= now && tDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
              }).length === 0 && <div className="text-gray-500">No upcoming events.</div>}
              {tasks.filter(t => {
                const now = new Date();
                const tDate = new Date(t.date);
                return tDate >= now && tDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
              }).map((t, idx) => (
                <div key={idx} className="bg-white rounded border px-3 py-2 flex items-center gap-2 shadow-sm cursor-pointer" onClick={() => setSelectedTask(t)}>
                  <span className="font-mono text-xs text-gray-500">{t.date}</span>
                  <span className="text-gray-800">{t.title}</span>
                </div>
              ))}
            </div>
          )}
          {tab === "past" && (
            <div className="space-y-2">
              <div className="font-bold mb-2 text-lg">Past Events</div>
              {tasks.filter(t => {
                const now = new Date();
                const tDate = new Date(t.date);
                return tDate < now;
              }).length === 0 && <div className="text-gray-500">No past events.</div>}
              {tasks.filter(t => {
                const now = new Date();
                const tDate = new Date(t.date);
                return tDate < now;
              }).map((t, idx) => (
                <div key={idx} className="bg-white rounded border px-3 py-2 flex items-center gap-2 shadow-sm cursor-pointer" onClick={() => setSelectedTask(t)}>
                  <span className="font-mono text-xs text-gray-500">{t.date}</span>
                  <span className="text-gray-800">{t.title}</span>
                </div>
              ))}
            </div>
          )}
          {tab === "agenda" && <div className="text-lg">[Agenda view coming soon]</div>}
        </div>
        {!showFilters && (
          <button
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded font-semibold shadow-lg hover:bg-blue-700 whitespace-nowrap"
            onClick={() => setShowFilters(true)}
          >
            Show Filters
          </button>
        )}
      </div>
      {showFilters && (
        <div className="fixed right-0 top-0 h-full w-64 bg-white border-l shadow-lg z-40 p-4 flex flex-col gap-4">
          <button
            className="absolute left-0 top-4 -translate-x-full px-3 py-1 bg-blue-600 text-white rounded-l font-semibold shadow-lg hover:bg-blue-700"
            onClick={() => setShowFilters(false)}
          >
            Hide Filters
          </button>
          <div className="font-bold text-lg mb-2">Calendar Filters</div>
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
          <button
            className="mt-2 px-3 py-1 bg-gray-200 text-black rounded font-semibold hover:bg-gray-300"
            onClick={() => { setFilterDay(null); setFilterMonth(null); setFilterYear(null); }}
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