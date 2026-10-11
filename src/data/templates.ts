import { ProjectTemplate } from '../types';

export const BOOK_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'sachbuch_expert',
    name: 'Fachbuch & Ratgeber',
    description: 'Für wissenschaftliche Monografien, Fachliteratur und praxiserprobte Anleitungen. Hoher Fokus auf belegte Fakten und Quellen.',
    genre: 'Sachbuch / Fachbuch',
    iconName: 'BookOpen',
    defaultStyle: 'Informativ, Präzise & Akademisch',
    defaultTone: 'Analytisch & Seriös',
    recommendedWordCount: '25.000 - 40.000 Wörter',
    sampleOutline: [
      'Einleitung: Die Problemstellung & Methodik',
      'Theoretische Grundlagen & Historischer Kontext',
      'Analyse der Kernfaktoren & Empirische Evidenz',
      'Praktische Anwendung & Fallstudien',
      'Fazit, Ausblick & Zukunftsmodelle'
    ]
  },
  {
    id: 'roman_fiction',
    name: 'Belletristik & Sci-Fi / Roman',
    description: 'Für fesselnde Geschichten, Romane und Science-Fiction. Fokus auf Kapitelbögen, lebendige Dialoge und stimmungsvolle Illustrationen.',
    genre: 'Roman / Fiction',
    iconName: 'Feather',
    defaultStyle: 'Narrativ, Bildhaft & Atmosphärisch',
    defaultTone: 'Spannend & Emotionale Tiefe',
    recommendedWordCount: '40.000 - 80.000 Wörter',
    sampleOutline: [
      'Der Aufbruch: Die gewohnte Welt ins Schwanken bringen',
      'Schatten der Vergangenheit: Erste Hindernisse',
      'Der Wendepunkt: Ein unvorhergesehenes Ereignis',
      'Der Kulminationspunkt: Die entscheidende Konfrontation',
      'Neuanfang: Nachwehen und Erkenntnis'
    ]
  },
  {
    id: 'biografie_memoir',
    name: 'Biografie & Memoir',
    description: 'Für Lebensgeschichten, Zeitzeugenberichte und biografische Analysen. Präzise Chronologie mit Zeitzeugen-Quellen.',
    genre: 'Biografie / Zeitgeschichte',
    iconName: 'UserCheck',
    defaultStyle: 'Persönlich, Reflektiert & Dokumentarisch',
    defaultTone: 'Einfühlsam & Historisch exakt',
    recommendedWordCount: '30.000 - 50.000 Wörter',
    sampleOutline: [
      'Herkunft und Prägung in frühen Jahren',
      'Der Weg zur eigenen Berufung',
      'Durchbrüche und historische Meilensteine',
      'Krisen, Überwindung & Wandlung',
      'Vermächtnis und zeitlose Lehren'
    ]
  },
  {
    id: 'kinderbuch_illu',
    name: 'Kinder- & Jugendbuch',
    description: 'Kurze, verständliche Kapitel mit reichlich Bildplatzhaltern für KI-generierte Illustrationen und lehrreichen Kernaussagen.',
    genre: 'Kinder- & Jugendliteratur',
    iconName: 'Sparkles',
    defaultStyle: 'Bildhaft, Fantasiereich & Verständlich',
    defaultTone: 'Herzlich & Abenteuerlustig',
    recommendedWordCount: '5.000 - 15.000 Wörter',
    sampleOutline: [
      'Ein geheimnisvoller Fund im Wald',
      'Das Rätsel der leuchtenden Spuren',
      'Neue Freunde auf ungewöhnlichen Pfaden',
      'Das große Abenteuer am Fluss',
      'Gemeinsam stark: Das Fest im Dorf'
    ]
  },
  {
    id: 'business_manifest',
    name: 'Business-Strategie & Manifest',
    description: 'Für Unternehmenslenker, Startups und Visionäre. Prägnante Thesen, datengestützte Marktanalysen und Action-Plans.',
    genre: 'Wirtschaft & Management',
    iconName: 'TrendingUp',
    defaultStyle: 'Prägnant, Handlungsorientiert & Visionär',
    defaultTone: 'Inspirierend & Direkt',
    recommendedWordCount: '15.000 - 25.000 Wörter',
    sampleOutline: [
      'Der Status Quo der Branche: Warum Veränderung nötig ist',
      'Die 5 Grundpfeiler des neuen Paradigmas',
      'Skalierung & Prozessoptimierung',
      'Kultur, Führung & Resilienz',
      'Das Manifest: Der Fahrplan für die nächsten 5 Jahre'
    ]
  }
];
