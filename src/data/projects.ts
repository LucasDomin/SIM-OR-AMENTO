export type Project = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: "Film" | "Editorial" | "Brand" | "Documentary" | "Fashion";
  client: string;
  year: string;
  location: string;
  duration?: string;
  format: string;
  cover: string;
  stills: string[];
  description: string;
  credits: { role: string; name: string }[];
  awards?: string[];
  color: string;
  video?: string;
  poster?: string;
};

export const projects: Project[] = [
  {
    id: "01",
    slug: "atlas",
    title: "Atlas",
    subtitle: "A short film for Maison Vétiver",
    category: "Film",
    client: "Maison Vétiver",
    year: "2025",
    location: "São Paulo - Brasil",
    duration: "3' 42\"",
    format: "Short film · 6K Anamorphic",
    cover:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=2400&q=80",
    stills: [
      "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=2000&q=80",
      "https://images.unsplash.com/photo-1485217988980-11786ced9454?auto=format&fit=crop&w=2000&q=80",
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=2000&q=80",
    ],
    description:
      "Uma meditação visual sobre o tempo, o silêncio e o ritual. Filmado em película anamórfica entre as colinas de Sintra, Atlas traduz a alma da Maison Vétiver em luz e sombra.",
    credits: [
      { role: "Direção", name: "N. Ferreira" },
      { role: "Direção de Fotografia", name: "M. Caldeira" },
      { role: "Trilha Original", name: "Ó. Mendes" },
      { role: "Pós-Produção", name: "Estúdio MOMENTUM" },
    ],
    awards: ["Cannes Lions · Shortlist 2025", "Ciclope Festival · Bronze"],
    color: "#d4c5a9",
  },
  {
    id: "02",
    slug: "obsidian",
    title: "Obsidian",
    subtitle: "Campanha global · Ettore Automobili",
    category: "Brand",
    client: "Ettore Automobili",
    year: "2025",
    location: "São Paulo - Brasil",
    duration: "60\" + stills",
    format: "Film + Print campaign",
    cover:
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=2400&q=80",
    stills: [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2000&q=80",
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2000&q=80",
      "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=2000&q=80",
    ],
    description:
      "A apresentação do GT noturno da Ettore. Um exercício de contenção: motor, luz e deserto. Sem trilha, apenas mecânica e respiração.",
    credits: [
      { role: "Direção Criativa", name: "Estúdio MOMENTUM" },
      { role: "Direção de Fotografia", name: "L. Vasconcelos" },
      { role: "Color", name: "Company 3 · LDN" },
    ],
    awards: ["D&AD · Wood Pencil"],
    color: "#a8a29e",
  },
  {
    id: "03",
    slug: "linho",
    title: "Linho",
    subtitle: "Editorial — Vogue Portugal",
    category: "Editorial",
    client: "Vogue Portugal",
    year: "2024",
    location: "São Paulo - Brasil",
    format: "8 páginas · Print",
    cover:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=2400&q=80",
    stills: [
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=80",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2000&q=80",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=2000&q=80",
    ],
    description:
      "Oito páginas dedicadas ao toque do linho, à luz portuguesa do meio-dia e à arquitetura honesta das casas de Comporta.",
    credits: [
      { role: "Fotografia", name: "N. Ferreira" },
      { role: "Styling", name: "C. Albuquerque" },
      { role: "Beauty", name: "I. Moretti" },
    ],
    color: "#e8dcc4",
  },
  {
    id: "04",
    slug: "kintsugi",
    title: "Kintsugi",
    subtitle: "Documentário — Hermès Foundation",
    category: "Documentary",
    client: "Fondation d'entreprise Hermès",
    year: "2024",
    location: "São Paulo - Brasil",
    duration: "12' 08\"",
    format: "Short documentary · 4K",
    cover:
      "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=2400&q=80",
    stills: [
      "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=2000&q=80",
      "https://images.unsplash.com/photo-1480796927426-f609979314bd?auto=format&fit=crop&w=2000&q=80",
      "https://images.unsplash.com/photo-1545569310-518c01dd8b80?auto=format&fit=crop&w=2000&q=80",
    ],
    description:
      "Um retrato íntimo de Hiroshi Tanaka, mestre da arte do kintsugi. A beleza da imperfeição contada em silêncio.",
    credits: [
      { role: "Direção", name: "N. Ferreira" },
      { role: "Câmera", name: "T. Yamamoto" },
      { role: "Som", name: "Sonora Studios" },
    ],
    awards: ["IDFA · Official Selection"],
    color: "#c9a875",
  },
  {
    id: "05",
    slug: "monolith",
    title: "Monolith",
    subtitle: "Arquitetura — Atelier Beira",
    category: "Brand",
    client: "Atelier Beira",
    year: "2025",
    location: "São Paulo - Brasil",
    format: "Film + stills · Brand book",
    cover:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=2400&q=80",
    stills: [
      "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=2000&q=80",
      "https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=2000&q=80",
      "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=2000&q=80",
    ],
    description:
      "Concreto, granito, luz. O retrato da nova sede do Atelier Beira como uma escultura habitada.",
    credits: [
      { role: "Direção", name: "Estúdio MOMENTUM" },
      { role: "Steadicam", name: "R. Pinto" },
    ],
    color: "#b8b5ad",
  },
  {
    id: "06",
    slug: "noctilucent",
    title: "Noctilucent",
    subtitle: "Fashion film — Saint Cyr",
    category: "Fashion",
    client: "Saint Cyr",
    year: "2024",
    location: "São Paulo - Brasil",
    duration: "2' 14\"",
    format: "Fashion film · 35mm",
    cover:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2400&q=80",
    stills: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=80",
      "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?auto=format&fit=crop&w=2000&q=80",
      "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=2000&q=80",
    ],
    description:
      "Filmado durante a aurora boreal de março, Noctilucent traduz a coleção de inverno em pura matéria de sonho.",
    credits: [
      { role: "Direção", name: "N. Ferreira" },
      { role: "Modelo", name: "Ó. Lindqvist" },
    ],
    color: "#9fb8c7",
  },
  {
    id: "07",
    slug: "arcadia",
    title: "Arcadia",
    subtitle: "Editorial — Architecture Digest",
    category: "Editorial",
    client: "Architecture Digest",
    year: "2024",
    location: "São Paulo - Brasil",
    format: "12 páginas · Print",
    cover:
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=2400&q=80",
    stills: [
      "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=2000&q=80",
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=2000&q=80",
      "https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=2000&q=80",
    ],
    description:
      "Uma reportagem visual sobre a arquitetura brutalista paulistana, explorando massa, vazio e luz em seis edifícios icônicos dos anos 1960.",
    credits: [
      { role: "Fotografia", name: "N. Ferreira" },
      { role: "Texto", name: "M. Oliveira" },
    ],
    color: "#c2b49a",
  },
  {
    id: "08",
    slug: "horizonte",
    title: "Horizonte",
    subtitle: "Brand Film — Osklen",
    category: "Brand",
    client: "Osklen",
    year: "2025",
    location: "São Paulo - Brasil",
    duration: "1' 45\"",
    format: "Brand film · 4K",
    cover:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=80",
    stills: [
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=2000&q=80",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=80",
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2000&q=80",
    ],
    description:
      "Um filme de marca para a campanha de verão da Osklen. Corpos, tecidos naturais e a linha do horizonte carioca filmados em anamórfico.",
    credits: [
      { role: "Direção", name: "SIM Studio" },
      { role: "Fotografia", name: "M. Caldeira" },
      { role: "Color", name: "L. Vasconcelos" },
    ],
    color: "#7a9a7d",
  },
];

export const clients = [
  "Hermès",
  "Vogue",
  "Porsche",
  "Aesop",
  "Apple",
  "Leica",
  "Bottega Veneta",
  "Loewe",
  "Saint Laurent",
  "Maison Margiela",
  "Acne Studios",
  "COS",
];
