// SIM — Still In Movement
// Narrativa baseada em perguntas. A resposta é sempre SIM.

export type Lang = "pt" | "en";

export const translations = {
  pt: {
    nav: {
      works: "O QUÊ?",
      studio: "ONDE?",
      manifesto: "QUEM?",
      contact: "COMO?",
      admin: "Acesso",
    },
    hero: {
      reel: "REEL 2025",
      title1: "Pensou em audiovisual",
      title2: "e bateu a dúvida?",
      titleEm: "A resposta é SIM.",
      kicker: "Still In Movement",
      subtitle: "",
      scroll: "Rolar para descobrir",
      scenes: ["Atlas · 2025", "Noctilucent · 2024", "Kintsugi · 2024"],
    },
    manifesto: {
      label: "QUEM?",
      lead: "Still In Movement",
      body: "Acreditamos numa contradição bonita: a imagem parada que contém o movimento. Entre o instante congelado da fotografia e o tempo contínuo do cinema, existe um espaço onde vivem as marcas que respeitam o silêncio.",
      body2:
        "Filmamos a luz como matéria. Construímos ritmo no corte. Deixamos a respiração entrar em cada quadro.",
      closing: "Pensou em audiovisual e bateu a dúvida?",
      answer: "A resposta é SIM.",
      toggleStill: "Still",
      toggleMove: "Motion",
    },
    works: {
      label: "O QUÊ?",
      title: "Algumas respostas em forma de imagem.",
      desc: "Projetos que respondem por nós.",
      view: "Ver case",
      play: "Reproduzir",
    },
    frames: {
      label: "Galeria",
      title: "Cada quadro, um movimento",
      desc: "Stills extraídos das produções — a sequência que se torna filme.",
    },
    capabilities: {
      label: "ONDE?",
      title: "Entre a ideia e a tela.",
      intro:
        "É aí que estamos. Produzimos onde a história acontece. No estúdio. Na rua. No palco. Na indústria. No silêncio. O espaço muda. O olhar permanece.",
      list: [
        {
          k: "01",
          t: "Cinema de Marca",
          d: "Filmes e campanhas com direção autoral, fotografia cinematográfica e design de som.",
        },
        {
          k: "02",
          t: "Fotografia Editorial",
          d: "Imagens para moda, arquitetura e retrato — do conceito à pós-produção.",
        },
        {
          k: "03",
          t: "Documentário",
          d: "Narrativas íntimas e retratos humanos filmados com honestidade e tempo.",
        },
        {
          k: "04",
          t: "Fashion Film",
          d: "Tradução de coleções em pura atmosfera, luz e materialidade.",
        },
      ],
    },
    why: {
      label: "POR QUÊ?",
      title: "Porque vídeos são vistos. Histórias são lembradas.",
      body: "Não criamos apenas conteúdo. Criamos presença. Criamos memória. Criamos movimento.",
    },
    clients: { label: "Confiam no SIM", title: "Clientes" },
    recognition: {
      label: "Reconhecimento",
      title: "Premiações",
      stats: [
        { n: "12+", l: "Anos em cena" },
        { n: "180", l: "Produções" },
        { n: "9", l: "Países" },
        { n: "24", l: "Prêmios" },
      ],
    },
    estimate: {
      label: "Orçamento",
      title: "Inicie um projeto",
      desc: "Simule o investimento do seu filme ou editorial em segundos.",
      cta: "Pedir orçamento",
      summary: "Estimativa",
      currency: "R$",
    },
    footer: {
      tagline: "Pensou em audiovisual? A resposta é SIM.",
      contact: "COMO?",
      studio: "Estúdio",
      locations: "São Paulo - Brasil",
      rights: "Todos os direitos reservados.",
      email: "Olá, vamos conversar",
      headline1: "Vamos criar",
      headline2: "algo juntos",
      questions: [
        { q: "Como tirar uma ideia do papel?", a: "SIM." },
        { q: "Como produzir algo diferente?", a: "SIM." },
        { q: "Como contar uma história melhor?", a: "SIM." },
        { q: "Como começar?", a: "SIM." },
        { q: "Como entrar em contato?", a: "SIM." },
      ],
    },
    ai: {
      title: "Assistente SIM",
      greeting:
        "Olá. Sou o assistente do SIM. Qual a sua pergunta? A resposta provavelmente é SIM.",
      placeholder: "Escreva sua mensagem…",
    },
  },
  en: {
    nav: {
      works: "WHAT?",
      studio: "WHERE?",
      manifesto: "WHO?",
      contact: "HOW?",
      admin: "Access",
    },
    hero: {
      reel: "REEL 2025",
      title1: "Thought about audiovisual",
      title2: "and started wondering?",
      titleEm: "The answer is SIM.",
      kicker: "Still In Movement",
      subtitle: "",
      scroll: "Scroll to discover",
      scenes: ["Atlas · 2025", "Noctilucent · 2024", "Kintsugi · 2024"],
    },
    manifesto: {
      label: "WHO?",
      lead: "Still In Movement",
      body: "We believe in a beautiful contradiction: the still image that holds movement within. Between the frozen instant of a photograph and the continuous time of cinema, there is a space where brands that respect silence live.",
      body2:
        "We film light as matter. We build rhythm in the cut. We let breath enter every frame.",
      closing: "Thought about audiovisual and started wondering?",
      answer: "The answer is SIM.",
      toggleStill: "Still",
      toggleMove: "Motion",
    },
    works: {
      label: "WHAT?",
      title: "Some answers made of images.",
      desc: "Projects that answer for us.",
      view: "View case",
      play: "Play",
    },
    frames: {
      label: "Gallery",
      title: "Each frame, a movement",
      desc: "Stills pulled from our productions — the sequence that becomes film.",
    },
    capabilities: {
      label: "WHERE?",
      title: "Between the idea and the screen.",
      intro:
        "That's where we are. We produce wherever the story happens. In the studio. On the street. On stage. In the industry. In silence. The space changes. The eye remains.",
      list: [
        {
          k: "01",
          t: "Brand Cinema",
          d: "Films and campaigns with authored direction, cinematic photography and sound design.",
        },
        {
          k: "02",
          t: "Editorial Photography",
          d: "Images for fashion, architecture and portraiture — from concept to post.",
        },
        {
          k: "03",
          t: "Documentary",
          d: "Intimate narratives and human portraits filmed with honesty and time.",
        },
        {
          k: "04",
          t: "Fashion Film",
          d: "Translating collections into pure atmosphere, light and materiality.",
        },
      ],
    },
    why: {
      label: "WHY?",
      title: "Because videos are watched. Stories are remembered.",
      body: "We don't just create content. We create presence. We create memory. We create motion.",
    },
    clients: { label: "They trust SIM", title: "Clients" },
    recognition: {
      label: "Recognition",
      title: "Awards",
      stats: [
        { n: "12+", l: "Years on set" },
        { n: "180", l: "Productions" },
        { n: "9", l: "Countries" },
        { n: "24", l: "Awards" },
      ],
    },
    estimate: {
      label: "Quote",
      title: "Start a project",
      desc: "Estimate the investment for your film or editorial in seconds.",
      cta: "Request quote",
      summary: "Estimate",
      currency: "R$",
    },
    footer: {
      tagline: "Thought about audiovisual? The answer is SIM.",
      contact: "HOW?",
      studio: "Studio",
      locations: "São Paulo - Brasil",
      rights: "All rights reserved.",
      email: "Say hello, let's talk",
      headline1: "Let's create",
      headline2: "something together",
      questions: [
        { q: "How to turn an idea into reality?", a: "SIM." },
        { q: "How to produce something different?", a: "SIM." },
        { q: "How to tell a better story?", a: "SIM." },
        { q: "How to begin?", a: "SIM." },
        { q: "How to get in touch?", a: "SIM." },
      ],
    },
    ai: {
      title: "SIM Assistant",
      greeting:
        "Hi. I'm the SIM assistant. What's your question? The answer is probably SIM.",
      placeholder: "Type your message…",
    },
  },
} as const;

type Widen<T> = T extends string
  ? string
  : T extends number
  ? number
  : T extends ReadonlyArray<infer U>
  ? readonly Widen<U>[]
  : { [K in keyof T]: Widen<T[K]> };

export type Dict = Widen<(typeof translations)["pt"]>;
