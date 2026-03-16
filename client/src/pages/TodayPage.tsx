import checkIsMobile from "is-mobile";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { pageMenuAtom } from "../atoms/pageMenu.atom.js";
import { tasksAtom } from "../atoms/tasks.js";
import {
  fetchTodayWeather,
  getTodayWeatherSummary,
  type TodayWeatherSummary,
} from "../lib/today-weather.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { getTodayTasks } from "../lib/task-views.js";
import { loadWeatherLocationSetting } from "../lib/weather-settings.js";
import { TodayPageDesktopView } from "./views/TodayPageDesktopView.js";
import { TodayPageMobileView } from "./views/TodayPageMobileView.js";

export default function TodayPage() {
  const allTasks = useAtomValue(tasksAtom);
  const isLoading = useAtomValue(workspaceLoadingAtom);
  const setPageMenu = useSetAtom(pageMenuAtom);
  const [showCompleted, setShowCompleted] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherLocationName, setWeatherLocationName] = useState<string | null>(null);
  const [weatherSummary, setWeatherSummary] = useState<TodayWeatherSummary | null>(null);
  const isMobile = checkIsMobile();

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
    const location = loadWeatherLocationSetting();
    if (!location) {
      setWeatherLocationName(null);
      setWeatherSummary(null);
      setWeatherLoading(false);
      return;
    }

    setWeatherLocationName(location.name);
    setWeatherLoading(true);
    fetchTodayWeather(location)
      .then((weather) => {
        setWeatherSummary(getTodayWeatherSummary(weather, new Date().toISOString()));
      })
      .catch(() => {
        setWeatherSummary(null);
      })
      .finally(() => setWeatherLoading(false));
  }, []);

  const tasks = getTodayTasks(allTasks, new Date().toISOString(), showCompleted);

  const viewProps = {
    tasks,
    isLoading,
    hideCompleted: !showCompleted,
    weatherLoading,
    weatherLocationName,
    weatherSummary,
  };

  if (isMobile) {
    return <TodayPageMobileView {...viewProps} />;
  }

  return <TodayPageDesktopView {...viewProps} />;
}
