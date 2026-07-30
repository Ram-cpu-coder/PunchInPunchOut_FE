import React, { useEffect, useMemo, useState } from "react";

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const API_BASE = import.meta.env.VITE_API_URL || "";
const SESSION_KEY = "punchin-session";
const ACTIVE_VIEW_KEY = "punchin-active-view";
const validViews = ["work", "dashboard", "records"];

function FieldIcon({ name }) {
  return (
    <span className="field-icon" aria-hidden="true">
      <Icon name={name} />
    </span>
  );
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonday(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return formatDate(copy);
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

function Icon({ name }) {
  const paths = {
    save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z M17 21v-8H7v8 M7 3v5h8",
    trash: "M3 6h18 M8 6V4h8v2 M6 6l1 15h10l1-15",
    check: "M20 6 9 17l-5-5",
    undo: "M9 14 4 9l5-5 M4 9h10a6 6 0 0 1 0 12h-1",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5l3 2",
    play: "M8 5v14l11-7-11-7Z",
    stop: "M6 6h12v12H6Z",
    dollar: "M12 2v20 M17 5.5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6",
    user: "M20 21a8 8 0 0 0-16 0 M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
    mail: "M4 6h16v12H4V6Z M4 7l8 6 8-6",
    lock: "M7 11V8a5 5 0 0 1 10 0v3 M6 11h12v10H6V11Z",
    eye: "M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    eyeOff: "M3 3l18 18 M10.6 10.6a3 3 0 0 0 4 4 M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.3 17.3 0 0 1-3.2 4.2 M6.5 6.8C3.6 8.7 2 12 2 12s3.5 7 10 7c1.5 0 2.8-.3 4-.8",
    coffee: "M4 8h12v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z M16 9h2a2 2 0 0 1 0 4h-2 M5 21h10",
    note: "M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z M14 3v5h5 M8 13h8 M8 17h6",
    calendar: "M7 3v4 M17 3v4 M4 9h16 M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
    archive: "M4 7h16 M5 7l1 14h12l1-14 M8 3h8l2 4H6l2-4 M10 12h4",
    chart: "M4 19V5 M8 17v-6 M13 17V8 M18 17v-9 M3 19h18",
    work: "M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1 M4 7h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z M4 12h16",
    menu: "M4 6h16 M4 12h16 M4 18h16",
    chevronLeft: "M15 18 9 12l6-6",
    chevronRight: "m9 18 6-6-6-6",
    chevronDown: "m6 9 6 6 6-6",
    sparkles: "M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z M19 15l.7 2.3L22 18l-2.3.7L19 22l-.7-2.3L16 18l2.3-.7L19 15Z",
    download: "M12 3v12 M7 10l5 5 5-5 M5 21h14",
    clear: "M18 6 6 18 M6 6l12 12"
  };

  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

function createWeek(weekStart = getMonday()) {
  const start = new Date(`${weekStart}T00:00:00`);

  return {
    weekStart,
    isPaid: false,
    days: dayNames.map((label, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);

      return {
        key: dayKeys[index],
        label,
        date: formatDate(date),
        start: "",
        end: "",
        breakMinutes: 0,
        notes: ""
      };
    })
  };
}

function timeToMinutes(value) {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function calculateDayHours(day) {
  const start = timeToMinutes(day.start);
  const end = timeToMinutes(day.end);

  if (start === null || end === null) return 0;

  const adjustedEnd = end < start ? end + 24 * 60 : end;
  const minutes = Math.max(adjustedEnd - start - Number(day.breakMinutes || 0), 0);
  return Number((minutes / 60).toFixed(2));
}

function money(value) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD"
  }).format(value || 0);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function safePdfText(value) {
  return String(value ?? "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfText(value) {
  return safePdfText(value).replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function wrapPdfLine(value, maxLength = 96) {
  const words = safePdfText(value).split(" ");
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const nextLine = line ? `${line} ${word}` : word;
    if (nextLine.length > maxLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  });

  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function getReportTextLines(report) {
  return [
    "Punch In Punch Out Timesheet",
    `${report.title} - ${report.status}`,
    `Total hours: ${report.totalHours.toFixed(2)}`,
    `Total pay: ${money(report.totalPay)}`,
    `Hourly rate: ${money(report.rate)}`,
    "",
    ...report.weeks.flatMap((weekReport) => [
      `Week starting ${weekReport.weekStart} - ${weekReport.status}`,
      "Date | Day | Start time | End time | Daily hours",
      ...weekReport.days.map((day) =>
        `${day.date} | ${day.day} | ${day.start} | ${day.end} | ${day.hours.toFixed(2)}`
      ),
      `Total hours this week: ${weekReport.totalHours.toFixed(2)}`,
      ""
    ])
  ];
}

function buildPdf(report) {
  const allLines = getReportTextLines(report).flatMap((line) => wrapPdfLine(line));
  const linesPerPage = 42;
  const pages = [];

  for (let index = 0; index < allLines.length; index += linesPerPage) {
    pages.push(allLines.slice(index, index + linesPerPage));
  }

  if (!pages.length) pages.push(["Punch In Punch Out Timesheet"]);

  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pagesId = addObject("");
  const pageIds = [];

  pages.forEach((pageLines) => {
    const textCommands = pageLines
      .map((line, index) => `${index === 0 ? "" : "0 -16 Td\n"}(${escapePdfText(line)}) Tj`)
      .join("\n");
    const stream = `BT\n/F1 11 Tf\n42 750 Td\n${textCommands}\nET`;
    const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

function calculateWeekTotals(savedWeek, hourlyRate = 0) {
  const daily = (savedWeek.days || []).map(calculateDayHours);
  const weeklyHours = Number(daily.reduce((sum, hours) => sum + hours, 0).toFixed(2));
  const rate = Number(hourlyRate || 0);

  return {
    weeklyHours,
    weeklyPay: Number((weeklyHours * rate).toFixed(2))
  };
}

function formatClockTime(date = new Date()) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatDisplayTime(value, style) {
  if (!value) return "--:--";
  const [rawHours, rawMinutes] = value.split(":").map(Number);

  if (style === "24") return value;

  const suffix = rawHours >= 12 ? "PM" : "AM";
  const hours = rawHours % 12 || 12;
  return `${hours}:${String(rawMinutes).padStart(2, "0")} ${suffix}`;
}

function formatExportTime(value) {
  if (!value) return "-";
  return formatDisplayTime(value, "12");
}

function calculateLiveDayHours(day, activeTimer, now) {
  if (!activeTimer) return calculateDayHours(day);

  const elapsedMs = Math.max(now.getTime() - activeTimer.startedAt, 0);
  const breakMs = Number(day.breakMinutes || 0) * 60 * 1000;
  return Number((Math.max(elapsedMs - breakMs, 0) / 3600000).toFixed(6));
}

function formatRunningTime(day, activeTimer, now) {
  if (!activeTimer) return "";

  const elapsedSeconds = Math.max(Math.floor((now.getTime() - activeTimer.startedAt) / 1000) - Number(day.breakMinutes || 0) * 60, 0);
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getStatusKind(message) {
  const text = message.toLowerCase();
  if (
    text.includes("failed") ||
    text.includes("error") ||
    text.includes("enter ") ||
    text.includes("stop ") ||
    text.includes("connect ") ||
    text.includes("please ")
  ) {
    return "error";
  }

  if (
    text.includes("saving") ||
    text.includes("loading") ||
    text.includes("signing") ||
    text.includes("creating") ||
    text.includes("marking") ||
    text.includes("stopping")
  ) {
    return "loading";
  }

  return "success";
}

function App() {
  const storedSession = (() => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  })();
  const [authToken, setAuthToken] = useState(storedSession?.accessToken || "");
  const [currentUser, setCurrentUser] = useState(storedSession?.user || null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [weeks, setWeeks] = useState([]);
  const [week, setWeek] = useState(createWeek());
  const [hourlyRate, setHourlyRate] = useState("");
  const [hasSavedHourlyRate, setHasSavedHourlyRate] = useState(false);
  const [activeView, setActiveView] = useState(() => {
    const savedView = localStorage.getItem(ACTIVE_VIEW_KEY);
    return validViews.includes(savedView) ? savedView : "work";
  });
  const [weekView, setWeekView] = useState("unpaid");
  const [isPaymentOpen, setIsPaymentOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth > 700
  );
  const [timeFormat, setTimeFormat] = useState("12");
  const [activeTimer, setActiveTimer] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const [status, setStatus] = useState("Ready");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dirtyDayKeys, setDirtyDayKeys] = useState([]);
  const [exportWeekStarts, setExportWeekStarts] = useState([]);
  const [exportFormat, setExportFormat] = useState("pdf");

  const todayIndex = (new Date().getDay() + 6) % 7;
  const activeWorkIndex =
    activeTimer?.weekStart === week.weekStart ? activeTimer.dayIndex : todayIndex;
  const currentWorkDay = week.days[activeWorkIndex] || week.days[todayIndex] || week.days[0];

  async function apiFetch(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
    if (authToken) headers.set("Authorization", `Bearer ${authToken}`);

    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (response.status === 401) {
      logout();
      throw new Error("Please sign in again.");
    }
    return response;
  }

  function saveSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setAuthToken(session.accessToken);
    setCurrentUser(session.user);
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(ACTIVE_VIEW_KEY);
    setAuthToken("");
    setCurrentUser(null);
    setWeeks([]);
    setWeek(createWeek());
    setHourlyRate("");
    setHasSavedHourlyRate(false);
    setActiveTimer(null);
    setIsLoaded(true);
  }

  useEffect(() => {
    localStorage.setItem(ACTIVE_VIEW_KEY, activeView);
  }, [activeView]);

  async function submitAuth(event) {
    event.preventDefault();
    if (isAuthSubmitting) return;

    const endpoint = authMode === "signup" ? "/api/auth/signup" : "/api/auth/login";
    const payload = authMode === "signup"
      ? authForm
      : { email: authForm.email, password: authForm.password };

    try {
      setIsAuthSubmitting(true);
      setStatus(authMode === "signup" ? "Signing up..." : "Signing in...");
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Authentication failed");

      setHourlyRate("");
      setHasSavedHourlyRate(false);
      saveSession(data);
      setIsLoaded(false);
      setStatus(authMode === "signup" ? "Account created." : "Logged in.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsAuthSubmitting(false);
    }
  }

  const totals = useMemo(() => {
    const daily = week.days.map((day, index) =>
      activeTimer?.weekStart === week.weekStart && activeTimer.dayIndex === index
        ? calculateLiveDayHours(day, activeTimer, now)
        : calculateDayHours(day)
    );
    const weeklyHours = Number(daily.reduce((sum, hours) => sum + hours, 0).toFixed(2));
    const rate = Number(hourlyRate || 0);
    const weeklyPay = Number((weeklyHours * rate).toFixed(2));

    return { daily, weeklyHours, weeklyPay };
  }, [activeTimer, hourlyRate, now, week]);

  const activeWorkHours = totals.daily[activeWorkIndex] || 0;
  const activeWorkPay = activeWorkHours * Number(hourlyRate || 0);
  const isWorkTimerRunning = activeTimer?.weekStart === week.weekStart && activeTimer.dayIndex === activeWorkIndex;
  const activeWorkHoursText = activeWorkHours.toFixed(isWorkTimerRunning ? 6 : 2);
  const activeWorkPayText = isWorkTimerRunning ? `$${activeWorkPay.toFixed(7)}` : money(activeWorkPay);
  const currentWorkDayCompleted = Boolean(currentWorkDay.start && currentWorkDay.end && !isWorkTimerRunning);
  const hasOtherActiveTimer = Boolean(activeTimer) && !isWorkTimerRunning;
  const isWeekEditingLocked = Boolean(activeTimer);
  const shouldShowToast = status && status !== "Ready";
  const statusKind = shouldShowToast ? getStatusKind(status) : "success";

  useEffect(() => {
    if (!shouldShowToast) return undefined;

    const timeout = window.setTimeout(() => setStatus("Ready"), 3000);
    return () => window.clearTimeout(timeout);
  }, [shouldShowToast, status]);

  const unpaidWeeks = useMemo(() => {
    return weeks
      .filter((savedWeek) => !savedWeek.isPaid)
      .map((savedWeek) => ({
        ...savedWeek,
        totals: calculateWeekTotals(savedWeek, hourlyRate)
      }));
  }, [hourlyRate, weeks]);

  const paidWeeks = useMemo(() => {
    return weeks
      .filter((savedWeek) => savedWeek.isPaid)
      .map((savedWeek) => ({
        ...savedWeek,
        totals: calculateWeekTotals(savedWeek, hourlyRate)
      }));
  }, [hourlyRate, weeks]);

  const allWeeks = useMemo(() => {
    return weeks.map((savedWeek) => ({
      ...savedWeek,
      totals: calculateWeekTotals(savedWeek, hourlyRate)
    }));
  }, [hourlyRate, weeks]);

  const exportWeeks = useMemo(() => {
    return allWeeks.filter((savedWeek) => exportWeekStarts.includes(savedWeek.weekStart));
  }, [allWeeks, exportWeekStarts]);

  const visibleWeeks = useMemo(() => {
    if (weekView === "paid") return paidWeeks;
    if (weekView === "all") return allWeeks;
    return unpaidWeeks;
  }, [allWeeks, paidWeeks, unpaidWeeks, weekView]);

  const unpaidSummary = useMemo(() => {
    return unpaidWeeks.reduce(
      (summary, savedWeek) => ({
        hours: Number((summary.hours + savedWeek.totals.weeklyHours).toFixed(2)),
        pay: Number((summary.pay + savedWeek.totals.weeklyPay).toFixed(2))
      }),
      { hours: 0, pay: 0 }
    );
  }, [unpaidWeeks]);

  const viewSummary = useMemo(() => {
    return visibleWeeks.reduce(
      (summary, savedWeek) => ({
        hours: Number((summary.hours + savedWeek.totals.weeklyHours).toFixed(2)),
        pay: Number((summary.pay + savedWeek.totals.weeklyPay).toFixed(2))
      }),
      { hours: 0, pay: 0 }
    );
  }, [visibleWeeks]);

  const allWeeksSummary = useMemo(() => {
    return allWeeks.reduce(
      (summary, savedWeek) => ({
        hours: Number((summary.hours + savedWeek.totals.weeklyHours).toFixed(2)),
        pay: Number((summary.pay + savedWeek.totals.weeklyPay).toFixed(2))
      }),
      { hours: 0, pay: 0 }
    );
  }, [allWeeks]);

  async function loadWeeks() {
    const response = await apiFetch("/api/weeks");
    const data = await response.json();
    setWeeks(data);
    return data;
  }

  async function loadSettings() {
    const response = await apiFetch("/api/settings");
    const data = await response.json();
    setHourlyRate(data.hourlyRate ?? "");
    setHasSavedHourlyRate(data.hourlyRate !== null && data.hourlyRate !== undefined && data.hourlyRate !== "");
    return data;
  }

  async function saveActiveTimer(timer) {
    const response = await apiFetch("/api/settings/timer", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(timer)
    });

    if (!response.ok) throw new Error("Timer save failed");
    return response.json();
  }

  async function clearActiveTimer() {
    const response = await apiFetch("/api/settings/timer", { method: "DELETE" });
    if (!response.ok) throw new Error("Timer clear failed");
  }

  async function saveSettings(nextHourlyRate = hourlyRate) {
    const response = await apiFetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hourlyRate: nextHourlyRate })
    });

    if (!response.ok) throw new Error("Rate save failed");
    const saved = await response.json();
    setHourlyRate(saved.hourlyRate ?? "");
    setHasSavedHourlyRate(saved.hourlyRate !== null && saved.hourlyRate !== undefined && saved.hourlyRate !== "");
  }

  async function saveRateAndContinue() {
    if (!hourlyRate || Number(hourlyRate) <= 0) {
      setStatus("Enter your hourly rate to continue.");
      return;
    }

    try {
      await saveSettings();
      setActiveView("work");
      setStatus("Hourly rate saved.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function loadWeek(weekStart) {
    setStatus("Loading week...");
    const response = await apiFetch(`/api/weeks/${weekStart}`);
    const data = await response.json();
    const normalized = { ...createWeek(weekStart), ...data, isPaid: Boolean(data.isPaid) };
    const visibleWeek = activeTimer?.weekStart === normalized.weekStart
      ? {
          ...normalized,
          days: normalized.days.map((day, dayIndex) =>
            dayIndex === activeTimer.dayIndex ? { ...day, start: activeTimer.startTime, end: "" } : day
          )
        }
      : normalized;
    setWeek(visibleWeek);
    setDirtyDayKeys([]);
    setStatus("Ready");
    return visibleWeek;
  }

  useEffect(() => {
    if (!authToken) {
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    Promise.all([loadSettings(), loadWeeks()])
      .then(async ([settings, savedWeeks]) => {
        const legacyRate = savedWeeks.find((savedWeek) => savedWeek.hourlyRate != null)?.hourlyRate;
        if (settings.hourlyRate == null && legacyRate != null) {
          setHourlyRate(legacyRate);
          setHasSavedHourlyRate(true);
          saveSettings(legacyRate).catch(() => {});
        }
        const restoredTimer = settings.activeTimer?.weekStart ? settings.activeTimer : null;

        if (restoredTimer) {
          await loadWeek(restoredTimer.weekStart);
          setWeek((current) => ({
            ...current,
            days: current.days.map((day, dayIndex) =>
              dayIndex === restoredTimer.dayIndex
                ? { ...day, start: restoredTimer.startTime, end: "" }
                : day
            )
          }));
          setActiveTimer({
            weekStart: restoredTimer.weekStart,
            dayIndex: restoredTimer.dayIndex,
            startedAt: new Date(restoredTimer.startedAt).getTime(),
            startTime: restoredTimer.startTime
          });
          setNow(new Date());
          setStatus(`${dayNames[restoredTimer.dayIndex]} timer restored. Click Stop shift when finished.`);
          return;
        }

        await loadWeek(getMonday());
      })
      .catch(() => setStatus("Connect MongoDB and start the API to load saved weeks."))
      .finally(() => setIsLoaded(true));
  }, [authToken]);

  useEffect(() => {
    if (!activeTimer) return undefined;

    const interval = window.setInterval(() => setNow(new Date()), 250);
    return () => window.clearInterval(interval);
  }, [activeTimer]);

  function updateDay(index, field, value) {
    if (isWeekEditingLocked) {
      setStatus("Stop the running shift before editing week records.");
      return;
    }

    const dayKey = week.days[index]?.key;
    if (dayKey) {
      setDirtyDayKeys((keys) => (keys.includes(dayKey) ? keys : [...keys, dayKey]));
    }

    setWeek((current) => ({
      ...current,
      days: current.days.map((day, dayIndex) => (dayIndex === index ? { ...day, [field]: value } : day))
    }));
  }

  async function clearDay(index) {
    if (isWeekEditingLocked) {
      setStatus("Stop the running shift before clearing week records.");
      return;
    }

    const nextWeek = {
      ...week,
      days: week.days.map((day, dayIndex) =>
        dayIndex === index ? { ...day, start: "", end: "", breakMinutes: 0, notes: "" } : day
      )
    };

    setIsSaving(true);
    setStatus(`Clearing ${week.days[index].label}...`);

    if (activeTimer?.weekStart === week.weekStart && activeTimer.dayIndex === index) {
      setActiveTimer(null);
    }

    setWeek(nextWeek);

    try {
      if (activeTimer?.weekStart === week.weekStart && activeTimer.dayIndex === index) {
        await clearActiveTimer();
      }

      const response = await apiFetch(`/api/weeks/${nextWeek.weekStart}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nextWeek, hourlyRate: null })
      });

      if (!response.ok) throw new Error("Clear failed");

      const saved = await response.json();
      setWeek({ ...saved, isPaid: Boolean(saved.isPaid) });
      await loadWeeks();
      setDirtyDayKeys((keys) => keys.filter((key) => key !== nextWeek.days[index]?.key));
      setStatus(`${week.days[index].label} cleared and saved.`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleDayTimer(index) {
    const clockTime = formatClockTime();
    const isRunning = activeTimer?.weekStart === week.weekStart && activeTimer.dayIndex === index;

    if (isRunning) {
      const nextWeek = {
        ...week,
        days: week.days.map((day, dayIndex) => (dayIndex === index ? { ...day, end: clockTime } : day))
      };

      setIsSaving(true);
      setStatus("Stopping shift and saving...");

      try {
        await clearActiveTimer();
        setWeek(nextWeek);
        setActiveTimer(null);

        const response = await apiFetch(`/api/weeks/${nextWeek.weekStart}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...nextWeek, hourlyRate: null })
        });

        if (!response.ok) throw new Error("Shift stopped, but week save failed.");

        const saved = await response.json();
        setWeek({ ...saved, isPaid: Boolean(saved.isPaid) });
        await loadWeeks();
        setStatus(`${week.days[index].label} stopped at ${clockTime}. Week saved automatically.`);
      } catch (error) {
        setStatus(error.message);
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (activeTimer) {
      setStatus("Stop the running timer before starting another day.");
      return;
    }

    const startedAt = Date.now();
    const nextWeek = {
      ...week,
      days: week.days.map((day, dayIndex) =>
        dayIndex === index ? { ...day, start: clockTime, end: "" } : day
      )
    };
    const nextTimer = {
      weekStart: week.weekStart,
      dayIndex: index,
      startedAt: new Date(startedAt).toISOString(),
      startTime: clockTime
    };

    try {
      await saveActiveTimer(nextTimer);
      const response = await apiFetch(`/api/weeks/${nextWeek.weekStart}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nextWeek, hourlyRate: null })
      });

      if (!response.ok) throw new Error("Timer started, but week save failed.");
      await loadWeeks();
    } catch (error) {
      setStatus(error.message);
      return;
    }

    setNow(new Date());
    setWeek(nextWeek);
    setActiveTimer({ ...nextTimer, startedAt });
    setStatus(`${week.days[index].label} timer started at ${clockTime}. Week record is available.`);
  }

  function fillSampleWeek() {
    if (isWeekEditingLocked) {
      setStatus("Stop the running shift before editing week records.");
      return;
    }

    const sample = [
      ["09:00", "17:00", 30, "Morning shift"],
      ["10:00", "18:00", 30, ""],
      ["09:30", "16:30", 30, ""],
      ["12:00", "20:00", 30, "Late shift"],
      ["08:00", "14:00", 0, ""],
      ["", "", 0, ""],
      ["", "", 0, ""]
    ];

    setWeek((current) => ({
      ...current,
      isPaid: false,
      days: current.days.map((day, index) => ({
        ...day,
        start: sample[index][0],
        end: sample[index][1],
        breakMinutes: sample[index][2],
        notes: sample[index][3]
      }))
    }));
    setStatus("Sample week added. Save when ready.");
  }

  async function saveWeek() {
    if (isWeekEditingLocked) {
      setStatus("Stop the running shift before saving week records.");
      return;
    }

    setIsSaving(true);
    setStatus("Saving...");

    try {
      await saveSettings();
      const response = await apiFetch(`/api/weeks/${week.weekStart}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...week, hourlyRate: null })
      });

      if (!response.ok) throw new Error("Save failed");

      const saved = await response.json();
      setWeek({ ...saved, isPaid: Boolean(saved.isPaid) });
      await loadWeeks();
      setDirtyDayKeys([]);
      setStatus("Saved");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function saveDay(index) {
    if (isWeekEditingLocked) {
      setStatus("Stop the running shift before saving week records.");
      return;
    }

    const day = week.days[index];
    if (!day) return;

    setIsSaving(true);
    setStatus(`Saving ${day.label}...`);

    try {
      const response = await apiFetch(`/api/weeks/${week.weekStart}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...week, hourlyRate: null })
      });

      if (!response.ok) throw new Error(`${day.label} save failed`);

      const saved = await response.json();
      setWeek({ ...saved, isPaid: Boolean(saved.isPaid) });
      await loadWeeks();
      setDirtyDayKeys((keys) => keys.filter((key) => key !== day.key));
      setStatus(`${day.label} saved.`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  function getWeeksExport(selectedWeeks) {
    const rate = Number(hourlyRate || 0);
    const weeks = selectedWeeks.map((selectedWeek) => {
      const days = selectedWeek.days.map((day) => {
        const hours = calculateDayHours(day);
        return {
          weekStart: selectedWeek.weekStart,
          status: selectedWeek.isPaid ? "Paid" : "Unpaid",
          day: day.label,
          date: day.date,
          start: formatExportTime(day.start),
          end: formatExportTime(day.end),
          breakMinutes: Number(day.breakMinutes || 0),
          hours,
          pay: Number((hours * rate).toFixed(2)),
          notes: day.notes || ""
        };
      });
      const totalHours = Number(days.reduce((sum, day) => sum + day.hours, 0).toFixed(2));

      return {
        weekStart: selectedWeek.weekStart,
        status: selectedWeek.isPaid ? "Paid" : "Unpaid",
        days,
        totalHours,
        totalPay: Number((totalHours * rate).toFixed(2))
      };
    });
    const rows = weeks.flatMap((weekReport) => weekReport.days);

    const totalHours = Number(rows.reduce((sum, row) => sum + row.hours, 0).toFixed(2));
    const totalPay = Number((totalHours * rate).toFixed(2));
    const title = selectedWeeks.length === 1
      ? `Week ${selectedWeeks[0].weekStart}`
      : `${selectedWeeks.length} selected weeks`;

    return {
      title,
      filenameBase: selectedWeeks.length === 1 ? `week-${selectedWeeks[0].weekStart}` : "selected-weeks",
      rate,
      totalHours,
      totalPay,
      status: selectedWeeks.length === 1 ? (selectedWeeks[0].isPaid ? "Paid" : "Unpaid") : "Multiple weeks",
      weeks,
      rows
    };
  }

  function buildExportHtml(report) {
    const weekTables = report.weeks.map((weekReport) => {
      const rows = weekReport.days.map((day) => `
        <tr>
          <td>${escapeHtml(day.date)}</td>
          <td>${escapeHtml(day.day)}</td>
          <td>${escapeHtml(day.start)}</td>
          <td>${escapeHtml(day.end)}</td>
          <td>${escapeHtml(day.hours.toFixed(2))}</td>
        </tr>
      `).join("");

      return `
        <section class="week">
          <h2>Week starting ${escapeHtml(weekReport.weekStart)}</h2>
          <p>${escapeHtml(weekReport.status)}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Day</th><th>Start time</th><th>End time</th><th>Daily hours</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr><td colspan="4">Total hours this week</td><td>${escapeHtml(weekReport.totalHours.toFixed(2))}</td></tr>
            </tfoot>
          </table>
        </section>
      `;
    }).join("");

    return `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(report.title)}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #17212b; margin: 32px; }
            h1 { margin: 0 0 8px; font-size: 28px; }
            h2 { margin: 28px 0 4px; font-size: 20px; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 20px 0; }
            .summary div { border: 1px solid #dbe7e4; padding: 12px; border-radius: 6px; }
            .summary span { display: block; color: #66737b; font-size: 12px; font-weight: 700; text-transform: uppercase; }
            .summary strong { display: block; margin-top: 6px; font-size: 18px; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; }
            th, td { border: 1px solid #dbe7e4; padding: 8px; text-align: left; font-size: 13px; }
            th { background: #17212b; color: #fff; }
            tfoot td { font-weight: 700; background: #eef7f4; }
            @media print { body { margin: 18px; } }
          </style>
        </head>
        <body>
          <h1>Punch In Punch Out Timesheet</h1>
          <p>${escapeHtml(report.title)} - ${escapeHtml(report.status)}</p>
          <section class="summary">
            <div><span>Total hours</span><strong>${escapeHtml(report.totalHours.toFixed(2))}</strong></div>
            <div><span>Total pay</span><strong>${escapeHtml(money(report.totalPay))}</strong></div>
            <div><span>Hourly rate</span><strong>${escapeHtml(money(report.rate))}</strong></div>
            <div><span>Status</span><strong>${escapeHtml(report.status)}</strong></div>
          </section>
          ${weekTables}
        </body>
      </html>`;
  }

  function exportSelectedWeeks() {
    if (!exportWeeks.length) {
      setStatus("Select at least one week to export.");
      return;
    }

    const report = getWeeksExport(exportWeeks);
    const format = exportFormat;

    if (format === "txt") {
      downloadBlob(getReportTextLines(report).join("\n"), `${report.filenameBase}.txt`, "text/plain;charset=utf-8");
    }

    if (format === "csv") {
      const rows = [
        ["Week", report.title],
        ["Status", report.status],
        ["Total Hours", report.totalHours.toFixed(2)],
        ["Total Pay", money(report.totalPay)],
        ["Hourly Rate", money(report.rate)],
        [],
        ...report.weeks.flatMap((weekReport) => [
          [`Week starting ${weekReport.weekStart}`, weekReport.status],
          ["Date", "Day", "Start Time", "End Time", "Daily Hours"],
          ...weekReport.days.map((day) => [
            day.date,
            day.day,
            day.start,
            day.end,
            day.hours.toFixed(2)
          ]),
          ["Total hours this week", "", "", "", weekReport.totalHours.toFixed(2)],
          []
        ])
      ];
      downloadBlob(rows.map((row) => row.map(escapeCsv).join(",")).join("\n"), `${report.filenameBase}.csv`, "text/csv;charset=utf-8");
    }

    if (format === "doc") {
      downloadBlob(buildExportHtml(report), `${report.filenameBase}.doc`, "application/msword;charset=utf-8");
    }

    if (format === "pdf") {
      downloadBlob(buildPdf(report), `${report.filenameBase}.pdf`, "application/pdf");
    }

    setStatus(`${report.title} export ready.`);
  }

  function toggleExportWeek(weekStart) {
    setExportWeekStarts((starts) =>
      starts.includes(weekStart)
        ? starts.filter((start) => start !== weekStart)
        : [...starts, weekStart]
    );
  }

  async function togglePaidStatus() {
    if (isWeekEditingLocked) {
      setStatus("Stop the running shift before changing payment status.");
      return;
    }

    const nextWeek = { ...week, isPaid: !week.isPaid, hourlyRate: null };
    setWeek(nextWeek);
    setStatus(nextWeek.isPaid ? "Marking paid..." : "Marking unpaid...");

    try {
      const response = await apiFetch(`/api/weeks/${nextWeek.weekStart}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextWeek)
      });

      if (!response.ok) throw new Error("Status save failed");

      const saved = await response.json();
      setWeek({ ...saved, isPaid: Boolean(saved.isPaid) });
      await loadWeeks();
      setStatus(saved.isPaid ? "Marked paid" : "Marked unpaid");
    } catch (error) {
      setWeek((current) => ({ ...current, isPaid: !nextWeek.isPaid }));
      setStatus(error.message);
    }
  }

  async function deleteWeek() {
    if (isWeekEditingLocked) {
      setStatus("Stop the running shift before deleting week records.");
      return;
    }

    const confirmed = window.confirm(`Delete the week starting ${week.weekStart}?`);
    if (!confirmed) return;

    setStatus("Deleting...");
    if (activeTimer?.weekStart === week.weekStart) {
      await clearActiveTimer();
      setActiveTimer(null);
    }
    await apiFetch(`/api/weeks/${week.weekStart}`, { method: "DELETE" });
    await loadWeeks();
    const fresh = createWeek(week.weekStart);
    setWeek(fresh);
    setStatus("Week deleted");
  }

  function changeWeekStart(value) {
    if (!value) return;

    loadWeek(value).catch(() => {
      setWeek(createWeek(value));
      setStatus("New unsaved week");
    });
  }

  function navigateWeek(direction) {
    const nextWeekStart = direction === "current" ? getMonday() : addDays(week.weekStart, direction === "previous" ? -7 : 7);
    changeWeekStart(nextWeekStart);
  }

  function openView(view) {
    setActiveView(view);

    if (view === "work" && activeTimer?.weekStart && activeTimer.weekStart !== week.weekStart) {
      loadWeek(activeTimer.weekStart).catch(() => {
        setStatus("Could not load the running shift week.");
      });
    }
  }

  function renderDayRow(day, index, mode = "full") {
    const isRunning = activeTimer?.weekStart === week.weekStart && activeTimer.dayIndex === index;
    const isCompleted = Boolean(day.start && day.end && !isRunning);
    const anotherTimerRunning = Boolean(activeTimer) && !isRunning;
    const isEditable = mode !== "today" && !isRunning && !isWeekEditingLocked;
    const disableRecordControls = mode !== "today" && isWeekEditingLocked;
    const isDirty = mode !== "today" && dirtyDayKeys.includes(day.key);

    return (
      <article className={`day-row ${mode === "today" ? "today-row" : ""} ${isRunning ? "is-running" : ""}`} key={day.key}>
        <div className="day-name">
          <strong>{day.label}</strong>
          <span>{day.date}</span>
        </div>
        <div className="punch-control">
          <button
            className={`punch-button ${isRunning ? "running" : ""} ${isCompleted ? "completed" : ""}`}
            type="button"
            onClick={() => toggleDayTimer(index)}
            disabled={anotherTimerRunning || isCompleted || isSaving || disableRecordControls}
          >
            <Icon name={isRunning || isCompleted ? "stop" : "play"} />
            {isRunning ? "Stop shift" : isCompleted ? "Completed" : "Start shift"}
          </button>
          {isEditable ? (
            <div className="shift-edit-fields">
              <label>
                <span>Start</span>
                <input
                  type="time"
                  value={day.start}
                  onChange={(event) => updateDay(index, "start", event.target.value)}
                  disabled={isWeekEditingLocked}
                  aria-label={`${day.label} start time`}
                />
              </label>
              <label>
                <span>End</span>
                <input
                  type="time"
                  value={day.end}
                  onChange={(event) => updateDay(index, "end", event.target.value)}
                  disabled={isWeekEditingLocked}
                  aria-label={`${day.label} end time`}
                />
              </label>
            </div>
          ) : (
            <div className="time-stamps">
              <span>Start <strong>{formatDisplayTime(day.start, timeFormat)}</strong></span>
              <span>End <strong>{day.end ? formatDisplayTime(day.end, timeFormat) : isRunning ? "Running" : "--:--"}</strong></span>
            </div>
          )}
          {isRunning && <span className="live-clock">{formatRunningTime(day, activeTimer, now)}</span>}
        </div>
        <label className="pretty-field compact-field">
          <FieldIcon name="coffee" />
          <input
            type="number"
            min="0"
            step="5"
            placeholder="0"
            value={day.breakMinutes}
            onChange={(event) => updateDay(index, "breakMinutes", event.target.value)}
            onWheel={(event) => event.currentTarget.blur()}
            disabled={isWeekEditingLocked && mode !== "today"}
            aria-label={`${day.label} break minutes`}
          />
        </label>
        <output>{totals.daily[index].toFixed(2)}</output>
        <label className="pretty-field note-field">
          <FieldIcon name="note" />
          <input
            type="text"
            value={day.notes}
            placeholder="Optional note"
            onChange={(event) => updateDay(index, "notes", event.target.value)}
            disabled={isWeekEditingLocked && mode !== "today"}
          />
        </label>
        <div className="day-actions">
          {isDirty && (
            <button className="row-save-button" type="button" onClick={() => saveDay(index)} disabled={isSaving || disableRecordControls}>
              <Icon name="save" />
              Save
            </button>
          )}
          <button className="clear-day-button" type="button" onClick={() => clearDay(index)} disabled={isSaving || disableRecordControls}>
            <Icon name="clear" />
            Clear
          </button>
        </div>
      </article>
    );
  }

  const navigationItems = [
    { id: "work", label: "Work", icon: "work" },
    { id: "dashboard", label: "Dashboard", icon: "chart" },
    { id: "records", label: "Week records", icon: "archive" }
  ];

  if (!isLoaded) {
    return (
      <main className="app-shell setup-shell">
        <section className="setup-panel">
          <p className="eyebrow">Punch in</p>
          <h1>Loading your workspace.</h1>
          <p className="hero-copy">{status}</p>
        </section>
      </main>
    );
  }

  if (!authToken) {
    return (
      <main className="app-shell setup-shell">
        <section className="setup-panel auth-panel">
          <p className="eyebrow">Punch in</p>
          <h1>{authMode === "signup" ? "Create your account." : "Welcome back."}</h1>
          <p className="hero-copy">Each user gets their own hourly rate, active timer, and timesheets.</p>
          <form className="auth-form" onSubmit={submitAuth}>
            {authMode === "signup" && (
              <label className="pretty-field">
                <FieldIcon name="user" />
                <input
                  type="text"
                  placeholder="Full name"
                  value={authForm.name}
                  onChange={(event) => setAuthForm((form) => ({ ...form, name: event.target.value }))}
                  required
                />
              </label>
            )}
            <label className="pretty-field">
              <FieldIcon name="mail" />
              <input
                type="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(event) => setAuthForm((form) => ({ ...form, email: event.target.value }))}
                required
              />
            </label>
            <div className="pretty-field password-field">
              <FieldIcon name="lock" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={authForm.password}
                onChange={(event) => setAuthForm((form) => ({ ...form, password: event.target.value }))}
                required
                minLength={6}
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <Icon name={showPassword ? "eyeOff" : "eye"} />
              </button>
            </div>
            <button className="primary-button" type="submit" disabled={isAuthSubmitting}>
              <Icon name="check" />
              {isAuthSubmitting
                ? authMode === "signup" ? "Signing up..." : "Signing in..."
                : authMode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>
          <button
            className="link-button"
            type="button"
            disabled={isAuthSubmitting}
            onClick={() => setAuthMode((mode) => (mode === "signup" ? "login" : "signup"))}
          >
            {authMode === "signup" ? "Already have an account? Sign in" : "New user? Create an account"}
          </button>
          <p className="status-text">{status}</p>
        </section>
      </main>
    );
  }

  if (!hasSavedHourlyRate) {
    return (
      <main className="app-shell setup-shell">
        <section className="setup-panel">
          <p className="eyebrow">Before you start</p>
          <h1>Set your hourly rate.</h1>
          <p className="hero-copy">This is saved once and reused for every week until you change it from the dashboard.</p>
          <div className="setup-actions">
            <label className="pretty-field rate-field">
              <FieldIcon name="dollar" />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="35.00"
                value={hourlyRate}
                onChange={(event) => setHourlyRate(event.target.value)}
                aria-label="Hourly rate"
              />
            </label>
            <button className="primary-button" type="button" onClick={saveRateAndContinue}>
              <Icon name="check" />
              Continue
            </button>
          </div>
          <p className="status-text">{status}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-frame">
      <aside className={`sidebar ${isMobileMenuOpen ? "menu-open" : ""}`} aria-label="Main navigation">
        <div className="brand-mark">
          <span>PI</span>
          <div>
            <strong>Punch In</strong>
            <small>Hours and pay</small>
          </div>
        </div>
        <button
          className="hamburger-button"
          type="button"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
        >
          <Icon name={isMobileMenuOpen ? "clear" : "menu"} />
        </button>
        <nav className="side-nav">
          {navigationItems.map((item) => (
            <button
              className={activeView === item.id ? "active" : ""}
              type="button"
              key={item.id}
              onClick={() => {
                openView(item.id);
                setIsMobileMenuOpen(false);
              }}
            >
              <Icon name={item.icon} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-status">
          {currentUser && <span>{currentUser.name}</span>}
          <span>Hourly rate</span>
          <strong>{money(Number(hourlyRate || 0))}</strong>
          <button className="logout-button" type="button" onClick={logout}>Logout</button>
        </div>
      </aside>

      <section className="workspace">
        {shouldShowToast && (
          <div className={`toast-notice ${statusKind}`} role="status" aria-live="polite">
            <Icon name={statusKind === "error" ? "clear" : statusKind === "loading" ? "clock" : "check"} />
            <div>
              <strong>{statusKind === "error" ? "Needs attention" : statusKind === "loading" ? "Working on it" : "Success"}</strong>
              <span>{status}</span>
            </div>
            <button type="button" onClick={() => setStatus("Ready")} aria-label="Dismiss notification">
              <Icon name="clear" />
            </button>
          </div>
        )}

        {activeView !== "work" && (
          <header className="workspace-header">
            <div>
              <p className="eyebrow">{activeView === "dashboard" ? "Dashboard" : "Records"}</p>
              <h1>{activeView === "dashboard" ? "Your work overview." : "Week records."}</h1>
            </div>
          <button className="ghost-button" type="button" onClick={() => openView("records")}>
              <Icon name="archive" />
              Week records
            </button>
          </header>
        )}

        {activeView === "work" && (
          <section className="work-view">
            <div className="today-card">
              <div className="live-earnings-panel">
                <div className="live-metric-card">
                  <span>Hours worked</span>
                  <strong key={`hours-${activeWorkHoursText}`} className={isWorkTimerRunning ? "animated-number" : ""}>{activeWorkHoursText}</strong>
                </div>
                <div className="live-metric-card">
                  <span>Earned so far</span>
                  <strong key={`pay-${activeWorkPayText}`} className={isWorkTimerRunning ? "animated-number money-number" : "money-number"}>{activeWorkPayText}</strong>
                </div>
              </div>
              <div className="today-card-header">
                <div>
                  <p className="eyebrow">Current shift</p>
                  <h2>{currentWorkDay.label}</h2>
                  <span>{currentWorkDay.date}</span>
                </div>
                <div className="time-format-toggle" role="group" aria-label="Time format">
                  <button className={timeFormat === "12" ? "active" : ""} type="button" onClick={() => setTimeFormat("12")}>
                    12h
                  </button>
                  <button className={timeFormat === "24" ? "active" : ""} type="button" onClick={() => setTimeFormat("24")}>
                    24h
                  </button>
                </div>
              </div>
              <div className="mini-summary work-summary">
                <article>
                  <span>This week</span>
                  <strong>{totals.weeklyHours.toFixed(2)} hrs</strong>
                </article>
                <article>
                  <span>Estimated pay</span>
                  <strong>{money(totals.weeklyPay)}</strong>
                </article>
                <article>
                  <span>Status</span>
                  <strong>{week.isPaid ? "Paid" : "Unpaid"}</strong>
                </article>
              </div>
              <section className={`primary-punch-panel ${isWorkTimerRunning ? "is-running" : ""}`} aria-label="Shift control">
                <div>
                  <span>{isWorkTimerRunning ? "Shift is running" : currentWorkDayCompleted ? "Shift completed" : "Ready for today"}</span>
                  <strong>{isWorkTimerRunning ? formatRunningTime(currentWorkDay, activeTimer, now) : currentWorkDayCompleted ? "Done" : "Start when ready"}</strong>
                </div>
                <button
                  className={`primary-punch-button ${isWorkTimerRunning ? "running" : ""} ${currentWorkDayCompleted ? "completed" : ""}`}
                  type="button"
                  onClick={() => toggleDayTimer(activeWorkIndex)}
                  disabled={hasOtherActiveTimer || currentWorkDayCompleted || isSaving}
                >
                  <Icon name={isWorkTimerRunning || currentWorkDayCompleted ? "stop" : "play"} />
                  {isWorkTimerRunning ? "Stop shift" : currentWorkDayCompleted ? "Completed" : "Start shift"}
                </button>
              </section>
              <div className="today-table">
                {renderDayRow(currentWorkDay, activeWorkIndex, "today")}
              </div>
              <div className="actions split-actions">
                <button className="ghost-button" type="button" onClick={() => openView("records")}>
                  <Icon name="menu" />
                  View all days
                </button>
              </div>
            </div>
          </section>
        )}

        {activeView === "dashboard" && (
          <section className="dashboard-view">
            <section className="dashboard-hero" aria-label="Dashboard summary">
              <article className="dashboard-money-card">
                <span>Total money earned</span>
                <strong>{money(allWeeksSummary.pay)}</strong>
                <small>{allWeeksSummary.hours.toFixed(2)} total hours recorded</small>
              </article>
              <article className="dashboard-small-card">
                <span>This week</span>
                <strong>{totals.weeklyHours.toFixed(2)} hrs</strong>
                <small>{money(totals.weeklyPay)} estimated</small>
              </article>
              <article className="dashboard-small-card alert-card">
                <span>Unpaid weeks</span>
                <strong>{unpaidWeeks.length}</strong>
                <small>{money(unpaidWeeks.reduce((sum, savedWeek) => sum + savedWeek.totals.weeklyPay, 0))} pending</small>
              </article>
            </section>

            <section className="dashboard-rate-panel" aria-label="Hourly rate">
              <div>
                <span>Hourly rate</span>
                <strong>{money(Number(hourlyRate || 0))}</strong>
              </div>
              <label className="pretty-field rate-field">
                <FieldIcon name="dollar" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="35.00"
                  value={hourlyRate}
                  onChange={(event) => setHourlyRate(event.target.value)}
                  onWheel={(event) => event.currentTarget.blur()}
                  aria-label="Hourly rate"
                />
              </label>
              <button className="primary-button rate-save-button" type="button" onClick={saveRateAndContinue}>
                <Icon name="save" />
                Save rate
              </button>
            </section>

            <section className="export-panel dashboard-export-panel" aria-label="Export weeks">
              <div>
                <p className="eyebrow">Export</p>
                <h2>Export week reports</h2>
                <span className="table-hint">Select one or more saved weeks, choose a format, then export.</span>
              </div>

              <div className="export-control-grid">
                <div className="export-field">
                  <span>Weeks</span>
                  <div className="export-week-list">
                    {allWeeks.length ? (
                      allWeeks.map((savedWeek) => (
                        <label className="export-week-option" key={savedWeek.weekStart}>
                          <input
                            type="checkbox"
                            checked={exportWeekStarts.includes(savedWeek.weekStart)}
                            onChange={() => toggleExportWeek(savedWeek.weekStart)}
                          />
                          <span>
                            <strong>{savedWeek.weekStart}</strong>
                            <small>{savedWeek.totals.weeklyHours.toFixed(2)} hrs - {money(savedWeek.totals.weeklyPay)}</small>
                          </span>
                        </label>
                      ))
                    ) : (
                      <p className="empty-note">No saved weeks to export.</p>
                    )}
                  </div>
                </div>

                <label>
                  <span>Format</span>
                  <span className="pretty-field">
                    <FieldIcon name="download" />
                    <select value={exportFormat} onChange={(event) => setExportFormat(event.target.value)}>
                      <option value="pdf">PDF</option>
                      <option value="txt">Text</option>
                      <option value="csv">Excel CSV</option>
                      <option value="doc">Word</option>
                    </select>
                  </span>
                </label>

                <button className="primary-button" type="button" onClick={exportSelectedWeeks}>
                  <Icon name="download" />
                  Export
                </button>
              </div>
            </section>
          </section>
        )}

        {activeView === "records" && (
          <section className="records-view">
            {isWeekEditingLocked && (
              <div className="records-lock-banner">
                <Icon name="clock" />
                <span>View only while a shift is running. Stop the shift to edit, save, delete, clear, or change payment status.</span>
              </div>
            )}

            <section className="records-hero" aria-label="Selected week summary">
              <article className="records-week-card">
                <span>Selected week</span>
                <strong>{week.weekStart}</strong>
                <small>{week.isPaid ? "Paid" : "Unpaid until marked paid"}</small>
              </article>
              <article className="records-stat-card">
                <span>Hours</span>
                <strong>{totals.weeklyHours.toFixed(2)}</strong>
              </article>
              <article className="records-stat-card money-card">
                <span>Pay</span>
                <strong>{money(totals.weeklyPay)}</strong>
              </article>
            </section>

            <section className="week-navigation" aria-label="Week navigation">
              <div className="week-jump">
                <button type="button" onClick={() => navigateWeek("previous")}>
                  <Icon name="chevronLeft" />
                  Previous
                </button>
                <button type="button" onClick={() => navigateWeek("current")}>
                  <Icon name="calendar" />
                  Current
                </button>
                <button type="button" onClick={() => navigateWeek("next")}>
                  Next
                  <Icon name="chevronRight" />
                </button>
              </div>
              <button className={week.isPaid ? "status-button paid" : "status-button"} type="button" onClick={togglePaidStatus}>
                <Icon name={week.isPaid ? "undo" : "check"} />
                {isWeekEditingLocked ? "Locked while running" : week.isPaid ? "Mark unpaid" : "Mark paid"}
              </button>
            </section>

            <section className="toolbar" aria-label="Week controls">
              <label>
                <span>Week starting</span>
                <span className="pretty-field">
                  <FieldIcon name="calendar" />
                  <input type="date" value={week.weekStart} onChange={(event) => changeWeekStart(event.target.value)} />
                </span>
              </label>

              <label>
                <span>Saved weeks</span>
                <span className="pretty-field">
                  <FieldIcon name="archive" />
                  <select value={week.weekStart} onChange={(event) => changeWeekStart(event.target.value)}>
                    <option value={week.weekStart}>Current week</option>
                    {weeks.map((savedWeek) => (
                      <option value={savedWeek.weekStart} key={savedWeek.weekStart}>
                        {savedWeek.weekStart}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
            </section>

            <section className={`week-browser ${isPaymentOpen ? "open" : "collapsed"}`} aria-label="Saved weeks browser">
              <button
                className="accordion-trigger"
                type="button"
                aria-expanded={isPaymentOpen}
                onClick={() => setIsPaymentOpen((open) => !open)}
              >
                <span className="accordion-label">
                  <span className="eyebrow">Payment status</span>
                  <span className="accordion-heading">
                    {weekView === "paid" ? "Paid weeks" : weekView === "all" ? "All saved weeks" : "Weeks not paid"}
                  </span>
                </span>
                <span className="accordion-summary">
                  <span>{viewSummary.hours.toFixed(2)} hours</span>
                  <strong>{viewSummary.pay ? money(viewSummary.pay) : "--"}</strong>
                  <Icon name="chevronDown" />
                </span>
              </button>

              {isPaymentOpen && (
                <div className="accordion-body">
                  <div className="panel-actions">
                    <div className="tab-list" role="tablist" aria-label="Filter saved weeks">
                      <button className={weekView === "unpaid" ? "active" : ""} type="button" onClick={() => setWeekView("unpaid")}>
                        Unpaid
                      </button>
                      <button className={weekView === "paid" ? "active" : ""} type="button" onClick={() => setWeekView("paid")}>
                        Paid
                      </button>
                      <button className={weekView === "all" ? "active" : ""} type="button" onClick={() => setWeekView("all")}>
                        All
                      </button>
                    </div>
                    <div className="browser-total">
                      <span>{viewSummary.hours.toFixed(2)} hours</span>
                      <strong>{viewSummary.pay ? money(viewSummary.pay) : "--"}</strong>
                    </div>
                  </div>

                  {visibleWeeks.length ? (
                    <div className="week-list">
                      {visibleWeeks.map((savedWeek) => (
                        <button
                          className={`week-item ${savedWeek.isPaid ? "paid" : "unpaid"} ${
                            savedWeek.weekStart === week.weekStart ? "selected" : ""
                          }`}
                          type="button"
                          key={savedWeek.weekStart}
                          onClick={() => changeWeekStart(savedWeek.weekStart)}
                        >
                          <span>
                            <strong>{savedWeek.weekStart}</strong>
                            <small>{savedWeek.isPaid ? "Paid" : "Not paid"} - {savedWeek.totals.weeklyHours.toFixed(2)} hours</small>
                          </span>
                          <span>{hourlyRate ? money(savedWeek.totals.weeklyPay) : "No rate"}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-note">No {weekView} weeks to show.</p>
                  )}
                </div>
              )}
            </section>

            <section className="days-table" aria-label="Daily hour entries">
              <div className="table-toolbar">
                <div>
                  <p className="eyebrow">Timesheet</p>
                  <h2>All days</h2>
                  <span className="table-hint">
                    {isWeekEditingLocked
                      ? "Week records are view-only while a shift is running. Stop the shift to edit."
                      : "Edit a day, then use the Save button that appears on that row."}
                  </span>
                </div>
                <div className="actions">
                  <button className="sample-button" type="button" onClick={fillSampleWeek}>
                    <Icon name="sparkles" />
                    Sample week
                  </button>
                  <button className="ghost-button" type="button" onClick={deleteWeek}>
                    <Icon name="trash" />
                    Delete week
                  </button>
                </div>
              </div>
              <div className="table-head">
                <span>Day</span>
                <span>Timer</span>
                <span>Break</span>
                <span>Hours</span>
                <span>Note</span>
                <span>Clear</span>
              </div>

              {week.days.map((day, index) => renderDayRow(day, index))}
            </section>
          </section>
        )}

        <footer className="status-bar">
          <span>{status}</span>
          <span>Weeks stay saved until you delete them.</span>
        </footer>
      </section>
    </main>
  );
}

export default App;
