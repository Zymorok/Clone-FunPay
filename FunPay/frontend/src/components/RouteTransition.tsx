import { useEffect, useRef, useState, type ReactNode } from "react";

const exitDurationMs = 180;
const enterDurationMs = 240;

type RouteTransitionProps = {
  children: (displayedRoute: string) => ReactNode;
  route: string;
};

type TransitionPhase = "idle" | "leaving" | "entering";

export function RouteTransition({ children, route }: RouteTransitionProps) {
  const [displayedRoute, setDisplayedRoute] = useState(route);
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const displayedRouteRef = useRef(route);

  useEffect(() => {
    if (route === displayedRouteRef.current) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      displayedRouteRef.current = route;
      setDisplayedRoute(route);
      setPhase("idle");
      window.scrollTo({ left: 0, top: 0 });
      return;
    }

    setPhase("leaving");

    const exitTimer = window.setTimeout(() => {
      displayedRouteRef.current = route;
      setDisplayedRoute(route);
      setPhase("entering");
      window.scrollTo({ left: 0, top: 0 });
    }, exitDurationMs);

    const enterTimer = window.setTimeout(() => {
      setPhase("idle");
    }, exitDurationMs + enterDurationMs);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(enterTimer);
    };
  }, [route]);

  return (
    <div className={`route-transition route-transition--${phase}`} data-route={displayedRoute}>
      {children(displayedRoute)}
    </div>
  );
}
