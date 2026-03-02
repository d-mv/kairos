import { useCallback } from "react";
import { useLocation } from "react-router-dom";

export function useIsActive() {
  const location = useLocation();

  return useCallback((path: string) => location.pathname === path, [location.pathname]);
}
