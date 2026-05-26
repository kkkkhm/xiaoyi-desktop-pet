const PERIODS = {
  morning: {
    label: "早晨",
    start: 6 * 60,
    end: 8 * 60 + 59
  },
  forenoon: {
    label: "上午",
    start: 9 * 60,
    end: 11 * 60 + 29
  },
  noon: {
    label: "中午",
    start: 11 * 60 + 30,
    end: 13 * 60 + 29
  },
  afternoon: {
    label: "下午",
    start: 13 * 60 + 30,
    end: 17 * 60 + 59
  },
  evening: {
    label: "晚上",
    start: 18 * 60,
    end: 22 * 60 + 59
  },
  lateNight: {
    label: "深夜",
    start: 23 * 60,
    end: 5 * 60 + 59
  }
};

function minutesOfDay(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes();
}

function getCurrentPeriod(date = new Date()) {
  const minute = minutesOfDay(date);
  for (const [period, range] of Object.entries(PERIODS)) {
    if (range.start <= range.end && minute >= range.start && minute <= range.end) return period;
  }
  return "lateNight";
}

function getCurrentTimeInfo(date = new Date()) {
  const currentPeriod = getCurrentPeriod(date);
  return {
    currentTime: date.toLocaleString("zh-CN", { hour12: false }),
    currentHour: date.getHours(),
    currentPeriod,
    periodDescription: PERIODS[currentPeriod].label
  };
}

module.exports = {
  getCurrentPeriod,
  getCurrentTimeInfo
};
