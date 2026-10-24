export type SiteField = {
  key: string;
  label: string;
  group: string;
  default: string;
  multiline?: boolean;
  hint?: string;
};

/** Every editable piece of text on the public site. The admin form is generated from this list. */
export const SITE_FIELDS: SiteField[] = [
  { key: "utilityLine", group: "Bandeau du haut", label: "Phrase d’accroche", default: "La foi, la culture et la vie au cœur de nos récits" },
  { key: "city", group: "Bandeau du haut", label: "Lieu", default: "Abidjan, Côte d’Ivoire" },

  { key: "heroEyebrow", group: "Page d’accueil", label: "Étiquette", default: "Foi · Société · Culture" },
  { key: "heroOverline", group: "Page d’accueil", label: "Sur-titre", default: "L’ESSENTIEL, AVEC DU SENS" },
  { key: "heroTitle1", group: "Page d’accueil", label: "Titre — début", default: "Des histoires qui" },
  { key: "heroTitle2", group: "Page d’accueil", label: "Titre — fin (en italique)", default: "font grandir." },
  { key: "heroIntro", group: "Page d’accueil", label: "Introduction", multiline: true, default: "Un regard lumineux sur la foi, les personnes et les initiatives qui font vibrer la Côte d’Ivoire." },

  { key: "featuredTitle", group: "Titres des rubriques", label: "« À la une » — titre", default: "À la une" },
  { key: "featuredDesc", group: "Titres des rubriques", label: "« À la une » — description", default: "Les récits qui éclairent l’actualité et nourrissent la réflexion." },
  { key: "latestTitle", group: "Titres des rubriques", label: "Dernières actualités — titre", default: "Dernières actualités" },
  { key: "latestDesc", group: "Titres des rubriques", label: "Dernières actualités — description", default: "Comprendre le présent, garder le regard ouvert." },
  { key: "interviewsTitle", group: "Titres des rubriques", label: "Interviews — titre", default: "Interviews" },
  { key: "interviewsDesc", group: "Titres des rubriques", label: "Interviews — description", default: "Des femmes et des hommes racontent ce qui les anime." },
  { key: "activitiesTitle", group: "Titres des rubriques", label: "Vie du média — titre", default: "La vie de Hébron-Ivoire" },
  { key: "activitiesDesc", group: "Titres des rubriques", label: "Vie du média — description", default: "Informer, transmettre, témoigner : nos espaces d’expression au service du lien." },
  { key: "activity1Title", group: "Cartes « Vie du média »", label: "Carte 1 — titre", default: "Les voix de la foi" },
  { key: "activity1Desc", group: "Cartes « Vie du média »", label: "Carte 1 — description", default: "Cultiver le sens et la réflexion" },
  { key: "activity2Title", group: "Cartes « Vie du média »", label: "Carte 2 — titre", default: "Nos rencontres" },
  { key: "activity2Desc", group: "Cartes « Vie du média »", label: "Carte 2 — description", default: "Faire grandir le dialogue" },
  { key: "activity3Title", group: "Cartes « Vie du média »", label: "Carte 3 — titre", default: "Au service du lien" },
  { key: "activity3Desc", group: "Cartes « Vie du média »", label: "Carte 3 — description", default: "Mettre en lumière les initiatives" },
  { key: "activity4Title", group: "Cartes « Vie du média »", label: "Carte 4 — titre", default: "Paroles de vie" },
  { key: "activity4Desc", group: "Cartes « Vie du média »", label: "Carte 4 — description", default: "Accueillir chaque histoire" },

  { key: "eventsTitle1", group: "Section événements", label: "Titre — début", default: "Nos événements," },
  { key: "eventsTitle2", group: "Section événements", label: "Titre — fin (en italique)", default: "nos rencontres." },
  { key: "eventsIntro", group: "Section événements", label: "Introduction", multiline: true, default: "Des moments pour se retrouver, s’inspirer et faire grandir les liens." },

  { key: "contactKicker", group: "Bandeau contact", label: "Étiquette", default: "Une histoire à partager ?" },
  { key: "contactTitle", group: "Bandeau contact", label: "Titre", default: "La conversation continue." },
  { key: "contactText", group: "Bandeau contact", label: "Texte", multiline: true, default: "Écrivez à la rédaction, proposez un sujet ou partagez votre témoignage." },
  { key: "contactEmail", group: "Bandeau contact", label: "E-mail de la rédaction", default: "contact@hebron-ivoire.ci" },

  { key: "footerAbout", group: "Pied de page", label: "Présentation du média", multiline: true, default: "Un média de proximité pour écouter, raconter et mettre en lumière ce qui nous relie." },
  { key: "facebookUrl", group: "Pied de page", label: "Lien Facebook", default: "https://www.facebook.com/" },
  { key: "instagramUrl", group: "Pied de page", label: "Lien Instagram", default: "https://www.instagram.com/" },
  { key: "youtubeUrl", group: "Pied de page", label: "Lien YouTube", default: "https://www.youtube.com/" },
  { key: "footerNote", group: "Pied de page", label: "Note en bas de page", multiline: true, hint: "Facultatif — affichée sous le pied de page.", default: "" },
];

export const SITE_DEFAULTS: Record<string, string> = Object.fromEntries(SITE_FIELDS.map(f => [f.key, f.default]));
