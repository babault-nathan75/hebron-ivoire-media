import { useEffect, useState, type ReactNode } from "react";
import {
  Archive,
  BookOpen,
  CalendarDays,
  Eye,
  FileText,
  Image as ImageIcon,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Lightbulb,
  Pencil,
  Rocket,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  TriangleAlert,
  Trash2,
  Type,
  Users,
  Video,
} from "lucide-react";

import { ADMIN_PATH } from "@shared/adminPath";

type Section = { id: string; title: string; icon: typeof BookOpen; body: ReactNode };

const Tip = ({ children }: { children: ReactNode }) => <div className="gd-callout gd-tip"><Lightbulb size={16} /><div>{children}</div></div>;
const Warn = ({ children }: { children: ReactNode }) => <div className="gd-callout gd-warn"><TriangleAlert size={16} /><div>{children}</div></div>;
const Steps = ({ children }: { children: ReactNode }) => <ol className="gd-steps">{children}</ol>;
const Code = ({ children }: { children: ReactNode }) => <pre className="gd-code">{children}</pre>;
const K = ({ children }: { children: ReactNode }) => <kbd className="gd-kbd">{children}</kbd>;

const SECTIONS: Section[] = [
  {
    id: "demarrer",
    title: "Premiers pas",
    icon: Rocket,
    body: (
      <>
        <p>
          L’espace rédaction est l’endroit où vous gérez <strong>tout</strong> ce qui apparaît sur le site : articles, événements, textes fixes,
          messages des visiteurs et équipe d’administrateurs. Rien ne se modifie dans le code : tout se fait ici, depuis un navigateur.
        </p>
        <h3>Se connecter</h3>
        <p>Deux méthodes existent, au choix, sur la page <code>{ADMIN_PATH}</code> :</p>
        <ul>
          <li><strong>Mot de passe</strong> : saisissez votre e-mail et votre mot de passe. L’icône œil permet d’afficher ou de masquer ce que vous tapez.</li>
          <li><strong>Code par e-mail</strong> : saisissez votre e-mail, cliquez sur « Recevoir un code », puis tapez le code à 6 chiffres reçu par e-mail.</li>
        </ul>
        <Warn>
          Le code est valable <strong>10 minutes</strong>, ne peut être demandé qu’<strong>une fois par minute</strong> et n’autorise que
          <strong> 5 essais</strong>. Si rien n’arrive, regardez dans les courriers indésirables (spams). Seules les adresses enregistrées comme
          administrateurs reçoivent un code.
        </Warn>
        <h3>Définir ou changer votre mot de passe</h3>
        <p>
          Si vous vous connectez par code, vous pouvez à tout moment créer un mot de passe : cliquez sur <strong>« Mot de passe »</strong> en bas du
          menu de gauche, saisissez-en un nouveau (8 caractères minimum) et validez. Les deux méthodes de connexion restent utilisables ensuite.
        </p>
        <h3>Se repérer</h3>
        <ul>
          <li><strong>Menu de gauche</strong> : Tableau de bord, Publications, Messages, Contenu du site, Administrateurs et ce Guide.</li>
          <li><strong>« Voir le média »</strong> ouvre le site public pour vérifier le résultat de vos modifications.</li>
          <li><strong>« Quitter »</strong> vous déconnecte. Faites-le toujours sur un ordinateur partagé.</li>
        </ul>
        <Tip>Sur téléphone, le menu devient une barre horizontale en haut de l’écran. Faites-la glisser pour voir toutes les sections.</Tip>
      </>
    ),
  },
  {
    id: "tableau-de-bord",
    title: "Tableau de bord",
    icon: LayoutDashboard,
    body: (
      <>
        <p>C’est la page d’accueil de l’espace rédaction. Elle résume l’activité en un coup d’œil.</p>
        <ul>
          <li><strong>Les 4 compteurs</strong> (articles publiés, brouillons, événements à venir, total) sont cliquables : ils mènent à la liste correspondante.</li>
          <li><strong>Activité récente</strong> : les 6 derniers contenus modifiés, avec leur statut.</li>
          <li>
            <strong>À faire</strong> : une liste d’alertes utiles — nouveaux messages à lire, envoi d’e-mails ou Cloudinary (images) non
            configurés, aucun article publié. Quand tout est en place, vous voyez « Tout est en place ».
          </li>
          <li><strong>Raccourcis</strong> : nouvel événement, modifier les textes du site, ajouter un administrateur.</li>
        </ul>
      </>
    ),
  },
  {
    id: "articles",
    title: "Créer et publier un article",
    icon: FileText,
    body: (
      <>
        <Steps>
          <li>Ouvrez <strong>Publications → Articles</strong> puis cliquez sur <strong>« Nouvelle publication »</strong>.</li>
          <li>Choisissez le <strong>type</strong> (Texte, Vidéo ou Podcast : voir la section suivante), puis renseignez le <strong>titre</strong>, le <strong>résumé</strong> et le <strong>texte</strong> (voir « Mettre en forme »).</li>
          <li>Dans la colonne de droite, choisissez la <strong>rubrique</strong>, ajoutez une <strong>image de couverture</strong> et réglez le <strong>statut</strong>.</li>
          <li>Cliquez sur <strong>« Enregistrer »</strong> (ou <K>Ctrl</K> + <K>S</K>).</li>
        </Steps>
        <h3>Les champs</h3>
        <table className="gd-table">
          <tbody>
            <tr><th>Titre</th><td>Il apparaît partout. L’adresse (slug) s’en déduit automatiquement.</td></tr>
            <tr><th>Résumé</th><td>2 à 3 phrases (700 caractères maximum). Affiché sur les cartes, dans la recherche et dans l’aperçu de partage WhatsApp/Facebook.</td></tr>
            <tr><th>Rubrique</th><td>Détermine où l’article s’affiche. Les rubriques se créent dans l’onglet <strong>Rubriques</strong>.</td></tr>
            <tr><th>À la une</th><td>Case à cocher : l’article passe en priorité sur la page d’accueil.</td></tr>
            <tr><th>Image de couverture</th><td>Fortement recommandée : sans image, un fond vert décoratif est utilisé.</td></tr>
            <tr><th>Auteur</th><td>Facultatif. Nom affiché sous le titre.</td></tr>
            <tr><th>Adresse (slug)</th><td>Partie finale du lien (<code>/article/mon-article</code>). Elle doit être unique ; ne la changez pas après publication, sinon les liens déjà partagés ne marchent plus.</td></tr>
            <tr><th>Temps de lecture</th><td>Calculé automatiquement d’après la longueur du texte, modifiable.</td></tr>
          </tbody>
        </table>
        <h3>Les trois statuts</h3>
        <ul>
          <li><strong>Brouillon</strong> : privé, visible uniquement dans l’espace rédaction. Idéal pour travailler en plusieurs fois.</li>
          <li><strong>Publié</strong> : visible sur le site dès l’enregistrement.</li>
          <li><strong>Archivé</strong> : retiré du site mais conservé, on peut le restaurer.</li>
        </ul>
        <h3>Programmer une publication</h3>
        <p>
          Passez le statut sur <strong>Publié</strong>, puis remplissez <strong>« Date de publication »</strong> avec une date et une heure futures.
          L’article reste invisible jusqu’à ce moment, puis apparaît automatiquement. Dans la liste, il porte l’étiquette
          « Programmé · date ». Laissez le champ vide pour publier immédiatement.
        </p>
        <Tip>Quand vous modifiez un article déjà publié, sa date de publication d’origine est conservée : il ne « remonte » pas en tête de liste.</Tip>
      </>
    ),
  },
  {
    id: "video-podcast",
    title: "Publier une vidéo ou un podcast",
    icon: Video,
    body: (
      <>
        <p>Une publication peut être de trois types, à choisir tout en haut de l’éditeur :</p>
        <ul>
          <li><strong>Texte</strong> : un article classique, avec une image de couverture.</li>
          <li><strong>Vidéo</strong> : le lecteur s’affiche en haut de la page, avant le texte.</li>
          <li><strong>Podcast</strong> : un lecteur audio avec l’image de couverture à côté.</li>
        </ul>
        <h3>Ajouter le média</h3>
        <Steps>
          <li>Choisissez le type <strong>Vidéo</strong> ou <strong>Podcast</strong>.</li>
          <li>Cliquez sur la zone <strong>« Téléverser… »</strong> pour envoyer un fichier (vidéo : 100 Mo maximum, audio : 50 Mo maximum), <strong>ou</strong> collez un lien dans le champ en dessous.</li>
          <li>Liens acceptés : <strong>YouTube</strong> (<code>https://youtu.be/…</code>), ou l’adresse directe d’un fichier <code>.mp4</code>, <code>.webm</code>, <code>.mp3</code>, <code>.m4a</code>.</li>
          <li>Un aperçu du lecteur s’affiche : vérifiez qu’il fonctionne avant d’enregistrer.</li>
          <li>Remplissez le titre, le résumé et l’image de couverture. Le champ « Description / transcription » est facultatif.</li>
        </Steps>
        <Tip>Pour les vidéos longues, mettez-les sur YouTube et collez simplement le lien : c’est gratuit, rapide pour les visiteurs et cela n’utilise pas votre espace de stockage Cloudinary.</Tip>
        <p>
          Les vidéos et podcasts apparaissent avec une icône (lecture ou casque) sur les cartes, dans la rubrique choisie,
          ainsi que dans les sections <strong>Vidéos</strong> et <strong>Podcasts</strong> de la page d’accueil et sur les pages <code>/videos</code> et <code>/podcasts</code>.
          Dans la colonne de droite, « Durée » sert à indiquer la durée en minutes.
        </p>
      </>
    ),
  },
  {
    id: "rubriques",
    title: "Créer et gérer les rubriques",
    icon: Tags,
    body: (
      <>
        <p>Les rubriques sont les sections du journal (Actualité, Société, Sport, Économie…). C’est vous qui décidez de leur liste.</p>
        <Steps>
          <li>Ouvrez l’onglet <strong>Rubriques</strong>.</li>
          <li>Saisissez le <strong>nom</strong> (par exemple « Sport ») et, si vous le souhaitez, une <strong>description</strong> affichée en haut de la page de la rubrique.</li>
          <li>Cliquez sur <strong>« Créer la rubrique »</strong>. Elle devient disponible dans l’éditeur de publications.</li>
        </Steps>
        <ul>
          <li><strong>Ordre</strong> : les flèches haut/bas règlent l’ordre dans le menu et sur la page d’accueil.</li>
          <li><strong>Renommer</strong> : le crayon change le nom ; toutes les publications de la rubrique suivent, mais l’adresse de la rubrique change aussi.</li>
          <li><strong>Supprimer</strong> : possible uniquement si la rubrique est vide. Sinon, déplacez ou supprimez d’abord ses publications.</li>
        </ul>
        <Tip>Une rubrique n’apparaît dans le menu et sur la page d’accueil qu’une fois qu’elle contient au moins une publication visible. Inutile donc de la cacher : elle se montre toute seule.</Tip>
      </>
    ),
  },
  {
    id: "mise-en-forme",
    title: "Mettre en forme le texte",
    icon: Type,
    body: (
      <>
        <p>
          L’éditeur propose une <strong>barre d’outils</strong> : intertitre, sous-titre, gras, italique, citation, liste à puces, liste numérotée,
          lien, téléversement de média et intégration par lien. Sélectionnez du texte puis cliquez sur le bouton voulu. L’onglet
          <strong> « Aperçu »</strong> montre exactement le rendu pour les lecteurs.
        </p>
        <p>Vous pouvez aussi taper la mise en forme à la main. Séparez toujours les paragraphes par <strong>une ligne vide</strong> :</p>
        <Code>{`## Un intertitre
### Un sous-titre

Un paragraphe avec du **gras**, de l'*italique* et un [lien](https://exemple.com).

> Une citation mise en valeur.

- Premier point
- Deuxième point

1. Première étape
2. Deuxième étape

![Légende de la photo](https://adresse-de-l-image.jpg)`}</Code>
        <h3>Insérer une vidéo ou un audio</h3>
        <ul>
          <li><strong>YouTube</strong> : collez le lien de la vidéo <strong>seul sur sa ligne</strong>, entouré de lignes vides. Il devient un lecteur intégré.</li>
          <li><strong>Fichier vidéo ou audio</strong> : cliquez sur le bouton image de la barre d’outils et choisissez le fichier (il est envoyé sur Cloudinary puis inséré), ou collez l’adresse d’un fichier <code>.mp4</code>, <code>.mp3</code>…</li>
        </ul>
        <Tip>Pour les vidéos longues, préférez YouTube : cela évite de consommer le quota gratuit de stockage et de bande passante.</Tip>
        <h3>Raccourcis de l’éditeur</h3>
        <ul>
          <li><K>Ctrl</K> + <K>S</K> (ou <K>⌘</K> + <K>S</K> sur Mac) : enregistrer.</li>
          <li>Un point orange à côté du titre signale des <strong>modifications non enregistrées</strong>. Le bouton « Retour » demande confirmation avant de les perdre.</li>
        </ul>
      </>
    ),
  },
  {
    id: "gerer",
    title: "Gérer vos publications",
    icon: Pencil,
    body: (
      <>
        <p>La liste <strong>Publications</strong> regroupe les articles et les événements (onglets en haut à gauche).</p>
        <ul>
          <li><strong>Rechercher</strong> par titre et <strong>filtrer</strong> par statut (Tous, Publié, Brouillon, Archivé).</li>
          <li><Eye size={14} className="gd-inline" /> <strong>Publier / Dépublier</strong> : change le statut en un clic, sans ouvrir l’éditeur.</li>
          <li><Pencil size={14} className="gd-inline" /> <strong>Modifier</strong> : ouvre l’éditeur.</li>
          <li><Archive size={14} className="gd-inline" /> <strong>Archiver / Restaurer</strong> : retire du site sans rien perdre.</li>
          <li><Trash2 size={14} className="gd-inline" /> <strong>Supprimer</strong> : efface <strong>définitivement</strong>, après confirmation.</li>
        </ul>
        <Warn>La suppression est irréversible. En cas de doute, utilisez « Archiver » : vous pourrez toujours revenir en arrière.</Warn>
      </>
    ),
  },
  {
    id: "evenements",
    title: "Créer un événement",
    icon: CalendarDays,
    body: (
      <>
        <Steps>
          <li><strong>Publications → Événements → Nouvel événement</strong>.</li>
          <li>Titre, présentation courte, <strong>date et heure de début</strong>, fin (facultative), <strong>lieu</strong>, image.</li>
          <li>Dans « Programme et informations pratiques », détaillez le déroulé. La même mise en forme que pour les articles est disponible.</li>
          <li>Choisissez le statut <strong>Publié</strong> et enregistrez.</li>
        </Steps>
        <ul>
          <li>La section « Événements » de la page d’accueil affiche le <strong>prochain événement publié</strong> (les événements de moins de 24 h sont encore montrés). Sans événement publié, la section n’apparaît pas.</li>
          <li>Chaque événement a sa propre page (<code>/evenement/…</code>), partageable.</li>
          <li>Les heures sont affichées selon le fuseau d’Abidjan.</li>
        </ul>
      </>
    ),
  },
  {
    id: "medias",
    title: "Images et médias",
    icon: ImageIcon,
    body: (
      <>
        <p>Les fichiers sont stockés sur <strong>Cloudinary</strong> et servis rapidement dans un format optimisé.</p>
        <table className="gd-table">
          <tbody>
            <tr><th>Image</th><td>JPG, PNG ou WebP, <strong>10 Mo</strong> maximum. Glissez-déposez ou cliquez sur la zone.</td></tr>
            <tr><th>Vidéo</th><td>MP4, WebM, MOV…, <strong>100 Mo</strong> maximum.</td></tr>
            <tr><th>Audio</th><td>MP3, M4A, WAV…, <strong>50 Mo</strong> maximum.</td></tr>
          </tbody>
        </table>
        <h3>Conseils pour de belles images</h3>
        <ul>
          <li>Privilégiez le <strong>format paysage</strong> (environ 16:10), au moins 1200 px de large.</li>
          <li>Évitez les textes incrustés dans l’image : elle est recadrée selon l’écran.</li>
          <li>Pour changer l’image d’un article, utilisez « Remplacer » ; « Retirer » la supprime de l’article (le fichier reste sur Cloudinary).</li>
        </ul>
        <Warn>N’utilisez que des images dont vous détenez les droits (photos prises par l’équipe, accord écrit des auteurs).</Warn>
      </>
    ),
  },
  {
    id: "emplacements",
    title: "Où apparaissent mes contenus",
    icon: Eye,
    body: (
      <>
        <p>La page d’accueil est organisée comme celle d’un journal et se construit toute seule à partir de ce que vous publiez. Une section sans contenu est masquée.</p>
        <table className="gd-table">
          <tbody>
            <tr><th>À la une (grande photo)</th><td>La publication cochée « à la une » la plus récente, sinon la plus récente tout court.</td></tr>
            <tr><th>Les 3 titres sous la une</th><td>Les trois publications suivantes, de la plus récente à la plus ancienne.</td></tr>
            <tr><th>Dernières nouvelles</th><td>La colonne de droite : les 7 publications les plus récentes avec leur heure.</td></tr>
            <tr><th>Un bloc par rubrique</th><td>Chaque rubrique qui a du contenu a son bloc (jusqu’à 3 publications), dans l’ordre défini dans l’onglet Rubriques.</td></tr>
            <tr><th>Vidéos / Podcasts</th><td>Bandeaux dédiés qui reprennent vos dernières publications de type Vidéo ou Podcast.</td></tr>
            <tr><th>Agenda</th><td>Les prochains événements publiés (4 maximum).</td></tr>
            <tr><th>Menu</th><td>Les rubriques non vides, puis « Vidéos » et « Podcasts » s’il y en a.</td></tr>
            <tr><th>Pages dédiées</th><td><code>/actualites</code> (tout), <code>/rubrique/nom</code>, <code>/videos</code>, <code>/podcasts</code>, avec 9 publications par page.</td></tr>
          </tbody>
        </table>
        <Tip>La page d’accueil charge les 48 dernières publications. Les plus anciennes restent accessibles par « Toute l’actualité » et par leur rubrique.</Tip>
      </>
    ),
  },
  {
    id: "contenu-du-site",
    title: "Modifier les textes du site",
    icon: SlidersHorizontal,
    body: (
      <>
        <p>
          L’onglet <strong>Contenu du site</strong> regroupe les textes fixes : slogan sous le logo, ville, description du site (affichée sur Google et dans les aperçus de partage),
          titres des sections Agenda, Vidéos et Podcasts, bloc contact, pied de page, adresse e-mail de la rédaction et liens Facebook, Instagram, YouTube.
        </p>
        <ul>
          <li>Chaque champ affiche en <strong>grisé</strong> le texte par défaut. <strong>Laissez le champ vide</strong> pour le conserver.</li>
          <li>Écrivez dans le champ pour remplacer le texte ; effacez-le pour revenir au texte d’origine.</li>
          <li>Cliquez sur <strong>« Enregistrer »</strong> : le site est mis à jour immédiatement.</li>
          <li>La « note en bas de page » est facultative : vide, rien ne s’affiche.</li>
        </ul>
        <Tip>Pour les liens des réseaux sociaux, collez l’adresse complète de la page (commençant par <code>https://</code>).</Tip>
      </>
    ),
  },
  {
    id: "messages",
    title: "Messages et abonnés",
    icon: Inbox,
    body: (
      <>
        <h3>Messages du formulaire de contact</h3>
        <ul>
          <li>Chaque message reçu apparaît dans <strong>Messages</strong> avec une pastille orange tant qu’il n’est pas lu. Le nombre de nouveaux messages s’affiche aussi dans le menu.</li>
          <li>Cliquez sur un message pour le lire (il passe alors en « lu »).</li>
          <li><strong>Répondre</strong> ouvre votre messagerie avec l’adresse du visiteur déjà remplie.</li>
          <li><strong>Marquer non lu</strong> permet de se rappeler d’y revenir ; la corbeille supprime le message.</li>
          <li>Une copie de chaque message est aussi envoyée par e-mail à l’adresse de la rédaction.</li>
        </ul>
        <h3>Abonnés aux nouveautés</h3>
        <p>
          Les adresses saisies dans le pied de page du site sont listées dans l’onglet <strong>Abonnés</strong>. Le bouton <strong>« Exporter en CSV »</strong>
          télécharge la liste (ouvrable dans Excel). Chaque abonné peut être supprimé.
        </p>
        <Warn>Ces adresses sont des données personnelles : ne les partagez pas et ne les utilisez que pour informer les personnes qui se sont inscrites.</Warn>
      </>
    ),
  },
  {
    id: "administrateurs",
    title: "Gérer les administrateurs",
    icon: Users,
    body: (
      <>
        <p>Tous les administrateurs ont les <strong>mêmes droits</strong> : publier, modifier, supprimer, lire les messages et gérer l’équipe.</p>
        <h3>Ajouter un administrateur</h3>
        <Steps>
          <li>Ouvrez <strong>Administrateurs</strong>.</li>
          <li>Saisissez son e-mail.</li>
          <li>Facultatif : choisissez un mot de passe initial (8 caractères minimum) à lui transmettre de façon sûre. Sans mot de passe, il se connectera par code e-mail.</li>
          <li>Cliquez sur <strong>« Ajouter l’administrateur »</strong>. Il peut se connecter immédiatement et verra ce guide à sa première visite.</li>
        </Steps>
        <h3>Retirer un administrateur</h3>
        <p>Cliquez sur la corbeille à côté de son nom. Il perd l’accès tout de suite, même s’il est connecté. Vous ne pouvez pas vous retirer vous-même : il reste ainsi toujours au moins un administrateur.</p>
        <Warn>N’ajoutez que des personnes de confiance : un administrateur peut supprimer des contenus et voir les messages des visiteurs.</Warn>
      </>
    ),
  },
  {
    id: "securite",
    title: "Sécurité et bonnes pratiques",
    icon: ShieldCheck,
    body: (
      <>
        <ul>
          <li>Choisissez un mot de passe <strong>long et unique</strong> (une phrase de plusieurs mots vaut mieux qu’un mot compliqué).</li>
          <li>Ne partagez jamais votre mot de passe ni un code reçu par e-mail, même avec « le support ».</li>
          <li>Sur un ordinateur public ou partagé, cliquez toujours sur <strong>« Quitter »</strong>.</li>
          <li>Relisez et utilisez l’<strong>Aperçu</strong> avant de publier ; en cas d’hésitation, laissez en brouillon.</li>
          <li>Gardez l’accès à votre boîte e-mail : c’est elle qui permet de vous reconnecter par code.</li>
          <li>Si un collaborateur quitte l’équipe, retirez-le aussitôt de la liste des administrateurs.</li>
        </ul>
      </>
    ),
  },
  {
    id: "depannage",
    title: "Questions fréquentes",
    icon: LifeBuoy,
    body: (
      <>
        <dl className="gd-faq">
          <dt>Je n’ai pas reçu mon code de connexion.</dt>
          <dd>Vérifiez les spams, attendez une minute avant d’en redemander un, et assurez-vous d’utiliser l’adresse enregistrée comme administrateur. Sinon, connectez-vous par mot de passe ou demandez à un autre administrateur de vérifier votre adresse.</dd>
          <dt>Mon article est publié mais n’apparaît pas sur le site.</dt>
          <dd>Vérifiez le statut (« Publié », pas « Brouillon »), que la <strong>date de publication n’est pas dans le futur</strong>, puis rechargez le site. Pour qu’il apparaisse dans une section précise (Interviews, Reportages…), contrôlez sa rubrique.</dd>
          <dt>Une section de la page d’accueil a disparu.</dt>
          <dd>Elle n’a plus de contenu : publiez dans la rubrique correspondante (ou un événement à venir pour l’Agenda).</dd>
          <dt>Le téléversement d’une image échoue.</dt>
          <dd>Contrôlez la taille (10 Mo maximum) et le format. Si le message évoque Cloudinary, contactez la personne qui gère l’hébergement : les identifiants Cloudinary sont peut-être absents ou incorrects.</dd>
          <dt>Le lien partagé sur WhatsApp n’affiche pas la bonne image.</dt>
          <dd>Vérifiez que l’article a une image de couverture. WhatsApp et Facebook gardent un aperçu en mémoire : un ancien lien peut mettre du temps à se rafraîchir.</dd>
          <dt>J’ai perdu mes modifications.</dt>
          <dd>Seul l’enregistrement les conserve. Pensez à <K>Ctrl</K> + <K>S</K> régulièrement et à ne pas fermer l’onglet tant que le point orange est visible.</dd>
          <dt>J’ai supprimé un contenu par erreur.</dt>
          <dd>La suppression est définitive. À l’avenir, archivez plutôt que supprimer.</dd>
          <dt>Ma vidéo ou mon podcast ne se lance pas.</dt>
          <dd>Vérifiez l’aperçu du lecteur dans l’éditeur. Un lien YouTube doit être celui de la vidéo (pas d’une chaîne ni d’une liste de lecture). Pour un fichier, utilisez l’adresse directe se terminant par .mp4 ou .mp3, ou téléversez-le.</dd>
          <dt>Une erreur « Trop de tentatives » s’affiche.</dt>
          <dd>Des limites protègent le site contre les abus (par exemple 5 messages de contact par heure et par adresse). Patientez, puis réessayez.</dd>
        </dl>
      </>
    ),
  },
];

export function Guide({ onNavigate }: { onNavigate?: (section: "dashboard" | "content" | "rubriques" | "messages" | "site" | "admins") => void }) {
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-10% 0px -70% 0px" },
    );
    SECTIONS.forEach((s) => { const el = document.getElementById(s.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  };

  return (
    <div className="adm-stack">
      <div className="adm-head">
        <div>
          <h1>Guide de l’administrateur</h1>
          <p>Tout ce qu’il faut savoir pour gérer le média, de la première connexion à la publication d’un article.</p>
        </div>
        {onNavigate && <button className="adm-btn adm-btn-primary" onClick={() => onNavigate("content")}><FileText size={16} /> Écrire un article</button>}
      </div>

      <div className="gd-layout">
        <nav className="gd-toc adm-card" aria-label="Sommaire du guide">
          <span className="gd-toc-title"><BookOpen size={14} /> Sommaire</span>
          {SECTIONS.map((s, i) => (
            <button key={s.id} className={active === s.id ? "on" : ""} onClick={() => go(s.id)}>
              <span>{i + 1}</span>{s.title}
            </button>
          ))}
        </nav>

        <div className="gd-content">
          <div className="adm-card gd-start">
            <h2><Rocket size={18} /> En 5 minutes</h2>
            <ol>
              <li>Définissez votre <strong>mot de passe</strong> (bouton en bas du menu).</li>
              <li>Ouvrez <strong>Contenu du site</strong> pour vérifier les textes et les liens des réseaux sociaux.</li>
              <li>Vérifiez les <strong>rubriques</strong> (onglet Rubriques) et créez celles dont vous avez besoin.</li>
              <li>Créez votre première <strong>publication</strong> (texte, vidéo ou podcast) en brouillon, avec une image.</li>
              <li>Relisez-le dans l’onglet <strong>Aperçu</strong>, puis passez-le en <strong>Publié</strong>.</li>
              <li>Cliquez sur <strong>« Voir le média »</strong> pour constater le résultat.</li>
            </ol>
          </div>

          {SECTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <section key={s.id} id={s.id} className="adm-card gd-section">
                <h2><span className="gd-num">{i + 1}</span><Icon size={18} /> {s.title}</h2>
                {s.body}
              </section>
            );
          })}

          <p className="gd-end"><KeyRound size={14} /> Besoin d’aide supplémentaire ? Contactez la personne qui gère l’hébergement du site.</p>
        </div>
      </div>
    </div>
  );
}
