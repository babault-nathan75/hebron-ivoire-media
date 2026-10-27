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
  { key: "tagline", group: "Identité", label: "Slogan sous le logo", default: "Le média d’impact social et sociétal" },
  { key: "city", group: "Identité", label: "Ville / pays", default: "Abidjan, Côte d’Ivoire" },
  { key: "siteDescription", group: "Identité", label: "Description du site (Google, aperçus de partage)", multiline: true, default: "Impact-Nation.net, le média d’impact social et sociétal : éclairer, transformer, bâtir." },

  { key: "agendaTitle", group: "Page d’accueil", label: "Titre de la section événements", default: "Agenda" },
  { key: "videosTitle", group: "Page d’accueil", label: "Titre de la section vidéos", default: "Vidéos" },
  { key: "podcastsTitle", group: "Page d’accueil", label: "Titre de la section podcasts", default: "Podcasts" },

  { key: "contactTitle", group: "Contact", label: "Titre de la section contact", default: "Contacter la rédaction" },
  { key: "contactText", group: "Contact", label: "Texte d’introduction", multiline: true, default: "Une information, un sujet à proposer, un témoignage ? Écrivez-nous : la rédaction vous répond." },
  { key: "contactEmail", group: "Contact", label: "E-mail de la rédaction", default: "contact@impact-nation.net" },

  { key: "footerAbout", group: "Pied de page", label: "Présentation du média", multiline: true, default: "Impact-Nation.net est un média d’impact social et sociétal : nous éclairons les enjeux, valorisons les initiatives qui transforment la société et aidons à bâtir l’avenir." },
  { key: "facebookUrl", group: "Pied de page", label: "Lien Facebook", default: "https://www.facebook.com/" },
  { key: "instagramUrl", group: "Pied de page", label: "Lien Instagram", default: "https://www.instagram.com/" },
  { key: "youtubeUrl", group: "Pied de page", label: "Lien YouTube", default: "https://www.youtube.com/" },
  { key: "footerNote", group: "Pied de page", label: "Note en bas de page", multiline: true, hint: "Facultatif — affichée sous le pied de page.", default: "" },
];

export const SITE_DEFAULTS: Record<string, string> = Object.fromEntries(SITE_FIELDS.map(f => [f.key, f.default]));
