import checkIsMobile from "is-mobile";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { pageMenuAtom } from "../atoms/pageMenu.atom.js";
import { tasksAtom } from "../atoms/tasks.js";
import {
  fetchTodayWeather,
  getTodayWeatherSummary,
  type TodayWeatherSummary,
} from "../lib/today-weather.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { getTodayTasks } from "../lib/task-views.js";
import {
  loadWeatherLocationSetting,
  WEATHER_LOCATION_STORAGE_KEY,
} from "../lib/weather-settings.js";
import { TodayPageDesktopView } from "./views/TodayPageDesktopView.js";
import { TodayPageMobileView } from "./views/TodayPageMobileView.js";

export default function TodayPage() {
  const allTasks = useAtomValue(tasksAtom);
  const isLoading = useAtomValue(workspaceLoadingAtom);
  const setPageMenu = useSetAtom(pageMenuAtom);
  const [showCompleted, setShowCompleted] = useState(false);
  const [weatherSummary, setWeatherSummary] = useState<TodayWeatherSummary | null>(null);
  const [weatherError, setWeatherError] = useState(false);
  const isMobile = useMemo(() => checkIsMobile(), []);

  useEffect(() => {
    setPageMenu([
      {
        label: showCompleted ? "Hide Completed" : "Show Completed",
        onClick: () => setShowCompleted((c) => !c),
      },
    ]);
    return () => setPageMenu([]);
  }, [setPageMenu, showCompleted]);

  useEffect(() => {
    const loadWeather = () => {
      const location = loadWeatherLocationSetting();
      if (!location) {
        setWeatherSummary(null);
        setWeatherError(false);
        return;
      }

      fetchTodayWeather(location)
        .then((weather) => {
          setWeatherSummary(getTodayWeatherSummary(weather));
          setWeatherError(false);
        })
        .catch(() => {
          setWeatherSummary(null);
          setWeatherError(true);
        });
    };

    loadWeather();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === null || e.key === WEATHER_LOCATION_STORAGE_KEY) loadWeather();
    };

    window.addEventListener("kairos:weather-location-changed" as keyof WindowEventMap, loadWeather);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(
        "kairos:weather-location-changed" as keyof WindowEventMap,
        loadWeather,
      );
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const tasks = getTodayTasks(allTasks, new Date().toISOString(), showCompleted);

  const viewProps = {
    tasks,
    isLoading,
    hideCompleted: !showCompleted,
    weatherSummary,
    weatherError,
  };

  if (isMobile) {
    return <TodayPageMobileView {...viewProps} />;
  }

  return <TodayPageDesktopView {...viewProps} />;
}
