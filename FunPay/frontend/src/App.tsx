import { useEffect, useState } from "react";
import { Navbar } from "./components/Navbar";
import { Register } from "./pages/Register";
import { RouteStub, type RouteStubInfo } from "./pages/RouteStub";

export type Theme = "light" | "dark";

const themeStorageKey = "funpay-theme";
const routeVideoPath = "/assets/website/backgrounds/routes";
const devBackendUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5090";

const routeStubs: Record<string, RouteStubInfo> = {
  "/catalog": {
    title: "Каталог",
    text: "Скоро здесь появятся игры, категории и первые объявления продавцов. А пока любуйтесь парочкой влюбленных Дэвида Мартинес + Люси из вселенной Cyberpunk: Edgerunners 🌙",
    video: `${routeVideoPath}/background_catalog.webm`,
  },
  "/orders": {
    title: "Мои заказы",
    text: "Здесь будет история заказов, статусы сделок и быстрый переход к продавцу. А пока наслаждайтесь ониме девочками 💔",
    video: `${routeVideoPath}/background_orders.webm`
  },
  "/chat": {
    title: "Чат",
    text: "Позже тут появится переписка покупателя и продавца внутри заказа. Даже не думайте отбирать у Виталика кошко-жену на фоне 😸",
    video: `${routeVideoPath}/background_chat.webm`
  },
  "/support": {
    title: "Поддержка",
    text: "Этот раздел оставим для помощи пользователям и решения спорных ситуаций. Люси со Шреком многое дерьм0 поведали в этом мире 🚬 (P.S Люси не смей изменять Дэвиду 😾)",
    video: `${routeVideoPath}/background_support.webm`
  },
  "/login": {
    title: "Вход в аккаунт",
    text: "Форма входа появится после завершения авторизации. Пока можно перейти к регистрации аккаунта. Нет игры — нет жизни? 👾 (P.S Жаль продолжения не будет 🫠)",
    video: `${routeVideoPath}/background_login.webm`,
    actionLabel: "Перейти к регистрации",
    actionHref: "/register"
  },
  "/terms": {
    title: "Условия использования",
    text: "Эту страницу будут писать слишком умные люди ☝️🤓"
  },
  "/privacy": {
    title: "Политика конфиденциальности",
    text: "Эту страницу будут писать слишком умные люди ☝️🤓"
  }
};

function getInitialTheme(): Theme {
  const savedTheme = localStorage.getItem(themeStorageKey);

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getCurrentRoute() {
  const route = window.location.pathname.replace(/\/+$/, "");

  return route || "/register";
}

function replaceRootRoute() {
  if (window.location.pathname === "/" || window.location.pathname === "") {
    window.history.replaceState(null, "", "/register");
  }
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const route = getCurrentRoute();
  const routeStub = routeStubs[route];

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    const heartbeatUrl = `${devBackendUrl}/internal/dev/frontend-heartbeat`;

    function sendHeartbeat() {
      void fetch(heartbeatUrl, { method: "POST", keepalive: true }).catch(() => undefined);
    }

    sendHeartbeat();
    const intervalId = window.setInterval(sendHeartbeat, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    replaceRootRoute();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  return (
    <div className="min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)] transition-colors duration-200">
      <Navbar theme={theme} onThemeChange={setTheme} />
      {route === "/register" ? (
        <Register />
      ) : (
        <RouteStub
          path={route}
          title={routeStub?.title ?? "Страница не найдена"}
          text={routeStub?.text ?? "Такого раздела пока нет. Вернитесь на главную страницу проекта."}
          video={routeStub?.video}
          actionLabel={routeStub?.actionLabel}
          actionHref={routeStub?.actionHref}
        />
      )}
    </div>
  );
}
