export function LogoMark() {
  return (
    <span className="inline-grid size-8 shrink-0 place-items-center">
      <svg aria-hidden="true" className="size-8" viewBox="0 0 48 48">
        <path
          d="M24 4 39 10v12c0 10.4-5.8 17.8-15 22C14.8 39.8 9 32.4 9 22V10L24 4Z"
          fill="url(#shieldFill)"
        />
        <path
          d="M24 8.2 35 12.7v9.1c0 7.9-4.1 13.7-11 17.4-6.9-3.7-11-9.5-11-17.4v-9.1l11-4.5Z"
          fill="#101722"
        />
        <path
          d="M17 13.3h16.9v4.2H22.2v5.2h9.8v4.1h-9.8v8H17V13.3Z"
          fill="url(#fFill)"
        />
        <defs>
          <linearGradient id="shieldFill" x1="11" x2="39" y1="4" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffc928" />
            <stop offset="1" stopColor="#f2a900" />
          </linearGradient>
          <linearGradient id="fFill" x1="17" x2="34" y1="13" y2="35" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffd84d" />
            <stop offset="1" stopColor="#f1a600" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}
