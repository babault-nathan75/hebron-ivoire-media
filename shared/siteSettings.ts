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
  { key: "siteDescription", group: "Identité", label: "Description du site (Google, aperçus de partage)", multiline: true, default: "citedimpact.net, le média d’impact social et sociétal : éclairer, transformer, bâtir." },

  { key: "agendaTitle", group: "Page d’accueil", label: "Titre de la section événements", default: "Agenda" },
  { key: "videosTitle", group: "Page d’accueil", label: "Titre de la section vidéos", default: "Vidéos" },
  { key: "podcastsTitle", group: "Page d’accueil", label: "Titre de la section podcasts", default: "Podcasts" },

  { key: "aboutBreadcrumb", group: "Page À propos", label: "Libellé dans le fil d’Ariane", default: "À propos" },
  { key: "aboutEyebrow", group: "Page À propos", label: "Petit titre au-dessus du titre principal", default: "Notre média" },
  { key: "aboutTitle", group: "Page À propos", label: "Titre principal", default: "À propos de Cité d’Impact" },
  { key: "aboutDescription", group: "Page À propos", label: "Description pour les moteurs de recherche", multiline: true, default: "Découvrez Cité d’Impact, le média d’impact social et sociétal." },
  { key: "aboutSubtitle", group: "Page À propos", label: "Sous-titre", multiline: true, default: "Le média d’impact social et sociétal" },
  { key: "aboutIntroTitle", group: "Page À propos", label: "Titre de l’introduction", default: "Donner du sens à l’information" },
  { key: "aboutIntroText", group: "Page À propos", label: "Premier paragraphe de l’introduction", multiline: true, default: "citedimpact.net est un média d’impact social et sociétal : nous éclairons les enjeux et valorisons les initiatives qui transforment la société." },
  { key: "aboutIntroText2", group: "Page À propos", label: "Deuxième paragraphe de l’introduction", multiline: true, default: "Nous voulons faire connaître les sujets qui comptent et donner une place aux initiatives qui font évoluer la société." },
  { key: "aboutValuesLabel", group: "Page À propos", label: "Libellé accessible de la section des valeurs", default: "Notre ligne éditoriale" },
  { key: "aboutValue1Title", group: "Page À propos", label: "Valeur 1 — titre", default: "Éclairer" },
  { key: "aboutValue1Text", group: "Page À propos", label: "Valeur 1 — texte", multiline: true, default: "Apporter des repères pour mieux comprendre les enjeux sociaux et sociétaux." },
  { key: "aboutValue2Title", group: "Page À propos", label: "Valeur 2 — titre", default: "Transformer" },
  { key: "aboutValue2Text", group: "Page À propos", label: "Valeur 2 — texte", multiline: true, default: "Raconter les idées, les personnes et les initiatives qui font bouger les choses." },
  { key: "aboutValue3Title", group: "Page À propos", label: "Valeur 3 — titre", default: "Bâtir" },
  { key: "aboutValue3Text", group: "Page À propos", label: "Valeur 3 — texte", multiline: true, default: "Mettre en lumière les pistes qui contribuent à construire un avenir meilleur." },
  { key: "aboutContactLabel", group: "Page À propos", label: "Texte du bouton de contact", default: "Écrire à la rédaction" },

  { key: "contactTitle", group: "Contact", label: "Titre de la section contact", default: "Contacter la rédaction" },
  { key: "contactText", group: "Contact", label: "Texte d’introduction", multiline: true, default: "Une information, un sujet à proposer, un témoignage ? Écrivez-nous : la rédaction vous répond." },
  { key: "contactEmail", group: "Contact", label: "E-mail de la rédaction", default: "contact@impact-nation.net" },

  { key: "footerAbout", group: "Pied de page", label: "Présentation du média", multiline: true, default: "citedimpact.net est un média d’impact social et sociétal : nous éclairons les enjeux et valorisons les initiatives qui transforment la société." },
  { key: "facebookUrl", group: "Pied de page", label: "Lien Facebook", default: "https://www.facebook.com/" },
  { key: "instagramUrl", group: "Pied de page", label: "Lien Instagram", default: "https://www.instagram.com/" },
  { key: "youtubeUrl", group: "Pied de page", label: "Lien YouTube", default: "https://www.youtube.com/" },
  { key: "footerNote", group: "Pied de page", label: "Note en bas de page", multiline: true, hint: "Facultatif — affichée sous le pied de page.", default: "" },
];

export const SITE_DEFAULTS: Record<string, string> = Object.fromEntries(SITE_FIELDS.map(f => [f.key, f.default]));
