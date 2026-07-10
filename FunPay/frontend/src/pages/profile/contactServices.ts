import { AtSign } from "lucide-react";
import type { IconType } from "react-icons";
import {
  SiDiscord,
  SiFacebook,
  SiGithub,
  SiInstagram,
  SiKick,
  SiReddit,
  SiSteam,
  SiTelegram,
  SiTiktok,
  SiTwitch,
  SiX,
  SiYoutube
} from "react-icons/si";

export type ServiceId = "telegram" | "discord" | "youtube" | "twitch" | "twitter" | "instagram" | "tiktok" | "facebook" | "reddit" | "github" | "steam" | "kick" | "custom";

type ServiceDefinition = {
  id: ServiceId;
  title: string;
  Icon: IconType;
};

export const contactServices: ServiceDefinition[] = [
  { id: "telegram", title: "Telegram", Icon: SiTelegram },
  { id: "discord", title: "Discord", Icon: SiDiscord },
  { id: "youtube", title: "YouTube", Icon: SiYoutube },
  { id: "twitch", title: "Twitch", Icon: SiTwitch },
  { id: "twitter", title: "X / Twitter", Icon: SiX },
  { id: "instagram", title: "Instagram", Icon: SiInstagram },
  { id: "tiktok", title: "TikTok", Icon: SiTiktok },
  { id: "facebook", title: "Facebook", Icon: SiFacebook },
  { id: "reddit", title: "Reddit", Icon: SiReddit },
  { id: "github", title: "GitHub", Icon: SiGithub },
  { id: "steam", title: "Steam", Icon: SiSteam },
  { id: "kick", title: "Kick", Icon: SiKick },
  { id: "custom", title: "Другой сервис", Icon: AtSign }
];

export function getServiceDefinition(service: string) {
  return contactServices.find((item) => item.id === service) ?? contactServices.at(-1)!;
}
