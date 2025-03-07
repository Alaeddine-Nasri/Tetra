type Bilingual = { fr: string; en: string }
type RowType = 'tags' | 'pills'
export type { Bilingual }

interface NavLink {
  key: string
  label: Bilingual
  path: string
}

export interface Screenshot {
  src: string
  title: Bilingual
  description: Bilingual
}

export interface Project {
  id: string
  title: string
  company: string
  role: Bilingual
  impact: Bilingual
  description: Bilingual
  fullDescription: Bilingual
  tags: string[]
  year: string
  image: string
  url?: string
  screenshots?: Screenshot[]
}

export interface AboutRow {
  key: string
  label: Bilingual
  detail?: Bilingual
  type: RowType
  items: (string | Bilingual)[]
}

interface SocialLink {
  label: string
  url: string
}

export const content = {
  meta: {
    name: 'Ala-Nasri',
    title: {
      fr: 'Ala Eddine Nasri — Ingénieur Frontend',
      en: 'Ala Eddine Nasri — Frontend Engineer & 3D Developer'
    },
    description: {
      fr: 'Ingénieur Frontend · Vue · TypeScript · Three.js · 3D Web',
      en: 'Frontend Engineer · Vue · TypeScript · Three.js · 3D Web'
    }
  },

  nav: {
    logo: 'Ala-Nasri',
    links: [
      { key: 'work',    label: { fr: 'Projets',   en: 'Work'    }, path: '/work'    },
      { key: 'about',   label: { fr: 'À propos',  en: 'About'   }, path: '/about'   },
      { key: 'contact', label: { fr: 'Contact',   en: 'Contact' }, path: '/contact' }
    ] as NavLink[]
  },

  mobile: {
    fr: 'Ce site est conçu pour les écrans larges.',
    en: 'This site is designed for wide screens.'
  },

  home: {
    name: 'Ala Eddine Nasri',
    title: {
      fr: 'Ingénieur Frontend',
      en: 'Frontend Engineer'
    },
    availability: {
      fr: 'Disponible pour des projets',
      en: 'Available for projects'
    }
  },

  about: {
    heading: { fr: 'À propos.', en: 'About Me.' },

    bio: {
      fr: 'Je conçois des interfaces pensées pour durer — architectures claires, animations intentionnelles, code qui fait sens.',
      en: 'I craft interfaces built to last — clear architectures, intentional animations, code that makes sense.'
    },

    stats: [
      {
        key: 'experience',
        value: '3+',
        unit: { fr: 'ans', en: 'years' },
        label: { fr: 'Expérience', en: 'Experience' },
        detail: { fr: 'Projets industriels & académiques', en: 'Industrial & academic projects' }
      },
      {
        key: 'projects',
        value: '12+',
        unit: { fr: '', en: '' },
        label: { fr: 'Projets', en: 'Projects' },
        detail: { fr: 'Livrés en production', en: 'Shipped to production' }
      },
      {
        key: 'awards',
        value: '1ᵉʳ',
        unit: { fr: 'Prix', en: 'Prize' },
        label: { fr: 'DevFest Hackathon', en: 'DevFest Hackathon' },
        detail: { fr: 'Compétition nationale', en: 'National competition' }
      }
    ],

    rows: [
      {
        key: 'engineering',
        label: { fr: 'Ingénierie',    en: 'Engineering'  },
        detail: { fr: 'Architectures logicielles, algorithmes et systèmes embarqués.', en: 'Software architectures, algorithms and embedded systems.' },
        type: 'tags',
        items: ['Architectures', 'Algorithmics', 'Systems', 'Embedded']
      },
      {
        key: 'education',
        label: { fr: 'Formation',     en: 'Education'    },
        detail: { fr: 'Diplômes obtenus en France, spécialisation IoT & Logiciel.', en: 'Degrees obtained in France, IoT & Software specialisation.' },
        type: 'tags',
        items: [
          { fr: 'Master IoT',         en: 'Master IoT'         },
          { fr: 'Diplôme Ingénieur',  en: 'Engineer Diploma'   }
        ]
      },
      {
        key: 'skills',
        label: { fr: 'Compétences',   en: 'Skills'       },
        detail: { fr: 'Stack actuelle et outils du quotidien.', en: 'Current stack and daily tools.' },
        type: 'pills',
        items: ['Vue 3', 'TypeScript', 'Three.js', 'GSAP', 'Node.js', 'Python', 'REST API', 'Git', 'Docker', 'IoT']
      },
      {
        key: 'languages',
        label: { fr: 'Langues',       en: 'Languages'    },
        detail: { fr: 'Trois langues, trois cultures.', en: 'Three languages, three cultures.' },
        type: 'tags',
        items: [
          { fr: 'Français — natif',  en: 'French — native'  },
          { fr: 'Anglais — courant', en: 'English — fluent' },
          { fr: 'Arabe — natif',     en: 'Arabic — native'  }
        ]
      }
    ] as AboutRow[],

    cv: {
      label: { fr: 'Télécharger le CV', en: 'Download CV' },
      path: '/cv/ala-nasri-cv.pdf'
    }
  },

  work: {
    heading: { fr: 'Projets.', en: 'Work.' },
    projects: [
      {
        id: 'spinalcom',
        title: 'SpinalCom — Network & Tickets',
        company: 'SpinalCom',
        role: {
          fr: 'Développeur Frontend',
          en: 'Frontend Developer'
        },
        impact: {
          fr: 'Réduction du temps de chargement de 30% · déployé en préproduction sur hôpitaux et banques',
          en: '30% load time reduction · pre-production deployed across hospitals and banks'
        },
        description: {
          fr: 'Jumeau numérique · bâtiments intelligents · 3D',
          en: 'Digital twin · smart buildings · 3D'
        },
        fullDescription: {
          fr: `Développées au sein de SpinalWall — le portail unifié de SpinalCom — ces deux micro-applications s'appuient sur SpinalCore, un Building Operating System qui unifie BIM, capteurs IoT et SI d'entreprise dans un seul jumeau numérique.

L'application Network permet aux facility managers de superviser en temps réel tous les équipements connectés d'un bâtiment. Elle combine une table hiérarchique des équipements (nom, typologie, statut, réseaux enfants) et une intégration au viewer BIM 3D : chaque équipement est représenté par un sprite positionné à ses coordonnées XYZ réelles, les connexions parent-enfant sont tracées sous forme de lignes dynamiques dans la scène. Sélectionner un nœud dans la table zoome automatiquement sur son réseau dans le modèle 3D et ouvre une carte interactive avec les valeurs temps réel des capteurs. Une logique de statuts entièrement config-driven calcule l'état de chaque équipement depuis ses Control Points — seuils booléens ou numériques définis par JSON par type d'équipement. Optimisation clé : remplacement d'un composant de table récursif par un rendu indexé par niveau, réduisant le temps de chargement de 30% sur les grands bâtiments.

L'application Tickets gère le cycle complet des interventions de maintenance — création, suivi et résolution de tickets liés à des éléments BIM spécifiques, visibles et cliquables directement dans le viewer 3D. Le système de connecteurs inter-applications que j'ai développé relie les deux apps : depuis le panneau d'analyse de Network, un clic route l'utilisateur directement vers les tickets des équipements inactifs, en transmettant le contexte complet \`{ name, id, profileName, type, vue }\` pour que l'app cible s'ouvre déjà filtrée.`,
          en: `Built inside SpinalWall — SpinalCom's unified portal — these two micro-apps run on top of SpinalCore, a Building Operating System that unifies BIM models, IoT sensors, and enterprise IT into a single digital twin.

The Network app lets facility managers supervise every connected piece of equipment in a building in real time. It combines a hierarchical equipment table (name, typology, status, child networks) with a BIM 3D viewer integration: each equipment item is rendered as a sprite at its real XYZ coordinates, with dynamic parent-child connection lines drawn in the scene. Selecting any row in the table auto-zooms the 3D model to that equipment's network and opens an interactive card showing live sensor values. Status logic is fully config-driven — a JSON file defines which Control Point to query per equipment type and what threshold triggers a red status. Key optimization: replacing a recursive table component with a flat level-indexed renderer cut load time by 30% on large buildings.

The Tickets app handles the full intervention lifecycle — creating, tracking, and resolving maintenance tickets linked to specific BIM elements, visible and clickable directly in the 3D viewer. The inter-app connector system I built bridges both apps: from Network's analytics panel, one click routes the user to the tickets for inactive equipment, passing full context \`{ name, id, profileName, type, vue }\` so the target app opens already filtered on the right data.`
        },
        tags: ['Vue 3', 'TypeScript', 'Three.js', 'D3.js', 'Vuex', 'Node.js'],
        year: '2025',
        image: '/projects/spinalcom.png',
        screenshots: [
          {
            src: '/projects/spinalcom-1.jpg',
            title: { fr: 'Viewer 3D + table hiérarchique', en: '3D viewer + hierarchical table' },
            description: {
              fr: 'Sélection d\'un équipement dans la table : zoom automatique sur son réseau dans le modèle 3D, sprites colorés par statut, carte interactive avec valeurs capteurs en temps réel.',
              en: 'Selecting equipment in the table auto-zooms to its network in the 3D model, with status-colored sprites and a live sensor values card.'
            }
          },
          {
            src: '/projects/spinalcom-2.jpg',
            title: { fr: 'Réseau 3D + connexions dynamiques', en: '3D network + dynamic connections' },
            description: {
              fr: 'Lignes de connexion parent-enfant tracées dans la scène 3D aux coordonnées XYZ réelles — CRUD des connexions directement dans le viewer, zoom dynamique par sélection.',
              en: 'Parent-child connection lines drawn in the 3D scene at real XYZ coordinates — full CRUD on connections directly in the viewer, dynamic zoom on selection.'
            }
          },
          {
            src: '/projects/spinalcom-3.jpg',
            title: { fr: 'Tickets & connecteurs inter-apps', en: 'Tickets & inter-app connectors' },
            description: {
              fr: 'Tickets d\'intervention liés aux éléments BIM, visibles dans le viewer 3D — routing contextuel depuis Network vers Tickets avec transmission du contexte complet.',
              en: 'Intervention tickets linked to BIM elements, visible in the 3D viewer — contextual routing from Network to Tickets carrying the full entity context.'
            }
          }
        ]
      },
      {
        id: 'tetra',
        title: 'Tetra',
        company: 'Projet personnel',
        role: {
          fr: 'Concepteur & Développeur Frontend',
          en: 'Designer & Frontend Developer'
        },
        impact: {
          fr: 'Portfolio cinématique déployé sur ala-nasri.dev',
          en: 'Cinematic portfolio live at ala-nasri.dev'
        },
        description: {
          fr: 'Portfolio cinématique · 3D · scroll',
          en: 'Cinematic portfolio · 3D · scroll'
        },
        fullDescription: {
          fr: `Tetra est le portfolio que vous regardez en ce moment. Conçu comme un objet en soi — pas une présentation, une expérience.

L'architecture repose sur Vue 3 + Vite en SPA pure, sans SSR. Quatre sections en 100vh défilent en continu avec ScrollTrigger de GSAP : Hero, Projets, À propos, Contact. La navigation ancre chaque section sans rechargement. Les transitions entre vues sont pilotées par GSAP avec des timelines précises — chaque mouvement est intentionnel, lent, cinématique.

La pièce centrale est un cristal octaédrique Three.js construit en \`OctahedronGeometry\` native — aucun fichier de modèle. La géométrie utilise \`flatShading: true\` pour que chaque face lise comme un plan distinct. Le matériau est un \`MeshStandardMaterial\` sombre (#0D0A1E) avec un overlay \`EdgesGeometry\` en violet (#6B5CE7, opacity 0.35). Trois \`PointLight\` positionnés précisément créent le jeu de faces éclairées et de faces dans l'ombre. Un cristal compagnon à 35% de la taille principale tourne sur un axe différent. Trente-six particules orbitent en ellipses individualisées. L'ensemble réagit au scroll via un composable \`useCrystalAnimation.ts\` séparé du rendu : accélération de rotation ×3.5, inclinaison selon la direction, particules aspirées vers le centre puis dispersées.

Le panneau de détail projet s'inspire de itssharl.ee — il glisse depuis la droite, labels à gauche (CATÉGORIE, ANNÉE, STACK), contenu à droite, scroll interne. Fermeture par touche Escape, clic overlay, ou bouton.`,
          en: `Tetra is the portfolio you're looking at right now. Designed as an object in itself — not a presentation, an experience.

The architecture is Vue 3 + Vite as a pure SPA, no SSR. Four 100vh sections scroll continuously with GSAP's ScrollTrigger: Hero, Work, About, Contact. Navigation anchors each section without reload. View transitions are driven by GSAP with precise timelines — every movement is intentional, slow, cinematic.

The centerpiece is a Three.js octahedral crystal built with native \`OctahedronGeometry\` — no model files. The geometry uses \`flatShading: true\` so each face reads as a distinct plane. The material is a dark \`MeshStandardMaterial\` (#0D0A1E) with an \`EdgesGeometry\` overlay in purple (#6B5CE7, opacity 0.35). Three precisely positioned \`PointLight\` sources create the interplay of lit and shadowed faces. A companion crystal at 35% scale rotates on a different axis. Thirty-six particles orbit in individualized ellipses. Everything reacts to scroll via a \`useCrystalAnimation.ts\` composable separated from the render layer: rotation speed ×3.5, tilt toward scroll direction, particles pulled inward then scattered outward.

The project detail panel takes inspiration from itssharl.ee — slides in from the right, labels on the left (CATEGORY, YEAR, STACK), content on the right, internal scroll. Closes on Escape key, overlay click, or button.`
        },
        tags: ['Vue 3', 'TypeScript', 'Three.js', 'GSAP', 'ScrollTrigger', 'Tailwind CSS', 'Pinia'],
        year: '2025',
        image: '/projects/tetra.png',
        url: 'https://ala-nasri.dev',
        screenshots: [
          {
            src: '/projects/tetra-1.png',
            title: { fr: 'Cristal octaédrique 3D', en: '3D octahedral crystal' },
            description: {
              fr: 'OctahedronGeometry flatShading avec overlay EdgesGeometry violet, trois PointLights positionnés, cristal compagnon et 36 particules en orbite elliptique.',
              en: 'OctahedronGeometry with flatShading, purple EdgesGeometry overlay, three positioned PointLights, companion crystal and 36 particles in elliptical orbits.'
            }
          },
          {
            src: '/projects/tetra-2.png',
            title: { fr: 'Section projets — scroll horizontal', en: 'Work section — horizontal scroll' },
            description: {
              fr: 'Cards projets en scroll horizontal piloté par ScrollTrigger — timeline horizontale en arrière-plan, effet vignette au survol.',
              en: 'Project cards in horizontal scroll driven by ScrollTrigger — horizontal timeline behind cards, vignette hover effect.'
            }
          },
          {
            src: '/projects/tetra-3.png',
            title: { fr: 'Panneau de détail projet', en: 'Project detail panel' },
            description: {
              fr: 'Panneau qui glisse depuis la droite — labels CATÉGORIE / ANNÉE / STACK à gauche, contenu scrollable à droite, fermeture Escape ou overlay.',
              en: 'Panel sliding in from the right — CATEGORY / YEAR / STACK labels on the left, scrollable content on the right, closes on Escape or overlay click.'
            }
          }
        ]
      },
      {
        id: 'manarah',
        title: 'Manarah',
        company: 'Projet personnel',
        role: {
          fr: 'Fondateur & Développeur Full Stack',
          en: 'Founder & Full Stack Developer'
        },
        impact: {
          fr: '4 écoles · 1600+ élèves · en production · abonnement annuel',
          en: '4 schools · 1600+ students · live in production · annual subscription'
        },
        description: {
          fr: 'SaaS scolaire · 4 écoles · production',
          en: 'School SaaS · 4 schools · live'
        },
        fullDescription: {
          fr: `Manarah est un produit SaaS complet que j'ai conçu, développé et commercialisé en solo — aujourd'hui utilisé en production par 4 établissements privés en Algérie pour gérer plus de 1 600 élèves avec un modèle d'abonnement annuel.

Le produit couvre l'intégralité du cycle opérationnel d'une école privée : gestion de la structure académique (niveaux, années, groupes, matières), planning hebdomadaire des séances avec support de sessions récurrentes et parallèles, présence automatisée par QR code — chaque élève a son propre QR, la fenêtre de présence s'ouvre automatiquement 15 minutes avant la séance et les absences sont enregistrées automatiquement à la fermeture.

Le module de paiements gère plusieurs formules (pack de séances, mensuel, annuel, personnalisé) avec un système de split de revenus configurable : chaque paiement est automatiquement réparti entre l'école et l'enseignant selon des règles paramétrables par enseignant, niveau ou matière. Le module de paie génère les récapitulatifs mensuels enseignants basés sur les séances réalisées. Un tableau de bord temps réel agrège revenus, taux de présence, activité enseignants et alertes de renouvellement.

Stack : React, Node.js / Express, PostgreSQL, REST API, JWT. Déployé sur Render.`,
          en: `Manarah is a complete SaaS product I designed, built, and commercialized solo — now running in production at 4 private schools in Algeria, managing 1,600+ students on an annual subscription model.

The product covers the full operational cycle of a private school: academic structure management (levels, years, groups, subjects), weekly session scheduling with recurring and parallel session support, and QR-based automated attendance — each student has a unique QR code, the attendance window opens automatically 15 minutes before the session, and absences are recorded automatically on close.

The payment module handles multiple formats (session packs, monthly, annual, custom) with a configurable revenue split system: each payment is automatically distributed between the school and the teacher based on rules configurable per teacher, level, or subject. The payroll module generates monthly teacher summaries based on completed sessions. A real-time dashboard aggregates revenue, attendance rates, teacher activity, and renewal alerts.

Stack: React, Node.js / Express, PostgreSQL, REST API, JWT. Deployed on Render.`
        },
        tags: ['React', 'Node.js', 'Express', 'PostgreSQL', 'REST API', 'JWT'],
        year: '2024',
        image: '/projects/manarah.png',
        url: 'https://manarah-8dr0.onrender.com',
        screenshots: [
          {
            src: '/projects/manarah-1.png',
            title: { fr: 'Planning — mode clair', en: 'Schedule — light mode' },
            description: {
              fr: 'Calendrier semaine, sessions parallèles color-coded par enseignant, mode clair.',
              en: 'Week calendar, parallel sessions color-coded per teacher, light mode.'
            }
          },
          {
            src: '/projects/manarah-2.png',
            title: { fr: 'Planning — mode sombre', en: 'Schedule — dark mode' },
            description: {
              fr: 'Même vue semaine en mode sombre — thème CSS custom properties, zéro refactor.',
              en: 'Same week view in dark mode — CSS custom properties theming, zero refactor.'
            }
          },
          {
            src: '/projects/manarah-3.png',
            title: { fr: 'Tableau de bord temps réel', en: 'Real-time dashboard' },
            description: {
              fr: 'KPIs agrégés côté serveur, graphiques Recharts, revenus et présence en temps réel.',
              en: 'Server-aggregated KPIs, Recharts graphs, live revenue and attendance data.'
            }
          },
          {
            src: '/projects/manarah-4.png',
            title: { fr: 'Tableau de bord — mode sombre', en: 'Dashboard — dark mode' },
            description: {
              fr: 'Dashboard identique en dark mode — palette adaptée, lisibilité des graphiques préservée.',
              en: 'Same dashboard in dark mode — adapted palette, chart readability preserved.'
            }
          },
          {
            src: '/projects/manarah-5.png',
            title: { fr: 'Gestion des élèves', en: 'Student management' },
            description: {
              fr: 'Table paginée avec panneau latéral — profil, QR code et statut de renouvellement par élève.',
              en: 'Paginated table with side panel — profile, QR code and renewal status per student.'
            }
          },
          {
            src: '/projects/manarah-6.png',
            title: { fr: 'Paiements & split revenus', en: 'Payments & revenue split' },
            description: {
              fr: 'Split école/enseignant calculé automatiquement par paiement, progress bar séances consommées.',
              en: 'Automatic school/teacher revenue split per payment, consumed sessions progress bar.'
            }
          },
          {
            src: '/projects/manarah-7.png',
            title: { fr: 'Interface arabe — RTL', en: 'Arabic UI — RTL' },
            description: {
              fr: 'Layout RTL complet — direction HTML, nav et grilles inversées sans duplication de composants.',
              en: 'Full RTL layout — HTML direction, nav and grids flipped with no component duplication.'
            }
          }
        ]
      },
      {
        id: 'bank-of-algeria',
        title: 'Centrale Budget',
        company: 'Bank of Algeria',
        role: {
          fr: 'Développeur Full Stack',
          en: 'Full Stack Developer'
        },
        impact: {
          fr: '300+ utilisateurs internes · 45 formulaires réduits à 5 · 3 systèmes remplacés par 1',
          en: '300+ internal users · 45 forms reduced to 5 · 3 legacy systems replaced by 1'
        },
        description: {
          fr: 'Système budgétaire · 300 utilisateurs internes',
          en: 'Budget system · 300 internal users'
        },
        fullDescription: {
          fr: `La Banque d'Algérie gère chaque année une campagne budgétaire impliquant plus de 112 structures réparties à travers tout le pays — sièges du réseau, directions centrales, directions générales — pour un total de ~5 000 prévisions budgétaires annuelles. Le processus existant reposait sur 3 applications hétérogènes, 45 annexes budgétaires distinctes en Excel, et une messagerie comme seul canal de communication. Le résultat : erreurs de ressaisie, retards chroniques, absence de traçabilité.

J'ai conçu et développé "Centrale Budget", une solution web unifiée en JEE / JavaServer Faces qui remplace l'ensemble de ce système. L'application couvre le cycle budgétaire complet : expression des besoins par les structures, consolidation et contrôle par la sous-direction du budget, validation par la commission budgétaire, notification du budget annuel. Les 45 formulaires ont été rationalisés en 5 canevas dynamiques. Un module d'administration gère les utilisateurs, groupes, droits d'accès, et le référentiel organisationnel (chapitres, rubriques, centres). Un module de reporting génère les récapitulatifs et KPIs validés par le top-management. La solution a été déployée en préproduction avec des retours positifs des équipes métier.`,
          en: `The Bank of Algeria manages an annual budget campaign involving 112+ structures spread across the country — network branches, central directorates, general directorates — generating ~5,000 budget forecasts per year. The existing process ran on 3 heterogeneous applications, 45 separate Excel budget annexes, and email as the sole communication channel. The result: re-entry errors, chronic delays, no traceability.

I designed and built "Centrale Budget," a unified JEE/JavaServer Faces web solution replacing this entire system. The app covers the full budget cycle: needs expression by structures, consolidation and control by the budget sub-directorate, validation by the budget commission, and annual budget notification. 45 forms were rationalized into 5 dynamic templates. An administration module handles users, groups, access rights, and the organizational reference data (chapters, line items, cost centers). A reporting module generates summaries and KPIs validated by top management. The solution was deployed to pre-production with positive feedback from business teams.`
        },
        tags: ['JEE', 'JavaServer Faces', 'JavaScript', 'CSS', 'Jasper Reports', 'UML', 'Scrum'],
        year: '2023',
        image: '/projects/bank-algeria.png',
        screenshots: [
          {
            src: '/projects/bank-algeria-1.png',
            title: { fr: 'Page de connexion', en: 'Login screen' },
            description: {
              fr: 'Écran d\'authentification — photo architecturale de la Banque d\'Algérie à gauche, formulaire de connexion par matricule à droite.',
              en: 'Authentication screen — Bank of Algeria architectural photo on the left, matricule-based login form on the right.'
            }
          },
          {
            src: '/projects/bank-algeria-2.png',
            title: { fr: 'Tableau de bord administrateur', en: 'Admin dashboard' },
            description: {
              fr: 'Vue d\'accueil administrateur — 5 modules accessibles : campagne budgétaire, utilisateurs, organisation, chapitres/rubriques, reporting.',
              en: 'Admin home view — 5 accessible modules: budget campaign, users, organization, chapters/categories, reporting.'
            }
          },
          {
            src: '/projects/bank-algeria-3.png',
            title: { fr: 'Dashboard KPI budgétaire', en: 'Budget KPI dashboard' },
            description: {
              fr: 'Tableau de bord de reporting : budget demandé, taux de réalisation, budget notifié — répartition par rubrique (barres), par chapitre (donut), par structure (bulles) et évolution temporelle.',
              en: 'Reporting dashboard: requested budget, realization rate, notified budget — breakdown by category (bars), chapter (donut), structure (bubbles) and time evolution.'
            }
          },
          {
            src: '/projects/bank-algeria-4.png',
            title: { fr: 'Récapitulatif des prévisions', en: 'Budget forecast summary' },
            description: {
              fr: 'Table des prévisions budgétaires par opération — exercice, code opération, rubrique, intitulé, centre, coût total TTC et statut de contrôle par ligne.',
              en: 'Budget forecast table by operation — exercise, operation code, category, label, center, total cost TTC and control status per row.'
            }
          },
          {
            src: '/projects/bank-algeria-5.png',
            title: { fr: 'Contrôle de la campagne', en: 'Campaign control panel' },
            description: {
              fr: 'Interface de pilotage de la campagne budgétaire — activation par toggles, dates butoires par type de structure, paramètres financiers (TVA, seuils de marché).',
              en: 'Budget campaign control interface — activation toggles, deadlines per structure type, financial parameters (VAT, market thresholds).'
            }
          },
          {
            src: '/projects/bank-algeria-6.png',
            title: { fr: 'Gestion des utilisateurs', en: 'User management' },
            description: {
              fr: 'Liste des utilisateurs avec matricule, nom et centre budgétaire — actions par ligne (profil, détail, suppression), filtrage en-tête de colonne.',
              en: 'User list with matricule, name and budget center — per-row actions (profile, detail, delete), column header filtering.'
            }
          }
        ]
      },
      {
        id: 'aurespedia',
        title: 'AuresPédia',
        company: 'Université Batna 2',
        role: {
          fr: 'Développeur Frontend',
          en: 'Frontend Developer'
        },
        impact: {
          fr: 'Plateforme médicale officielle · bilingue FR/AR · contenu géré via CMS',
          en: 'Official medical platform · FR/AR bilingual · CMS-managed content'
        },
        description: {
          fr: 'Plateforme médicale · bilingue FR/AR · CMS',
          en: 'Medical platform · FR/AR bilingual · CMS'
        },
        fullDescription: {
          fr: `AuresPédia est la plateforme officielle du département de pédiatrie de l'Université de Batna 2, conçue pour servir à la fois les professionnels de santé et les familles algériennes. Elle centralise les articles scientifiques validés par l'équipe médicale, les actualités du CHU, les activités de formation (ateliers, conférences), et les ressources pédiatriques — le tout en français et en arabe.

Développée avec Next.js 14 App Router et next-intl v3, l'architecture repose sur un routing \`app/[locale]/\` avec génération statique des deux langues. Le contenu est intégralement géré via Sanity.io v3 — actualités, activités, articles, membres de l'équipe, configuration héros et citations — sans aucune ligne de code à modifier pour publier. Le passage en RTL pour la version arabe est géré automatiquement : la balise html reçoit \`dir="rtl"\` et le bon jeu de polices (Manrope pour le français, Cairo pour l'arabe).

Points techniques notables : un composant \`ActualitesClient\` avec animation clip-path reveal, un carrousel \`HeroQuotes\` auto-cyclant avec navigation par points, un \`TeamGrid\` avec pagination et expand/collapse, un \`FadingImage\` crossfade à intervalle, et une intégration Resend pour le formulaire de contact. Le tout responsive, avec une stratégie \`2xl:\` spécifique pour le rendu à 80% de zoom sur les écrans 1440px.`,
          en: `AuresPédia is the official platform of the Pediatrics Department of Batna 2 University, designed to serve both healthcare professionals and Algerian families. It centralizes medical-team-validated scientific articles, hospital news, training activities (workshops, conferences), and pediatric resources — entirely in French and Arabic.

Built with Next.js 14 App Router and next-intl v3, the architecture uses an \`app/[locale]/\` routing structure with static generation for both languages. All content is managed through Sanity.io v3 — news, activities, articles, team members, hero config and quotes — with no code changes needed to publish. Arabic RTL is handled automatically: the html tag receives \`dir="rtl"\` and the correct font set (Manrope for French, Cairo for Arabic).

Notable technical details: an \`ActualitesClient\` component with clip-path reveal animation, a self-cycling \`HeroQuotes\` carousel with dot navigation, a \`TeamGrid\` with pagination and expand/collapse, a \`FadingImage\` crossfade cycler, and Resend integration for the contact form. Fully responsive with a specific \`2xl:\` strategy for 80% zoom rendering on 1440px screens.`
        },
        tags: ['Next.js 14', 'TypeScript', 'Sanity.io', 'next-intl', 'Tailwind CSS', 'Resend'],
        year: '2026',
        image: '/projects/aurespedia.png',
        url: 'https://aurespedia.vercel.app/fr',
        screenshots: [
          {
            src: '/projects/aurespedia-1.png',
            title: { fr: 'Hero bilingue + citations Sanity', en: 'Bilingual hero + Sanity quotes' },
            description: {
              fr: 'Routing FR/AR via next-intl, citations auto-cyclantes depuis Sanity CMS.',
              en: 'FR/AR routing via next-intl, auto-cycling quotes from Sanity CMS.'
            }
          },
          {
            src: '/projects/aurespedia-2.png',
            title: { fr: 'Actualités — carrousel CMS', en: 'News — CMS carousel' },
            description: {
              fr: 'Carrousel auto-rotatif 20s, contenu entièrement piloté par Sanity sans code.',
              en: '20s auto-rotating carousel, content fully managed from Sanity with no code changes.'
            }
          },
          {
            src: '/projects/aurespedia-3.png',
            title: { fr: 'Page À propos — RTL automatique', en: 'About page — automatic RTL' },
            description: {
              fr: 'Bascule html dir="rtl" par locale, polices Cairo/Manrope switchées dynamiquement.',
              en: 'html dir="rtl" toggle per locale, Cairo/Manrope fonts switched dynamically.'
            }
          },
          {
            src: '/projects/aurespedia-4.png',
            title: { fr: 'Équipe médicale — TeamGrid paginé', en: 'Medical team — paginated TeamGrid' },
            description: {
              fr: 'Cards avec overflow visible, panels flottants et pagination depuis Sanity.',
              en: 'Overflow-visible cards, floating detail panels and Sanity-driven pagination.'
            }
          },
          {
            src: '/projects/aurespedia-5.png',
            title: { fr: 'Section À propos — homepage', en: 'About section — homepage' },
            description: {
              fr: 'Collage d\'images en CSS Grid, onglets Vision/Mission en state React local.',
              en: 'CSS Grid image collage, Vision/Mission tabs in local React state.'
            }
          }
        ]
      }
    ] as Project[]
  },

  contact: {
    headline: {
      fr: "Chaque grand projet commence par une conversation.",
      en: "Let's build something worth looking at."
    },
    email: 'hi@ala-nasri.dev',
    links: [
      { label: 'GitHub',   url: 'https://github.com/ala-nasri'      },
      { label: 'LinkedIn', url: 'https://linkedin.com/in/ala-nasri'  }
    ] as SocialLink[]
  }
}
