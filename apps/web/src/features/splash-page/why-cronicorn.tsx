import { Bot, Code2, Globe, Rocket, Wallet, Zap } from "lucide-react";
import React from "react";

type Feature = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  blobs: {
    color: string; // rgba(...)
    size: string; // e.g. 'w-32 h-32'
    position: string; // e.g. 'top-[-20px] left-[-20px]'
    blur?: string; // e.g. 'blur-2xl'
    opacity?: string; // e.g. 'opacity-40'
  }[];
};

const features: Feature[] = [
  {
    icon: Rocket,
    title: "Setup in minutes",
    description:
      "Describe the job, add endpoints, done. Skip the cron syntax and config pain. You can be testing in minutes.",
    blobs: [
      {
        color: "rgba(16,185,129,0.45)", // emerald-500/45
        size: "w-32 h-32",
        position: "top-[-18px] left-[-18px]",
        blur: "blur-2xl",
        opacity: "opacity-60",
      },
      {
        color: "rgba(20,184,166,0.35)", // teal-500/35
        size: "w-40 h-40",
        position: "bottom-[-24px] right-[-24px]",
        blur: "blur-3xl",
        opacity: "opacity-50",
      },
    ],
  },
  {
    icon: Bot,
    title: "Hands-off",
    description:
      "Schedules adjust automatically. No more tweaking timers or pausing jobs — Cronicorn reacts to real conditions.",
    blobs: [
      {
        color: "rgba(139,92,246,0.45)", // violet-500/45
        size: "w-28 h-28",
        position: "top-[-22px] right-[-16px]",
        blur: "blur-3xl",
        opacity: "opacity-60",
      },
      {
        color: "rgba(217,70,239,0.35)", // fuchsia-500/35
        size: "w-48 h-48",
        position: "bottom-[-28px] left-[-28px]",
        blur: "blur-2xl",
        opacity: "opacity-50",
      },
    ],
  },
  {
    icon: Zap,
    title: "Runs when needed",
    description:
      "No wasteful “just in case” jobs. Tasks trigger only when the right conditions are met, not on a blind timer.",
    blobs: [
      {
        color: "rgba(251,191,36,0.45)", // amber-400/45
        size: "w-36 h-36",
        position: "top-[-20px] left-[30%]",
        blur: "blur-3xl",
        opacity: "opacity-60",
      },
      {
        color: "rgba(249,115,22,0.35)", // orange-500/35
        size: "w-28 h-28",
        position: "bottom-[-20px] left-[-16px]",
        blur: "blur-2xl",
        opacity: "opacity-50",
      },
    ],
  },
  {
    icon: Wallet,
    title: "Save resources",
    description:
      "Fewer runs, lower costs. Avoid burning compute on jobs that don’t need to run — keep bills low.",
    blobs: [
      {
        color: "rgba(132,204,22,0.45)", // lime-500/45
        size: "w-32 h-32",
        position: "top-[10%] left-[-18px]",
        blur: "blur-3xl",
        opacity: "opacity-55",
      },
      {
        color: "rgba(16,185,129,0.35)", // emerald-500/35
        size: "w-44 h-44",
        position: "bottom-[-24px] right-[-24px]",
        blur: "blur-2xl",
        opacity: "opacity-50",
      },
    ],
  },
  {
    icon: Code2,
    title: "Cleaner code",
    description:
      "No scattered time checks or cron math. Centralize all your scheduling logic in one simple job description.",
    blobs: [
      {
        color: "rgba(168,85,247,0.45)", // purple-500/45
        size: "w-36 h-36",
        position: "top-[-24px] left-1/2 -translate-x-1/2",
        blur: "blur-3xl",
        opacity: "opacity-60",
      },
      {
        color: "rgba(236,72,153,0.35)", // pink-500/35
        size: "w-28 h-28",
        position: "bottom-[-18px] left-[-18px]",
        blur: "blur-2xl",
        opacity: "opacity-50",
      },
    ],
  },
  {
    icon: Globe,
    title: "Works anywhere",
    description:
      "If it’s an HTTP endpoint, you’re good. From health checks to alerts, syncing, or scripts — Cronicorn fits right in.",
    blobs: [
      {
        color: "rgba(244,63,94,0.45)", // rose-500/45
        size: "w-32 h-32",
        position: "bottom-[-22px] left-1/2 -translate-x-1/2",
        blur: "blur-3xl",
        opacity: "opacity-60",
      },
      {
        color: "rgba(251,146,60,0.35)", // orange-400/35
        size: "w-40 h-40",
        position: "top-[-24px] right-[-24px]",
        blur: "blur-2xl",
        opacity: "opacity-50",
      },
    ],
  },
];

function Blob({
  color,
  size,
  position,
  blur = "blur-2xl",
  opacity = "opacity-50",
}: {
  color: string;
  size: string;
  position: string;
  blur?: string;
  opacity?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute ${size} ${position} ${blur} ${opacity} transition-transform duration-300 ease-out group-hover:scale-105`}
      style={{
        background: `radial-gradient(closest-side, ${color} 0%, transparent 70%)`,
        borderRadius: "9999px",
        filter: "blur(24px)",
      }}
    />
  );
}

const Features01Page = () => {
  return (
    <div className="max-w-5xl w-full  mx-auto  flex flex-col gap-8">

      <h2 className="text-3xl font-medium text-foreground mb-2 leading-tight tracking-tight mt-8">
        More building. Less scheduling.

      </h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-screen-lg mx-auto px-6">
        {features.map(feature => (
          <div
            key={feature.title}
            className="relative group overflow-hidden flex flex-col border rounded-2xl py-6 px-5 bg-card/20"
          >
            {/* Blurred radial blobs (unique per item) */}
            {feature.blobs.map((b, i) => (
              <Blob key={i} {...b} />
            ))}

            <div className="relative text-left">
              <div className="flex gap-2 items-center">
                <div className="h-10 w-10 flex items-center justify-center bg-background/50 rounded-full">
                  <feature.icon className="h-6 w-6" />
                </div>
                <span className="text-lg font-semibold">{feature.title}</span>
              </div>

              <p className="mt-1 text-foreground/85 text-sm">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Features01Page;
