import { useEffect, useState } from "react";
import { useSetAtom } from "jotai";
import { tasksAtom } from "../atoms/tasks.js";
import { api } from "../lib/api.js";
import { getPageTaskListParams, type PageTaskScope } from "../lib/page-tasks.js";

export function usePageTasks(scope: PageTaskScope | null): boolean {
  const setTasks = useSetAtom(tasksAtom);
  const [isLoading, setIsLoading] = useState(scope !== null);
  const scopeKey = scope ? JSON.stringify(scope) : "";

  useEffect(() => {
    if (!scope) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    api.tasks
      .list(getPageTaskListParams(scope))
      .then((tasks) => {
        if (cancelled) return;
        setTasks(tasks);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to load page tasks", error);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [scope, scopeKey, setTasks]);

  return isLoading;
}
