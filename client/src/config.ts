const CONFIG = {
  API: {
    BASE_URL: import.meta.env.DEV
      ? "http://localhost:10000"
      : "https://node-clqa.onrender.com",
    ENDPOINTS: {
      GENERATE_STREAM: "/generate/stream",
    },
  },
  SIDEBAR_ITEMS: [
    {
      path: "/",
      title: "Dashboard",
      icon: "🏡",
    },
    {
      path: "/store",
      title: "Store",
      icon: "⭐️",
    },
    {
      path: "/create-app",
      title: "Create App",
      icon: "🪄",
    },
  ],
  WINDOW_LAYOUTS: {
    grid: {
      positions: [
        [0, 0, 0] as [number, number, number],
        [5, 0, 0] as [number, number, number],
        [-5, 0, 0] as [number, number, number],
        [0, 3, 0] as [number, number, number],
        [5, 3, 0] as [number, number, number],
        [-5, 3, 0] as [number, number, number],
      ],
    },
    minimized: {
      positions: [
        [-8, -5, 0] as [number, number, number],
        [-6, -5, 0] as [number, number, number],
        [-4, -5, 0] as [number, number, number],
        [-2, -5, 0] as [number, number, number],
        [0, -5, 0] as [number, number, number],
        [2, -5, 0] as [number, number, number],
      ],
    },
  },
} as const;

export default CONFIG;
