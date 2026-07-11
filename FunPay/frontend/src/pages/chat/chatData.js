const cosmeticsRoot = "/assets/website/profile-cosmetics";
const stickerRoot = "/assets/website/stickers/sets";
const emojiRoot = "/assets/website/emojis/sets";

const profileCosmetics = [
  {
    wallpaper: `${cosmeticsRoot}/wallpapers/02/002__mitaka-asa__cover.webp`,
    wallpaperVideo: `${cosmeticsRoot}/wallpapers/02/002__mitaka-asa__cover__320x180__av1.webm`,
    banner: `${cosmeticsRoot}/banners/02/002__ellen-joe-chibi__cover.webp`,
    bannerVideo: `${cosmeticsRoot}/banners/02/002__ellen-joe-chibi__cover__320x80__av1.webm`
  },
  {
    wallpaper: `${cosmeticsRoot}/wallpapers/04/004__hatsune-miku-shrek__cover.webp`,
    wallpaperVideo: `${cosmeticsRoot}/wallpapers/04/004__hatsune-miku-shrek__cover__320x180__av1.webm`,
    banner: `${cosmeticsRoot}/banners/04/004__inquisitive-klee__cover.webp`,
    bannerVideo: `${cosmeticsRoot}/banners/04/004__inquisitive-klee__cover__320x80__av1.webm`
  },
  {
    wallpaper: `${cosmeticsRoot}/wallpapers/03/003__a-dream-for-david__cover.webp`,
    wallpaperVideo: `${cosmeticsRoot}/wallpapers/03/003__a-dream-for-david__cover__320x180__av1.webm`,
    banner: `${cosmeticsRoot}/banners/05/005__lucy__cover.webp`,
    bannerVideo: `${cosmeticsRoot}/banners/05/005__lucy__cover__320x80__av1.webm`
  },
  {
    wallpaper: `${cosmeticsRoot}/wallpapers/01/001__david-lucyna__cover.webp`,
    wallpaperVideo: `${cosmeticsRoot}/wallpapers/01/001__david-lucyna__cover__320x180__av1.webm`,
    banner: `${cosmeticsRoot}/banners/01/001__six-paths-of-pain__cover.jpeg`
  },
  {
    wallpaper: `${cosmeticsRoot}/wallpapers/07/007__shiki-ryougi__cover.webp`,
    wallpaperVideo: `${cosmeticsRoot}/wallpapers/07/007__shiki-ryougi__cover__320x180__av1.webm`,
    banner: `${cosmeticsRoot}/banners/03/003__chains__cover.webp`,
    bannerVideo: `${cosmeticsRoot}/banners/03/003__chains__cover__320x80__av1.webm`
  },
  {
    wallpaper: `${cosmeticsRoot}/wallpapers/06/006__rappa__cover.webp`,
    wallpaperVideo: `${cosmeticsRoot}/wallpapers/06/006__rappa__cover__320x180__av1.webm`,
    banner: `${cosmeticsRoot}/banners/06/006__soft-hugs__cover.webp`,
    bannerVideo: `${cosmeticsRoot}/banners/06/006__soft-hugs__cover__320x80__av1.webm`
  }
];

export const contacts = [
  {
    id: "alyndra",
    normalizedNick: "alyndra",
    name: "Alyndra",
    avatar: `${cosmeticsRoot}/avatars/02/002__reze__cover.webp`,
    frame: `${cosmeticsRoot}/frames/04/004__endless-vortex__cover.webp`,
    presence: "online",
    time: "00:18",
    unread: 2,
    publicId: "100000214",
    memberSinceKey: "chatUi.profile.memberSinceLong",
    aboutKey: "chatUi.mock.alyndra.about",
    previewKey: "chatUi.mock.alyndra.preview",
    ...profileCosmetics[0]
  },
  {
    id: "senkuro",
    normalizedNick: "senkuro",
    name: "Senkuro",
    avatar: `${cosmeticsRoot}/avatars/63/063__senkurian__cover.webp`,
    frame: `${cosmeticsRoot}/frames/05/005__magic-bubble__cover.webp`,
    presence: "afk",
    time: "23:41",
    unread: 0,
    publicId: "100000327",
    memberSinceKey: "chatUi.profile.memberSinceMedium",
    aboutKey: "chatUi.mock.senkuro.about",
    previewKey: "chatUi.mock.senkuro.preview",
    ...profileCosmetics[1]
  },
  {
    id: "mita",
    normalizedNick: "mita",
    name: "Mita",
    avatar: `${cosmeticsRoot}/avatars/08/008__embarrassed-mita__cover.webp`,
    frame: `${cosmeticsRoot}/frames/09/009__hologram__cover.webp`,
    presence: "online",
    time: "22:06",
    unread: 1,
    publicId: "100000408",
    memberSinceKey: "chatUi.profile.memberSinceShort",
    aboutKey: "chatUi.mock.mita.about",
    previewKey: "chatUi.mock.mita.preview",
    ...profileCosmetics[2]
  },
  {
    id: "david",
    normalizedNick: "david",
    name: "David",
    avatar: `${cosmeticsRoot}/avatars/01/001__david-s-legs__cover.webp`,
    frame: `${cosmeticsRoot}/frames/01/001__legs__cover.webp`,
    presence: "offline",
    time: "21:34",
    unread: 0,
    publicId: "100000512",
    memberSinceKey: "chatUi.profile.memberSinceLong",
    aboutKey: "chatUi.mock.david.about",
    previewKey: "chatUi.mock.david.preview",
    ...profileCosmetics[3]
  },
  {
    id: "rikka",
    normalizedNick: "rikka",
    name: "Rikka",
    avatar: `${cosmeticsRoot}/avatars/94/094__rikka-takanashi__cover.webp`,
    frame: `${cosmeticsRoot}/frames/94/094__smoke__cover.webp`,
    presence: "offline",
    time: "18:52",
    unread: 0,
    publicId: "100000694",
    memberSinceKey: "chatUi.profile.memberSinceMedium",
    aboutKey: "chatUi.mock.rikka.about",
    previewKey: "chatUi.mock.rikka.preview",
    ...profileCosmetics[4]
  },
  {
    id: "livesey",
    normalizedNick: "livesey",
    name: "Dr. Livesey",
    avatar: `${cosmeticsRoot}/avatars/06/006__dr-livesey__cover.webp`,
    frame: `${cosmeticsRoot}/frames/06/006__yuji-technique__cover.webp`,
    presence: "afk",
    timeKey: "chatUi.yesterday",
    unread: 0,
    publicId: "100000777",
    memberSinceKey: "chatUi.profile.memberSinceLong",
    aboutKey: "chatUi.mock.livesey.about",
    previewKey: "chatUi.mock.livesey.preview",
    ...profileCosmetics[5]
  }
];

export const initialMessagesByContact = {
  alyndra: [
    { id: 1, side: "incoming", textKey: "chatUi.mock.alyndra.message1", time: "00:12" },
    { id: 2, side: "outgoing", textKey: "chatUi.mock.alyndra.message2", time: "00:14", read: true },
    { id: 3, side: "incoming", kind: "order", textKey: "chatUi.mock.alyndra.order", time: "00:16" },
    { id: 4, side: "incoming", textKey: "chatUi.mock.alyndra.message3", time: "00:18" },
    { id: 5, side: "outgoing", kind: "sticker", asset: `${stickerRoot}/04/004__senkuro__sticker_020__senkurohello__image.webp`, time: "00:19", read: true }
  ],
  senkuro: [
    { id: 1, side: "incoming", textKey: "chatUi.mock.senkuro.message1", time: "23:35" },
    { id: 2, side: "outgoing", textKey: "chatUi.mock.senkuro.message2", time: "23:38", read: true },
    { id: 3, side: "incoming", textKey: "chatUi.mock.senkuro.preview", time: "23:41" }
  ],
  mita: [
    { id: 1, side: "outgoing", textKey: "chatUi.mock.mita.message1", time: "21:58", read: true },
    { id: 2, side: "incoming", textKey: "chatUi.mock.mita.message2", time: "22:04" },
    { id: 3, side: "incoming", kind: "sticker", asset: `${stickerRoot}/02/002__my-escapism__sticker_001__sakotachahh__image.webp`, time: "22:06" }
  ],
  david: [
    { id: 1, side: "incoming", textKey: "chatUi.mock.david.message1", time: "21:27" },
    { id: 2, side: "outgoing", textKey: "chatUi.mock.david.message2", time: "21:31", read: true },
    { id: 3, side: "incoming", textKey: "chatUi.mock.david.preview", time: "21:34" }
  ],
  rikka: [
    { id: 1, side: "incoming", textKey: "chatUi.mock.rikka.message1", time: "18:46" },
    { id: 2, side: "outgoing", textKey: "chatUi.mock.rikka.preview", time: "18:52", read: true }
  ],
  livesey: [
    { id: 1, side: "incoming", textKey: "chatUi.mock.livesey.message1", time: "17:12" },
    { id: 2, side: "outgoing", textKey: "chatUi.mock.livesey.preview", time: "17:18", read: true }
  ]
};

export const stickerSets = [
  { id: "01", name: "Nubchan", cover: `${stickerRoot}/01/001__nubchan__cover.webp` },
  { id: "02", name: "My Escapism", cover: `${stickerRoot}/02/002__my-escapism__cover.webp` },
  { id: "03", name: "Fedor", cover: `${stickerRoot}/03/003__lazy-arctic-fox-fedor__cover.webp` },
  { id: "04", name: "Senkuro", cover: `${stickerRoot}/04/004__senkuro__cover.webp` }
];

export const emojiSets = [
  { id: "01", name: "Senkuro Mini", cover: `${emojiRoot}/01/001__senkuro-mini__cover.webp` },
  { id: "02", name: "Silvervale", cover: `${emojiRoot}/02/002__silvervale__cover.webp` },
  { id: "03", name: "Shupogaki", cover: `${emojiRoot}/03/003__shupogaki__cover.webp` },
  { id: "04", name: "Merunyaa", cover: `${emojiRoot}/04/004__merunyaa__cover.webp` }
];

function createCollectionItems({ names, packageName, packageNumber, root, set, type }) {
  return names.map((name, index) => {
    const itemNumber = String(index + 1).padStart(3, "0");
    return {
      id: `${type}-${set}-${itemNumber}`,
      name,
      set,
      asset: `${root}/${set}/${packageNumber}__${packageName}__${type}_${itemNumber}__${name}__image.webp`
    };
  });
}

export const stickerItems = [
  ...createCollectionItems({ root: stickerRoot, set: "01", packageNumber: "001", packageName: "nubchan", type: "sticker", names: ["nubchanphone", "nubchanwut", "nubchanboom", "nubchancorner", "nubchancry", "nubchanscammerch", "nubchanwhahaha", "nubchantie", "nubchanmayiplease", "nubchanwall", "nubchanterrify", "nubchanopenhands"] }),
  ...createCollectionItems({ root: stickerRoot, set: "02", packageNumber: "002", packageName: "my-escapism", type: "sticker", names: ["sakotachahh", "sakotachtired", "sakotachflooshed", "sakotachsarcastic", "sakotachhmm", "sakotachdespair", "sakotachcool", "sakotachhug", "sakotachdrink", "sakotachgun", "sakotachembarrassed", "sakotachheart"] }),
  ...createCollectionItems({ root: stickerRoot, set: "03", packageNumber: "003", packageName: "lazy-arctic-fox-fedor", type: "sticker", names: ["fedoratips", "fedorgun", "fedorhide", "fedordance", "fedorsoulout", "fedorholy", "fedorholysh", "fedormanga", "fedornotme", "fedorpadoru", "fedorromordeath", "fedorgym"] }),
  ...createCollectionItems({ root: stickerRoot, set: "04", packageNumber: "004", packageName: "senkuro", type: "sticker", names: ["senkurolick", "senkurowine", "senkurohacker", "senkuroclap", "senkuroknife", "senkuromayiplease", "senkuroprepare", "senkurocex", "senkuroheartpupil", "senkurosmirk", "senkuroloading", "senkurosweat"] })
];

export const emojiItems = [
  ...createCollectionItems({ root: emojiRoot, set: "01", packageNumber: "001", packageName: "senkuro-mini", type: "emoji", names: ["senkurolick", "senkurowine", "senkurohacker", "senkuroclap", "senkuroknife", "senkuromayiplease", "senkuroprepare", "senkurocex"] }),
  ...createCollectionItems({ root: emojiRoot, set: "02", packageNumber: "002", packageName: "silvervale", type: "emoji", names: ["silverblankiesdance", "silvertaps", "silvernoted", "silverloading", "silverhacker", "silverwaves", "silverwows", "silveryandere"] }),
  ...createCollectionItems({ root: emojiRoot, set: "03", packageNumber: "003", packageName: "shupogaki", type: "emoji", names: ["shuporightlike", "shupoleftlike", "shupoexclamation", "shupobell", "shupoheadhands", "shupoheart", "shuporightpunch", "shupoleftpunch"] }),
  ...createCollectionItems({ root: emojiRoot, set: "04", packageNumber: "004", packageName: "merunyaa", type: "emoji", names: ["meruamogusbounce", "merubongohype", "merubongo", "merubonk", "merubooba", "merucheekpull", "merucheer", "merucheerfaster"] })
];

export const ownProfileCosmetics = {
  wallpaper: `${cosmeticsRoot}/wallpapers/05/005__tian-with-a-lollipop__cover.webp`,
  wallpaperVideo: `${cosmeticsRoot}/wallpapers/05/005__tian-with-a-lollipop__cover__320x180__av1.webm`,
  banner: `${cosmeticsRoot}/banners/07/007__tennis-game__cover.webp`,
  bannerVideo: `${cosmeticsRoot}/banners/07/007__tennis-game__cover__320x80__av1.webm`
};

export { cosmeticsRoot };
