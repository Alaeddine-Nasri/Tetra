type Bilingual = { fr: string; en: string }
type RowType = 'tags' | 'pills'

interface NavLink {
  key: string
  label: Bilingual
  path: string
}

export interface Project {
  id: string
  title: string
  company: string
  description: Bilingual
  fullDescription: Bilingual
  tags: string[]
  year: string
  image: string
  url?: string
}

export interface AboutRow {
  key: string
  label: Bilingual
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
      en: 'Ala Eddine Nasri — Frontend Engineer'
    },
    description: {
      fr: 'Ingénieur Frontend · Vue · TypeScript · Three.js',
      en: 'Frontend Engineer · Vue · TypeScript · Three.js'
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

    rows: [
      {
        key: 'engineering',
        label: { fr: 'Ingénierie',    en: 'Engineering'  },
        type: 'tags',
        items: ['Architectures', 'Algorithmics', 'Systems']
      },
      {
        key: 'experience',
        label: { fr: '· Expérience',  en: '· Experience' },
        type: 'tags',
        items: [{ fr: '3+ ans', en: '3+ years' }]
      },
      {
        key: 'education',
        label: { fr: 'Formation',     en: 'Education'    },
        type: 'tags',
        items: [
          { fr: 'Master IoT',         en: 'Master IoT'         },
          { fr: 'Diplôme Ingénieur',  en: 'Engineer Diploma'   }
        ]
      },
      {
        key: 'awards',
        label: { fr: 'Récompenses',   en: 'Awards'       },
        type: 'tags',
        items: [{ fr: 'DevFest Hackathon — 1ᵉʳ Prix', en: 'DevFest Hackathon — 1st Prize' }]
      },
      {
        key: 'skills',
        label: { fr: 'Compétences',   en: 'Skills'       },
        type: 'pills',
        items: ['Vue 3', 'TypeScript', 'Three.js', 'GSAP', 'Node.js', 'Python', 'REST API', 'Git', 'Docker', 'IoT']
      },
      {
        key: 'languages',
        label: { fr: 'Langues',       en: 'Languages'    },
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
        title: 'SpinalCom',
        company: 'SpinalCom',
        description: {
          fr: 'Plateforme de gestion de bâtiments intelligents.',
          en: 'Smart building management platform.'
        },
        fullDescription: {
          fr: 'Développement frontend d\'une plateforme IoT pour la gestion des bâtiments intelligents. Interface de visualisation temps réel des capteurs, dashboards dynamiques et intégration de protocoles industriels.',
          en: 'Frontend development of an IoT platform for smart building management. Real-time sensor visualization interface, dynamic dashboards and industrial protocol integration.'
        },
        tags: ['Vue 3', 'TypeScript', 'IoT', 'WebSocket'],
        year: '2024',
        image: '/projects/spinalcom.jpg'
      },
      {
        id: 'tetra',
        title: 'Tetra',
        company: 'Personnel',
        description: {
          fr: 'Portfolio cinématique — design minimal, atmosphérique.',
          en: 'Cinematic portfolio — minimal, atmospheric design.'
        },
        fullDescription: {
          fr: 'Portfolio personnel conçu comme une expérience cinématique. Three.js pour la scène 3D, GSAP pour les animations d\'entrée et transitions entre pages, Pinia pour la gestion de l\'état bilingue.',
          en: 'Personal portfolio designed as a cinematic experience. Three.js for the 3D scene, GSAP for entrance animations and page transitions, Pinia for bilingual state management.'
        },
        tags: ['Vue 3', 'Three.js', 'GSAP', 'TypeScript'],
        year: '2024',
        image: '/projects/tetra.jpg',
        url: 'https://ala-nasri.dev'
      },
      {
        id: 'iot-dashboard',
        title: 'IoT Dashboard',
        company: 'Projet académique',
        description: {
          fr: 'Tableau de bord temps réel pour systèmes embarqués.',
          en: 'Real-time dashboard for embedded systems.'
        },
        fullDescription: {
          fr: 'Interface de monitoring temps réel pour un réseau de capteurs IoT. Visualisation de données avec graphiques animés, alertes configurables et historique de métriques sur plusieurs semaines.',
          en: 'Real-time monitoring interface for an IoT sensor network. Data visualization with animated charts, configurable alerts and multi-week metrics history.'
        },
        tags: ['Vue 3', 'Python', 'MQTT', 'Chart.js'],
        year: '2023',
        image: '/projects/iot-dashboard.jpg'
      },
      {
        id: 'algoviz',
        title: 'AlgoViz',
        company: 'Open Source',
        description: {
          fr: 'Visualiseur d\'algorithmes interactif.',
          en: 'Interactive algorithm visualizer.'
        },
        fullDescription: {
          fr: 'Outil pédagogique de visualisation d\'algorithmes de tri et de graphes. Animations pas-à-pas avec contrôle de la vitesse, support de plusieurs algorithmes classiques avec complexité affichée en temps réel.',
          en: 'Educational tool for visualizing sorting and graph algorithms. Step-by-step animations with speed control, support for multiple classical algorithms with real-time complexity display.'
        },
        tags: ['TypeScript', 'Canvas API', 'Algorithmics'],
        year: '2023',
        image: '/projects/algoviz.jpg'
      }
    ] as Project[]
  },

  contact: {
    headline: {
      fr: "Construisons quelque chose qui mérite d'être vu.",
      en: "Let's build something worth looking at."
    },
    email: 'hi@ala-nasri.dev',
    links: [
      { label: 'GitHub',   url: 'https://github.com/ala-nasri'      },
      { label: 'LinkedIn', url: 'https://linkedin.com/in/ala-nasri'  }
    ] as SocialLink[]
  }
}
