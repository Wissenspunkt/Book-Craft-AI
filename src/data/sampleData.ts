import { BookProject } from '../types';

export const INITIAL_SAMPLE_PROJECTS: BookProject[] = [
  {
    id: 'proj_ai_revolution_2026',
    title: 'Die KI-Transformation im Verlagswesen',
    subtitle: 'Menschliche Kreativität und generative Systeme in der Ära synthetischer Medien',
    author: 'Dr. Clara von Bergmann',
    genre: 'Sachbuch / Medienwissenschaft',
    templateId: 'sachbuch_expert',
    targetLength: 'Umfassendes Werk (~20.000 Wörter)',
    targetWordCount: 20000,
    style: 'Informativ, Präzise & Akademisch',
    tone: 'Analytisch & Objektiv',
    targetAudience: 'Verleger, Autoren & Medienwissenschaftler',
    citationStyle: 'APA',
    coverImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    summary: 'Analyse der Umwälzungen im Buchmarkt durch automatisierte Text- und Bildevaluation, automatisierte Quellenkontrolle und hybride Autorenschaft.',
    createdAt: '2026-02-10T10:00:00Z',
    lastModified: '2026-09-19T08:00:00Z',
    currentPhase: 'factcheck',
    cloudSynced: true,
    lastSyncedAt: '2026-09-19T08:12:00Z',
    bibliography: [
      {
        id: 'src_1',
        author: 'Müller, H. & Schmidt, K.',
        title: 'Generative KI im Buchmarkt: Marktanalysen und Zukunftsprognosen',
        year: '2025',
        publisher: 'Verlagsakademie Verlag',
        type: 'Book',
        citationKey: 'Mueller2025'
      },
      {
        id: 'src_2',
        author: 'European AI & Publishing Consortium',
        title: 'Report on Automated Fact-Checking Accuracy in Literary Texts',
        year: '2026',
        publisher: 'Journal of Digital Publishing Vol. 14',
        type: 'Journal',
        citationKey: 'EAPC2026',
        url: 'https://doi.org/10.1000/eapc.2026.01'
      },
      {
        id: 'src_3',
        author: 'Weber, L.',
        title: 'Urheberrecht und KI-generierte Inhalte in Europa',
        year: '2024',
        publisher: 'Juristische Medienrundschau',
        type: 'Journal',
        citationKey: 'Weber2024'
      }
    ],
    chapters: [
      {
        id: 'chap_1',
        chapterNumber: 1,
        title: 'Die Evolution des geschriebenen Wortes',
        summary: 'Vom Buchdruck Gutenbergs bis zur generativen Transformation in den 2020er Jahren.',
        estimatedWords: 3500,
        actualWords: 3420,
        status: 'factchecked',
        fleschScore: 68,
        illustrationUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80',
        illustrationPrompt: 'Eine historische Buchpresse kombiniert mit leuchtenden digitalen Datenströmen, fotorealistisch.',
        content: `## 1.1 Vom Bleisatz zur neuronalen Textsynthese

Die Geschichte des Buchdrucks ist eine Geschichte der Demokratisierung von Wissen. Als Johannes Gutenberg um das Jahr 1440 den Druck mit beweglichen Metalllettern erfand [Beleg: Mueller2025], veränderte sich die europäischen Kulturlandschaft radikal. Was früher Jahre manueller Abschrift durch Mönche erforderte, konnte plötzlich in Auflage gedruckt werden.

Fast sechs Jahrhunderte später erleben wir eine mindestens ebenso fundamentale Zäsur. Während die Digitalisierung der 1990er Jahre primär die Distribution (E-Books, Online-Händler) veränderte, greift die Ära der generativen Künstlichen Intelligenz direkt in den Prozess der **Inhaltserstellung, Lektorierung und Faktenprüfung** ein.

> "Die generative Transformation des Buchmarktes betrifft nicht nur das Schreiben selbst, sondern verkürzt die Redaktionszyklus-Zeiten um bis zu 65%." [Beleg: EAPC2026]

## 1.2 Die Welle der Automatisierung

Ein zentraler Aspekt moderner Autorenschaft ist die strenge Validierung von Informationen. In Zeiten synthetischer Medien ist die Quellenkontrolle zum wichtigsten Differenzierungsmerkmal für Qualitätsliteratur geworden.

### Kernfaktoren der neuen Infrastruktur:
- **Automatische Ablaufgliederung:** Hierarchische Strukturierung von Kapitelentwürfen auf Basis von Zielgruppenanalysen.
- **Echtzeit-Faktenprüfung:** Abgleich behaupteter Jahreszahlen und Studien mit verifizierten wissenschaftlichen Datenbanken.
- **Kombinierte Multimodalität:** Nahtlose Erzeugung passender Buch-Illustrationen direkt aus dem Kapitelkontext.

## 1.3 Zusammenfassung & Key Takeaways

Der Übergang von der manuellen Recherche zur hybriden KI-gestützten Buchproduktion ist keine Bedrohung der Autorenschaft, sondern eine Leistungssteigerung. Entscheidend bleibt die kritische Prüfung der Quellen und das Feingefühl im Lektorat.`,
        keyFacts: [
          {
            id: 'fc_1',
            statement: 'Johannes Gutenberg erfand um 1440 den Druck mit beweglichen Lettern.',
            status: 'verified',
            explanation: 'Historisch gesichertes Datum, im Einklang mit Standardwerken.',
            suggestedCitation: 'Mueller2025'
          },
          {
            id: 'fc_2',
            statement: 'Redaktionszyklus-Zeiten verkürzen sich um bis zu 65% durch KI-Unterstützung.',
            status: 'verified',
            explanation: 'Aus dem EAPC Report 2026 abgeleitet.',
            suggestedCitation: 'EAPC2026'
          }
        ],
        proofreadSuggestions: [
          {
            id: 'ps_1',
            type: 'style',
            originalText: 'veränderte sich die europäischen Kulturlandschaft radikal',
            suggestedText: 'veränderte sich die europäische Kulturlandschaft radikal',
            reason: 'Grammatikfehler im Adjektiv (Kasus/Numerus-Kongruenz).'
          }
        ]
      },
      {
        id: 'chap_2',
        chapterNumber: 2,
        title: 'Strenge Faktenprüfung und Quellenanalyse',
        summary: 'Verfahren zur automatisierten Verifikation von Daten, Zitaten und wissenschaftlichen Quellen.',
        estimatedWords: 4000,
        actualWords: 2850,
        status: 'writing',
        fleschScore: 62,
        illustrationUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        illustrationPrompt: 'Futuristisches holografisches Netz mit Lupen und Quellennetzwerken, hochdetailliert.',
        content: `## 2.1 Das Problem der Halluzination in Sprachmodellen

Bei der Erstellung von Sachbüchern und wissenschaftlichen Arbeiten ist Genauigkeit die oberste Prämisse. Frühe KI-Modelle neigten dazu, Literaturangaben oder statistische Werte frei zu erfinden.

Um dieses Problem zu lösen, setzen moderne Buchplattformen auf **Grounded Search & Verifikations-Schleifen**.

## 2.2 Der dreistufige Verifikationsprozess

1. **Behauptungsextraktion:** Der Text wird nach Eigennamen, Jahreszahlen, Prozentsätzen und Zitaten gescannt.
2. **Datenbankabgleich:** Jede Behauptung wird mit wissenschaftlichen Indizes (z.B. CrossRef, PubMed, Google Scholar) abgeglichen [Beleg: Weber2024].
3. **Status-Vergabe:** Verifiziert (Grün), Prüfbedarf (Gelb) oder Beleg fehlt (Rot).

> "Ohne lückenloses Quellverzeichnis verliert Fachliteratur ihre Glaubwürdigkeit in einer Welt voller KI-Inhalte." [Beleg: Mueller2025]`,
        keyFacts: [
          {
            id: 'fc_3',
            statement: 'Datenbankabgleich erfolgt über Schnittstellen wie CrossRef und PubMed.',
            status: 'review_needed',
            explanation: 'Sollte im Text präzisiert werden, welche Schnittstelle primär genutzt wird.',
            suggestedCitation: 'Weber2024'
          }
        ],
        proofreadSuggestions: []
      },
      {
        id: 'chap_3',
        chapterNumber: 3,
        title: 'Der Multiformat-Export: EPUB, PDF & Kindle',
        summary: 'Technische Spezifikationen für die verlagsreife Ausgabe auf allen Endgeräten.',
        estimatedWords: 3000,
        actualWords: 0,
        status: 'draft',
        content: '',
        keyFacts: [],
        proofreadSuggestions: []
      }
    ]
  }
];
